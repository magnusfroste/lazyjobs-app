import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCaller, mayActFor } from "../_shared/caller.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  job_id: string;
  user_id: string;
  language_override?: 'auto' | 'en' | 'sv';
  include?: ('cv' | 'cover_letter' | 'email')[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_id, user_id, language_override = 'auto', include = ['cv', 'cover_letter', 'email'] }: GenerateRequest = await req.json();

    if (!mayActFor(await getCaller(req), user_id)) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!job_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: job_id and user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Job fetch error:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile and CV data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.cv_data) {
      return new Response(
        JSON.stringify({ success: false, error: 'No CV data found. Please upload your CV first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine target language
    const targetLanguage = determineLanguage(
      job,
      language_override,
      profile.application_language_preference
    );

    console.log('Generating application:', {
      job_id,
      user_id,
      target_language: targetLanguage,
      include,
    });

    // Generate content based on include array
    const result: any = {
      success: true,
      language: targetLanguage,
      job: {
        title: job.title,
        company: job.company,
        location: job.location,
      },
    };

    if (include.includes('cv')) {
      result.cv = await generateTailoredCV(job, profile.cv_data, targetLanguage, openAIKey);
    }

    if (include.includes('cover_letter')) {
      result.cover_letter = await generateCoverLetter(job, profile.cv_data, targetLanguage, openAIKey);
    }

    if (include.includes('email')) {
      result.email = await generateEmailDraft(job, profile.cv_data, targetLanguage, openAIKey);
    }

    // Save generated content to database
    const { data: matchData } = await supabase
      .from('matches')
      .select('id')
      .eq('user_id', user_id)
      .eq('job_id', job_id)
      .single();

    if (matchData) {
      const { error: saveError } = await supabase
        .from('applications')
        .upsert({
          match_id: matchData.id,
          user_id: user_id,
          job_id: job_id,
          generated_cv: result.cv || null,
          generated_cover_letter: result.cover_letter || null,
          generated_email_subject: result.email?.subject || null,
          generated_email_body: result.email?.body || null,
          language: targetLanguage,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'match_id'
        });

      if (saveError) {
        console.error('Error saving application:', saveError);
      } else {
        console.log('Application saved successfully');
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-application:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Determine the target language for generation
function determineLanguage(
  job: any,
  override: string,
  userPreference?: string
): 'en' | 'sv' {
  // 1. Explicit override takes priority
  if (override === 'en') return 'en';
  if (override === 'sv') return 'sv';

  // 2. User preference from profile settings
  if (userPreference === 'en') return 'en';
  if (userPreference === 'sv') return 'sv';

  // 3. Auto-detect from job description
  const description = (job.description || '').toLowerCase();
  const swedishKeywords = ['och', 'att', 'för', 'med', 'som', 'är', 'på', 'vi', 'du', 'söker'];
  const swedishCount = swedishKeywords.filter(word => description.includes(` ${word} `)).length;

  return swedishCount >= 3 ? 'sv' : 'en';
}

// Generate tailored CV
async function generateTailoredCV(
  job: any,
  cvData: any,
  language: string,
  apiKey: string
): Promise<string> {
  const isSwedish = language === 'sv';
  
  const systemPrompt = isSwedish
    ? 'Du är en professionell karriärrådgivare som hjälper kandidater att skräddarsy sina CV:n för specifika jobbansökningar. Ditt mål är att omorganisera och betona relevant erfarenhet samtidigt som du behåller sanningen.'
    : 'You are a professional career advisor helping candidates tailor their CVs for specific job applications. Your goal is to reorder and emphasize relevant experience while maintaining truthfulness.';

  const userPrompt = isSwedish
    ? `Skapa ett skräddarsytt CV för denna jobbtitel: "${job.title}" på ${job.company}.

Jobbeskrivning:
${job.description || 'Ingen beskrivning tillgänglig'}

Kandidatens CV-data:
${JSON.stringify(cvData, null, 2)}

Instruktioner:
1. Omorganisera erfarenhetssektion för att visa mest relevant erfarenhet först
2. Betona färdigheter som matchar jobbet
3. Använd nyckelord från jobbbeskrivningen
4. Håll det kortfattat och professionellt
5. Ändra INTE på fakta - omorganisera och betona bara

Svara med ren Markdown-formaterad text för CV:t.`
    : `Create a tailored CV for this job: "${job.title}" at ${job.company}.

Job Description:
${job.description || 'No description available'}

Candidate's CV Data:
${JSON.stringify(cvData, null, 2)}

Instructions:
1. Reorder experience section to show most relevant experience first
2. Emphasize skills that match the job
3. Use keywords from the job description
4. Keep it concise and professional
5. Do NOT change facts - only reorder and emphasize

Respond with plain Markdown-formatted text for the CV.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Generate cover letter
async function generateCoverLetter(
  job: any,
  cvData: any,
  language: string,
  apiKey: string
): Promise<string> {
  const isSwedish = language === 'sv';
  
  const systemPrompt = isSwedish
    ? 'Du är en professionell karriärrådgivare som skriver engagerande personliga brev som framhäver kandidatens styrkor och passion för rollen.'
    : 'You are a professional career advisor writing engaging cover letters that highlight candidate strengths and passion for the role.';

  const userPrompt = isSwedish
    ? `Skriv ett personligt brev för denna jobbtitel: "${job.title}" på ${job.company}.

Jobbeskrivning:
${job.description || 'Ingen beskrivning tillgänglig'}

Kandidatens CV-data:
${JSON.stringify(cvData, null, 2)}

Instruktioner:
1. Öppna med en stark, engagerande mening
2. Visa entusiasm för företaget och rollen
3. Koppla specifik erfarenhet till jobbkraven
4. Visa förståelse för företagets värderingar/uppdrag
5. Avsluta med en tydlig uppmaning till handling
6. Håll det till 3-4 stycken
7. Använd professionell men varm ton

Svara med ren Markdown-formaterad text för det personliga brevet.`
    : `Write a cover letter for this job: "${job.title}" at ${job.company}.

Job Description:
${job.description || 'No description available'}

Candidate's CV Data:
${JSON.stringify(cvData, null, 2)}

Instructions:
1. Open with a strong, engaging sentence
2. Show enthusiasm for the company and role
3. Connect specific experience to job requirements
4. Demonstrate understanding of company values/mission
5. Close with a clear call to action
6. Keep it to 3-4 paragraphs
7. Use professional but warm tone

Respond with plain Markdown-formatted text for the cover letter.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Generate email draft
async function generateEmailDraft(
  job: any,
  cvData: any,
  language: string,
  apiKey: string
): Promise<{ subject: string; body: string }> {
  const isSwedish = language === 'sv';
  
  const systemPrompt = isSwedish
    ? 'Du är en professionell karriärrådgivare som skriver koncisa, professionella e-postmeddelanden för jobbansökningar. Returnera JSON med "subject" och "body" fält.'
    : 'You are a professional career advisor writing concise, professional job application emails. Return JSON with "subject" and "body" fields.';

  const userPrompt = isSwedish
    ? `Skriv ett professionellt e-postmeddelande för denna jobbansökan: "${job.title}" på ${job.company}.

Kandidatens CV-data:
${JSON.stringify(cvData, null, 2)}

Instruktioner:
1. Skapa en professionell ämnesrad
2. Håll e-postmeddelandet kort (2-3 meningar)
3. Nämn nyckelbehörigheter
4. Hänvisa till bifogade dokument (CV och personligt brev)
5. Använd professionell ton

Returnera JSON med denna exakta struktur:
{
  "subject": "Ämnesraden här",
  "body": "E-postmeddelandet här"
}`
    : `Write a professional email for this job application: "${job.title}" at ${job.company}.

Candidate's CV Data:
${JSON.stringify(cvData, null, 2)}

Instructions:
1. Create a professional subject line
2. Keep the email brief (2-3 sentences)
3. Mention key qualifications
4. Reference attached documents (CV and cover letter)
5. Use professional tone

Return JSON with this exact structure:
{
  "subject": "The subject line here",
  "body": "The email body here"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return {
    subject: result.subject || '',
    body: result.body || '',
  };
}
