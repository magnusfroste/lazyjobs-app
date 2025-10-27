/**
 * ============ AI MATCHING FEATURE ============
 * React hook for AI-powered job matching
 *
 * Provides:
 * - AI matching availability status
 * - Job fetching with AI matching
 * - Error handling and fallback
 * - Analytics tracking
 *
 * Can be removed by deleting this file and removing imports
 * ============================================
 */

import { useState } from 'react'
import { useQdrant } from './useQdrant'
import { getAIMatchedJobs } from '../lib/aiMatching'
import type { Profile, Job } from '../types'

interface AIMatchingStats {
  totalFetched: number
  avgScore: number
  lastFetch: string | null
}

interface UseAIMatchingReturn {
  enabled: boolean
  loading: boolean
  error: string | null
  stats: AIMatchingStats
  getJobs: (limit?: number) => Promise<Job[]>
  trackInteraction: (action: string, jobId: string, matchScore?: number) => void
}

export function useAIMatching(userProfile: Profile | null): UseAIMatchingReturn {
  const { enabled: qdrantEnabled, initialized } = useQdrant()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<AIMatchingStats>({
    totalFetched: 0,
    avgScore: 0,
    lastFetch: null,
  })

  /**
   * Fetch AI-matched jobs
   */
  async function getJobs(limit = 20): Promise<Job[]> {
    if (!qdrantEnabled || !initialized) {
      console.warn('AI matching not available')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const jobs = await getAIMatchedJobs(userProfile, limit)

      // Update stats
      setStats(prev => ({
        totalFetched: prev.totalFetched + jobs.length,
        avgScore: calculateAvgScore(jobs),
        lastFetch: new Date().toISOString(),
      }))

      return jobs
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('AI matching error:', err)
      setError(errorMessage)
      return [] // Return empty array on error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Track user interaction for A/B testing
   */
  function trackInteraction(action: string, jobId: string, matchScore?: number): void {
    // Log for analytics (can be sent to backend later)
    console.log('[AI Matching Analytics]', {
      action, // 'swipe_right', 'swipe_left', 'view'
      jobId,
      matchScore,
      timestamp: new Date().toISOString(),
      userId: userProfile?.id,
    })

    // TODO: Send to analytics service
    // analytics.track('ai_matching_interaction', { ... });
  }

  return {
    enabled: qdrantEnabled && initialized,
    loading,
    error,
    stats,
    getJobs,
    trackInteraction,
  }
}

function calculateAvgScore(jobs: Job[]): number {
  if (!jobs.length) return 0
  const sum = jobs.reduce((acc, job) => acc + (job.match_score || 0), 0)
  return Math.round(sum / jobs.length)
}
