import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type MatchMode = "keyword" | "precomputed";

interface MatchModeToggleProps {
  mode: MatchMode;
  onChange: (mode: MatchMode) => void;
  isPremium?: boolean;
  showPremiumBadge?: boolean;
}

export const MatchModeToggle = ({
  mode,
  onChange,
  isPremium = false,
  showPremiumBadge = false,
}: MatchModeToggleProps) => {
  return (
    <div className="w-full max-w-md mx-auto py-4">
      <RadioGroup
        value={mode}
        onValueChange={(value) => onChange(value as MatchMode)}
        className="flex gap-3"
      >
        <div className="flex-1">
          <div
            className={`relative flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              mode === "keyword"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onChange("keyword")}
          >
            <RadioGroupItem value="keyword" id="keyword" />
            <Label
              htmlFor="keyword"
              className="flex-1 cursor-pointer font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔤</span>
                <span>Keyword</span>
              </div>
            </Label>
          </div>
        </div>

        <div className="flex-1">
          <div
            className={`relative flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              mode === "precomputed"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onChange("precomputed")}
          >
            <RadioGroupItem value="precomputed" id="precomputed" />
            <Label
              htmlFor="precomputed"
              className="flex-1 cursor-pointer font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span>Pre-Match</span>
              </div>
            </Label>
          </div>
        </div>
      </RadioGroup>
      
      {mode === "precomputed" && (
        <div className="mt-3 text-sm text-muted-foreground text-center">
          ⚡ Pre-Match shows your best matches first - all jobs analyzed overnight
        </div>
      )}
    </div>
  );
};
