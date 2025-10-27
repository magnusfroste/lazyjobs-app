import { motion, useMotionValue, useTransform } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { MapPin, DollarSign, Briefcase, Clock, ExternalLink, Info, X } from 'lucide-react'
import type { Job } from '../types'
import { calculateMatchBreakdown } from '../lib/skillGaps'

interface JobCardProps {
  job: Job & { match_score?: number; matched_skills?: string[]; missing_skills?: string[] }
  onSwipe: (direction: 'left' | 'right') => void
  style?: React.CSSProperties
  isFlipped?: boolean
  onFlip?: () => void
  onReadMore?: () => void
  cardId?: string
  userSkills?: string[]
  userProfile?: any
}

export default function JobCard({
  job,
  onSwipe,
  style,
  isFlipped = false,
  onFlip,
  onReadMore,
  cardId,
  userSkills = [],
  userProfile,
}: JobCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  // Scale for visual feedback when swiping
  const scale = useTransform(x, [-130, 0, 130], [1.05, 1, 1.05])

  // Create these hooks ALWAYS, not conditionally - adjusted for new threshold
  const likeOpacity = useTransform(x, [0, 130], [0, 1])
  const nopeOpacity = useTransform(x, [-130, 0], [1, 0])

  const handleDragEnd = (_event: any, info: PanInfo): void => {
    // Only allow swipe if horizontal movement is dominant
    const isHorizontalSwipe = Math.abs(info.offset.x) > Math.abs(info.offset.y) * 3

    // Optimal threshold: 130px (~3.5cm on mobile)
    // Also check velocity for quick swipes
    const swipeThreshold = 130
    const velocityThreshold = 600

    const isSwipe =
      Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold

    if (isHorizontalSwipe && isSwipe) {
      const direction = info.offset.x > 0 ? 'right' : 'left'
      onSwipe(direction)
    }
  }

  const formatSalary = (min?: number | null, max?: number | null, currency?: string | null): string | null => {
    if (!min && !max) return null
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    })
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`
    }
    return formatter.format((min || max) as number)
  }

  // Calculate REAL match breakdown using skill gap analysis
  const safeUserSkills = userSkills || []
  const breakdown = calculateMatchBreakdown(job, safeUserSkills, userProfile)
  
  // Calculate matched and missing skills for this specific job
  const jobRequiredSkills = job.required_skills || []
  const userSkillsLower = safeUserSkills.map(s => s.toLowerCase())
  const matchedSkills = jobRequiredSkills.filter(skill => 
    userSkillsLower.includes(skill.toLowerCase())
  )
  const missingSkills = jobRequiredSkills.filter(skill => 
    !userSkillsLower.includes(skill.toLowerCase())
  )

  return (
    <motion.div
      data-card-id={cardId}
      className="absolute w-full h-full flex items-center justify-center px-4"
      style={{
        x,
        rotate,
        opacity,
        scale,
        ...style,
      }}
      drag={isFlipped ? false : 'x'}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      dragDirectionLock={true}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: isFlipped ? 'default' : 'grabbing' }}
      exit={{
        x: x.get() > 0 ? 600 : -600,
        opacity: 0,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{
          cursor: isFlipped ? 'default' : 'grab',
          perspective: '1000px',
          height: 'calc(100vh - 200px)',
          maxHeight: '700px',
          touchAction: 'pan-y',
          marginLeft: '0',
          marginRight: '0',
        }}
      >
        {/* Card Content - Simple Show/Hide */}
        <div className="relative w-full h-full">
          {/* FRONT SIDE - Job Details */}
          <div
            className={`absolute w-full h-full transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            {/* Header - Optimized */}
            <div className="mb-2 p-4 pt-12">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1 pr-2 leading-tight">
                  {job.title}
                </h2>
                {(breakdown?.overall || job.match_score) && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onFlip && onFlip()
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full text-base font-bold whitespace-nowrap hover:bg-blue-600 active:scale-95 transition-all shadow-lg flex-shrink-0"
                    title="Tap to see match breakdown"
                  >
                    {breakdown?.overall || Math.round(job.match_score * 100)}% ✨
                  </button>
                )}
              </div>
              <p className="text-base text-gray-600 dark:text-gray-300">{job.company}</p>
            </div>

            {/* Content - Fill Available Space */}
            <div
              className="px-4 pb-4 space-y-3 overflow-y-auto"
              style={{ maxHeight: 'calc(100% - 160px)' }}
            >
              {/* Location & Remote */}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{job.location || 'Location not specified'}</span>
                {job.is_remote && (
                  <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Remote
                  </span>
                )}
              </div>

              {/* Salary */}
              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                  </span>
                </div>
              )}

              {/* Employment Type & Experience - Combined Row */}
              <div className="flex items-center gap-4 text-gray-700 text-sm">
                {job.employment_type && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <span className="capitalize">{job.employment_type}</span>
                  </div>
                )}
                {job.experience_level && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="capitalize">{job.experience_level}</span>
                  </div>
                )}
              </div>

              {/* Skills - Limited to 6 */}
              {job.required_skills && job.required_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5 text-sm">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills.slice(0, 6).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.required_skills.length > 6 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                        +{job.required_skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Description - Limited with Read More */}
              {/* TODO: Migrate to Markdown rendering when OpenJobs converts HTML→Markdown */}
              {/* Current: Renders HTML from RemoteOK (safe for trusted sources) */}
              {/* Future: Use react-markdown for safer, cleaner rendering */}
              {job.description && (
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5 text-sm">
                    Description
                  </h3>
                  <div
                    className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                  {job.description.length > 200 && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onReadMore && onReadMore()
                      }}
                      className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1"
                    >
                      Read more →
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onReadMore && onReadMore()
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-md active:scale-95 text-sm"
                >
                  📄 Full Details
                </button>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-all text-center text-sm flex items-center justify-center gap-1.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Original
                  </a>
                )}
              </div>
            </div>

            {/* Swipe Indicators - More Visible */}
            {!isFlipped && (
              <>
                <motion.div
                  className="absolute top-20 left-8 text-5xl font-black text-green-500 border-4 border-green-500 px-4 py-2 rotate-[-20deg] shadow-xl"
                  style={{
                    opacity: likeOpacity,
                  }}
                >
                  LIKE
                </motion.div>
                <motion.div
                  className="absolute top-20 right-8 text-5xl font-black text-red-500 border-4 border-red-500 px-4 py-2 rotate-[20deg] shadow-xl"
                  style={{
                    opacity: nopeOpacity,
                  }}
                >
                  NOPE
                </motion.div>
              </>
            )}
          </div>

          {/* BACK SIDE - Match Breakdown - More Compact */}
          <div
            className={`absolute w-full h-full p-4 pt-16 overflow-y-auto bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 transition-opacity duration-300 ${isFlipped ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
          >
            {/* Close Button */}
            {isFlipped && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onFlip && onFlip()
                }}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 transition-all shadow-md z-20"
                aria-label="Close match breakdown"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            <div className="space-y-4">
              {/* Header with inline score badge */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Match Breakdown</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5 text-sm">Why this job matches your profile</p>
                </div>
                <div className="px-4 py-2 bg-blue-500 text-white rounded-full text-base font-bold whitespace-nowrap shadow-lg flex-shrink-0">
                  {breakdown?.overall}% ✨
                </div>
              </div>

              {/* Breakdown Details - Compact Grid */}
              <div className="space-y-2.5">
                {/* Skills Match */}
                <div className="flex flex-row items-center gap-3">
                  <span className="font-semibold text-gray-700 dark:text-white text-sm w-28 flex-shrink-0">Skills Match</span>
                  <div className="flex-1 flex flex-row items-center gap-2 min-w-0">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-0">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${breakdown?.skills}%` }}
                      />
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm w-12 text-right flex-shrink-0">{breakdown?.skills}%</span>
                  </div>
                </div>

                {/* Salary Range */}
                <div className="flex flex-row items-center gap-3">
                  <span className="font-semibold text-gray-700 dark:text-white text-sm w-28 flex-shrink-0">Salary Range</span>
                  <div className="flex-1 flex flex-row items-center gap-2 min-w-0">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-0">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${breakdown?.salary}%` }}
                      />
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm w-12 text-right flex-shrink-0">{breakdown?.salary}%</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex flex-row items-center gap-3">
                  <span className="font-semibold text-gray-700 dark:text-white text-sm w-28 flex-shrink-0">Location</span>
                  <div className="flex-1 flex flex-row items-center gap-2 min-w-0">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-0">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${breakdown?.location}%` }}
                      />
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm w-12 text-right flex-shrink-0">{breakdown?.location}%</span>
                  </div>
                </div>

                {/* Employment Type */}
                <div className="flex flex-row items-center gap-3">
                  <span className="font-semibold text-gray-700 dark:text-white text-sm w-28 flex-shrink-0">Employment Type</span>
                  <div className="flex-1 flex flex-row items-center gap-2 min-w-0">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-0">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                        style={{ width: `${breakdown?.type}%` }}
                      />
                    </div>
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm w-12 text-right flex-shrink-0">{breakdown?.type}%</span>
                  </div>
                </div>
              </div>

              {/* Key Highlights - Grouped by Status */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
                  💡 Key Highlights
                </h4>
                <div className="space-y-3 text-xs">
                  {/* Skills Summary */}
                  {jobRequiredSkills.length > 0 && (
                    <div className="text-gray-700 dark:text-gray-300 font-medium">
                      Skills: {matchedSkills.length} of {jobRequiredSkills.length} matched
                      {missingSkills.length > 0 && (
                        <span className="text-gray-500 dark:text-gray-400 font-normal">
                          {' '}({missingSkills.length} missing)
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* You Have (Matched Skills) */}
                  {matchedSkills.length > 0 && (
                    <div>
                      <div className="text-green-700 dark:text-green-400 font-semibold mb-1.5 flex items-center gap-1">
                        <span>✅</span>
                        <span>You Have ({matchedSkills.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.slice(0, 6).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                        {matchedSkills.length > 6 && (
                          <span className="px-2 py-0.5 text-green-600 dark:text-green-400 text-xs">
                            +{matchedSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Missing Skills */}
                  {missingSkills.length > 0 && (
                    <div>
                      <div className="text-orange-700 dark:text-orange-400 font-semibold mb-1.5 flex items-center gap-1">
                        <span>❌</span>
                        <span>Missing ({missingSkills.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.slice(0, 6).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                        {missingSkills.length > 6 && (
                          <span className="px-2 py-0.5 text-orange-600 dark:text-orange-400 text-xs">
                            +{missingSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
