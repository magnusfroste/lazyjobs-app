import { X, Share } from "lucide-react";
import { useState, useEffect } from "react";

interface SafariInstallBannerProps {
  onDismiss: () => void;
}

const BANNER_DISMISSED_KEY = "safari-install-banner-dismissed";

export const SafariInstallBanner = ({ onDismiss }: SafariInstallBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-40 px-3 py-2 animate-in slide-in-from-top duration-300">
      <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-lg px-3 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <Share className="h-4 w-4 flex-shrink-0" />
          <span>
            Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for best experience
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-primary-foreground/20 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
