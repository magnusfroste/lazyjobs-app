import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { Button } from "@/components/ui/button";
import { ApplicationAssistantModal } from "@/components/ApplicationAssistantModal";
import { Job, JobWithMatch } from "@/types/job";
import JobCard from "@/components/JobCard";
import MobileNavBar from "@/components/MobileNavBar";
import TopBar from "@/components/TopBar";

const Matches = () => {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { matches, loading: matchesLoading, deleteMatch, markAsApplied } = useMatches(user?.id || "");

  const toggleFlip = (matchId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  const loading = authLoading || matchesLoading;

  // Sort matches: unapplied first, applied at bottom
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.is_applied && !b.is_applied) return 1;
    if (!a.is_applied && b.is_applied) return -1;
    return 0;
  });

  if (!authLoading && !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <TopBar />
      
      {/* Desktop header */}
      <div className="hidden md:block sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            My Matches
          </h1>
        </div>
      </div>

      {/* Mobile header - simple title only */}
      <div className="md:hidden pt-4 pb-2">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          My Matches
        </h1>
      </div>

      <div className="container max-w-4xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <p className="text-muted-foreground mb-4 md:mb-6">{matches.length} matches</p>

        <div className="space-y-3 md:space-y-4">
          {sortedMatches.map((match) => (
          <JobCard
              key={match.id}
              job={{
                ...match.job,
                match_score: match.match_score || 50,
                match_breakdown: match.job_match?.match_breakdown,
                matching_skills: match.job_match?.matching_skills,
                skills_to_learn: match.job_match?.skills_to_learn,
                recommendation: match.job_match?.recommendation,
                confidence_level: match.job_match?.confidence_level,
              } as JobWithMatch}
              mode="matches"
              isFlipped={flippedCards[match.id]}
              onFlip={() => toggleFlip(match.id)}
              onDelete={() => deleteMatch(match.id)}
              onApply={() => setSelectedJobForApplication(match.job as Job)}
              onMarkAsApplied={() => markAsApplied(match.id)}
              isApplied={match.is_applied || false}
              hasGeneratedApplication={!!match.application}
              matchDate={new Date(match.created_at!).toLocaleDateString()}
              appliedAt={match.applied_at}
              onSwipe={() => {}}
            />
          ))}

          {matches.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <p className="text-xl font-semibold">No matches yet</p>
              <p className="text-muted-foreground">
                Start swiping to find your perfect job!
              </p>
              <Button
                onClick={() => navigate("/swipe")}
                className="gradient-primary text-white"
              >
                Start Swiping
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Application Assistant Modal */}
      {selectedJobForApplication && user && (
        <ApplicationAssistantModal
          job={selectedJobForApplication}
          userId={user.id}
          onClose={() => setSelectedJobForApplication(null)}
        />
      )}

      <MobileNavBar />
    </div>
  );
};

export default Matches;
