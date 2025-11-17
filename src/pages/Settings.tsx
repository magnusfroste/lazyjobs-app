import { useEffect } from "react";
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

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { theme, setTheme } = useTheme();

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
      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your application settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Mobile header - simple title only */}
      <div className="md:hidden pt-4 pb-2">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Settings
        </h1>
      </div>

      <div className="container max-w-4xl mx-auto md:py-0 py-4 px-3 md:px-4">

        <div className="space-y-4 md:space-y-6">
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
        </div>
      </div>

      <MobileNavBar />
    </div>
  );
}
