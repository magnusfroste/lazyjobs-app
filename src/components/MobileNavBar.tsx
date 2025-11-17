import { Home, Heart, Bell, User, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Hide on desktop
  if (!isMobile) {
    return null;
  }

  const navItems = [
    { path: "/swipe", icon: Home, label: "Swipe" },
    { path: "/matches", icon: Heart, label: "Saved" },
    { path: "/notifications", icon: Bell, label: "Notifs" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t safe-bottom">
      <div className="flex items-center justify-around py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className={`flex items-center justify-center p-3 rounded-full transition-colors ${
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="w-6 h-6" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavBar;
