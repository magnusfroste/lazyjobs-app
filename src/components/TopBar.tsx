import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Briefcase, Heart, User, Sun, Moon, LogOut, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TopBar = () => {
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

  // Hide TopBar completely on mobile
  if (isMobile) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b safe-top">
      <div className="container max-w-5xl mx-auto px-3 md:px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo - Left side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Briefcase className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            LazyJobs
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Navigation Icons - Right side */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Swipe Jobs */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/swipe")}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <Briefcase className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Swipe Jobs</TooltipContent>
            </Tooltip>

            {/* My Matches */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/matches")}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Saved Jobs</TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/notifications")}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <Bell className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            {/* Profile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <User className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Profile</TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/settings")}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-1" />

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </TooltipContent>
            </Tooltip>

            {/* Sign Out */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign Out</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default TopBar;
