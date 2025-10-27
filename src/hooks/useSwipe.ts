import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { swipeService } from "@/services/swipeService";
import { matchService } from "@/services/matchService";
import { useToast } from "@/hooks/use-toast";

type Job = Tables<"jobs">;

export const useSwipe = (userId: string, jobs: Job[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const calculateMatchScore = (job: Job): number => {
    // Mock match score calculation - will be replaced with AI matching
    return Math.floor(Math.random() * 30) + 50;
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (currentIndex >= jobs.length) return;

    const currentJob = jobs[currentIndex];
    const matchScore = calculateMatchScore(currentJob);

    try {
      // Record swipe event
      await swipeService.recordSwipeWithJob(
        userId,
        currentJob,
        direction,
        matchScore
      );

      // If right swipe, create a match
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
