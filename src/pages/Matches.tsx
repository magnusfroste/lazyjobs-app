import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { ArrowLeft, ExternalLink, FileText, CheckCircle2, X, Sparkles, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ApplicationAssistantModal } from "@/components/ApplicationAssistantModal";
import { Job } from "@/types/job";

const Matches = () => {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
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

  const getMatchBreakdown = (match: any) => {
    if (match.job_match?.match_breakdown) {
      return {
        overall: Math.round((match.match_score || 0) * 100),
        skills: match.job_match.match_breakdown.skills || 50,
        salary: match.job_match.match_breakdown.salary || 50,
        location: match.job_match.match_breakdown.location || 50,
        remote: match.job_match.match_breakdown.remote || 50,
        type: match.job_match.match_breakdown.type || 50,
      };
    }
    
    return {
      overall: Math.round((match.match_score || 0) * 100),
      skills: 50,
      salary: 50,
      location: 50,
      remote: 50,
      type: 50,
    };
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  const loading = authLoading || matchesLoading;

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
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/swipe")}
            className="flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Swipe
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            My Matches
          </h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 pt-6">
        <p className="text-muted-foreground mb-6">{matches.length} matches</p>

        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-card border rounded-2xl p-6 space-y-4"
            >
              {!flippedCards[match.id] ? (
                // FRONT SIDE - Job Details
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{match.job.title}</h3>
                      <p className="text-muted-foreground mb-3">{match.job.company}</p>

                      <div className="flex flex-wrap gap-2 text-sm mb-3">
                        <Badge variant="secondary">
                          {match.job.location || "Remote"}
                        </Badge>
                        {match.job.is_remote && (
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                            Remote
                          </Badge>
                        )}
                        {match.job.salary_min && match.job.salary_max && (
                          <Badge variant="secondary">
                            ${match.job.salary_min.toLocaleString()} - ${match.job.salary_max.toLocaleString()}
                          </Badge>
                        )}
                        {match.job.employment_type && (
                          <Badge variant="secondary">{match.job.employment_type}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className="gradient-primary text-white border-0 px-3 py-1">
                        {Math.round((match.match_score || 0) * 100)}% ✨
                      </Badge>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {match.job.required_skills && (
                    <div className="flex flex-wrap gap-2">
                      {match.job.required_skills.slice(0, 6).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
                          {skill}
                        </Badge>
                      ))}
                      {match.job.required_skills.length > 6 && (
                        <Badge variant="secondary">
                          +{match.job.required_skills.length - 6} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {expandedJob === match.id && match.job.description && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {match.job.description.slice(0, 500)}...
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => setSelectedJobForApplication(match.job)}
                      className="flex-1 gradient-primary text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Apply with AI
                    </Button>
                    
                    {match.job.url && (
                      <Button
                        onClick={() => window.open(match.job.url!, "_blank")}
                        variant="outline"
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Job
                      </Button>
                    )}

                    {!match.is_applied && (
                      <Button
                        onClick={() => markAsApplied(match.id)}
                        variant="outline"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      onClick={() => setExpandedJob(expandedJob === match.id ? null : match.id)}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={() => toggleFlip(match.id)}
                      variant="outline"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Matched {new Date(match.created_at).toLocaleDateString()} • {Math.round((match.match_score || 0) * 100)}% match
                  </p>
                </>
              ) : (
                // BACK SIDE - Match Breakdown
                <div className="relative">
                  <button
                    onClick={() => toggleFlip(match.id)}
                    className="absolute top-0 right-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white mb-2">
                      <div className="text-3xl font-bold">
                        {getMatchBreakdown(match).overall}%
                      </div>
                    </div>
                    <h3 className="text-lg font-bold">{match.job.title}</h3>
                    <p className="text-sm text-muted-foreground">Match Breakdown</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Skills Match</span>
                        <span className="text-sm font-bold text-primary">
                          {getMatchBreakdown(match).skills}%
                        </span>
                      </div>
                      <Progress value={getMatchBreakdown(match).skills} />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Salary Range</span>
                        <span className="text-sm font-bold text-green-600">
                          {getMatchBreakdown(match).salary}%
                        </span>
                      </div>
                      <Progress value={getMatchBreakdown(match).salary} className="[&>div]:bg-green-600" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Location</span>
                        <span className="text-sm font-bold text-orange-600">
                          {getMatchBreakdown(match).location}%
                        </span>
                      </div>
                      <Progress value={getMatchBreakdown(match).location} className="[&>div]:bg-orange-600" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Remote Preference</span>
                        <span className="text-sm font-bold text-purple-600">
                          {getMatchBreakdown(match).remote}%
                        </span>
                      </div>
                      <Progress value={getMatchBreakdown(match).remote} className="[&>div]:bg-purple-600" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Employment Type</span>
                        <span className="text-sm font-bold text-pink-600">
                          {getMatchBreakdown(match).type}%
                        </span>
                      </div>
                      <Progress value={getMatchBreakdown(match).type} className="[&>div]:bg-pink-600" />
                    </div>
                  </div>

                  {match.job_match?.recommendation && (
                    <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">AI Recommendation</p>
                          <p className="text-sm text-muted-foreground">
                            {match.job_match.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {match.job_match?.matching_skills && match.job_match.matching_skills.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Your Matching Skills ({match.job_match.matching_skills.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.job_match.matching_skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.job_match?.skills_to_learn && match.job_match.skills_to_learn.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-orange-600" />
                        Skills to Learn ({match.job_match.skills_to_learn.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.job_match.skills_to_learn.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.job_match?.confidence_level && (
                    <div className="mt-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={
                          match.job_match.confidence_level === 'high' 
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400' 
                            : match.job_match.confidence_level === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400'
                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }
                      >
                        {match.job_match.confidence_level.charAt(0).toUpperCase() + match.job_match.confidence_level.slice(1)} Confidence Match
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
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
    </div>
  );
};

export default Matches;
