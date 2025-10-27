import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { ArrowLeft, ExternalLink, FileText, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Matches = () => {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { matches, loading: matchesLoading, deleteMatch, markAsApplied } = useMatches(user?.id || "");

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const loading = authLoading || matchesLoading;

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
                    {match.match_score}% ✨
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
                {match.job.url && (
                  <Button
                    onClick={() => window.open(match.job.url!, "_blank")}
                    className="flex-1 gradient-primary text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                )}
                
                {!match.is_applied && (
                  <Button
                    onClick={() => markAsApplied(match.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Applied
                  </Button>
                )}

                <Button
                  onClick={() => setExpandedJob(expandedJob === match.id ? null : match.id)}
                  variant="outline"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Matched {new Date(match.created_at).toLocaleDateString()} • {match.match_score}% match
              </p>
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
    </div>
  );
};

export default Matches;
