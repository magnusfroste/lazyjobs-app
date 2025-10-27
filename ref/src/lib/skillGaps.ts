/**
 * Skill Gap Detection & Gamification
 * 
 * Calculates missing skills from job stack and provides
 * gamification metrics (unlock count, trending skills, etc.)
 */

import type { Job } from '../types'

export interface SkillGap {
  skill: string
  jobCount: number // How many jobs in stack require this
  percentage: number // % of jobs in stack that require this
  unlockCount: number // How many jobs you'd unlock by learning this
  trending: boolean // Is this skill trending in the market?
  category?: string // e.g., "Frontend", "Backend", "DevOps"
}

export interface MatchBreakdown {
  overall: number
  skills: number
  experience: number
  location: number
  salary: number
  type: number
  matchedSkills: string[]
  missingSkills: string[]
}

/**
 * Calculate skill gaps from current job stack
 * Shows which skills are missing and how many jobs they'd unlock
 */
export function calculateSkillGaps(
  userSkills: string[],
  jobStack: Job[],
  limit = 5
): SkillGap[] {
  if (!userSkills || !jobStack || jobStack.length === 0) {
    return []
  }

  // Normalize user skills to lowercase for comparison
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim())

  // Count missing skills across all jobs
  const skillCounts: Record<string, number> = {}

  jobStack.forEach(job => {
    const requiredSkills = job.required_skills || []
    requiredSkills.forEach(skill => {
      const normalizedSkill = skill.toLowerCase().trim()
      if (!normalizedUserSkills.includes(normalizedSkill)) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      }
    })
  })

  // Convert to array and sort by frequency
  const gaps = Object.entries(skillCounts)
    .map(([skill, count]) => ({
      skill,
      jobCount: count,
      percentage: Math.round((count / jobStack.length) * 100),
      unlockCount: count, // Same as jobCount for now
      trending: isTrendingSkill(skill),
      category: categorizeSkill(skill),
    }))
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, limit)

  return gaps
}

/**
 * Calculate detailed match breakdown for a specific job
 * Replaces hardcoded values with real calculations
 */
export function calculateMatchBreakdown(
  job: Job,
  userSkills: string[],
  userProfile?: any
): MatchBreakdown {
  // Normalize skills for comparison
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim())
  const requiredSkills = (job.required_skills || []).map(s => s.toLowerCase().trim())

  // Calculate skills match
  const matchedSkills: string[] = []
  const missingSkills: string[] = []

  requiredSkills.forEach(skill => {
    if (normalizedUserSkills.includes(skill)) {
      matchedSkills.push(skill)
    } else {
      missingSkills.push(skill)
    }
  })

  const skillsMatch = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 100 // If no skills required, 100% match

  // Calculate experience match
  const experienceMatch = calculateExperienceMatch(job, userProfile)

  // Calculate location match
  const locationMatch = calculateLocationMatch(job, userProfile)

  // Calculate salary match
  const salaryMatch = calculateSalaryMatch(job, userProfile)

  // Calculate employment type match
  const typeMatch = calculateTypeMatch(job, userProfile)

  // Overall match (weighted average)
  const overall = Math.round(
    skillsMatch * 0.5 + // Skills are 50% of the match
    experienceMatch * 0.2 +
    locationMatch * 0.15 +
    salaryMatch * 0.1 +
    typeMatch * 0.05
  )

  return {
    overall,
    skills: skillsMatch,
    experience: experienceMatch,
    location: locationMatch,
    salary: salaryMatch,
    type: typeMatch,
    matchedSkills,
    missingSkills,
  }
}

/**
 * Calculate experience level match
 */
function calculateExperienceMatch(job: Job, userProfile?: any): number {
  if (!job.experience_level || !userProfile?.cv_data?.experience_years) {
    return 75 // Default if not specified
  }

  const userYears = userProfile.cv_data.experience_years
  const required = job.experience_level.toLowerCase()

  // Map experience levels to years
  const levelMap: Record<string, { min: number; max: number }> = {
    'entry': { min: 0, max: 2 },
    'junior': { min: 0, max: 3 },
    'mid': { min: 2, max: 5 },
    'mid-level': { min: 2, max: 5 },
    'senior': { min: 5, max: 15 },
    'lead': { min: 7, max: 20 },
    'staff': { min: 8, max: 20 },
    'principal': { min: 10, max: 25 },
  }

  const range = levelMap[required]
  if (!range) return 75

  // Perfect match if within range
  if (userYears >= range.min && userYears <= range.max) {
    return 100
  }

  // Overqualified (still good)
  if (userYears > range.max) {
    return 90
  }

  // Underqualified (calculate how close)
  const gap = range.min - userYears
  return Math.max(50, 100 - gap * 20)
}

/**
 * Calculate location match
 */
function calculateLocationMatch(job: Job, userProfile?: any): number {
  // Remote jobs always match
  if (job.is_remote) {
    return 100
  }

  // If no location preference, default to 75
  if (!userProfile?.preferences?.preferred_location) {
    return job.location ? 75 : 50
  }

  // If job has no location, lower score
  if (!job.location) {
    return 50
  }

  // Simple string matching (can be improved with geocoding)
  const userLocation = userProfile.preferences.preferred_location.toLowerCase()
  const jobLocation = job.location.toLowerCase()

  if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation)) {
    return 100
  }

  return 60 // Different location but specified
}

/**
 * Calculate salary match
 */
function calculateSalaryMatch(job: Job, userProfile?: any): number {
  // If no salary info, default to 75
  if (!job.salary_min && !job.salary_max) {
    return 75
  }

  // If user has no salary preference, default to 100
  if (!userProfile?.preferences?.min_salary) {
    return 100
  }

  const userMinSalary = userProfile.preferences.min_salary
  const jobMaxSalary = job.salary_max || job.salary_min

  // If job meets or exceeds user's minimum
  if (jobMaxSalary && jobMaxSalary >= userMinSalary) {
    return 100
  }

  // Calculate how close it is
  const jobMinSalary = job.salary_min || job.salary_max
  if (jobMinSalary) {
    const percentage = (jobMinSalary / userMinSalary) * 100
    return Math.min(100, Math.max(50, percentage))
  }

  return 75
}

/**
 * Calculate employment type match
 */
function calculateTypeMatch(job: Job, userProfile?: any): number {
  // If no preference, default to 100
  if (!userProfile?.preferences?.preferred_employment_type) {
    return 100
  }

  // If job has no type specified
  if (!job.employment_type) {
    return 75
  }

  const userPreference = userProfile.preferences.preferred_employment_type.toLowerCase()
  const jobType = job.employment_type.toLowerCase()

  // Exact match
  if (userPreference === jobType) {
    return 100
  }

  // Partial match (e.g., "full-time" vs "full time")
  if (userPreference.replace(/[-\s]/g, '') === jobType.replace(/[-\s]/g, '')) {
    return 100
  }

  return 60 // Different type
}

/**
 * Check if a skill is trending
 * (Simplified - in production, use real market data)
 */
function isTrendingSkill(skill: string): boolean {
  const trendingSkills = [
    'react', 'typescript', 'kubernetes', 'aws', 'docker',
    'graphql', 'nextjs', 'tailwind', 'python', 'rust',
    'go', 'terraform', 'ai', 'machine learning', 'llm'
  ]

  return trendingSkills.some(trending =>
    skill.toLowerCase().includes(trending)
  )
}

/**
 * Categorize skill by type
 * (Simplified - in production, use a proper taxonomy)
 */
function categorizeSkill(skill: string): string {
  const skillLower = skill.toLowerCase()

  const categories: Record<string, string[]> = {
    'Frontend': ['react', 'vue', 'angular', 'svelte', 'nextjs', 'tailwind', 'css', 'html', 'javascript', 'typescript'],
    'Backend': ['node', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'fastapi', 'nestjs'],
    'DevOps': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'jenkins', 'ci/cd'],
    'Database': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra'],
    'Mobile': ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android'],
    'AI/ML': ['python', 'tensorflow', 'pytorch', 'scikit', 'pandas', 'numpy', 'ai', 'machine learning', 'llm'],
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => skillLower.includes(keyword))) {
      return category
    }
  }

  return 'Other'
}

/**
 * Get gamification message for skill gap
 */
export function getGamificationMessage(gap: SkillGap): string {
  if (gap.unlockCount >= 10) {
    return `🔥 Learn ${gap.skill} to unlock ${gap.unlockCount} more jobs!`
  }
  if (gap.trending) {
    return `⭐ ${gap.skill} is trending! ${gap.unlockCount} jobs waiting.`
  }
  return `📚 ${gap.unlockCount} jobs need ${gap.skill}`
}
