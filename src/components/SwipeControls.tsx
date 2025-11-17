import { X, RotateCcw, Heart, Menu, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

interface SwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onMenuClick?: () => void;
  onThemeToggle?: () => void;
  currentTheme?: "light" | "dark";
  isMobile?: boolean;
}

const SwipeControls = ({ onSwipeLeft, onSwipeRight, onUndo, canUndo, onMenuClick, onThemeToggle, currentTheme, isMobile }: SwipeControlsProps) => {
  return (
    <div className="fixed left-0 right-0 flex items-center justify-between px-4 z-50 safe-bottom" style={{ bottom: '2rem' }}>
      {/* Left: Hamburger Menu - Mobile Only */}
      {isMobile && onMenuClick ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={onMenuClick}
          className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-lg hover:shadow-xl transition-shadow"
        >
          <Menu className="w-6 h-6" />
        </motion.button>
      ) : (
        <div className="w-12" />
      )}

      {/* Center: Swipe Controls */}
      <div className="flex items-center gap-6">
        <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(50);
          onSwipeLeft();
        }}
        className="w-16 h-16 rounded-full gradient-danger flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <X className="w-8 h-8" />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        onClick={onUndo}
        disabled={!canUndo}
        className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-6 h-6" />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(50);
          onSwipeRight();
        }}
        className="w-16 h-16 rounded-full gradient-success flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <Heart className="w-8 h-8" />
      </motion.button>
      </div>

      {/* Right: Theme Toggle - Mobile Only */}
      {isMobile && onThemeToggle ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={onThemeToggle}
          className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-lg hover:shadow-xl transition-shadow"
        >
          {currentTheme === "dark" ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
        </motion.button>
      ) : (
        <div className="w-12" />
      )}
    </div>
  );
};

export default SwipeControls;
