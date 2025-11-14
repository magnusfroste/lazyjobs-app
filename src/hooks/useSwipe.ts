import { useState, useEffect, useRef } from "react";
import { swipeService } from "@/services/swipeService";
import { matchService } from "@/services/matchService";
import { useToast } from "@/hooks/use-toast";
import { JobWithMatch } from "@/types/job";

export const useSwipe = (userId: string, jobs: JobWithMatch[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState<string[]>([]);
  const { toast } = useToast();
  const prevJobsRef = useRef<JobWithMatch[]>([]);

  // Only reset if jobs array was actually replaced (not on background append)
  useEffect(() => {
    const jobsReplaced = jobs.length > 0 && prevJobsRef.current.length > 0 &&
      (jobs[0]?.id !== prevJobsRef.current[0]?.id);
    
    if (jobsReplaced) {
      console.log("🔄 Jobs replaced, resetting index");
      setCurrentIndex(0);
      setSwipeHistory([]);
    }
    
    prevJobsRef.current = jobs;
  }, [jobs]);

  const handleSwipe = async (direction: "left" | "right") => {
    if (currentIndex >= jobs.length) return;

    const currentJob = jobs[currentIndex];
    const matchScore = currentJob.match_score || 50;

    try {
      // Record swipe in swipes table
      await swipeService.recordSwipeWithJob(userId, currentJob, direction, matchScore);

      // If right swipe, also create match
      if (direction === "right") {
        await matchService.createMatch(userId, currentJob.id, matchScore);
        
        toast({
          title: "It's a match! 🎉",
          description: `${currentJob.title} saved to your matches`,
        });
      }

      setSwipeHistory([...swipeHistory, currentJob.id]);
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error("Swipe error:", error);
      toast({
        title: "Error",
        description: "Failed to process swipe",
        variant: "destructive",
      });
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0 && swipeHistory.length > 0) {
      setCurrentIndex(currentIndex - 1);
      setSwipeHistory(swipeHistory.slice(0, -1));
    }
  };

  const currentJob = jobs[currentIndex];
  const remainingJobs = jobs.length - currentIndex;
  const canUndo = currentIndex > 0;

  return {
    currentJob,
    currentIndex,
    remainingJobs,
    canUndo,
    handleSwipe,
    handleUndo,
  };
};
