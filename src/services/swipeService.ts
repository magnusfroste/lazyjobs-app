import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

export interface SwipeEventData {
  user_id: string;
  job_id: string;
  direction: "left" | "right";
  job_title?: string;
  company_name?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  is_remote?: boolean | null;
  location?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  required_skills?: string[] | null;
  match_score?: number;
  time_spent_seconds?: number;
}

export class SwipeServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SwipeServiceError";
  }
}

export class SwipeService {
  async recordSwipe(eventData: SwipeEventData): Promise<void> {
    const { error } = await supabase
      .from("swipe_events")
      .insert(eventData);

    if (error) throw new SwipeServiceError(error.message);
  }

  async recordSwipeWithJob(
    userId: string,
    job: Job,
    direction: "left" | "right",
    matchScore?: number
  ): Promise<void> {
    await this.recordSwipe({
      user_id: userId,
      job_id: job.id,
      direction,
      job_title: job.title,
      company_name: job.company,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      is_remote: job.is_remote,
      location: job.location,
      employment_type: job.employment_type,
      experience_level: job.experience_level,
      required_skills: job.required_skills,
      match_score: matchScore,
    });
  }

  async getUserSwipeHistory(userId: string, limit = 100) {
    const { data, error } = await supabase
      .from("swipe_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new SwipeServiceError(error.message);
    return data || [];
  }

  async getSwipeStats(userId: string) {
    const { data, error } = await supabase
      .from("swipe_events")
      .select("direction")
      .eq("user_id", userId);

    if (error) throw new SwipeServiceError(error.message);

    const total = data?.length || 0;
    const rightSwipes = data?.filter((s) => s.direction === "right").length || 0;
    const leftSwipes = data?.filter((s) => s.direction === "left").length || 0;

    return {
      total,
      rightSwipes,
      leftSwipes,
      rightSwipeRate: total > 0 ? rightSwipes / total : 0,
    };
  }
}

export const swipeService = new SwipeService();
