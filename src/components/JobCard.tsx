import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { MapPin, DollarSign, Briefcase, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { JobWithMatch } from "@/types/job";

interface JobCardProps {
  job: JobWithMatch;
  onSwipe: (direction: "left" | "right") => void;
  remainingJobs: number;
}

const JobCard = ({ job, onSwipe, remainingJobs }: JobCardProps) => {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const matchScore = job.match_score || 0.5;
  const matchBreakdown = job.match_breakdown || {
    skills: 0,
    salary: 0,
    location: 0,
    remote: 0,
    employment: 0,
  };

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
        cursor: "grab",
      }}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ duration: 0.2 }}
      drag="x"
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
            <Popover>
              <PopoverTrigger asChild>
                <button className="px-4 py-2 bg-primary/10 text-primary rounded-full text-lg font-semibold hover:bg-primary/20 transition-colors cursor-pointer border-0">
                  {Math.round(matchScore * 100)}% ✨
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <h4 className="font-semibold">Match Breakdown</h4>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Skills</span>
                      <span className="font-medium">{matchBreakdown.skills}%</span>
                    </div>
                    <Progress value={matchBreakdown.skills} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Salary</span>
                      <span className="font-medium">{matchBreakdown.salary}%</span>
                    </div>
                    <Progress value={matchBreakdown.salary} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Location</span>
                      <span className="font-medium">{matchBreakdown.location}%</span>
                    </div>
                    <Progress value={matchBreakdown.location} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Remote</span>
                      <span className="font-medium">{matchBreakdown.remote}%</span>
                    </div>
                    <Progress value={matchBreakdown.remote} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Employment Type</span>
                      <span className="font-medium">{matchBreakdown.employment}%</span>
                    </div>
                    <Progress value={matchBreakdown.employment} className="h-2" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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

          {/* Description */}
          {job.description && (
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>
            </div>
          )}

          {/* Company Description */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Company Description</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description || "No company description available."}
            </p>
            <button className="text-sm text-primary hover:underline mt-2 font-semibold">
              Read more →
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button className="flex-1 py-3 px-6 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity">
              📄 Full Details
            </button>
            <button 
              onClick={() => job.url && window.open(job.url, "_blank")}
              className="flex-1 py-3 px-6 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors"
            >
              🔗 Original
            </button>
          </div>
        </div>

        {/* Job Counter */}
        <div className="bg-muted/30 px-6 py-3 text-center text-sm text-muted-foreground">
          {remainingJobs} jobs • Tap score to see details
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
