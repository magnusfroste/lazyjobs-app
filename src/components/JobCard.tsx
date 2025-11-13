import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { MapPin, DollarSign, Briefcase, Clock, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { JobWithMatch } from "@/types/job";
import { useIsMobile } from "@/hooks/use-mobile";
import { isHTML, htmlToFormattedText } from "@/lib/htmlToText";

interface JobCardProps {
  job: JobWithMatch;
  onSwipe: (direction: "left" | "right") => void;
  remainingJobs: number;
  isActive?: boolean;
  isFlipped?: boolean;
  onFlip?: () => void;
  isBackgroundFetching?: boolean;
  totalJobsAnalyzed?: number;
}

const JobCard = ({ job, onSwipe, remainingJobs, isActive = true, isFlipped = false, onFlip, isBackgroundFetching = false, totalJobsAnalyzed = 0 }: JobCardProps) => {
  const [exitX, setExitX] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const isMobile = useIsMobile();

  const matchScore = job.match_score || 0.5;
  const matchBreakdown = job.match_breakdown || {
    skills: 0,
    salary: 0,
    location: 0,
    remote: 0,
    employment: 0,
  };

  // Calculate matched/missing skills from LLM response (or fallback to required_skills)
  const matchedSkills = (job as any).matched_skills || job.required_skills?.slice(0, 6) || [];
  const missingSkills = (job as any).missing_skills || [];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setExitX(-1000);
      setTimeout(() => onSwipe("left"), 200);
    },
    onSwipedRight: () => {
      setExitX(1000);
      setTimeout(() => onSwipe("right"), 200);
    },
    trackMouse: true,
  });

  return (
    <motion.div
      {...handlers}
      style={{
        x,
        rotate,
        opacity,
        cursor: isFlipped ? "default" : "grab",
      }}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ duration: 0.2 }}
      drag={isFlipped ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (Math.abs(offset.x) > 100) {
          setExitX(offset.x > 0 ? 1000 : -1000);
          setTimeout(() => onSwipe(offset.x > 0 ? "right" : "left"), 200);
        }
      }}
      className="relative w-full max-w-2xl mx-auto"
    >
      <div className="bg-card border rounded-3xl shadow-xl overflow-hidden">
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
                {Math.round(matchScore * 100)}% ✨
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
                    {Math.round(matchScore * 100)}% ✨
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

          {/* Action Button */}
          <div className="pt-4">
            <button 
              onClick={() => job.url && window.open(job.url, "_blank")}
              className="w-full py-3 px-6 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity"
            >
              🔗 View Original Job Posting
            </button>
          </div>
        </div>

        {/* Job Progress Counter */}
        {isActive && (
          <div className="bg-muted/30 px-6 py-3 text-center text-sm text-muted-foreground">
            {isBackgroundFetching ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Analyzing more jobs... ({totalJobsAnalyzed} analyzed)</span>
              </div>
            ) : (
              <span>{remainingJobs} left • {totalJobsAnalyzed} analyzed • Tap score for details</span>
            )}
          </div>
        )}

        {/* BACK SIDE - Detailed Match Analysis */}
        <div
          className={`absolute inset-0 p-6 pt-16 overflow-y-auto bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 transition-opacity duration-300 rounded-3xl ${
            isFlipped ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
        >
          {/* Close Button */}
          {isFlipped && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlip?.();
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-gray-900 transition-all shadow-md z-20"
              aria-label="Close match breakdown"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Match Breakdown Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Match Breakdown</h3>
                <p className="text-sm text-muted-foreground mt-1">Why this job matches your profile</p>
              </div>
              <div className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold shadow-lg">
                {Math.round(matchScore * 100)}% ✨
              </div>
            </div>

            {/* Progress bars for each category */}
            <div className="space-y-3">
              {/* Skills */}
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-sm">Skills</span>
                <div className="flex-1 flex items-center gap-2">
                  <Progress value={matchBreakdown.skills} className="h-2" />
                  <span className="font-bold text-sm w-12 text-right text-primary">
                    {matchBreakdown.skills}%
                  </span>
                </div>
              </div>

              {/* Salary */}
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-sm">Salary</span>
                <div className="flex-1 flex items-center gap-2">
                  <Progress value={matchBreakdown.salary} className="h-2 [&>div]:bg-green-500" />
                  <span className="font-bold text-sm w-12 text-right text-green-600 dark:text-green-400">
                    {matchBreakdown.salary}%
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-sm">Location</span>
                <div className="flex-1 flex items-center gap-2">
                  <Progress value={matchBreakdown.location} className="h-2 [&>div]:bg-purple-500" />
                  <span className="font-bold text-sm w-12 text-right text-purple-600 dark:text-purple-400">
                    {matchBreakdown.location}%
                  </span>
                </div>
              </div>

              {/* Remote */}
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-sm">Remote</span>
                <div className="flex-1 flex items-center gap-2">
                  <Progress value={matchBreakdown.remote} className="h-2 [&>div]:bg-blue-500" />
                  <span className="font-bold text-sm w-12 text-right text-blue-600 dark:text-blue-400">
                    {matchBreakdown.remote}%
                  </span>
                </div>
              </div>

              {/* Employment Type */}
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-sm">Type</span>
                <div className="flex-1 flex items-center gap-2">
                  <Progress value={matchBreakdown.employment} className="h-2 [&>div]:bg-orange-500" />
                  <span className="font-bold text-sm w-12 text-right text-orange-600 dark:text-orange-400">
                    {matchBreakdown.employment}%
                  </span>
                </div>
              </div>
            </div>

            {/* Skills Breakdown */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="bg-card/50 rounded-lg p-4 mt-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  💡 Skills Analysis
                </h4>
                
                {/* Matched Skills */}
                <div>
                  <div className="text-green-700 dark:text-green-400 font-semibold text-xs mb-2 flex items-center gap-1">
                    <span>✅</span>
                    <span>You Have ({matchedSkills.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.length > 0 ? (
                      matchedSkills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
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
                    <div className="text-orange-700 dark:text-orange-400 font-semibold text-xs mb-2 flex items-center gap-1">
                      <span>📚</span>
                      <span>To Learn ({missingSkills.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSkills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actionable Insights */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">💼</span>
                <div className="text-xs">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Why this match?</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    {matchScore >= 0.8 
                      ? "Excellent match! Your skills and preferences align perfectly." 
                      : matchScore >= 0.6 
                      ? "Good match with room to grow. Consider upskilling in missing areas." 
                      : "This role could be a stretch, but offers great learning opportunities."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
