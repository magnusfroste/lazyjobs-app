import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingPreferences } from "@/services/onboardingService";

interface OnboardingPreferencesProps {
  onSave: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
}

export const OnboardingPreferencesForm = ({ onSave, onSkip }: OnboardingPreferencesProps) => {
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    location: "",
    salary_min: undefined,
    work_type: "any",
    employment_types: [],
  });

  const toggleEmploymentType = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      employment_types: prev.employment_types?.includes(type)
        ? prev.employment_types.filter((t) => t !== type)
        : [...(prev.employment_types || []), type],
    }));
  };

  const employmentTypeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Job Preferences</h2>
        <p className="text-muted-foreground max-w-md">
          Tell us what you're looking for
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
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

        <div className="space-y-2">
          <Label>Employment Types</Label>
          <div className="grid grid-cols-2 gap-3">
            {employmentTypeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`onboarding-${option.value}`}
                  checked={preferences.employment_types?.includes(option.value)}
                  onCheckedChange={() => toggleEmploymentType(option.value)}
                />
                <Label htmlFor={`onboarding-${option.value}`} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button onClick={() => onSave(preferences)} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};
