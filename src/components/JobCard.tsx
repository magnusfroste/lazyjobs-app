import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { MapPin, DollarSign, Briefcase, Clock, Sparkles, X, ExternalLink, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { JobWithMatch } from "@/types/job";
import { useIsMobile } from "@/hooks/use-mobile";
import { isHTML, htmlToFormattedText } from "@/lib/htmlToText";
import { cn } from "@/lib/utils";

// Animated Progress Component
const AnimatedProgress = ({ 
  value, 
  delay = 0, 
  isFlipped,
  className 
}: { 
  value: number; 
  delay?: number; 
  isFlipped: boolean;
  className?: string;
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (isFlipped) {
      // Start animation after delay
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
      setAnimatedValue(0); // Reset when card flips back
    }
  }, [isFlipped, value, delay]);

  return <Progress value={animatedValue} className={className} />;
};

interface JobCardProps {
  job: JobWithMatch;
  onSwipe: (direction: "left" | "right") => void;
  isActive?: boolean;
  isFlipped?: boolean;
  onFlip?: () => void;
  cardsRemaining?: number;
  matchThreshold?: number;
  matchMode?: "keyword" | "precomputed";
  mode?: "swipe" | "matches";
  onDelete?: () => void;
  onApply?: () => void;
  onMarkAsApplied?: () => void;
  isApplied?: boolean;
  matchDate?: string;
  appliedAt?: string | null;
  hasGeneratedApplication?: boolean;
  swipePreview?: "left" | "right" | null;
}

const JobCard = ({ job, onSwipe, isActive = true, isFlipped = false, onFlip, cardsRemaining, matchThreshold, matchMode, mode = "swipe", onDelete, onApply, onMarkAsApplied, isApplied, matchDate, appliedAt, hasGeneratedApplication = false, swipePreview }: JobCardProps) => {
  const [exitX, setExitX] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const isMobile = useIsMobile();

  // All scores are now standardized to 0-100
  const matchScore = job.match_score || 50;
  const matchBreakdown = job.match_breakdown || {
    skills: 0,
    salary: 0,
    location: 0,
    work_arrangement: 0,
    type: 0,
  };

  // Use matching_skills and skills_to_learn from job_matches table
  const matchedSkills = job.matching_skills || job.required_skills?.slice(0, 6) || [];
  const missingSkills = job.skills_to_learn || [];

  return (
    <motion.div
      style={mode === "swipe" ? {
        x,
        rotate,
        opacity,
        cursor: isFlipped ? "default" : "grab",
      } : {}}
      animate={
        mode === "swipe" && exitX !== 0 
          ? { x: exitX } 
          : swipePreview === "left"
          ? { x: -window.innerWidth * 1.2, rotate: -10 }
          : swipePreview === "right"
          ? { x: window.innerWidth * 1.2, rotate: 10 }
          : { x: 0, rotate: 0 }
      }
      transition={{ duration: exitX !== 0 ? 0.3 : swipePreview ? 0.3 : 0.2, ease: "easeOut" }}
      drag={mode === "swipe" && !isFlipped ? "x" : false}
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0}
      onDragEnd={mode === "swipe" ? (e, { offset, velocity }) => {
        if (Math.abs(offset.x) > 100) {
          // Haptic feedback on mobile
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
          setExitX(offset.x > 0 ? window.innerWidth * 1.5 : -window.innerWidth * 1.5);
          setTimeout(() => onSwipe(offset.x > 0 ? "right" : "left"), 300);
        }
      } : undefined}
      className={cn(
        "relative w-full max-w-2xl mx-auto transition-opacity duration-300",
        isApplied && mode === "matches" && "opacity-70"
      )}
    >
      <div className={cn(
        "bg-card border-2 rounded-3xl shadow-xl overflow-hidden transition-colors duration-300",
        isApplied && mode === "matches" ? "border-accent" : "border-transparent"
      )}>
        {/* Delete button for matches mode */}
        {mode === "matches" && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* AI Draft Ready Badge */}
            {hasGeneratedApplication && (
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-accent hover:bg-accent text-accent-foreground border-0 shadow-lg">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Draft Ready
                </Badge>
              </div>
            )}
          </>
        )}
        
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
              <p className="text-lg text-muted-foreground">{job.company}</p>
            </div>
            {isMobile ? (
              // MOBILE: Direct tap to flip
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip?.();
                }}
                className="px-4 py-2 bg-primary/10 text-primary rounded-full text-lg font-semibold active:bg-primary/30 transition-colors cursor-pointer border-0"
              >
                {Math.round(matchScore)}% ✨
              </button>
            ) : (
              // DESKTOP: HoverCard (quick preview) + Click (flip for deep dive)
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlip?.();
                    }}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-full text-lg font-semibold hover:bg-primary/20 transition-colors cursor-pointer border-0"
                  >
                    {Math.round(matchScore)}% ✨
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-64" side="top">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Quick Breakdown</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Skills</div>
                        <div className="font-semibold text-primary">{matchBreakdown.skills}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Salary</div>
                        <div className="font-semibold text-green-600">{matchBreakdown.salary}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Location</div>
                        <div className="font-semibold text-purple-600">{matchBreakdown.location}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Remote</div>
                        <div className="font-semibold text-blue-600">{matchBreakdown.remote}%</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      💡 Click badge for detailed analysis
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>

          {/* Job Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span>{job.location || "Remote"}</span>
              {job.is_remote && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  Remote
                </Badge>
              )}
            </div>

            {job.salary_min && job.salary_max && (
              <div className="flex items-center gap-2 text-foreground">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <span>
                  ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-muted-foreground">
              {job.employment_type && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <span>{job.employment_type}</span>
                </div>
              )}
              {job.experience_level && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{job.experience_level}</span>
                </div>
              )}
            </div>
          </div>

          {/* Required Skills */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.slice(0, 6).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                    {skill}
                  </Badge>
                ))}
                {job.required_skills.length > 6 && (
                  <Badge variant="secondary">
                    +{job.required_skills.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* About this Role - Expandable Description */}
          {job.description && (
            <div className="pt-4 border-t space-y-2">
              <h3 className="font-semibold">About this role</h3>
              {isHTML(job.description) ? (
                <div 
                  className={`text-sm text-muted-foreground prose prose-sm max-w-none ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}
                  dangerouslySetInnerHTML={{ __html: htmlToFormattedText(job.description) }}
                />
              ) : (
                <p className={`text-sm text-muted-foreground ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                  {job.description}
                </p>
              )}
              {job.description.length > 150 && (
                <button 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-sm text-primary hover:underline mt-2 font-semibold"
                >
                  {isDescriptionExpanded ? 'Show less ↑' : 'Read more →'}
                </button>
              )}
            </div>
          )}

          {/* Matches Mode Action Buttons */}
          {mode === "matches" && (
            <>
              <div className="flex gap-1.5 pt-3 md:pt-4">
                <Button
                  onClick={onApply}
                  className="flex-1 gradient-primary text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Apply with AI</span>
                  <span className="sm:hidden">Apply</span>
                </Button>
                
                {job.url && (
                  <Button
                    onClick={() => window.open(job.url, "_blank")}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Job
                  </Button>
                )}

                <Button
                  onClick={onMarkAsApplied}
                  variant={isApplied ? "default" : "outline"}
                  title={isApplied ? "Applied" : "Mark as applied"}
                  className={cn(
                    "transition-all duration-300",
                    isApplied && "bg-accent hover:bg-accent/90 text-accent-foreground border-accent"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isApplied && <span className="ml-1.5">Applied</span>}
                </Button>
              </div>

              {/* Match Date */}
              {matchDate && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {isApplied && appliedAt 
                    ? `Applied ${formatDistanceToNow(new Date(appliedAt), { addSuffix: true })}`
                    : `Matched ${matchDate}`
                  } • {Math.round(matchScore)}% match
                </p>
              )}
            </>
          )}
        </div>

        {/* Card Footer - Cards Remaining Counter (Swipe mode only) */}
        {mode === "swipe" && isActive && cardsRemaining !== undefined && (
          <div className="bg-muted/30 px-6 py-3 text-center border-t border-border/50">
            <span className="text-sm font-medium text-muted-foreground">
              {(matchMode === "keyword" || matchMode === "precomputed") && matchThreshold !== undefined ? (
                <>{cardsRemaining} {cardsRemaining === 1 ? 'job' : 'jobs'} above {Math.round(matchThreshold * 100)}%</>
              ) : (
                <>{cardsRemaining} {cardsRemaining === 1 ? 'job' : 'jobs'} remaining</>
              )}
            </span>
          </div>
        )}

        {/* BACK SIDE - Detailed Match Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isFlipped ? { 
            opacity: 1, 
            scale: 1,
            transition: {
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }
          } : { 
            opacity: 0, 
            scale: 0.95,
            transition: {
              duration: 0.2,
              ease: [0.4, 0, 1, 1]
            }
          }}
          className={`absolute inset-0 p-3 pt-12 md:p-6 md:pt-16 overflow-y-auto bg-background rounded-3xl ${
            isFlipped ? 'z-10' : 'pointer-events-none z-0'
          }`}
        >
          {/* Close Button */}
          {isFlipped && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                onFlip?.();
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-gray-900 transition-all shadow-md z-20"
              aria-label="Close match breakdown"
            >
              <X className="w-6 h-6" />
            </motion.button>
          )}

          {/* Match Breakdown Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isFlipped ? { 
              opacity: 1, 
              y: 0,
              transition: {
                delay: 0.15,
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }
            } : { opacity: 0, y: 20 }}
            className="space-y-3 md:space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Match Breakdown</h3>
                <p className="text-sm text-muted-foreground mt-1">Why this job matches your profile</p>
              </div>
              <div className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold shadow-lg">
                {Math.round(matchScore)}% ✨
              </div>
            </div>

            {/* Progress bars for each category */}
            <div className="space-y-4">
              {/* Skills */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={isFlipped ? { 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.25,
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }
                } : { opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <span className="font-medium w-24 text-sm text-muted-foreground">Skills</span>
                <div className="flex-1 flex items-center gap-2">
                  <AnimatedProgress 
                    value={matchBreakdown.skills} 
                    delay={0.45}
                    isFlipped={isFlipped}
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
                animate={isFlipped ? { 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.35,
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }
                } : { opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <span className="font-medium w-24 text-sm text-muted-foreground">Salary</span>
                <div className="flex-1 flex items-center gap-2">
                  <AnimatedProgress 
                    value={matchBreakdown.salary} 
                    delay={0.55}
                    isFlipped={isFlipped}
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
                animate={isFlipped ? { 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.45,
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }
                } : { opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <span className="font-medium w-24 text-sm text-muted-foreground">Location</span>
                <div className="flex-1 flex items-center gap-2">
                  <AnimatedProgress 
                    value={matchBreakdown.location} 
                    delay={0.65}
                    isFlipped={isFlipped}
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
                animate={isFlipped ? { 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.55,
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }
                } : { opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <span className="font-medium w-24 text-sm text-muted-foreground">Type</span>
                <div className="flex-1 flex items-center gap-2">
                  <AnimatedProgress 
                    value={matchBreakdown.type} 
                    delay={0.75}
                    isFlipped={isFlipped}
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
                animate={isFlipped ? { 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.65,
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }
                } : { opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <span className="font-medium w-24 text-sm text-muted-foreground">Work</span>
                <div className="flex-1 flex items-center gap-2">
                  <AnimatedProgress 
                    value={matchBreakdown.work_arrangement} 
                    delay={0.85}
                    isFlipped={isFlipped}
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
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  💡 Skills Analysis
                </h4>
                
                {/* Matched Skills */}
                <div>
                  <div className="text-green-700 dark:text-green-400 font-medium text-xs mb-2 flex items-center gap-1.5">
                    <span>✅</span>
                    <span>You Have ({matchedSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.length > 0 ? (
                      matchedSkills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300 text-xs border-green-500/20">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No matching skills found</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                {missingSkills.length > 0 && (
                  <div>
                    <div className="text-orange-700 dark:text-orange-400 font-medium text-xs mb-2 flex items-center gap-1.5">
                      <span>📚</span>
                      <span>To Learn ({missingSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSkills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs border-orange-500/20">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            {job.recommendation && <div className="border-t border-border/30" />}

            {/* AI Recommendation */}
            {job.recommendation && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">AI Recommendation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.recommendation}
                </p>
              </div>
            )}

            {/* Confidence Level */}
            {job.confidence_level && (
              <div className="text-center text-xs text-muted-foreground mt-3">
                Confidence: <span className="font-semibold">{job.confidence_level}</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JobCard;
