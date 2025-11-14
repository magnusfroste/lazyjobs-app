import { useState, useEffect } from "react";

interface PWADetection {
  isIOS: boolean;
  isPWA: boolean;
  isIOSSafari: boolean;
  supportsPush: boolean;
  iOSVersion: number;
}

export const usePWADetection = (): PWADetection => {
  const [detection, setDetection] = useState<PWADetection>({
    isIOS: false,
    isPWA: false,
    isIOSSafari: false,
    supportsPush: false,
    iOSVersion: 0,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    // Detect if running as PWA
    const isPWA = window.matchMedia("(display-mode: standalone)").matches || 
                  (window.navigator as any).standalone === true;
    
    // Detect iOS Safari (not installed as PWA)
    const isIOSSafari = isIOS && !isPWA;
    
    // Extract iOS version
    const versionMatch = userAgent.match(/OS (\d+)_/);
    const iOSVersion = versionMatch ? parseFloat(versionMatch[1]) : 0;
    
    // iOS 16.4+ supports push notifications in PWA mode
    const supportsPush = isIOS ? (iOSVersion >= 16.4 && isPWA) : true;

    setDetection({
      isIOS,
      isPWA,
      isIOSSafari,
      supportsPush,
      iOSVersion,
    });
  }, []);

  return detection;
};
