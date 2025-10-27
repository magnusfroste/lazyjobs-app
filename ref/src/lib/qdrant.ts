/**
 * Qdrant Vector Database Client
 * Semantic search module for job-CV matching
 *
 * Features:
 * - Job embeddings storage
 * - CV embeddings storage
 * - Semantic similarity search
 * - Toggle on/off via environment variable
 */

import { QdrantClient } from '@qdrant/js-client-rest'

// Configuration
const QDRANT_URL = import.meta.env.VITE_QDRANT_URL || 'http://localhost:6333'
const QDRANT_API_KEY = import.meta.env.VITE_QDRANT_API_KEY || ''
const ENABLED = import.meta.env.VITE_QDRANT_ENABLED === 'true'

// Collection names
const COLLECTIONS = {
  JOBS: 'jobs',
  CVS: 'cvs',
}

// Embedding dimensions (OpenAI text-embedding-3-small = 1536)
const EMBEDDING_DIM = 1536

class QdrantService {
  client: QdrantClient | null
  enabled: boolean
  initialized: boolean

  constructor() {
    this.client = null
    this.enabled = ENABLED
    this.initialized = false
  }

  /**
   * Initialize Qdrant client and collections
   */
  async init() {
    if (!this.enabled) {
      console.log('🔌 Qdrant module is disabled')
      return false
    }

    try {
      this.client = new QdrantClient({
        url: QDRANT_URL,
        apiKey: QDRANT_API_KEY,
      })

      // Test connection
      await this.client.getCollections()
      console.log('✅ Qdrant connected:', QDRANT_URL)

      // Ensure collections exist
      await this.ensureCollections()

      this.initialized = true
      return true
    } catch (error) {
      console.error('❌ Qdrant initialization failed:', error)
      this.enabled = false
      return false
    }
  }

  /**
   * Create collections if they don't exist
   */
  async ensureCollections() {
    const collections = [
      { name: COLLECTIONS.JOBS, description: 'Job postings with semantic embeddings' },
      { name: COLLECTIONS.CVS, description: 'User CVs with semantic embeddings' },
    ]

    for (const { name, description } of collections) {
      try {
        await this.client.getCollection(name)
        console.log(`✓ Collection exists: ${name}`)
      } catch (error) {
        // Collection doesn't exist, create it
        await this.client.createCollection(name, {
          vectors: {
            size: EMBEDDING_DIM,
            distance: 'Cosine',
          },
        })
        console.log(`✓ Created collection: ${name}`)
      }
    }
  }

  /**
   * Generate embedding for text using OpenAI
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    // TODO: Replace with your embedding service
    // Options:
    // 1. OpenAI API (text-embedding-3-small)
    // 2. Supabase Edge Function with OpenAI
    // 3. Local model (sentence-transformers)

    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    const data = await response.json()
    return data.data[0].embedding
  }

  /**
   * Store job in Qdrant
   * @param {Object} job - Job object from LazyJobs
   */
  async storeJob(job) {
    if (!this.enabled || !this.initialized) return null

    try {
      // Create searchable text from job
      const searchText = [
        job.title,
        job.company,
        job.description,
        job.location,
        job.required_skills?.join(', '),
      ]
        .filter(Boolean)
        .join(' ')

      // Generate embedding
      const embedding = await this.generateEmbedding(searchText)

      // Store in Qdrant
      await this.client.upsert(COLLECTIONS.JOBS, {
        points: [
          {
            id: job.id,
            vector: embedding,
            payload: {
              job_id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              is_remote: job.is_remote,
              required_skills: job.required_skills || [],
              created_at: job.created_at,
            },
          },
        ],
      })

      console.log(`✓ Stored job in Qdrant: ${job.title}`)
      return true
    } catch (error) {
      console.error('Failed to store job in Qdrant:', error)
      return false
    }
  }

  /**
   * Store CV in Qdrant
   * @param {Object} cv - User CV/profile
   */
  async storeCV(cv) {
    if (!this.enabled || !this.initialized) return null

    try {
      // Create searchable text from CV
      const searchText = [
        cv.name,
        cv.title,
        cv.bio,
        cv.skills?.join(', '),
        cv.experience?.map(e => `${e.title} at ${e.company}`).join(', '),
      ]
        .filter(Boolean)
        .join(' ')

      // Generate embedding
      const embedding = await this.generateEmbedding(searchText)

      // Store in Qdrant
      await this.client.upsert(COLLECTIONS.CVS, {
        points: [
          {
            id: cv.user_id,
            vector: embedding,
            payload: {
              user_id: cv.user_id,
              name: cv.name,
              title: cv.title,
              skills: cv.skills || [],
              location: cv.location,
              remote_preference: cv.remote_preference,
              salary_expectation: cv.salary_expectation,
              updated_at: cv.updated_at,
            },
          },
        ],
      })

      console.log(`✓ Stored CV in Qdrant: ${cv.name}`)
      return true
    } catch (error) {
      console.error('Failed to store CV in Qdrant:', error)
      return false
    }
  }

  /**
   * Find matching CVs for a job
   * @param {string} jobId - Job ID
   * @param {number} limit - Number of matches to return
   * @returns {Promise<Array>} - Matching CVs with scores
   */
  async findMatchingCVsForJob(jobId, limit = 10) {
    if (!this.enabled || !this.initialized) return []

    try {
      // Get job vector
      const jobPoint = await this.client.retrieve(COLLECTIONS.JOBS, {
        ids: [jobId],
        with_vector: true,
      })

      if (!jobPoint || jobPoint.length === 0) {
        return []
      }

      // Search for similar CVs
      const results = await this.client.search(COLLECTIONS.CVS, {
        // @ts-ignore - Qdrant vector types are complex and dynamic
        vector: jobPoint[0].vector,
        limit,
        with_payload: true,
      })

      return results.map(result => ({
        user_id: result.payload.user_id,
        name: result.payload.name,
        title: result.payload.title,
        skills: result.payload.skills,
        match_score: result.score,
      }))
    } catch (error) {
      console.error('Failed to find matching CVs:', error)
      return []
    }
  }

  /**
   * Find matching jobs for a CV
   * @param {string} userId - User ID
   * @param {number} limit - Number of matches to return
   * @returns {Promise<Array>} - Matching jobs with scores
   */
  async findMatchingJobsForCV(userId, limit = 20) {
    if (!this.enabled || !this.initialized) return []

    try {
      // Get CV vector
      const cvPoint = await this.client.retrieve(COLLECTIONS.CVS, {
        ids: [userId],
        with_vector: true,
      })

      if (!cvPoint || cvPoint.length === 0) {
        return []
      }

      // Search for similar jobs
      const results = await this.client.search(COLLECTIONS.JOBS, {
        // @ts-ignore - Qdrant vector types are complex and dynamic
        vector: cvPoint[0].vector,
        limit,
        with_payload: true,
      })

      return results.map(result => ({
        job_id: result.payload.job_id,
        title: result.payload.title,
        company: result.payload.company,
        location: result.payload.location,
        match_score: result.score,
      }))
    } catch (error) {
      console.error('Failed to find matching jobs:', error)
      return []
    }
  }

  /**
   * Search jobs by text (for AI matching)
   * Generates embedding from text and searches for similar jobs
   * @param {string} searchText - Text to search for
   * @param {number} limit - Number of jobs to return
   * @returns {Promise<Array>} - Matching jobs with scores
   */
  async searchByText(searchText, limit = 20) {
    if (!this.enabled || !this.initialized) return []

    try {
      // Generate embedding from search text
      const embedding = await this.generateEmbedding(searchText)

      // Search for similar jobs
      const results = await this.client.search(COLLECTIONS.JOBS, {
        // @ts-ignore - Qdrant vector types are complex and dynamic
        vector: embedding,
        limit,
        with_payload: true,
      })

      return results.map(result => ({
        ...result.payload,
        score: result.score,
      }))
    } catch (error) {
      console.error('Failed to search by text:', error)
      return []
    }
  }

  /**
   * Find similar jobs
   * @param {string} jobId - Job ID
   * @param {number} limit - Number of similar jobs to return
   * @returns {Promise<Array>} - Similar jobs with scores
   */
  async findSimilarJobs(jobId, limit = 5) {
    if (!this.enabled || !this.initialized) return []

    try {
      // Get job vector
      const jobPoint = await this.client.retrieve(COLLECTIONS.JOBS, {
        ids: [jobId],
        with_vector: true,
      })

      if (!jobPoint || jobPoint.length === 0) {
        return []
      }

      // Search for similar jobs (exclude the original)
      const results = await this.client.search(COLLECTIONS.JOBS, {
        // @ts-ignore - Qdrant vector types are complex and dynamic
        vector: jobPoint[0].vector,
        limit: limit + 1,
        with_payload: true,
        filter: {
          must_not: [{ key: 'job_id', match: { value: jobId } }],
        },
      })

      // Filter out the original job
      return results
        .filter(result => result.payload.job_id !== jobId)
        .slice(0, limit)
        .map(result => ({
          job_id: result.payload.job_id,
          title: result.payload.title,
          company: result.payload.company,
          similarity_score: result.score,
        }))
    } catch (error) {
      console.error('Failed to find similar jobs:', error)
      return []
    }
  }

  /**
   * Delete job from Qdrant
   * @param {string} jobId - Job ID
   */
  async deleteJob(jobId) {
    if (!this.enabled || !this.initialized) return

    try {
      await this.client.delete(COLLECTIONS.JOBS, {
        points: [jobId],
      })
      console.log(`✓ Deleted job from Qdrant: ${jobId}`)
    } catch (error) {
      console.error('Failed to delete job from Qdrant:', error)
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    if (!this.enabled || !this.initialized) {
      return { enabled: false }
    }

    try {
      const jobsCollection = await this.client.getCollection(COLLECTIONS.JOBS)
      const cvsCollection = await this.client.getCollection(COLLECTIONS.CVS)

      return {
        enabled: true,
        jobs_count: jobsCollection.points_count,
        cvs_count: cvsCollection.points_count,
        url: QDRANT_URL,
      }
    } catch (error) {
      console.error('Failed to get Qdrant stats:', error)
      return { enabled: true, error: error.message }
    }
  }
}

// Export singleton instance
export const qdrantService = new QdrantService()

// Export for testing
export { QdrantService, COLLECTIONS }
