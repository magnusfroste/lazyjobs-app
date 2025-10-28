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
    matchScore: number
  ): Promise<void> {
    // Record in swipes table only (skip swipe_events for now)
    const { error } = await supabase
      .from("swipes")
      .insert({
        user_id: userId,
        job_id: job.id,
        direction,
      });

    // Ignore duplicate key errors (user already swiped this job)
    if (error && error.code !== "23505") {
      throw new SwipeServiceError(error.message);
    }
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
