/**
 * ============ AI MATCHING FEATURE ============
 * AI-powered job matching using Qdrant semantic search
 *
 * This module is isolated and can be removed by:
 * 1. Setting VITE_ENABLE_AI_MATCHING=false in .env
 * 2. Deleting this file
 * 3. Removing imports in components
 *
 * See ROLLBACK_AI_MATCHING.md for full removal instructions
 * ============================================
 */

import { supabase } from './supabase'
import type { Job, Profile } from '../types'

/**
 * Get AI-matched jobs for a user profile using semantic search
 * Calls the ai-match-jobs edge function which handles:
 * - Embedding generation (OpenAI)
 * - Qdrant search
 * - Filtering already swiped jobs
 */
export async function getAIMatchedJobs(
  userProfile: Profile | null,
  limit = 50,
  userId?: string
): Promise<Job[]> {
  try {
    console.log('🤖 AI Matching: Calling edge function...')

    // Call the ai-match-jobs edge function
    const { data, error } = await supabase.functions.invoke('ai-match-jobs', {
      body: {
        user_id: userId || userProfile?.id,
        limit,
      },
    })

    if (error) {
      console.error('❌ Edge function error:', error)
      return []
    }

    if (!data.success) {
      console.error('❌ AI matching failed:', data.error)
      return []
    }

    console.log(`✅ Found ${data.count} AI-matched jobs`)

    // Jobs are already in the correct format from edge function
    return data.data || []
  } catch (error) {
    console.error('❌ AI matching failed:', error)
    // Return empty array on failure - don't break the app
    return []
  }
}

/**
 * Build search text from user profile
 * Combines relevant fields into a single searchable text
 */
function buildUserSearchText(userProfile: any): string {
  const parts = [
    userProfile.title || userProfile.desired_role,
    userProfile.bio || userProfile.summary,
    userProfile.skills?.join(', '),
    userProfile.experience_level,
    userProfile.preferred_location,
    userProfile.preferred_employment_type,
  ].filter(Boolean)

  return parts.join(' ')
}

interface MatchingComparison {
  ai: {
    count: number
    avgScore: number
    jobs: Job[]
  }
  keyword: {
    count: number
    avgScore: number
    jobs: Job[]
  }
}

/**
 * Compare AI matching vs Keyword matching for analytics
 */
export async function compareMatchingMethods(
  userProfile: Profile,
  limit = 20
): Promise<MatchingComparison> {
  const [aiJobs, keywordJobs] = await Promise.all([
    getAIMatchedJobs(userProfile, limit),
    // Note: keywordJobs would come from existing matching.js
    // This is just for comparison analytics
    Promise.resolve([]),
  ])

  return {
    ai: {
      count: aiJobs.length,
      avgScore: calculateAvgScore(aiJobs),
      jobs: aiJobs,
    },
    keyword: {
      count: keywordJobs?.length || 0,
      avgScore: calculateAvgScore(keywordJobs || []),
      jobs: keywordJobs || [],
    },
  }
}

function calculateAvgScore(jobs: Job[]): number {
  if (!jobs.length) return 0
  const sum = jobs.reduce((acc, job) => acc + (job.match_score || 0), 0)
  return Math.round(sum / jobs.length)
}
