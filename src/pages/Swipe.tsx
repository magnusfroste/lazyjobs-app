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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Heart, User, Bell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type MatchMode = "keyword" | "precomputed";

const Swipe = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const [matchMode, setMatchMode] = useState<MatchMode>("precomputed");
  const [keywordThreshold, setKeywordThreshold] = useState(0.65);
  const [aiTopN, setAiTopN] = useState(50);
  const [swipePreview, setSwipePreview] = useState<"left" | "right" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const { jobs, loading: jobsLoading } = useJobs(
    user?.id,
    true,
    matchMode,
    keywordThreshold,
    aiTopN
  );
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

  const handleModeChange = (newMode: MatchMode) => {
    setMatchMode(newMode);
    const modeLabel = newMode === "precomputed" ? "Pre-Match" : "Keyword";
    toast({
      title: `Switched to ${modeLabel} matching`,
      description: "Showing fresh jobs!",
    });
  };

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

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
      <TopBar 
          matchMode={matchMode}
          onModeChange={handleModeChange}
          showMatchToggle={profile?.is_developer || false}
          keywordThreshold={keywordThreshold}
          onKeywordThresholdChange={setKeywordThreshold}
      />

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
                    topN={aiTopN}
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
              onMenuClick={() => setMobileMenuOpen(true)}
              onThemeToggle={handleThemeToggle}
              currentTheme={resolvedTheme}
              isMobile={isMobile}
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

      {/* Mobile Menu Drawer */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              LazyJobs
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                navigate("/profile");
                setMobileMenuOpen(false);
              }}
            >
              <User className="w-5 h-5" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                navigate("/matches");
                setMobileMenuOpen(false);
              }}
            >
              <Heart className="w-5 h-5" />
              Matches
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                navigate("/notification-history");
                setMobileMenuOpen(false);
              }}
            >
              <Bell className="w-5 h-5" />
              Notifications
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                navigate("/settings");
                setMobileMenuOpen(false);
              }}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Button>

            {profile?.is_developer && (
              <>
                <Separator className="my-4" />
                <div className="px-3 py-2">
                  <p className="text-sm font-medium mb-3">Match Mode</p>
                  <div className="inline-flex items-center rounded-full bg-muted p-1 gap-0.5 w-full">
                    <button
                      onClick={() => {
                        handleModeChange("keyword");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        matchMode === "keyword"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      🔤 Keyword
                    </button>
                    <button
                      onClick={() => {
                        handleModeChange("precomputed");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        matchMode === "precomputed"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      ⚡ Pre-Match
                    </button>
                  </div>
                </div>
              </>
            )}

            <Separator className="my-4" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Swipe;
