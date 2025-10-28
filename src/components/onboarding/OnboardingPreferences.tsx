import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OnboardingPreferences, SurveyAnswers } from "@/services/onboardingService";

interface OnboardingPreferencesProps {
  onSave: (preferences: OnboardingPreferences, survey?: SurveyAnswers) => void;
  onSkip: () => void;
}

export const OnboardingPreferencesForm = ({ onSave, onSkip }: OnboardingPreferencesProps) => {
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    location: "",
    salary_min: undefined,
    work_type: "any",
  });

  const [showSurvey, setShowSurvey] = useState(false);
  const [survey, setSurvey] = useState<SurveyAnswers>({});

  const handleContinue = () => {
    if (!showSurvey) {
      setShowSurvey(true);
    } else {
      onSave(preferences, survey);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">
          {showSurvey ? "Quick Survey" : "Job Preferences"}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {showSurvey
            ? "Help us understand your needs better (optional)"
            : "Tell us what you're looking for"}
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {!showSurvey ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="location">Preferred Location</Label>
              <Input
                id="location"
                placeholder="e.g., London, Remote, Worldwide"
                value={preferences.location}
                onChange={(e) =>
                  setPreferences({ ...preferences, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Minimum Salary (Optional)</Label>
              <Input
                id="salary"
                type="number"
                placeholder="e.g., 50000"
                value={preferences.salary_min || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    salary_min: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Work Type</Label>
              <RadioGroup
                value={preferences.work_type}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, work_type: value })
                }
              >
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
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>What stage are you in your job search?</Label>
              <RadioGroup
                value={survey.job_search_stage}
                onValueChange={(value) =>
                  setSurvey({ ...survey, job_search_stage: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exploring" id="exploring" />
                  <Label htmlFor="exploring" className="font-normal cursor-pointer">
                    Just exploring
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="actively_looking" id="actively_looking" />
                  <Label htmlFor="actively_looking" className="font-normal cursor-pointer">
                    Actively looking
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="font-normal cursor-pointer">
                    Need a job urgently
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                placeholder="e.g., 5"
                value={survey.experience_years || ""}
                onChange={(e) =>
                  setSurvey({ ...survey, experience_years: e.target.value })
                }
              />
            </div>
          </>
        )}

        <div className="flex flex-col space-y-3 pt-4">
          <Button onClick={handleContinue} size="lg" className="w-full">
            {showSurvey ? "Complete Setup" : "Continue"}
          </Button>
          
          <Button onClick={onSkip} variant="ghost" size="lg" className="w-full">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};
