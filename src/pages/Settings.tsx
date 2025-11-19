import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Moon, Sun, Monitor } from "lucide-react";
import { NotificationSettings } from "@/components/NotificationSettings";
import { FEATURES } from "@/lib/featureFlags";
import MobileNavBar from "@/components/MobileNavBar";
import { Slider } from "@/components/ui/slider";
import { getMatchSettings, saveMatchSettings } from "@/lib/matchSettings";
import { useToast } from "@/hooks/use-toast";
import { PageContainer, PageSection, MobilePageHeader, DesktopPageHeader } from "@/components/layout/LayoutComponents";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const [matchSettings, setMatchSettings] = useState(getMatchSettings());
  const { toast } = useToast();

  // Removed handleMatchModeChange and handleKeywordThresholdChange - precomputed is now the only mode

  const handleThresholdChange = (value: number[]) => {
    const threshold = value[0];
    const newSettings = { ...matchSettings, keywordThreshold: threshold };
    setMatchSettings(newSettings);
    saveMatchSettings(newSettings);
  };

  useEffect(() => {
    // Only redirect if auth has finished loading and there's no user
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
    return null; // Will redirect via useEffect
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
            <CardHeader>
              <CardTitle>Match Quality</CardTitle>
              <CardDescription>
                Control the minimum match score for jobs you see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Minimum Match Score</Label>
                  <span className="text-sm font-medium">
                    {Math.round(matchSettings.keywordThreshold * 100)}%
                  </span>
                </div>
                <Slider
                  value={[matchSettings.keywordThreshold]}
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
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the app looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="w-full"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="w-full"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="w-full"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
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
