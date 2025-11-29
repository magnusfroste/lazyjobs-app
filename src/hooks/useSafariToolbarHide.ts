import { useEffect } from "react";
import { usePWADetection } from "./usePWADetection";

/**
 * Hook to trigger Safari's toolbar hiding behavior on iOS.
 * Uses a scroll trick to make Safari think the user scrolled,
 * which triggers its "minimal UI" mode.
 */
export const useSafariToolbarHide = () => {
  const { isIOSSafari } = usePWADetection();

  useEffect(() => {
    if (!isIOSSafari) return;

    const hideToolbar = () => {
      // Only trigger if at top of page
      if (window.scrollY < 2) {
        window.scrollTo(0, 1);
      }
    };

    // Initial hide with small delay for DOM to settle
    const initialTimer = setTimeout(hideToolbar, 150);

    // Re-trigger on touch to keep toolbar hidden during interaction
    const handleTouchStart = () => {
      requestAnimationFrame(hideToolbar);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      clearTimeout(initialTimer);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [isIOSSafari]);

  return { isIOSSafari };
};
