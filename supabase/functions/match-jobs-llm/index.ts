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

    const { user_id, limit = 5 }: MatchRequest = await req.json();

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

    // Prepare candidate profile for LLM (INCREASED to 25 skills for better matching)
    const allCandidateSkills = profile.cv_data?.skills_flat || profile.cv_data?.skills || [];
    const candidateProfile = {
      skills: Array.isArray(allCandidateSkills) ? allCandidateSkills.slice(0, 25) : [],
      experience_years: profile.cv_data?.experience_years || 0,
      preferred_salary_min: profile.preferences?.salary_min || 0,
      preferred_salary_max: profile.preferences?.salary_max || 200000,
      preferred_locations: profile.preferences?.locations || [],
      remote_preference: profile.preferences?.remote_only || false,
    };

    console.log("Candidate skills count:", candidateProfile.skills.length);
    console.log("Processing", jobs.length, "jobs for LLM matching");

    // Prepare jobs for LLM (SIMPLIFIED - 10 skills max, no description)
    const jobsForLLM = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      required_skills: (job.required_skills || []).slice(0, 10),
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      location: job.location,
      remote_option: job.remote_option,
      employment_type: job.employment_type,
    }));

    const systemPrompt = `You are an expert job matching system. Return ONLY valid JSON.

    Return this exact structure (at most 3 jobs):
    {
      "matches": [
        {
          "job_id": "string",
          "match_score": 0.0-1.0,
          "matched_skills": ["skill1", "skill2", ...],
          "missing_skills": ["skill1", "skill2", ...],
          "reasoning": "brief explanation"
        }
      ]
    }

    Rules:
    - Analyze all provided jobs but RETURN ONLY THE TOP 3 matches (sorted by match_score desc)
    - matched_skills: max 8 items per job
    - missing_skills: max 6 items per job
    - reasoning: max 120 characters per job
    - match_score: 0.0 (no match) to 1.0 (perfect match)

    Do not include any other text, markdown, or explanation. Only return the JSON object.`;

    const userPrompt = JSON.stringify({
      candidate: candidateProfile,
      jobs: jobsForLLM,
    });

    // Call LLM API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 90 second timeout
    
    try {
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
          temperature: 0.2,  // Lower for more deterministic JSON
          max_tokens: 1000,  // Increased for better skill analysis
          // response_format removed - can cause issues with vLLM
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text();
        console.error("LLM API error:", llmResponse.status, errorText);
        
        if (llmResponse.status === 524) {
          throw new Error("LLM API timeout - try reducing the number of jobs");
        }
        
        throw new Error(`LLM API error: ${llmResponse.status}`);
      }

      const llmData = await llmResponse.json();
      console.log("Full LLM response:", JSON.stringify(llmData, null, 2));

      // Extract JSON from message content
      let content = llmData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in LLM response");
      }

      console.log("Raw content:", content);

      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      // Parse JSON with error handling
      let matches;
      try {
        const parsedData = JSON.parse(content);
        matches = parsedData.matches;
        console.log("Successfully parsed matches:", matches.length);
      } catch (parseError) {
        console.error("Failed to parse JSON from content:", parseError);
        console.error("Cleaned content:", content);
        // Graceful fallback on invalid JSON (often due to length truncation)
        const fallbackJobs = jobs.map((j: any) => ({ ...j, match_score: 0 }));
        return new Response(
          JSON.stringify({ success: true, jobs: fallbackJobs, note: "llm_invalid_json_fallback" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
    } catch (fetchError) {
      clearTimeout(timeout);
      
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.warn("LLM request timed out after 90 seconds. Returning fallback jobs.");
        const fallbackJobs = jobs.map((j: any) => ({ ...j, match_score: 0 }));
        return new Response(
          JSON.stringify({ success: true, jobs: fallbackJobs, note: "llm_timeout_fallback" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw fetchError;
    }
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
