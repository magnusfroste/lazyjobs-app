import { supabase } from "@/integrations/supabase/client";
import { JobWithMatch } from "@/types/job";
import { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

export class JobServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobServiceError";
  }
}

export class JobService {
  async getActiveJobs(limit = 50): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .limit(limit);

    if (error) throw new JobServiceError(error.message);
    return data || [];
  }

  async getJobById(jobId: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) throw new JobServiceError(error.message);
    return data;
  }

  async getMatchedJobs(userId: string, limit = 50): Promise<JobWithMatch[]> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("cv_data, preferences")
        .eq("id", userId)
        .single();

      // Call EXISTING match-jobs edge function (from /ref)
      const { data, error } = await supabase.functions.invoke("match-jobs", {
        body: {
          user_id: userId,
          cv_data: profile?.cv_data,
          preferences: profile?.preferences,
          limit,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        return this.getJobsExcludingSwipedByUser(userId, limit);
      }

      if (!data?.success) {
        console.warn("Edge function unsuccessful response");
        return this.getJobsExcludingSwipedByUser(userId, limit);
      }

      return data.jobs || [];
    } catch (error) {
      console.error("Error fetching matched jobs:", error);
      throw new JobServiceError("Failed to fetch matched jobs");
    }
  }

  async getAIMatchedJobs(userId: string, limit = 100): Promise<JobWithMatch[]> {
    try {
      const { data, error } = await supabase.functions.invoke("ai-match-jobs", {
        body: { user_id: userId, limit },
      });

      if (error) {
        console.error("AI matching error:", error);
        throw new JobServiceError("Failed to fetch AI-matched jobs");
      }

      // ai-match-jobs returns { success: true, data: [...jobs with scores...] }
      return data?.data || [];
    } catch (error) {
      console.error("Error fetching AI-matched jobs:", error);
      throw new JobServiceError("Failed to fetch AI-matched jobs");
    }
  }

  async getLLMMatchedJobs(userId: string, limit = 100): Promise<JobWithMatch[]> {
    try {
      const { data, error } = await supabase.functions.invoke("match-jobs-llm", {
        body: { user_id: userId, limit },
      });

      if (error) {
        console.error("LLM matching error:", error);
        throw new JobServiceError("Failed to fetch LLM-matched jobs");
      }

      return data?.jobs || [];
    } catch (error) {
      console.error("Error fetching LLM-matched jobs:", error);
      throw new JobServiceError("Failed to fetch LLM-matched jobs");
    }
  }

  async getPrecomputedMatches(userId: string, minThreshold = 0.65): Promise<JobWithMatch[]> {
    try {
      // Get user's pre-computed matches with job details
      const { data, error } = await supabase
        .from("job_matches")
        .select(`
          *,
          job:jobs(*)
        `)
        .eq("profile_id", userId)
        .gte("match_score", minThreshold * 100)
        .order("match_score", { ascending: false });

      if (error) throw new JobServiceError(error.message);

      // Get already swiped job IDs to filter out
      const { data: swipedJobIds } = await supabase
        .from("swipes")
        .select("job_id")
        .eq("user_id", userId);

      const swipedIds = new Set(swipedJobIds?.map(s => s.job_id) || []);

      // Transform to JobWithMatch format and filter out swiped
      return (data || [])
        .filter(match => match.job && !swipedIds.has(match.job_id))
        .map(match => ({
          ...match.job,
          match_score: match.match_score, // Already 0-100
          match_breakdown: match.match_breakdown,
          matching_skills: match.matching_skills,
          skills_to_learn: match.skills_to_learn,
          recommendation: match.recommendation,
          confidence_level: match.confidence_level,
        }));
    } catch (error) {
      console.error("Error fetching precomputed matches:", error);
      throw new JobServiceError("Failed to fetch precomputed matches");
    }
  }

  async getJobsExcludingSwipedByUser(userId: string, limit = 50): Promise<Job[]> {
    // Get jobs that user hasn't swiped on yet
    const { data: swipedJobIds, error: swipeError } = await supabase
      .from("swipes")
      .select("job_id")
      .eq("user_id", userId);

    if (swipeError) throw new JobServiceError(swipeError.message);

    const swipedIds = swipedJobIds?.map((s) => s.job_id) || [];

    const query = supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .limit(limit);

    if (swipedIds.length > 0) {
      query.not("id", "in", `(${swipedIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) throw new JobServiceError(error.message);
    return data || [];
  }
}

export const jobService = new JobService();
