import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Match = Tables<"matches">;
type Job = Tables<"jobs">;

export interface MatchWithJob extends Match {
  job: Job;
  job_match?: {
    match_breakdown: {
      skills: number;
      salary: number;
      location: number;
      remote: number;
      type: number;
    };
    matching_skills: string[];
    skills_to_learn: string[];
    recommendation: string;
    confidence_level: 'low' | 'medium' | 'high';
  };
}

export class MatchServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchServiceError";
  }
}

export class MatchService {
  async createMatch(
    userId: string,
    jobId: string,
    matchScore: number
  ): Promise<Match> {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        user_id: userId,
        job_id: jobId,
        match_score: matchScore,
      })
      .select()
      .single();

    if (error) throw new MatchServiceError(error.message);
    return data;
  }

  async getUserMatches(userId: string): Promise<MatchWithJob[]> {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        job:jobs(*),
        job_match:job_matches(
          match_breakdown,
          matching_skills,
          skills_to_learn,
          recommendation,
          confidence_level
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new MatchServiceError(error.message);
    return (data as any) || [];
  }

  async deleteMatch(matchId: string): Promise<void> {
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (error) throw new MatchServiceError(error.message);
  }

  async updateMatchNotes(matchId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from("matches")
      .update({ notes })
      .eq("id", matchId);

    if (error) throw new MatchServiceError(error.message);
  }

  async markAsApplied(matchId: string): Promise<void> {
    const { error } = await supabase
      .from("matches")
      .update({ 
        is_applied: true,
        applied_at: new Date().toISOString()
      })
      .eq("id", matchId);

    if (error) throw new MatchServiceError(error.message);
  }
}

export const matchService = new MatchService();
