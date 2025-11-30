import { useState, useEffect } from "react";
import { motion, animate } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JobWithMatch } from "@/types/job";

// Animated Progress Component
const AnimatedProgress = ({ 
  value, 
  delay = 0, 
  isVisible,
  className 
}: { 
  value: number; 
  delay?: number; 
  isVisible: boolean;
  className?: string;
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        const controls = animate(0, value, {
          duration: 0.7,
          ease: [0.4, 0, 0.2, 1],
          onUpdate: (latest) => setAnimatedValue(Math.round(latest))
        });
        return () => controls.stop();
      }, delay * 1000);
      
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(0);
    }
  }, [isVisible, value, delay]);

  return <Progress value={animatedValue} className={className} />;
};

interface MatchDetailsOverlayProps {
  job: JobWithMatch;
  onClose: () => void;
}

export const MatchDetailsOverlay = ({ job, onClose }: MatchDetailsOverlayProps) => {
  const matchScore = job.match_score || 50;
  const matchBreakdown = job.match_breakdown || {
    skills: 0,
    salary: 0,
    location: 0,
    work_arrangement: 0,
    type: 0,
  };

  const matchedSkills = job.matching_skills || job.required_skills?.slice(0, 6) || [];
  const missingSkills = job.skills_to_learn || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg truncate">{job.title}</h2>
            <p className="text-sm text-muted-foreground truncate">{job.company}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full font-bold text-sm">
              {Math.round(matchScore)}% ✨
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Close match breakdown"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Match Breakdown Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-bold">Match Breakdown</h3>
          <p className="text-sm text-muted-foreground mt-1">Why this job matches your profile</p>
        </motion.div>

        {/* Progress bars for each category */}
        <div className="space-y-4">
          {/* Skills */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3"
          >
            <span className="font-medium w-24 text-sm text-muted-foreground">Skills</span>
            <div className="flex-1 flex items-center gap-2">
              <AnimatedProgress 
                value={matchBreakdown.skills} 
                delay={0.25}
                isVisible={true}
                className="h-2 [&>div]:bg-green-500" 
              />
              <span className="font-semibold text-sm w-12 text-right text-green-600 dark:text-green-400">
                {matchBreakdown.skills}%
              </span>
            </div>
          </motion.div>

          {/* Salary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <span className="font-medium w-24 text-sm text-muted-foreground">Salary</span>
            <div className="flex-1 flex items-center gap-2">
              <AnimatedProgress 
                value={matchBreakdown.salary} 
                delay={0.35}
                isVisible={true}
                className="h-2 [&>div]:bg-green-500" 
              />
              <span className="font-semibold text-sm w-12 text-right text-green-600 dark:text-green-400">
                {matchBreakdown.salary}%
              </span>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-3"
          >
            <span className="font-medium w-24 text-sm text-muted-foreground">Location</span>
            <div className="flex-1 flex items-center gap-2">
              <AnimatedProgress 
                value={matchBreakdown.location} 
                delay={0.45}
                isVisible={true}
                className="h-2" 
              />
              <span className="font-semibold text-sm w-12 text-right text-muted-foreground">
                {matchBreakdown.location}%
              </span>
            </div>
          </motion.div>

          {/* Employment Type */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="font-medium w-24 text-sm text-muted-foreground">Type</span>
            <div className="flex-1 flex items-center gap-2">
              <AnimatedProgress 
                value={matchBreakdown.type} 
                delay={0.55}
                isVisible={true}
                className="h-2" 
              />
              <span className="font-semibold text-sm w-12 text-right text-muted-foreground">
                {matchBreakdown.type}%
              </span>
            </div>
          </motion.div>

          {/* Work Arrangement */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-3"
          >
            <span className="font-medium w-24 text-sm text-muted-foreground">Work</span>
            <div className="flex-1 flex items-center gap-2">
              <AnimatedProgress 
                value={matchBreakdown.work_arrangement} 
                delay={0.65}
                isVisible={true}
                className="h-2" 
              />
              <span className="font-semibold text-sm w-12 text-right text-muted-foreground">
                {matchBreakdown.work_arrangement}%
              </span>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Skills Breakdown */}
        {job.required_skills && job.required_skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h4 className="font-medium text-base flex items-center gap-2">
              💡 Skills Analysis
            </h4>
            
            {/* Matched Skills */}
            <div>
              <div className="text-green-700 dark:text-green-400 font-medium text-sm mb-2 flex items-center gap-1.5">
                <span>✅</span>
                <span>You Have ({matchedSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">No matching skills found</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            {missingSkills.length > 0 && (
              <div>
                <div className="text-orange-700 dark:text-orange-400 font-medium text-sm mb-2 flex items-center gap-1.5">
                  <span>📚</span>
                  <span>To Learn ({missingSkills.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Divider */}
        {job.recommendation && <div className="border-t border-border/30" />}

        {/* AI Recommendation */}
        {job.recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <h4 className="font-medium text-base">AI Recommendation</h4>
            <p className="text-muted-foreground leading-relaxed">
              {job.recommendation}
            </p>
          </motion.div>
        )}

        {/* Confidence Level */}
        {job.confidence_level && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-muted-foreground pt-4"
          >
            Confidence: <span className="font-semibold">{job.confidence_level}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
