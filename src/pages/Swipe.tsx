import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import JobCard from "@/components/JobCard";
import SwipeControls from "@/components/SwipeControls";
import TopBar from "@/components/TopBar";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

const Swipe = () => {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .limit(50);

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (!user || currentIndex >= jobs.length) return;

    const currentJob = jobs[currentIndex];

    try {
      // Record swipe event
      await supabase.from("swipe_events").insert({
        user_id: user.id,
        job_id: currentJob.id,
        direction,
        job_title: currentJob.title,
        company_name: currentJob.company,
        salary_min: currentJob.salary_min,
        salary_max: currentJob.salary_max,
        is_remote: currentJob.is_remote,
        location: currentJob.location,
        employment_type: currentJob.employment_type,
        experience_level: currentJob.experience_level,
        required_skills: currentJob.required_skills,
      });

      // If right swipe, create a match
      if (direction === "right") {
        await supabase.from("matches").insert({
          user_id: user.id,
          job_id: currentJob.id,
          match_score: Math.floor(Math.random() * 30) + 50, // Mock score 50-80%
        });

        toast({
          title: "It's a match! 🎉",
          description: `${currentJob.title} saved to your matches`,
        });
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error: any) {
      console.error("Swipe error:", error);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

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

  const currentJob = jobs[currentIndex];
  const remainingJobs = jobs.length - currentIndex;

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
              canUndo={currentIndex > 0}
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
