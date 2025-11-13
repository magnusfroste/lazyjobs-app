import { useState, useEffect, useRef } from "react";
import { jobService } from "@/services/jobService";
import { JobWithMatch } from "@/types/job";

type MatchMode = "keyword" | "ai" | "llm";

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
  const [dynamicLimit, setDynamicLimit] = useState(matchMode === "llm" ? 5 : topN);
  const [backgroundFetching, setBackgroundFetching] = useState(false);
  const lastFetchTimeRef = useRef<number>(0);
  const pendingFetchRef = useRef<NodeJS.Timeout | null>(null);

  const loadJobs = async (isBackgroundFetch = false, limitOverride?: number, appendToExisting = false) => {
    // Clear any pending fetch
    if (pendingFetchRef.current) {
      clearTimeout(pendingFetchRef.current);
      pendingFetchRef.current = null;
    }

    // Check cooldown (5 seconds) - only for background fetches
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    const COOLDOWN_MS = 5000;

    if (isBackgroundFetch && timeSinceLastFetch < COOLDOWN_MS && lastFetchTimeRef.current > 0) {
      console.log(`⏳ Cooldown active. Waiting ${Math.ceil((COOLDOWN_MS - timeSinceLastFetch) / 1000)}s...`);
      
      // Schedule the fetch after cooldown
      const waitTime = COOLDOWN_MS - timeSinceLastFetch;
      pendingFetchRef.current = setTimeout(() => {
        loadJobs(isBackgroundFetch, limitOverride);
      }, waitTime);
      return;
    }
    try {
      lastFetchTimeRef.current = now;
      
      if (isBackgroundFetch) {
        setBackgroundFetching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!userId) {
        setJobs([]);
        return;
      }

      const currentLimit = limitOverride ?? dynamicLimit;

      // Call appropriate service based on match mode
      const fetchedJobs =
        matchMode === "llm"
          ? await jobService.getLLMMatchedJobs(userId, currentLimit)
          : matchMode === "ai"
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

      if (appendToExisting && isBackgroundFetch) {
        // Append new jobs, filter out duplicates by ID
        setJobs(prevJobs => {
          const existingIds = new Set(prevJobs.map(j => j.id));
          const newJobs = filtered.filter(j => !existingIds.has(j.id));
          console.log(`➕ Appending ${newJobs.length} new jobs to existing ${prevJobs.length}`);
          return [...prevJobs, ...newJobs];
        });
      } else {
        // Initial load or mode switch: replace
        setJobs(filtered);
      }
    } catch (err) {
      setError(err as Error);
      setJobs([]);
    } finally {
      setLoading(false);
      setBackgroundFetching(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // Intentionally NOT including dynamicLimit to prevent race conditions
  }, [userId, excludeSwiped, matchMode, minThreshold, topN]);

  const triggerBackgroundFetch = (newLimit: number) => {
    console.log(`🔄 Background fetch triggered: ${newLimit} jobs`);
    setDynamicLimit(newLimit);
    loadJobs(true, newLimit, true); // Pass true to append jobs instead of replacing
  };

  return { jobs, loading, error, refetch: loadJobs, triggerBackgroundFetch, dynamicLimit, backgroundFetching };
};
