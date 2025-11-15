import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, DollarSign, Briefcase, Moon, Sun, Monitor, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { NotificationSettings } from "@/components/NotificationSettings";
import { FEATURES } from "@/lib/featureFlags";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading, updateProfile } = useProfile(user?.id);
  const { theme, setTheme } = useTheme();

  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [workType, setWorkType] = useState("any");
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only redirect if auth has finished loading and there's no user
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      const prefs = profile.preferences as any;
      setLocation(prefs?.location || "");
      setSalaryMin(prefs?.salary_min?.toString() || "");
      setWorkType(prefs?.work_type || "any");
      setEmploymentTypes(prefs?.employment_types || []);
    }
  }, [profile]);

  const toggleEmploymentType = (type: string) => {
    setEmploymentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateProfile({
        preferences: {
          ...((profile?.preferences as any) || {}),
          location,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          work_type: workType,
          employment_types: employmentTypes,
        },
      });
      toast({
        title: "Preferences saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

  const employmentTypeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your job search preferences and application settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Job Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>
                Set your job search criteria to get better matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Preferred Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Stockholm, Sweden"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Minimum Salary (SEK/month)
                </Label>
                <Input
                  id="salary"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g., 40000"
                />
              </div>

              <div className="space-y-2">
                <Label>Work Type</Label>
                <RadioGroup
                  value={workType}
                  onValueChange={(value) => setWorkType(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remote" id="work-remote" />
                    <Label htmlFor="work-remote" className="font-normal cursor-pointer">
                      Remote Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hybrid" id="work-hybrid" />
                    <Label htmlFor="work-hybrid" className="font-normal cursor-pointer">
                      Hybrid
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="office" id="work-office" />
                    <Label htmlFor="work-office" className="font-normal cursor-pointer">
                      Office
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="work-any" />
                    <Label htmlFor="work-any" className="font-normal cursor-pointer">
                      Any
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Types
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {employmentTypeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={employmentTypes.includes(option.value)}
                        onCheckedChange={() => toggleEmploymentType(option.value)}
                      />
                      <Label htmlFor={option.value} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardContent>
          </Card>


          {/* Push Notifications */}
          <NotificationSettings userId={user.id} />

          {/* Notification History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification History
              </CardTitle>
              <CardDescription>
                View all your past push notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/notifications")}
              >
                View Notification History
              </Button>
            </CardContent>
          </Card>

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
                <div className="grid grid-cols-3 gap-3">
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
    </div>
  );
}
