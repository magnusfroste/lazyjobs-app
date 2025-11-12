import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type MatchMode = "keyword" | "ai" | "llm";

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
                <span className="text-lg">⚡</span>
                <span>AI-Fast</span>
                {showPremiumBadge && !isPremium && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    ✨ Premium
                  </Badge>
                )}
              </div>
            </Label>
          </div>
        </div>

        <div className="flex-1">
          <div
            className={`relative flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              mode === "llm"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onChange("llm")}
          >
            <RadioGroupItem value="llm" id="llm" />
            <Label
              htmlFor="llm"
              className="flex-1 cursor-pointer font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <span>LLM</span>
              </div>
            </Label>
          </div>
        </div>
      </RadioGroup>

      {mode === "ai" && (
        <div className="mt-3 text-sm text-muted-foreground text-center">
          ⚡ AI-Fast uses semantic search for quick matches
        </div>
      )}
      
      {mode === "llm" && (
        <div className="mt-3 text-sm text-muted-foreground text-center">
          🧠 LLM uses Qwen 80B for intelligent scoring with detailed breakdowns
        </div>
      )}
    </div>
  );
};
