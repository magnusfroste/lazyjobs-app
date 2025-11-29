import { useState, useEffect } from "react";
import { Lightbulb, Heart, Sparkles, Zap } from "lucide-react";

interface SwipeFooterProps {
  remainingJobs: number;
  matchThreshold?: number;
  isIOSSafari?: boolean;
}

const tips = [
  { icon: Heart, text: "Swipe right on jobs you'd apply to" },
  { icon: Lightbulb, text: "Tap the card to see full details" },
  { icon: Sparkles, text: "AI improves your matches overnight" },
  { icon: Zap, text: "Higher match % = better fit for you" },
];

export const SwipeFooter = ({ remainingJobs, matchThreshold, isIOSSafari = false }: SwipeFooterProps) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = tips[tipIndex].icon;

  return (
    <div className="mt-8 pb-8 md:hidden">
      {/* Stats */}
      <div className="flex justify-center mb-6">
        <div className="bg-muted/50 backdrop-blur-sm rounded-full px-4 py-2 border border-border/30">
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">{remainingJobs}</span>
            {matchThreshold !== undefined 
              ? <> jobs above <span className="font-semibold text-foreground">{Math.round(matchThreshold * 100)}%</span></>
              : <> jobs to explore</>
            }
          </p>
        </div>
      </div>

      {/* Rotating tip */}
      <div className="mx-auto max-w-xs">
        <div 
          key={tipIndex}
          className="flex items-center justify-center gap-2 text-muted-foreground text-sm animate-fade-in"
        >
          <CurrentIcon className="w-4 h-4 text-primary/60" />
          <span>{tips[tipIndex].text}</span>
        </div>
      </div>

      {/* Extra spacer for Safari scroll trick - only needed in Safari browser, not PWA */}
      {isIOSSafari && <div className="h-32" aria-hidden="true" />}
    </div>
  );
};
