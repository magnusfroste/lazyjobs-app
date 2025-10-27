import { supabase } from "@/integrations/supabase/client";
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

  async getJobsExcludingSwipedByUser(userId: string, limit = 50): Promise<Job[]> {
    // Get jobs that user hasn't swiped on yet
    const { data: swipedJobIds, error: swipeError } = await supabase
      .from("swipe_events")
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
