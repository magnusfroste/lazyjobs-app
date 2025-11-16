import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Briefcase, Heart, User, Sun, Moon, Menu, LogOut, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type MatchMode = "keyword" | "precomputed";

interface TopBarProps {
  matchMode?: MatchMode;
  onModeChange?: (mode: MatchMode) => void;
  showMatchToggle?: boolean;
  isPremium?: boolean;
  keywordThreshold?: number;
  onKeywordThresholdChange?: (threshold: number) => void;
  aiTopN?: number;
  onAiTopNChange?: (topN: number) => void;
}

const TopBar = ({
  matchMode,
  onModeChange,
  showMatchToggle = false,
  isPremium = false,
  keywordThreshold = 0.65,
  onKeywordThresholdChange,
  aiTopN = 50,
  onAiTopNChange,
}: TopBarProps = {}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const isMobile = useIsMobile();


  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            LazyJobs
          </span>
        </div>

        {/* Match Mode Toggle - Compact for TopBar */}
        {showMatchToggle && matchMode && onModeChange && (
          <div className="flex-1 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-muted p-1 gap-0.5">
              <button
                onClick={() => onModeChange("keyword")}
                className={`relative px-2.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  matchMode === "keyword"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isMobile ? (
                  <span className="text-base">🔤</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🔤</span>
                    <span>Keyword</span>
                  </span>
                )}
              </button>
              <button
                onClick={() => onModeChange("precomputed")}
                className={`relative px-2.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  matchMode === "precomputed"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isMobile ? (
                  <span className="text-base">⚡</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">⚡</span>
                    <span>Pre-Match</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 p-0"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/swipe")}>
                <Briefcase className="w-4 h-4 mr-2" />
                Swipe Jobs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/matches")}>
                <Heart className="w-4 h-4 mr-2" />
                My Matches
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/notifications")}>
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Match Quality Settings - Only show when callbacks are provided */}
              {(onKeywordThresholdChange || onAiTopNChange) && (
                <>
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium mb-2">Match Quality</div>
                    {(matchMode === "keyword" || matchMode === "precomputed") ? (
                      <div className="space-y-1">
                        <DropdownMenuItem
                          onClick={() => onKeywordThresholdChange?.(0.4)}
                          className={keywordThreshold === 0.4 ? "bg-accent" : ""}
                        >
                          Low (40%+)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onKeywordThresholdChange?.(0.65)}
                          className={keywordThreshold === 0.65 ? "bg-accent" : ""}
                        >
                          Medium (65%+)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onKeywordThresholdChange?.(0.85)}
                          className={keywordThreshold === 0.85 ? "bg-accent" : ""}
                        >
                          High (85%+)
                        </DropdownMenuItem>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <DropdownMenuItem
                          onClick={() => onAiTopNChange?.(100)}
                          className={aiTopN === 100 ? "bg-accent" : ""}
                        >
                          Low (Top 100)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAiTopNChange?.(50)}
                          className={aiTopN === 50 ? "bg-accent" : ""}
                        >
                          Medium (Top 50)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAiTopNChange?.(25)}
                          className={aiTopN === 25 ? "bg-accent" : ""}
                        >
                          High (Top 25)
                        </DropdownMenuItem>
                      </div>
                    )}
                  </div>

                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </div>
  );
};

export default TopBar;
