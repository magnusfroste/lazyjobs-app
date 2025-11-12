import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchRequest {
  user_id: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const matchLLMUrl = Deno.env.get("MATCH_LLM_URL");
    const matchLLMApiKey = Deno.env.get("MATCH_LLM_API_KEY");

    if (!matchLLMUrl || !matchLLMApiKey) {
      throw new Error("MATCH_LLM_URL or MATCH_LLM_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !userData?.user) {
      throw new Error("Unauthorized");
    }

    const { user_id, limit = 100 }: MatchRequest = await req.json();

    if (userData.user.id !== user_id) {
      throw new Error("User ID mismatch");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("cv_data, preferences")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    // Get swiped job IDs to exclude
    const { data: swipedJobs } = await supabase
      .from("swipes")
      .select("job_id")
      .eq("user_id", user_id);

    const swipedIds = swipedJobs?.map((s) => s.job_id) || [];

    // Get active jobs (excluding swiped)
    const jobsQuery = supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .limit(limit);

    if (swipedIds.length > 0) {
      jobsQuery.not("id", "in", `(${swipedIds.join(",")})`);
    }

    const { data: jobs, error: jobsError } = await jobsQuery;

    if (jobsError || !jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} jobs with Qwen LLM`);

    // Prepare candidate profile for LLM
    const candidateProfile = {
      skills: profile.cv_data?.skills || [],
      experience_years: profile.cv_data?.experience_years || 0,
      preferred_salary_min: profile.preferences?.salary_min || 0,
      preferred_salary_max: profile.preferences?.salary_max || 200000,
      preferred_locations: profile.preferences?.locations || [],
      remote_preference: profile.preferences?.remote_only || false,
    };

    // Prepare jobs for LLM
    const jobsForLLM = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      required_skills: job.required_skills || [],
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      location: job.location,
      remote_option: job.remote_option,
      employment_type: job.employment_type,
      description: job.description?.substring(0, 500), // Limit description length
    }));

    const systemPrompt = `You are an expert job matching system. Analyze how well a candidate matches each job posting.

For each job, provide:
1. match_score: Overall match (0.0 to 1.0)
2. match_breakdown: Category scores (0-100 each):
   - skills: Technical/professional skill alignment
   - salary: Compensation fit  
   - location: Geographic compatibility
   - remote: Remote work preference match
   - employment: Contract type alignment
3. matched_skills: Skills candidate has that job needs
4. missing_skills: Critical skills candidate should learn
5. reasoning: Brief explanation (max 200 chars)

Consider skill transferability, seniority alignment, and career progression.`;

    const userPrompt = JSON.stringify({
      candidate: candidateProfile,
      jobs: jobsForLLM,
    });

    // Call Qwen LLM API (OpenAI-compatible)
    const llmResponse = await fetch(matchLLMUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${matchLLMApiKey}`,
      },
      body: JSON.stringify({
        model: "autoversio",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_job_matches",
              description: "Score and analyze job matches for a candidate",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        job_id: { type: "string" },
                        match_score: { type: "number", minimum: 0, maximum: 1 },
                        match_breakdown: {
                          type: "object",
                          properties: {
                            skills: { type: "number", minimum: 0, maximum: 100 },
                            salary: { type: "number", minimum: 0, maximum: 100 },
                            location: { type: "number", minimum: 0, maximum: 100 },
                            remote: { type: "number", minimum: 0, maximum: 100 },
                            employment: { type: "number", minimum: 0, maximum: 100 },
                          },
                          required: ["skills", "salary", "location", "remote", "employment"],
                        },
                        matched_skills: { type: "array", items: { type: "string" } },
                        missing_skills: { type: "array", items: { type: "string" } },
                        reasoning: { type: "string", maxLength: 200 },
                      },
                      required: ["job_id", "match_score", "match_breakdown", "matched_skills", "missing_skills", "reasoning"],
                    },
                  },
                },
                required: ["matches"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_job_matches" } },
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("LLM API error:", llmResponse.status, errorText);
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();
    console.log("LLM response received:", JSON.stringify(llmData).substring(0, 200));

    // Parse tool call response
    const toolCall = llmData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "score_job_matches") {
      throw new Error("Invalid LLM response format");
    }

    const matches = JSON.parse(toolCall.function.arguments).matches;

    // Merge LLM scores with original job data
    const scoredJobs = matches
      .map((match: any) => {
        const job = jobs.find((j) => j.id === match.job_id);
        if (!job) return null;

        return {
          ...job,
          match_score: match.match_score,
          match_breakdown: match.match_breakdown,
          matched_skills: match.matched_skills,
          missing_skills: match.missing_skills,
          reasoning: match.reasoning,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.match_score - a.match_score);

    console.log(`Returning ${scoredJobs.length} scored jobs`);

    return new Response(
      JSON.stringify({ success: true, jobs: scoredJobs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in match-jobs-llm:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
