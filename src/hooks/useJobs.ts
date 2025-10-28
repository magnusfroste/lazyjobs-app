import { useState, useEffect } from "react";
import { jobService } from "@/services/jobService";
import { JobWithMatch } from "@/types/job";

type MatchMode = "keyword" | "ai";

export const useJobs = (
  userId?: string,
  excludeSwiped = true,
  matchMode: MatchMode = "keyword"
) => {
  const [jobs, setJobs] = useState<JobWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setJobs([]);
        return;
      }

      // Call appropriate service based on match mode
      const fetchedJobs =
        matchMode === "ai"
          ? await jobService.getAIMatchedJobs(userId, 100)
          : await jobService.getMatchedJobs(userId, 100);

      // Filter by 50% minimum threshold (hardcoded for now)
      const filtered = fetchedJobs.filter((job) => {
        const score = job.match_score ?? 0.5;
        return score >= 0.5;
      });

      setJobs(filtered);
    } catch (err) {
      setError(err as Error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [userId, excludeSwiped, matchMode]);

  return { jobs, loading, error, refetch: loadJobs };
};
