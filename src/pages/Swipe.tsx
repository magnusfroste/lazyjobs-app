import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useJobs } from "@/hooks/useJobs";
import { useSwipe } from "@/hooks/useSwipe";
import { useCardFlip } from "@/hooks/useCardFlip";
import { useToast } from "@/hooks/use-toast";
import { useSafariToolbarHide } from "@/hooks/useSafariToolbarHide";
import JobCard from "@/components/JobCard";
import SwipeControls from "@/components/SwipeControls";
import TopBar from "@/components/TopBar";
import { CardStack } from "@/components/CardStack";
import MobileNavBar from "@/components/MobileNavBar";
import { SwipeHint } from "@/components/SwipeHint";
import { PageContainer } from "@/components/layout/LayoutComponents";
import { SafariInstallBanner } from "@/components/SafariInstallBanner";
import { SwipeFooter } from "@/components/SwipeFooter";

const DEFAULT_MATCH_THRESHOLD = 0.65;

type MatchMode = "keyword" | "precomputed";

const Swipe = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const [swipePreview, setSwipePreview] = useState<"left" | "right" | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { toast } = useToast();
  const { isIOSSafari } = useSafariToolbarHide();

  // Get threshold from profile preferences, fall back to default
  const keywordThreshold = useMemo(() => {
    const prefs = profile?.preferences as Record<string, unknown> | null;
    if (prefs?.match_threshold && typeof prefs.match_threshold === "number") {
      return prefs.match_threshold;
    }
    return DEFAULT_MATCH_THRESHOLD;
  }, [profile?.preferences]);

  const matchMode: MatchMode = "precomputed";

  // Only fetch jobs when profile is loaded to ensure threshold is stable
  // This prevents the race condition where jobs load with localStorage threshold
  // then reload with profile threshold, causing jobs to "appear then disappear"
  const { jobs, loading: jobsLoading } = useJobs(
    profileLoading ? undefined : user?.id,
    true,
    matchMode,
    keywordThreshold
  );

  const { currentJob, currentIndex, remainingJobs, canUndo, handleSwipe, handleUndo, jumpToJob } = useSwipe(
    user?.id || "",
    jobs
  );
  const { flipCard, isCardFlipped, isAnyCardFlipped } = useCardFlip();

  // Handle deep linking from push notifications
  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (jobId && jobs.length > 0) {
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
      
      searchParams.delete('jobId');
      setSearchParams(searchParams);
    }
  }, [searchParams, jobs, toast, setSearchParams, jumpToJob]);

  const handleButtonSwipeLeft = () => {
    setSwipePreview("left");
    setTimeout(() => {
      handleSwipe("left");
      setTimeout(() => setSwipePreview(null), 50);
    }, 500);
  };

  const handleButtonSwipeRight = () => {
    setSwipePreview("right");
    setTimeout(() => {
      handleSwipe("right");
      setTimeout(() => setSwipePreview(null), 50);
    }, 500);
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
    <div className={`min-h-screen pb-32 ${isIOSSafari ? 'safari-scroll-container' : ''}`}>
        <TopBar />
        {isIOSSafari && !bannerDismissed && (
          <SafariInstallBanner onDismiss={() => setBannerDismissed(true)} />
        )}
        <SwipeHint />

      <PageContainer maxWidth="2xl" className="pt-4 md:pt-20">
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
                    swipePreview={idx === 0 ? swipePreview : null}
                  />
                ))
              }
            />
            <SwipeFooter remainingJobs={remainingJobs} matchThreshold={keywordThreshold} isIOSSafari={isIOSSafari} />
            {!isAnyCardFlipped && (
              <SwipeControls
                onSwipeLeft={handleButtonSwipeLeft}
                onSwipeRight={handleButtonSwipeRight}
                onUndo={handleUndo}
                canUndo={canUndo}
              />
            )}
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
      </PageContainer>

      <MobileNavBar />
    </div>
  );
};

export default Swipe;
