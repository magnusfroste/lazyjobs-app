import { useState } from "react";
import { onboardingService, OnboardingPreferences, SurveyAnswers } from "@/services/onboardingService";
import { toast } from "@/hooks/use-toast";

type OnboardingStep = "welcome" | "upload" | "processing" | "preferences" | "complete";

export const useOnboarding = (userId: string) => {
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
    setUploading(true);
    setError(null);

    try {
      // Upload file
      const url = await onboardingService.uploadCV(userId, file);
      setCvUrl(url);

      // Move to processing step
      setStep("processing");
      setProcessing(true);

      // Try to process CV (if webhook configured)
      try {
        const cvData = await onboardingService.processCV(url, userId);
        await onboardingService.saveCVData(userId, url, cvData);
        
        toast({
          title: "CV Uploaded Successfully",
          description: "Your CV has been analyzed and saved.",
        });
      } catch (processError) {
        // If processing fails, just save the URL
        console.warn("CV processing failed, saving URL only:", processError);
        await onboardingService.saveCVData(userId, url);
        
        toast({
          title: "CV Uploaded",
          description: "Your CV has been saved. Processing will happen in the background.",
        });
      }

      // Move to preferences
      setProcessing(false);
      setStep("preferences");
    } catch (err) {
      setError((err as Error).message);
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

  const handleSavePreferences = async (prefs: OnboardingPreferences, surveyAnswers?: SurveyAnswers) => {
    try {
      // Save preferences
      await onboardingService.savePreferences(userId, prefs);

      // Save survey if provided
      if (surveyAnswers && Object.keys(surveyAnswers).length > 0) {
        await onboardingService.saveSurvey(userId, surveyAnswers);
      }

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
    survey,
    setPreferences,
    setSurvey,
    handleStart,
    handleUploadCV,
    handleSkipCV,
    handleSavePreferences,
    handleSkipPreferences,
  };
};
