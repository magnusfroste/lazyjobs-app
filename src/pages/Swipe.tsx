import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useJobs } from "@/hooks/useJobs";
import { useSwipe } from "@/hooks/useSwipe";
import { useCardFlip } from "@/hooks/useCardFlip";
import { useToast } from "@/hooks/use-toast";
import { getAppConfig } from "@/lib/config";
import JobCard from "@/components/JobCard";
import SwipeControls from "@/components/SwipeControls";
import TopBar from "@/components/TopBar";
import { CardStack } from "@/components/CardStack";

type MatchMode = "keyword" | "precomputed";

const Swipe = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const [matchMode, setMatchMode] = useState<MatchMode>("precomputed");
  const [keywordThreshold, setKeywordThreshold] = useState(0.65);
  const [aiTopN, setAiTopN] = useState(50);
  const { toast } = useToast();
  const { jobs, loading: jobsLoading } = useJobs(
    user?.id,
    true,
    matchMode,
    keywordThreshold,
    aiTopN
  );
  const { currentJob, currentIndex, remainingJobs, canUndo, handleSwipe, handleUndo } = useSwipe(
    user?.id || "",
    jobs
  );
  const { flipCard, isCardFlipped } = useCardFlip();

  const handleModeChange = (newMode: MatchMode) => {
    setMatchMode(newMode);
    const modeLabel = newMode === "precomputed" ? "Pre-Match" : "Keyword";
    toast({
      title: `Switched to ${modeLabel} matching`,
      description: "Showing fresh jobs!",
    });
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
      <TopBar 
          matchMode={matchMode}
          onModeChange={handleModeChange}
          showMatchToggle={true}
          keywordThreshold={keywordThreshold}
          onKeywordThresholdChange={setKeywordThreshold}
      />

      <div className="container max-w-2xl mx-auto px-4 pt-20">
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
                    onSwipe={idx === 0 ? handleSwipe : () => {}}
                    isActive={idx === 0}
                    isFlipped={isCardFlipped(job.id)}
                    onFlip={() => flipCard(job.id)}
                    cardsRemaining={remainingJobs}
                    matchThreshold={keywordThreshold}
                    matchMode={matchMode}
                    topN={aiTopN}
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
