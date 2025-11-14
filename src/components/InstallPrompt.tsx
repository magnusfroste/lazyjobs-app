import { useState } from "react";
import { X, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InstallPromptProps {
  onDismiss?: () => void;
}

export const InstallPrompt = ({ onDismiss }: InstallPromptProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
    localStorage.setItem("installPromptDismissed", "true");
  };

  if (isDismissed || localStorage.getItem("installPromptDismissed")) {
    return null;
  }

  return (
    <Card className="relative border-primary/20">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Install LazyJobs for Notifications</CardTitle>
            <CardDescription className="mt-1">
              Get instant job alerts on your iPhone or iPad
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Push notifications on iOS require installing the app to your home screen.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <p className="text-sm font-medium">How to install:</p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-medium">1.</span>
              <span>Tap the Share button <span className="inline-block">□↑</span> at the bottom of Safari</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">2.</span>
              <span>Scroll down and tap "Add to Home Screen"</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">3.</span>
              <span>Tap "Add" in the top right</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">4.</span>
              <span>Open LazyJobs from your home screen</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">5.</span>
              <span>Enable notifications in your Profile settings</span>
            </li>
          </ol>
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium mb-1">Benefits:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Push notifications for new job matches</li>
            <li>• Faster loading and offline access</li>
            <li>• Full-screen app experience</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Requires iOS 16.4 or later
        </p>
      </CardContent>
    </Card>
  );
};
