import { Tables } from "@/integrations/supabase/types";

export type Job = Tables<"jobs">;

export interface JobWithMatch extends Job {
  match_score?: number;
  match_breakdown?: {
    skills: number;
    salary: number;
    location: number;
    remote: number;
    employment: number;
  };
}
