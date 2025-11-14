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
    // Get all matches with jobs
    const { data: matchesData, error: matchesError } = await supabase
      .from("matches")
      .select(`
        *,
        job:jobs(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (matchesError) throw new MatchServiceError(matchesError.message);
    if (!matchesData) return [];

    // Get job_matches data for these jobs
    const jobIds = matchesData.map(m => m.job_id).filter(Boolean);
    
    if (jobIds.length === 0) return matchesData as any;

    const { data: jobMatchesData } = await supabase
      .from("job_matches")
      .select("job_id, match_breakdown, matching_skills, skills_to_learn, recommendation, confidence_level")
      .eq("profile_id", userId)
      .in("job_id", jobIds);

    // Merge the data
    const jobMatchesMap = new Map(
      jobMatchesData?.map(jm => [jm.job_id, jm]) || []
    );

    return matchesData.map(match => ({
      ...match,
      job_match: jobMatchesMap.get(match.job_id!) || undefined,
    })) as any;
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
