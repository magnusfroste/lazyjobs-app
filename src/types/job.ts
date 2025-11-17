import { Tables } from "@/integrations/supabase/types";

export type Job = Tables<"jobs">;

export interface JobWithMatch extends Job {
  match_score?: number;
  match_breakdown?: {
    skills: number;
    salary: number;
    location: number;
    work_arrangement: number;
    type: number;
  } | any; // Allow Json type from job_matches table
  matching_skills?: string[];
  skills_to_learn?: string[];
  recommendation?: string;
  confidence_level?: string;
}

export interface MatchBreakdown {
  skills: number;
  salary: number;
  location: number;
  remote: number;
  type: number;
}

export interface JobMatchData {
  match_breakdown: MatchBreakdown;
  matching_skills: string[];
  skills_to_learn: string[];
  recommendation: string;
  confidence_level: 'low' | 'medium' | 'high';
}
