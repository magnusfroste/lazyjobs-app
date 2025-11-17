import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, TrendingUp, Heart, FileText } from "lucide-react";
import { profileService } from "@/services/profileService";
import CVDisplay from "@/components/CVDisplay";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import MobileNavBar from "@/components/MobileNavBar";
import { useQuery } from "@tanstack/react-query";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile, updateSkills, refetch } = useProfile(user?.id);
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Job preferences state
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [workType, setWorkType] = useState("any");
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);

  // Fetch user statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["userStatistics", user?.id],
    queryFn: () => profileService.getUserStatistics(user!.id),
    enabled: !!user?.id,
  });

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
      
      // Load job preferences
      const prefs = profile.preferences as any;
      if (prefs) {
        setLocation(prefs.location || "");
        setSalaryMin(prefs.salary_min?.toString() || "");
        setWorkType(prefs.work_type || "any");
        setEmploymentTypes(prefs.employment_types || []);
      }
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
        preferences: {
          location,
          salary_min: salaryMin ? parseInt(salaryMin) : undefined,
          work_type: workType,
          employment_types: employmentTypes,
        },
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
  
  const handleEmploymentTypeToggle = (type: string) => {
    setEmploymentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.includes("pdf") && !file.type.includes("word")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProcessing(true);

    try {
      const result = await profileService.uploadCV(user.id, file, user.email || "");

      if (result.success) {
        toast({
          title: "CV Uploaded Successfully",
          description: "Your CV has been processed and analyzed.",
        });
        await refetch();
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("CV upload error:", error);
      toast({
        title: "CV Upload Failed",
        description: error.message || "An error occurred while uploading your CV",
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
        description: "Skills updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update skills",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-background">
      <TopBar />
      
      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-2">
              Manage your personal information and CV
            </p>
          </div>
        </div>
      </div>

      {/* Mobile header - simple title only */}
      <div className="md:hidden pt-4 pb-2">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Profile
        </h1>
      </div>

      <div className="container max-w-4xl mx-auto px-3 md:px-4 md:py-0 py-4">

        <div className="space-y-4 md:space-y-6">
          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Activity
              </CardTitle>
              <CardDescription>
                Overview of your job search progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {statsLoading ? "..." : statistics?.totalSwipes || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total Swipes
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-center mb-2">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {statsLoading ? "..." : statistics?.totalMatches || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Matches
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-center mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {statsLoading ? "..." : statistics?.totalApplications || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Applications
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
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
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+46 70 123 45 67"
                />
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Job Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>
                Set your job search preferences to get better matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location">Preferred Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, Remote"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Minimum Salary (Annual)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g., 80000"
                />
              </div>

              <div className="space-y-3">
                <Label>Work Type</Label>
                <RadioGroup value={workType} onValueChange={setWorkType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remote" id="remote" />
                    <Label htmlFor="remote" className="font-normal cursor-pointer">
                      Remote Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <Label htmlFor="hybrid" className="font-normal cursor-pointer">
                      Hybrid
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="office" id="office" />
                    <Label htmlFor="office" className="font-normal cursor-pointer">
                      Office
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="any" />
                    <Label htmlFor="any" className="font-normal cursor-pointer">
                      Any
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Employment Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="full-time"
                      checked={employmentTypes.includes("full-time")}
                      onCheckedChange={() => handleEmploymentTypeToggle("full-time")}
                    />
                    <Label htmlFor="full-time" className="font-normal cursor-pointer">
                      Full-time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="part-time"
                      checked={employmentTypes.includes("part-time")}
                      onCheckedChange={() => handleEmploymentTypeToggle("part-time")}
                    />
                    <Label htmlFor="part-time" className="font-normal cursor-pointer">
                      Part-time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contract"
                      checked={employmentTypes.includes("contract")}
                      onCheckedChange={() => handleEmploymentTypeToggle("contract")}
                    />
                    <Label htmlFor="contract" className="font-normal cursor-pointer">
                      Contract
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="freelance"
                      checked={employmentTypes.includes("freelance")}
                      onCheckedChange={() => handleEmploymentTypeToggle("freelance")}
                    />
                    <Label htmlFor="freelance" className="font-normal cursor-pointer">
                      Freelance
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CV Upload */}
          <Card>
            <CardHeader>
              <CardTitle>CV Upload</CardTitle>
              <CardDescription>
                Upload your CV for better job matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="cv-upload"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleCVUpload}
                  disabled={uploading}
                />
                <label
                  htmlFor="cv-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {uploading ? "Uploading..." : "Click to upload your CV"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF or Word document (max 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {processing && (
                <div className="text-center text-sm text-muted-foreground">
                  <p>Processing your CV... This may take a moment.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CV Display */}
          {profile?.cv_data && (
            <CVDisplay 
              cvData={profile.cv_data} 
              onSkillsUpdate={handleSkillsUpdate}
            />
          )}

        </div>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default Profile;
