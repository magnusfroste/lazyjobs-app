import { useState, useEffect, useRef } from "react";
import { jobService } from "@/services/jobService";
import { JobWithMatch } from "@/types/job";

type MatchMode = "keyword" | "precomputed";

export const useJobs = (
  userId?: string,
  excludeSwiped = true,
  matchMode: MatchMode = "keyword",
  minThreshold = 0.65
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
        matchMode === "precomputed"
          ? await jobService.getPrecomputedMatches(userId, minThreshold)
          : await jobService.getMatchedJobs(userId, 5000);

      // For keyword mode: filter by percentage threshold (convert 0-1 to 0-100)
      // For precomputed mode: already filtered/limited by service
      const filtered =
        matchMode === "keyword"
          ? fetchedJobs.filter((job) => {
              const score = job.match_score ?? 0;
              const thresholdPercent = minThreshold * 100; // Convert 0.65 → 65
              return score >= thresholdPercent;
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
  }, [userId, excludeSwiped, matchMode, minThreshold]);

  return { jobs, loading, error, refetch: loadJobs };
};
