import { useState, useEffect, useRef } from "react";
import { swipeService } from "@/services/swipeService";
import { matchService } from "@/services/matchService";
import { useToast } from "@/hooks/use-toast";
import { JobWithMatch } from "@/types/job";
import confetti from "canvas-confetti";

export const useSwipe = (userId: string, jobs: JobWithMatch[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState<string[]>([]);
  const { toast } = useToast();
  const prevJobsRef = useRef<JobWithMatch[]>([]);

  // Reset index when jobs array changes (new data loaded)
  useEffect(() => {
    const prevJobs = prevJobsRef.current;
    const hasNewJobs = jobs.length > 0;
    const hadPrevJobs = prevJobs.length > 0;
    const firstJobChanged = hasNewJobs && (!hadPrevJobs || jobs[0]?.id !== prevJobs[0]?.id);
    
    // Reset when we get jobs for the first time OR when the jobs list changes
    if (firstJobChanged) {
      console.log("🔄 Jobs changed, resetting index");
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
        
        // Trigger confetti for high-match jobs (90%+)
        if (matchScore >= 90) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#ff6b9d']
          });
        }
        
        toast({
          title: "Love is in the air! 💕",
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

  const jumpToJob = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < jobs.length) {
      setCurrentIndex(targetIndex);
      // Don't modify swipeHistory - user hasn't swiped yet
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
    jumpToJob,
  };
};
