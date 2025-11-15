import { useState } from "react";
import { onboardingService, OnboardingPreferences, SurveyAnswers } from "@/services/onboardingService";
import { profileService } from "@/services/profileService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type OnboardingStep = "welcome" | "upload" | "processing" | "preferences" | "complete";

export const useOnboarding = (userId: string) => {
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [cvUrl, setCvUrl] = useState<string>("");
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    location: "",
    salary_min: undefined,
    work_type: "any",
  });
  const [survey, setSurvey] = useState<SurveyAnswers>({});

  const handleStart = () => {
    setStep("upload");
  };

  const handleUploadCV = async (file: File) => {
    if (!user?.email) return;
    
    setUploading(true);
    setError(null);

    try {
      setStep("processing");
      setProcessing(true);

      // Use the working profileService.uploadCV method
      const result = await profileService.uploadCV(userId, file, user.email);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setCvUrl(result.publicUrl || "");
      
      toast({
        title: "CV Uploaded Successfully ✨",
        description: result.cvData 
          ? `Found ${result.cvData.skills_flat?.length || 0} skills in your CV`
          : "Your CV has been analyzed and saved",
      });

      // Move to preferences
      setProcessing(false);
      setStep("preferences");
    } catch (err) {
      setError((err as Error).message);
      setProcessing(false);
      setStep("upload"); // Go back to upload on error
      
      toast({
        title: "Upload Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSkipCV = () => {
    setStep("preferences");
  };

  const handleSavePreferences = async (prefs: OnboardingPreferences) => {
    try {
      // Save preferences
      await onboardingService.savePreferences(userId, prefs);

      // Complete onboarding
      await onboardingService.completeOnboarding(userId);

      setStep("complete");
      
      toast({
        title: "Welcome to LazyJobs!",
        description: "Your profile is all set up. Let's find you some matches!",
      });
    } catch (err) {
      setError((err as Error).message);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSkipPreferences = async () => {
    try {
      await onboardingService.completeOnboarding(userId);
      setStep("complete");
      
      toast({
        title: "Welcome to LazyJobs!",
        description: "You can update your preferences later in Settings.",
      });
    } catch (err) {
      setError((err as Error).message);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return {
    step,
    uploading,
    processing,
    error,
    cvUrl,
    preferences,
    setPreferences,
    handleStart,
    handleUploadCV,
    handleSkipCV,
    handleSavePreferences,
    handleSkipPreferences,
  };
};
