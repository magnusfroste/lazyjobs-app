import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const TIPS = [
  "Analyzing your work experience...",
  "Extracting your skills and expertise...",
  "Identifying your career highlights...",
  "Matching you with relevant opportunities...",
  "Almost ready to show you jobs...",
];

export const OnboardingProcessing = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 px-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
        <h2 className="text-3xl font-bold">Processing Your CV</h2>
        <p className="text-muted-foreground max-w-md">
          This will only take a moment...
        </p>
      </div>

      <div className="h-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};
