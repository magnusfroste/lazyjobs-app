import { Button } from "@/components/ui/button";
import { CheckCircle2, Bell, Sparkles } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useState } from "react";

interface OnboardingCompleteProps {
  userId: string;
  onStartSwiping: () => void;
}

export const OnboardingComplete = ({ userId, onStartSwiping }: OnboardingCompleteProps) => {
  const { subscribe, isSupported } = usePushNotifications(userId);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const handleEnableNotifications = async () => {
    setEnabling(true);
    try {
      const success = await subscribe();
      if (success) {
        setNotificationsEnabled(true);
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setEnabling(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Du är redo!</h1>
          <p className="text-muted-foreground">
            Din profil är klar. Vi matchar dig med de bästa jobben – 
            och förbättrar matchningarna varje natt med AI.
          </p>
        </div>

        {/* Notifications Card */}
        {isSupported && !notificationsEnabled && (
          <div className="bg-muted/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Bell className="w-4 h-4" />
              <span>Missa inga toppjobb</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Få notiser när vi hittar jobb som matchar din profil extra bra.
            </p>
            <Button 
              variant="outline" 
              onClick={handleEnableNotifications}
              disabled={enabling}
              className="w-full"
            >
              {enabling ? "Aktiverar..." : "Aktivera notiser"}
            </Button>
          </div>
        )}

        {notificationsEnabled && (
          <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Notiser aktiverade!</span>
          </div>
        )}

        {/* CTA */}
        <Button 
          size="lg" 
          className="w-full"
          onClick={onStartSwiping}
        >
          Börja swipa
        </Button>
      </div>
    </div>
  );
};
