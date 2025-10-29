import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Briefcase, Heart, User, Sun, Moon, Menu, LogOut } from "lucide-react";
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

type MatchMode = "keyword" | "ai";

interface TopBarProps {
  matchMode?: MatchMode;
  onModeChange?: (mode: MatchMode) => void;
  showMatchToggle?: boolean;
  isPremium?: boolean;
}

const TopBar = ({ matchMode, onModeChange, showMatchToggle = false, isPremium = false }: TopBarProps = {}) => {
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

  const canUseAI = !isPremium; // isPremium means "requires premium"

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            LazyJobs
          </span>
        </div>

        {/* Match Mode Toggle - Compact for TopBar */}
        {showMatchToggle && matchMode && onModeChange && (
          <div className="flex-1 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-muted p-1 gap-1">
              <button
                onClick={() => onModeChange("keyword")}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
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
                onClick={() => canUseAI && onModeChange("ai")}
                disabled={!canUseAI}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !canUseAI
                    ? "opacity-50 cursor-not-allowed"
                    : matchMode === "ai"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isMobile ? (
                  <span className="flex items-center gap-1">
                    <span className="text-base">🤖</span>
                    {isPremium && <Badge variant="secondary" className="scale-75 -ml-1 text-[10px] px-1 py-0">✨</Badge>}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🤖</span>
                    <span>AI</span>
                    {isPremium && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">✨</Badge>}
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
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
