/**
 * React Hook for Qdrant Semantic Search
 *
 * Usage:
 * const { storeJob, findMatches, enabled } = useQdrant();
 */

import { useState, useEffect } from 'react'
import { qdrantService } from '../lib/qdrant'
import type { Job } from '../types'

interface QdrantStats {
  jobs: number
  cvs: number
  [key: string]: any
}

interface CVMatch {
  userId: string
  score: number
  [key: string]: any
}

interface JobMatch {
  jobId: string
  score: number
  [key: string]: any
}

interface UseQdrantReturn {
  enabled: boolean
  initialized: boolean
  stats: QdrantStats | null
  storeJob: (job: Job) => Promise<any>
  storeCV: (cv: any) => Promise<any>
  findMatchingCVs: (jobId: string, limit?: number) => Promise<CVMatch[]>
  findMatchingJobs: (userId: string, limit?: number) => Promise<JobMatch[]>
  findSimilarJobs: (jobId: string, limit?: number) => Promise<Job[]>
  deleteJob: (jobId: string) => Promise<void>
  refreshStats: () => Promise<QdrantStats | undefined>
}

export function useQdrant(): UseQdrantReturn {
  const [enabled, setEnabled] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [stats, setStats] = useState<QdrantStats | null>(null)

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const success = await qdrantService.init()
      setEnabled(success)
      setInitialized(true)

      if (success) {
        const statsData = await qdrantService.getStats()
        // @ts-expect-error - Qdrant service returns dynamic stats format
        setStats(statsData)
      }
    }

    init()
  }, [])

  /**
   * Store a job in Qdrant
   */
  const storeJob = async (job: Job) => {
    if (!enabled) return null
    return await qdrantService.storeJob(job)
  }

  /**
   * Store a CV in Qdrant
   */
  const storeCV = async (cv: any) => {
    if (!enabled) return null
    return await qdrantService.storeCV(cv)
  }

  /**
   * Find matching CVs for a job
   */
  const findMatchingCVs = async (jobId: string, limit = 10): Promise<CVMatch[]> => {
    if (!enabled) return []
    // @ts-expect-error - Qdrant service returns dynamic match format
    return await qdrantService.findMatchingCVsForJob(jobId, limit)
  }

  /**
   * Find matching jobs for a CV
   */
  const findMatchingJobs = async (userId: string, limit = 20): Promise<JobMatch[]> => {
    if (!enabled) return []
    // @ts-expect-error - Qdrant service returns dynamic match format
    return await qdrantService.findMatchingJobsForCV(userId, limit)
  }

  /**
   * Find similar jobs
   */
  const findSimilarJobs = async (jobId: string, limit = 5): Promise<Job[]> => {
    if (!enabled) return []
    // @ts-expect-error - Qdrant service returns dynamic job format
    return await qdrantService.findSimilarJobs(jobId, limit)
  }

  /**
   * Delete a job
   */
  const deleteJob = async (jobId: string): Promise<void> => {
    if (!enabled) return
    return await qdrantService.deleteJob(jobId)
  }

  /**
   * Refresh stats
   */
  const refreshStats = async (): Promise<QdrantStats | undefined> => {
    if (!enabled) return
    const statsData = await qdrantService.getStats()
    // @ts-expect-error - Qdrant service returns dynamic stats format
    setStats(statsData)
    // @ts-expect-error - Qdrant service returns dynamic stats format
    return statsData
  }

  return {
    enabled,
    initialized,
    stats,
    storeJob,
    storeCV,
    findMatchingCVs,
    findMatchingJobs,
    findSimilarJobs,
    deleteJob,
    refreshStats,
  }
}
