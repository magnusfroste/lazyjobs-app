import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestChatRequest {
  message?: string;
  useToolCalling?: boolean;
  discoverModels?: boolean;
  testJobMatching?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { message, useToolCalling, discoverModels, testJobMatching }: TestChatRequest = await req.json();

    const LLM_API_URL = Deno.env.get("MATCH_LLM_URL");
    const LLM_API_KEY = Deno.env.get("MATCH_LLM_API_KEY");

    if (!LLM_API_URL || !LLM_API_KEY) {
      throw new Error("LLM configuration missing");
    }

    // Handle job matching test
    if (testJobMatching) {
      console.log("🧪 Testing job matching with 1 profile + 1 job");
      
      // Get auth header and create Supabase client
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("Authentication required for job matching test");
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase configuration missing");
      }

      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Failed to authenticate user");
      }

      console.log(`Fetching profile for user: ${user.id}`);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Failed to fetch user profile");
      }

      // Fetch 1 active job
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .limit(1);

      if (jobsError || !jobs || jobs.length === 0) {
        throw new Error("Failed to fetch active jobs");
      }

      const job = jobs[0];
      console.log(`Testing with job: ${job.title} (${job.id})`);

      // Prepare candidate profile (same trimming as match-jobs-llm)
      const allCandidateSkills = profile.cv_data?.skills_flat || profile.cv_data?.skills || [];
      const candidateProfile = {
        skills: Array.isArray(allCandidateSkills) ? allCandidateSkills.slice(0, 40) : [],
        experience_years: profile.cv_data?.experience_years || 0,
        preferred_salary_min: profile.preferences?.salary_min || 0,
        preferred_salary_max: profile.preferences?.salary_max || 200000,
        preferred_locations: profile.preferences?.locations || [],
        remote_preference: profile.preferences?.remote || false,
        preferred_employment_types: profile.preferences?.employment_types || [],
      };

      // Prepare job data (same trimming as match-jobs-llm)
      const jobForLLM = {
        id: job.id,
        title: job.title,
        company: job.company,
        required_skills: (job.required_skills || []).slice(0, 15),
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        location: job.location,
        remote_option: job.remote_option,
        employment_type: job.employment_type,
        description: job.description?.substring(0, 300),
      };

      console.log("Candidate skills count:", candidateProfile.skills.length);
      console.log("Job required skills count:", jobForLLM.required_skills.length);

      // Use EXACT same system prompt as match-jobs-llm
      const systemPrompt = `You are an expert job matching system. Analyze how well a candidate matches each job posting.
Score from 0-1 based on skills, experience, salary expectations, location preferences, and employment type.
Consider both matched skills and missing skills. Provide clear reasoning.

CRITICAL: You MUST call the score_job_matches function exactly once. Do not include any message content.`;

      const userPrompt = `Candidate Profile:
${JSON.stringify(candidateProfile, null, 2)}

Job Postings:
${JSON.stringify([jobForLLM], null, 2)}

Return a match score and analysis for this job.`;

      // Use EXACT same tool schema as match-jobs-llm
      const requestBody: any = {
        model: "autoversio",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
        tools: [
          {
            type: "function",
            function: {
              name: "score_job_matches",
              description: "Score job matches for a candidate",
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
                            skills: { type: "number" },
                            salary: { type: "number" },
                            location: { type: "number" },
                            remote: { type: "number" },
                            employment: { type: "number" },
                          },
                        },
                        matched_skills: { type: "array", items: { type: "string" } },
                        missing_skills: { type: "array", items: { type: "string" } },
                        reasoning: { type: "string" },
                      },
                      required: ["job_id", "match_score"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_job_matches" } },
      };

      console.log("Calling LLM with job matching tool schema...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(LLM_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LLM API error (${response.status}):`, errorText);
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("LLM Response:", JSON.stringify(data, null, 2));
      console.log(`Response time: ${responseTime}ms`);

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      const finishReason = data.choices?.[0]?.finish_reason;

      console.log("Finish reason:", finishReason);

      if (!toolCall) {
        console.error("No tool call in response");
        return new Response(
          JSON.stringify({
            success: false,
            error: "LLM did not return a tool call",
            responseTime,
            rawResponse: data,
            request: requestBody,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Parse tool call arguments
      let parsedArgs;
      const argsRaw = toolCall.function.arguments;
      
      console.log("Raw arguments type:", typeof argsRaw);
      console.log("Raw arguments:", argsRaw);

      if (typeof argsRaw === "string") {
        try {
          parsedArgs = JSON.parse(argsRaw);
          console.log("Successfully parsed string arguments");
        } catch (parseError) {
          console.error("Failed to parse tool call arguments:", parseError);
          console.error("Raw arguments string:", argsRaw);
          return new Response(
            JSON.stringify({
              success: false,
              error: `Invalid tool call arguments: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
              responseTime,
              rawArguments: argsRaw,
              finishReason,
              rawResponse: data,
              request: requestBody,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else if (typeof argsRaw === "object" && argsRaw) {
        parsedArgs = argsRaw;
        console.log("Arguments already an object");
      } else {
        console.error("Unexpected arguments type:", typeof argsRaw);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unexpected tool call arguments format",
            responseTime,
            rawArguments: argsRaw,
            finishReason,
            rawResponse: data,
            request: requestBody,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const matches = parsedArgs?.matches || [];
      const match = matches[0];

      if (!match) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No match data returned",
            responseTime,
            rawResponse: data,
            request: requestBody,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Match result:", JSON.stringify(match, null, 2));

      return new Response(
        JSON.stringify({
          success: true,
          responseTime,
          matchResult: {
            job_title: job.title,
            match_score: match.match_score,
            matched_skills: match.matched_skills || [],
            missing_skills: match.missing_skills || [],
            reasoning: match.reasoning || "No reasoning provided",
          },
          finishReason,
          rawResponse: data,
          request: requestBody,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If discovering models, call /v1/models endpoint
    if (discoverModels) {
      const modelsUrl = LLM_API_URL.replace("/chat/completions", "/models");
      console.log(`Discovering models at: ${modelsUrl}`);
      
      const modelsResponse = await fetch(modelsUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
      });

      if (!modelsResponse.ok) {
        const errorText = await modelsResponse.text();
        console.error(`Models API error (${modelsResponse.status}):`, errorText);
        throw new Error(`Models API error: ${modelsResponse.status} - ${errorText}`);
      }

      const modelsData = await modelsResponse.json();
      console.log("Available models:", JSON.stringify(modelsData, null, 2));

      return new Response(
        JSON.stringify({
          success: true,
          models: modelsData,
          endpoint: modelsUrl,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Testing LLM endpoint: ${LLM_API_URL}`);
    console.log(`Tool calling: ${useToolCalling}`);
    console.log(`Message: ${message}`);
    
    const requestBody: any = {
      model: "autoversio",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Be concise and clear.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    // Add tool calling if enabled
    if (useToolCalling) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "calculate",
            description: "Perform a simple arithmetic calculation",
            parameters: {
              type: "object",
              properties: {
                a: {
                  type: "number",
                  description: "First number",
                },
                b: {
                  type: "number",
                  description: "Second number",
                },
                operation: {
                  type: "string",
                  enum: ["add", "subtract", "multiply", "divide"],
                  description: "The operation to perform",
                },
              },
              required: ["a", "b", "operation"],
            },
          },
        },
      ];
      requestBody.tool_choice = "auto";
    }

    console.log("Request payload:", JSON.stringify(requestBody, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API error (${response.status}):`, errorText);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Response received:", JSON.stringify(data, null, 2));
    console.log(`Response time: ${responseTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        responseTime,
        data,
        request: requestBody,
        endpoint: LLM_API_URL,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error in test-llm-chat:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
