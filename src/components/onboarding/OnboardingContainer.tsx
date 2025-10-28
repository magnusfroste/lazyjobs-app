import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWelcome } from "./OnboardingWelcome";
import { OnboardingCVUpload } from "./OnboardingCVUpload";
import { OnboardingProcessing } from "./OnboardingProcessing";
import { OnboardingPreferencesForm } from "./OnboardingPreferences";
import { Progress } from "@/components/ui/progress";

interface OnboardingContainerProps {
  userId: string;
  onComplete: () => void;
}

export const OnboardingContainer = ({ userId, onComplete }: OnboardingContainerProps) => {
  const {
    step,
    uploading,
    processing,
    handleStart,
    handleUploadCV,
    handleSkipCV,
    handleSavePreferences,
    handleSkipPreferences,
  } = useOnboarding(userId);

  // Auto-redirect when complete
  if (step === "complete") {
    onComplete();
    return null;
  }

  // Calculate progress
  const getProgress = () => {
    switch (step) {
      case "welcome":
        return 0;
      case "upload":
        return 25;
      case "processing":
        return 50;
      case "preferences":
        return 75;
      default:
        return 0;
    }
  };

  const getStepText = () => {
    switch (step) {
      case "welcome":
        return "Welcome";
      case "upload":
        return "Step 1 of 2: Upload CV";
      case "processing":
        return "Processing...";
      case "preferences":
        return "Step 2 of 2: Preferences";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      {step !== "welcome" && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <div className="container max-w-2xl mx-auto px-4 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{getStepText()}</span>
              <span className="text-sm text-muted-foreground">{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={step !== "welcome" ? "pt-24" : ""}>
        {step === "welcome" && <OnboardingWelcome onStart={handleStart} />}
        
        {step === "upload" && (
          <OnboardingCVUpload
            onUpload={handleUploadCV}
            onSkip={handleSkipCV}
            uploading={uploading}
          />
        )}

        {step === "processing" && <OnboardingProcessing />}

        {step === "preferences" && (
          <OnboardingPreferencesForm
            onSave={handleSavePreferences}
            onSkip={handleSkipPreferences}
          />
        )}
      </div>
    </div>
  );
};
