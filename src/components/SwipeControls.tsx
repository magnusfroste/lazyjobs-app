import { X, RotateCcw, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface SwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const SwipeControls = ({ onSwipeLeft, onSwipeRight, onUndo, canUndo }: SwipeControlsProps) => {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-40" style={{ bottom: '6rem' }}>
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
    </div>
  );
};

export default SwipeControls;
