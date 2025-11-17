import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useJobs } from "@/hooks/useJobs";
import { useSwipe } from "@/hooks/useSwipe";
import { useCardFlip } from "@/hooks/useCardFlip";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAppConfig } from "@/lib/config";
import JobCard from "@/components/JobCard";
import SwipeControls from "@/components/SwipeControls";
import TopBar from "@/components/TopBar";
import { CardStack } from "@/components/CardStack";
import MobileNavBar from "@/components/MobileNavBar";
import { getMatchSettings, saveMatchSettings } from "@/lib/matchSettings";

type MatchMode = "keyword" | "precomputed";

const Swipe = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const [matchSettings, setMatchSettings] = useState(getMatchSettings());
  const matchMode = matchSettings.matchMode;
  const keywordThreshold = matchSettings.keywordThreshold;
  const [swipePreview, setSwipePreview] = useState<"left" | "right" | null>(null);
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const { jobs, loading: jobsLoading } = useJobs(
    user?.id,
    true,
    matchMode,
    keywordThreshold
  );

  // Listen for settings changes from Settings page
  useEffect(() => {
    const handleStorageChange = () => {
      setMatchSettings(getMatchSettings());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const { currentJob, currentIndex, remainingJobs, canUndo, handleSwipe, handleUndo, jumpToJob } = useSwipe(
    user?.id || "",
    jobs
  );
  const { flipCard, isCardFlipped } = useCardFlip();

  // Handle deep linking from push notifications
  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (jobId && jobs.length > 0) {
      // Find the job in the current jobs list
      const jobIndex = jobs.findIndex(job => job.id === jobId);
      
      if (jobIndex >= 0) {
        jumpToJob(jobIndex);
        toast({
          title: "Job Found! 🎯",
          description: "Showing the job from your notification",
        });
      } else {
        toast({
          title: "Job Not Found",
          description: "This job may have been swiped already or is no longer available",
          variant: "destructive",
        });
      }
      
      // Clear the jobId from URL
      searchParams.delete('jobId');
      setSearchParams(searchParams);
    }
  }, [searchParams, jobs, toast, setSearchParams, jumpToJob]);

  // Mode change handler removed - precomputed is now the only mode


  const handleButtonSwipeLeft = () => {
    setSwipePreview("left");
    setTimeout(() => {
      handleSwipe("left");
      setTimeout(() => setSwipePreview(null), 50);
    }, 200);
  };

  const handleButtonSwipeRight = () => {
    setSwipePreview("right");
    setTimeout(() => {
      handleSwipe("right");
      setTimeout(() => setSwipePreview(null), 50);
    }, 200);
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (user && !profileLoading && profile && !profile.onboarding_completed) {
      navigate("/onboarding");
    }
  }, [user, profile, profileLoading, navigate]);

  const loading = authLoading || profileLoading || jobsLoading;

  if (!authLoading && !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
        <TopBar />

      <div className="container max-w-2xl mx-auto px-3 md:px-4 pt-0 md:pt-20">
        {remainingJobs > 0 ? (
          <>
            <CardStack
              key={matchMode}
              cards={jobs
                .slice(currentIndex, currentIndex + 3)
                .map((job, idx) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    mode="swipe"
                    onSwipe={idx === 0 ? handleSwipe : () => {}}
                    isActive={idx === 0}
                    isFlipped={isCardFlipped(job.id)}
                    onFlip={() => flipCard(job.id)}
                    cardsRemaining={remainingJobs}
                    matchThreshold={keywordThreshold}
                    matchMode={matchMode}
                    swipePreview={idx === 0 ? swipePreview : null}
                  />
                ))
              }
            />
            <SwipeControls
              onSwipeLeft={handleButtonSwipeLeft}
              onSwipeRight={handleButtonSwipeRight}
              onUndo={handleUndo}
              canUndo={canUndo}
            />
          </>
        ) : (
          <div className="text-center py-20 space-y-4">
            <p className="text-2xl font-semibold">No more jobs!</p>
            <p className="text-muted-foreground">Check back later for new opportunities</p>
            <button
              onClick={() => navigate("/matches")}
              className="text-primary hover:underline font-semibold"
            >
              View your matches →
            </button>
          </div>
        )}
      </div>

      <MobileNavBar />
    </div>
  );
};

export default Swipe;
