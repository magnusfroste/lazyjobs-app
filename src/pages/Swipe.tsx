import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useJobs } from "@/hooks/useJobs";
import { useSwipe } from "@/hooks/useSwipe";
import { useCardFlip } from "@/hooks/useCardFlip";
import { getAppConfig } from "@/lib/config";
import JobCard from "@/components/JobCard";
import SwipeControls from "@/components/SwipeControls";
import TopBar from "@/components/TopBar";
import { MatchModeToggle } from "@/components/MatchModeToggle";
import { CardStack } from "@/components/CardStack";

type MatchMode = "keyword" | "ai";

const Swipe = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const [matchMode, setMatchMode] = useState<MatchMode>("keyword");
  const [aiMatchingEnabled, setAiMatchingEnabled] = useState(false);
  const [aiMatchingPremium, setAiMatchingPremium] = useState(false);
  const { jobs, loading: jobsLoading } = useJobs(user?.id, true, matchMode);
  const { currentJob, currentIndex, remainingJobs, canUndo, handleSwipe, handleUndo } = useSwipe(
    user?.id || "",
    jobs
  );
  const { flipCard, isCardFlipped } = useCardFlip();

  // Load feature flags
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAppConfig();
        setAiMatchingEnabled(config.features.ai_matching ?? false);
        setAiMatchingPremium(config.features.ai_matching_premium ?? false);
      } catch (error) {
        console.error("Failed to load feature flags:", error);
      }
    };
    loadConfig();
  }, []);

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

      <div className="container max-w-2xl mx-auto px-4 pt-20">
        {aiMatchingEnabled && (
          <MatchModeToggle
            mode={matchMode}
            onChange={setMatchMode}
            showPremiumBadge={aiMatchingPremium}
            isPremium={false}
          />
        )}

        {jobs.length > 0 ? (
          <>
            <CardStack
              cards={jobs
                .slice(currentIndex, currentIndex + 3)
                .map((job, idx) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSwipe={idx === 0 ? handleSwipe : () => {}}
                    remainingJobs={remainingJobs}
                    isActive={idx === 0}
                    isFlipped={isCardFlipped(job.id)}
                    onFlip={() => flipCard(job.id)}
                  />
                ))
              }
            />
            <SwipeControls
              onSwipeLeft={() => handleSwipe("left")}
              onSwipeRight={() => handleSwipe("right")}
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
    </div>
  );
};

export default Swipe;
