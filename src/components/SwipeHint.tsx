import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const SwipeHint = () => {
  const chevrons = [0, 1, 2, 3, 4];
  
  return (
    <div className="w-full h-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center overflow-hidden relative border-b border-border/30 safe-top">
      {/* Right flowing chevrons */}
      <motion.div
        className="absolute flex items-center gap-2"
        initial={{ opacity: 1 }}
        animate={{
          opacity: [1, 1, 0, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.4, 0.45, 1],
        }}
      >
        {chevrons.map((i) => (
          <motion.div
            key={`right-${i}`}
            initial={{ x: -40, opacity: 0 }}
            animate={{
              x: 200,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.15,
              repeatDelay: 2.5,
              times: [0, 0.2, 0.8, 1],
            }}
          >
            <ChevronRight className="w-4 h-4 text-primary" strokeWidth={2.5} />
          </motion.div>
        ))}
      </motion.div>

      {/* Left flowing chevrons */}
      <motion.div
        className="absolute flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0, 1, 1, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.45, 0.5, 0.9, 0.95],
        }}
      >
        {chevrons.map((i) => (
          <motion.div
            key={`left-${i}`}
            initial={{ x: 200, opacity: 0 }}
            animate={{
              x: -40,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.15 + 2,
              repeatDelay: 2.5,
              times: [0, 0.2, 0.8, 1],
            }}
          >
            <ChevronLeft className="w-4 h-4 text-primary" strokeWidth={2.5} />
          </motion.div>
        ))}
      </motion.div>

      {/* Text hint */}
      <span className="text-xs font-medium text-muted-foreground/60 tracking-wider">
        SWIPE TO DECIDE
      </span>
    </div>
  );
};
