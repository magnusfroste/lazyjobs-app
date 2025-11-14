import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Sun, Moon, Monitor, LogOut, MapPin, DollarSign, Briefcase, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { profileService } from "@/services/profileService";
import { FEATURES } from "@/lib/featureFlags";
import CVDisplay from "@/components/CVDisplay";
import { NotificationSettings } from "@/components/NotificationSettings";
import { InstallPrompt } from "@/components/InstallPrompt";
import { usePWADetection } from "@/hooks/usePWADetection";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile, updateSkills, refetch } = useProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isIOSSafari } = usePWADetection();
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Job preferences state
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  
  // Application assistant preferences
  const [autoOpenApplication, setAutoOpenApplication] = useState(false);
  const [applicationLanguage, setApplicationLanguage] = useState<'auto' | 'en' | 'sv'>('auto');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      
      // Load preferences
      const prefs = (profile.preferences as any) || {};
      setLocation(prefs.location || "");
      setSalaryMin(prefs.salary_min?.toString() || "");
      setRemoteOnly(prefs.remote_only || false);
      setEmploymentTypes(prefs.employment_types || []);
      
      // Load application assistant settings
      setAutoOpenApplication(prefs.auto_open_application || false);
      setApplicationLanguage((profile.application_language_preference as 'auto' | 'en' | 'sv') || 'auto');
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateProfile({
        full_name: fullName,
        phone: phone,
      });
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await updateProfile({
        preferences: {
          location,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          remote_only: remoteOnly,
          employment_types: employmentTypes,
          auto_open_application: autoOpenApplication,
        },
        application_language_preference: applicationLanguage,
      });
      
      toast({
        title: "Success",
        description: "Job preferences updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEmploymentType = (type: string) => {
    setEmploymentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast({
        title: "Error",
        description: "Only PDF and Word documents are allowed",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      toast({
        title: "Uploading CV...",
        description: "Please wait while we upload your file",
      });

      const result = await profileService.uploadCV(user.id, file, user.email!);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setUploading(false);
      setProcessing(true);
      
      toast({
        title: "Analyzing CV...",
        description: "Extracting your skills and experience",
      });

      // Give a moment for the processing state to show
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.cvData) {
        const skillCount = result.cvData.skills_flat?.length || 0;
        toast({
          title: "Success! ✨",
          description: `CV uploaded and analyzed! Found ${skillCount} skills in your profile.`,
        });
      } else {
        toast({
          title: "CV Uploaded",
          description: "Your CV was uploaded successfully",
        });
      }
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload CV",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleSkillsUpdate = async (skills: string[]) => {
    try {
      await updateSkills(skills);
      toast({
        title: "Success",
        description: `Updated to ${skills.length} skills`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update skills",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <TopBar />
      
      <div className="container max-w-2xl mx-auto px-4 pt-20">
        <div className="mb-6">
          <button
            onClick={() => navigate("/swipe")}
            className="flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Swipe
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Profile & Settings
        </h1>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full gradient-primary text-white"
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Job Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Preferences
              </CardTitle>
              <CardDescription>
                Set your preferences to get better job matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Preferred Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Sweden, Stockholm, Remote..."
                />
                <p className="text-xs text-muted-foreground">
                  e.g., "Sweden", "Stockholm", "Remote", "USA"
                </p>
              </div>

              {/* Minimum Salary */}
              <div className="space-y-2">
                <Label htmlFor="salaryMin" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Minimum Salary (USD)
                </Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="50000"
                />
              </div>

              {/* Remote Only Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remoteOnly"
                  checked={remoteOnly}
                  onCheckedChange={(checked) => setRemoteOnly(checked as boolean)}
                />
                <Label
                  htmlFor="remoteOnly"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remote jobs only
                </Label>
              </div>

              {/* Employment Types */}
              <div className="space-y-2">
                <Label>Employment Types</Label>
                <div className="flex flex-wrap gap-2">
                  {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={employmentTypes.includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleEmploymentType(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>

          {/* Application Assistant Settings */}
          {FEATURES.APPLICATION_ASSISTANT && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Application Assistant
                </CardTitle>
                <CardDescription>
                  Configure how the AI application generator works for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto-open toggle */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="auto-open"
                    checked={autoOpenApplication}
                    onCheckedChange={(checked) => setAutoOpenApplication(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="auto-open"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Auto-open after matching
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically open the application generator when you like a job. 
                      If disabled, you can apply later from your matches page.
                    </p>
                  </div>
                </div>

                {/* Language preference */}
                <div className="space-y-3">
                  <Label>Default Application Language</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={applicationLanguage === 'auto' ? 'default' : 'outline'}
                      onClick={() => setApplicationLanguage('auto')}
                      className="w-full"
                    >
                      🌍 Auto-detect
                    </Button>
                    <Button
                      type="button"
                      variant={applicationLanguage === 'en' ? 'default' : 'outline'}
                      onClick={() => setApplicationLanguage('en')}
                      className="w-full"
                    >
                      🇬🇧 English
                    </Button>
                    <Button
                      type="button"
                      variant={applicationLanguage === 'sv' ? 'default' : 'outline'}
                      onClick={() => setApplicationLanguage('sv')}
                      className="w-full"
                    >
                      🇸🇪 Swedish
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {applicationLanguage === 'auto'
                      ? "We'll detect the language from each job description"
                      : `Applications will always be generated in ${
                          applicationLanguage === 'en' ? 'English' : 'Swedish'
                        }`}
                  </p>
                </div>

                <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Push Notifications */}
          {user && isIOSSafari && <InstallPrompt />}
          {user && <NotificationSettings userId={user.id} />}

          {/* CV Upload */}
          <Card>
            <CardHeader>
              <CardTitle>CV / Resume</CardTitle>
              <CardDescription>Upload your CV for better job matching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {uploading && "Uploading your CV..."}
                    {processing && "Analyzing your CV with AI... This usually takes 20-50 seconds."}
                    {!uploading && !processing && "Upload PDF or Word document (max 5MB)"}
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCVUpload}
                    disabled={uploading}
                    className="hidden"
                    id="cv-upload-input"
                  />
                  <Label htmlFor="cv-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading || processing}
                      onClick={() => document.getElementById("cv-upload-input")?.click()}
                    >
                      {uploading && "Uploading..."}
                      {processing && "Analyzing..."}
                      {!uploading && !processing && "Choose File"}
                    </Button>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CV Display - Show extracted data */}
          {profile?.cv_data && (
            <CVDisplay 
              cvData={profile.cv_data} 
              onReupload={() => {
                document.getElementById('cv-upload-input')?.click();
              }}
              onSkillsUpdate={handleSkillsUpdate}
            />
          )}

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how LazyJobs looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
