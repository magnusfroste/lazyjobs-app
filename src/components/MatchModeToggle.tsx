import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type MatchMode = "keyword" | "ai";

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
  const canUseAI = !showPremiumBadge || isPremium;

  return (
    <div className="w-full max-w-md mx-auto py-4">
      <RadioGroup
        value={mode}
        onValueChange={(value) => canUseAI && onChange(value as MatchMode)}
        className="flex gap-4"
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
                <span>Keyword Match</span>
              </div>
            </Label>
          </div>
        </div>

        <div className="flex-1">
          <div
            className={`relative flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              !canUseAI
                ? "opacity-50 cursor-not-allowed"
                : mode === "ai"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
            }`}
            onClick={() => canUseAI && onChange("ai")}
          >
            <RadioGroupItem value="ai" id="ai" disabled={!canUseAI} />
            <Label
              htmlFor="ai"
              className={`flex-1 ${canUseAI ? "cursor-pointer" : "cursor-not-allowed"} font-medium`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>AI Match</span>
                {showPremiumBadge && !isPremium && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    ✨ Premium
                  </Badge>
                )}
              </div>
            </Label>
          </div>
        </div>
      </RadioGroup>

      {mode === "ai" && (
        <div className="mt-3 text-sm text-muted-foreground text-center">
          ℹ️ AI matching uses semantic search to find jobs based on meaning,
          not just keywords
        </div>
      )}
    </div>
  );
};
