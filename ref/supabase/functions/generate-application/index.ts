/**
 * Generate Application Edge Function
 * 
 * Generates tailored CV and cover letter for job applications
 * Features:
 * - Auto-detects job description language
 * - Respects user language preference
 * - Tailors CV to highlight relevant experience
 * - Generates professional cover letter
 * - Creates email draft
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface GenerateRequest {
  job_id: string
  user_id: string
  language_override?: 'auto' | 'en' | 'sv' // User preference
  include: ('cv' | 'cover_letter' | 'email')[]
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Check OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not set')
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          success: false 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    const { job_id, user_id, language_override = 'auto', include = ['cv', 'cover_letter', 'email'] } = await req.json() as GenerateRequest

    if (!job_id || !user_id) {
      return new Response(
        JSON.stringify({ 
          error: 'job_id and user_id are required',
          success: false 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    console.log(`📝 Generating application for user ${user_id}, job ${job_id}`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch job details
    console.log('Fetching job...')
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError) {
      console.error('Job fetch error:', jobError)
      return new Response(
        JSON.stringify({ 
          error: 'Job not found',
          details: jobError.message,
          success: false 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    if (!job) {
      console.error('Job is null')
      return new Response(
        JSON.stringify({ 
          error: 'Job not found',
          success: false 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    console.log('Job found:', job.title)

    // Fetch user profile and CV
    console.log('Fetching profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cv_data, preferences, application_language_preference')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ 
          error: 'Profile not found',
          details: profileError.message,
          success: false 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    if (!profile) {
      console.error('Profile is null')
      return new Response(
        JSON.stringify({ 
          error: 'Profile not found',
          success: false 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    if (!profile.cv_data) {
      console.error('CV data is missing')
      return new Response(
        JSON.stringify({ 
          error: 'No CV data found. Please upload your CV first.',
          success: false 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    console.log('Profile found with CV data')

    // Detect language
    const targetLanguage = determineLanguage(
      job,
      language_override,
      profile.application_language_preference
    )
    console.log(`🌍 Target language: ${targetLanguage}`)

    const results = {
      language: targetLanguage,
      job_title: job.title,
      company: job.company,
      cv: undefined as string | undefined,
      cover_letter: undefined as string | undefined,
      email: undefined as { subject: string, body: string } | undefined,
    }

    // Generate CV
    if (include.includes('cv')) {
      console.log('📄 Generating tailored CV...')
      results.cv = await generateTailoredCV(job, profile.cv_data, targetLanguage)
    }

    // Generate cover letter
    if (include.includes('cover_letter')) {
      console.log('📝 Generating cover letter...')
      results.cover_letter = await generateCoverLetter(job, profile.cv_data, targetLanguage)
    }

    // Generate email draft
    if (include.includes('email')) {
      console.log('✉️ Generating email draft...')
      results.email = await generateEmailDraft(job, profile.cv_data, targetLanguage)
    }

    console.log('✅ Application generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
        details: error.toString(),
        success: false,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

/**
 * Determine target language for application
 */
function determineLanguage(
  job: any,
  override: string,
  userPreference?: string
): 'en' | 'sv' {
  // User explicitly overrides
  if (override !== 'auto') {
    return override as 'en' | 'sv'
  }

  // User has a saved preference
  if (userPreference && userPreference !== 'auto') {
    return userPreference as 'en' | 'sv'
  }

  // Auto-detect from job description
  const text = `${job.title} ${job.description} ${job.company}`.toLowerCase()
  
  // Swedish indicators
  const swedishWords = ['och', 'att', 'för', 'med', 'som', 'är', 'på', 'vi', 'du', 'söker', 'arbete', 'tjänst']
  const swedishCount = swedishWords.filter(word => text.includes(word)).length

  // If 3+ Swedish words found, assume Swedish
  return swedishCount >= 3 ? 'sv' : 'en'
}

/**
 * Generate tailored CV using OpenAI
 */
async function generateTailoredCV(job: any, cvData: any, language: string): Promise<string> {
  const prompt = language === 'sv' 
    ? `Du är en professionell CV-skrivare. Skapa ett skräddarsytt CV baserat på följande:

JOBBANNONS:
Titel: ${job.title}
Företag: ${job.company}
Beskrivning: ${job.description}
Krav: ${job.required_skills?.join(', ') || 'Ej specificerat'}

KANDIDATENS CV:
${JSON.stringify(cvData, null, 2)}

UPPGIFT:
1. Omorganisera CV:t så att den mest relevanta erfarenheten kommer först
2. Framhäv färdigheter och erfarenheter som matchar jobbkraven
3. Ta bort irrelevant information
4. Håll det kortfattat (max 2 sidor)
5. Använd professionellt språk
6. Fokusera på resultat och prestationer

Returnera CV:t i Markdown-format med tydliga sektioner.`
    : `You are a professional CV writer. Create a tailored CV based on the following:

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${job.required_skills?.join(', ') || 'Not specified'}

CANDIDATE'S CV:
${JSON.stringify(cvData, null, 2)}

TASK:
1. Reorder the CV to highlight the most relevant experience first
2. Emphasize skills and experience matching job requirements
3. Remove irrelevant information
4. Keep it concise (max 2 pages)
5. Use professional language
6. Focus on achievements and results

Return the CV in Markdown format with clear sections.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('OpenAI API error:', errorData)
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0]) {
    console.error('Invalid OpenAI response:', data)
    throw new Error('Invalid response from OpenAI')
  }
  
  return data.choices[0].message.content
}

/**
 * Generate cover letter using OpenAI
 */
async function generateCoverLetter(job: any, cvData: any, language: string): Promise<string> {
  const prompt = language === 'sv'
    ? `Du är en professionell rekryteringskonsult. Skriv ett personligt brev för följande:

JOBBANNONS:
Titel: ${job.title}
Företag: ${job.company}
Beskrivning: ${job.description}
Plats: ${job.location}

KANDIDATENS BAKGRUND:
${JSON.stringify(cvData, null, 2)}

UPPGIFT:
Skriv ett professionellt och engagerande personligt brev (max 3 stycken) som:
1. Refererar till den specifika tjänsten
2. Kopplar kandidatens erfarenhet till jobbkraven
3. Visar entusiasm för företaget och rollen
4. Använder professionell men personlig ton
5. Avslutar med en uppmaning till handling

Returnera brevet i Markdown-format.`
    : `You are a professional recruitment consultant. Write a cover letter for the following:

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Location: ${job.location}

CANDIDATE'S BACKGROUND:
${JSON.stringify(cvData, null, 2)}

TASK:
Write a professional and engaging cover letter (max 3 paragraphs) that:
1. References the specific position
2. Connects candidate's experience to job requirements
3. Shows enthusiasm for the company and role
4. Uses professional but personal tone
5. Ends with a call to action

Return the letter in Markdown format.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('OpenAI API error (cover letter):', errorData)
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0]) {
    console.error('Invalid OpenAI response:', data)
    throw new Error('Invalid response from OpenAI')
  }
  
  return data.choices[0].message.content
}

/**
 * Generate email draft using OpenAI
 */
async function generateEmailDraft(job: any, cvData: any, language: string): Promise<{ subject: string, body: string }> {
  const prompt = language === 'sv'
    ? `Skriv ett professionellt e-postmeddelande för jobbansökan:

JOBB: ${job.title} på ${job.company}
KANDIDAT: ${cvData.title || cvData.name}

Skapa:
1. En professionell ämnesrad
2. Ett kort e-postmeddelande (3-4 meningar) som:
   - Hänvisar till jobbannonsen
   - Nämner nyckelkvalifikationer
   - Nämner bifogade CV och personligt brev
   - Avslutar professionellt

Returnera JSON: { "subject": "...", "body": "..." }`
    : `Write a professional job application email:

JOB: ${job.title} at ${job.company}
CANDIDATE: ${cvData.title || cvData.name}

Create:
1. A professional subject line
2. A brief email (3-4 sentences) that:
   - References the job posting
   - Mentions key qualifications
   - Mentions attached CV and cover letter
   - Ends professionally

Return JSON: { "subject": "...", "body": "..." }`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('OpenAI API error (email):', errorData)
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0]) {
    console.error('Invalid OpenAI response:', data)
    throw new Error('Invalid response from OpenAI')
  }
  
  return JSON.parse(data.choices[0].message.content)
}
