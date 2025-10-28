import { Button } from "@/components/ui/button";
import { Briefcase, Zap, Target } from "lucide-react";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

export const OnboardingWelcome = ({ onStart }: OnboardingWelcomeProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8 px-4">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Welcome to LazyJobs! 👋</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Find your dream job with AI-powered matching in seconds
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
        <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold">Upload Your CV</h3>
          <p className="text-sm text-muted-foreground">
            We'll analyze your experience and skills
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold">Swipe to Match</h3>
          <p className="text-sm text-muted-foreground">
            Like Tinder, but for jobs that fit you
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold">Get Hired Faster</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered applications that stand out
          </p>
        </div>
      </div>

      <Button size="lg" onClick={onStart} className="px-8">
        Get Started
      </Button>
    </div>
  );
};
