import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { useDenseMode } from "@/contexts/DenseModeContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Moon, Sun, Monitor, Minimize2, Maximize2, Info, Cloud } from "lucide-react";
import { NotificationSettings } from "@/components/NotificationSettings";
import MobileNavBar from "@/components/MobileNavBar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PageContainer, PageSection, MobilePageHeader, DesktopPageHeader } from "@/components/layout/LayoutComponents";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { theme, setTheme, setThemeFromProfile } = useTheme();
  const { denseMode, setDenseMode, setDenseModeFromProfile } = useDenseMode();
  const { settings, updateSetting, isSyncing } = useUserSettings(user?.id, profile);
  const { toast } = useToast();

  // Sync contexts with profile settings when profile loads
  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as Record<string, unknown>;
      if (prefs.theme && typeof prefs.theme === "string") {
        setThemeFromProfile(prefs.theme as "light" | "dark" | "system");
      }
      if (prefs.dense_mode && typeof prefs.dense_mode === "string") {
        setDenseModeFromProfile(prefs.dense_mode as "normal" | "compact");
      }
    }
  }, [profile, setThemeFromProfile, setDenseModeFromProfile]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    updateSetting("theme", newTheme);
  };

  const handleDenseModeChange = (checked: boolean) => {
    const newMode = checked ? "compact" : "normal";
    setDenseMode(newMode);
    updateSetting("dense_mode", newMode);
    toast({
      title: checked ? "Dense mode enabled" : "Dense mode disabled",
      description: checked 
        ? "Spacing has been tightened across all pages"
        : "Normal spacing has been restored",
    });
  };

  const handleThresholdChange = (value: number[]) => {
    const threshold = value[0];
    updateSetting("match_threshold", threshold);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 md:pt-16">
      <TopBar />
      
      <DesktopPageHeader 
        title="Settings" 
        description="Manage your application settings and preferences" 
      />
      
      <MobilePageHeader title="Settings" />

      <PageContainer className="md:py-0 py-4">
        <PageSection>
          {/* Match Quality */}
          <Card>
            <CardHeader className={denseMode === "compact" ? "p-2 md:p-3" : ""}>
              <div className="flex items-center justify-between">
                <CardTitle>Match Quality</CardTitle>
                {isSyncing && (
                  <Cloud className="h-4 w-4 text-muted-foreground animate-pulse" />
                )}
              </div>
              <CardDescription>
                Control the minimum match score for jobs you see
              </CardDescription>
            </CardHeader>
            <CardContent className={denseMode === "compact" ? "p-2 pt-0 md:p-3 space-y-3" : "space-y-6"}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Minimum Match Score</Label>
                  <span className="text-sm font-medium">
                    {Math.round(settings.match_threshold * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.match_threshold]}
                  onValueChange={handleThresholdChange}
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More Jobs (30%)</span>
                  <span>Best Matches Only (95%)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  LazyJobs uses AI to score how well each job matches your profile. 
                  Higher threshold = fewer jobs, but better matches.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <NotificationSettings userId={user.id} />

          {/* Appearance */}
          <Card>
            <CardHeader className={denseMode === "compact" ? "p-2 md:p-3" : ""}>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the app looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent className={denseMode === "compact" ? "p-2 pt-0 md:p-3 space-y-3" : "space-y-6"}>
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => handleThemeChange("light")}
                    className="w-full"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => handleThemeChange("dark")}
                    className="w-full"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => handleThemeChange("system")}
                    className="w-full"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dense-mode">Dense Mode</Label>
                      {denseMode === "compact" ? (
                        <Minimize2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">What is Dense Mode?</p>
                            <p className="text-sm">
                              Dense Mode reduces padding and spacing by 50% across all pages, 
                              allowing you to see more content on your screen at once. Perfect for 
                              power users who want to maximize information density.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Compact spacing for more content per screen
                    </p>
                  </div>
                  <Switch
                    id="dense-mode"
                    checked={denseMode === "compact"}
                    onCheckedChange={handleDenseModeChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </PageSection>
      </PageContainer>

      <MobileNavBar />
    </div>
  );
}
