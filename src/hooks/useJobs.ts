import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { jobService } from "@/services/jobService";

type Job = Tables<"jobs">;

export const useJobs = (userId?: string, excludeSwiped = true) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: Job[];
      if (userId && excludeSwiped) {
        data = await jobService.getJobsExcludingSwipedByUser(userId);
      } else {
        data = await jobService.getActiveJobs();
      }
      
      setJobs(data);
    } catch (err) {
      setError(err as Error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [userId, excludeSwiped]);

  return { jobs, loading, error, refetch: loadJobs };
};
