import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useProfile } from "@/hooks/useProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const { profile, updateProfile } = useProfile(userId);
  const {
    permission,
    isSubscribed,
    isSupported,
    loading,
    toggleNotifications,
  } = usePushNotifications(userId);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (profile) {
      setNotificationsEnabled(profile.notifications_enabled ?? true);
    }
  }, [profile]);

  const handleToggleEnabled = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await updateProfile({
      notifications_enabled: enabled,
    });
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case "granted":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          text: "Notifications enabled",
          variant: "default" as const,
        };
      case "denied":
        return {
          icon: <BellOff className="h-4 w-4 text-red-500" />,
          text: "Notifications blocked",
          variant: "destructive" as const,
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-amber-500" />,
          text: "Not enabled",
          variant: "default" as const,
        };
    }
  };

  const status = getPermissionStatus();
  const matchThreshold = (profile?.preferences as any)?.match_threshold || 65;

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Real-time alerts for new job matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser. Try using Chrome, Firefox, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when jobs match above {matchThreshold}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled" className="text-base">
              Enable Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive alerts for new job matches
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>

        {notificationsEnabled && (
          <>
            {/* Permission Status */}
            <div className="flex items-center gap-2 text-sm">
              {status.icon}
              <span className={permission === "denied" ? "text-red-500" : ""}>
                {status.text}
              </span>
            </div>

            {/* Subscribe/Unsubscribe Button */}
            <div className="space-y-2">
              {permission === "denied" ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Notifications are blocked. Please enable them in your browser settings.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button
                  onClick={toggleNotifications}
                  disabled={loading}
                  variant={isSubscribed ? "outline" : "default"}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isSubscribed ? (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Disable Push Notifications
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Enable Push Notifications
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {isSubscribed
                  ? "You'll receive push notifications for new matches"
                  : "Click to allow push notifications in your browser"}
              </p>
            </div>

            {/* Info Alert */}
            {isSubscribed && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  You'll be notified immediately when jobs match your profile above {matchThreshold}%
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
