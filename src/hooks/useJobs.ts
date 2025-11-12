import { useState, useEffect } from "react";
import { jobService } from "@/services/jobService";
import { JobWithMatch } from "@/types/job";

type MatchMode = "keyword" | "ai";

export const useJobs = (
  userId?: string,
  excludeSwiped = true,
  matchMode: MatchMode = "keyword",
  minThreshold = 0.65,
  topN = 50
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
          ? await jobService.getAIMatchedJobs(userId, topN)
          : await jobService.getMatchedJobs(userId, 5000);

      // For keyword mode: filter by percentage threshold
      // For AI mode: already limited by topN in the service call
      const filtered =
        matchMode === "keyword"
          ? fetchedJobs.filter((job) => {
              const score = job.match_score ?? 0;
              return score >= minThreshold;
            })
          : fetchedJobs;

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
  }, [userId, excludeSwiped, matchMode, minThreshold, topN]);

  return { jobs, loading, error, refetch: loadJobs };
};
