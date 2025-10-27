import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useJobs } from "@/hooks/useJobs";
import { useSwipe } from "@/hooks/useSwipe";
import JobCard from "@/components/JobCard";
import SwipeControls from "@/components/SwipeControls";
import TopBar from "@/components/TopBar";

const Swipe = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { jobs, loading: jobsLoading } = useJobs(user?.id, true);
  const { currentJob, remainingJobs, canUndo, handleSwipe, handleUndo } = useSwipe(
    user?.id || "",
    jobs
  );

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  const loading = authLoading || jobsLoading;

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
        {currentJob ? (
          <>
            <JobCard 
              job={currentJob} 
              onSwipe={handleSwipe}
              remainingJobs={remainingJobs}
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
