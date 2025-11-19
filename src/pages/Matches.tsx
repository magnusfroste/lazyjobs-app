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
import { PageContainer, PageSection, MobilePageHeader, DesktopPageHeader } from "@/components/layout/LayoutComponents";

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
    <div className="min-h-screen pb-20 md:pb-8 md:pt-16">
      <TopBar />
      
      <DesktopPageHeader 
        title="Saved Jobs" 
        description="Jobs you loved - review and apply" 
      />
      
      <MobilePageHeader title="Saved Jobs" />

      <PageContainer className="pt-4 md:pt-6">
        <p className="text-muted-foreground mb-4 md:mb-6">{matches.length} saved {matches.length === 1 ? 'job' : 'jobs'}</p>

        <PageSection className="space-y-3 md:space-y-4">
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
        </PageSection>

        {matches.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <p className="text-2xl font-bold mb-4">No saved jobs yet</p>
              <p className="text-muted-foreground mb-6">
                Start swiping to find jobs you love!
              </p>
              <Button
                onClick={() => navigate("/swipe")}
                size="lg"
              >
                Start Swiping
              </Button>
            </div>
          </div>
        )}
      </PageContainer>

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
