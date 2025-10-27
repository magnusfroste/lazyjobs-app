/**
 * Qdrant Integration for OpenJobs Connector
 * 
 * This module hooks into the job ingestion pipeline and stores
 * jobs in Qdrant for semantic search.
 * 
 * Toggle on/off via ENABLE_QDRANT environment variable
 */

import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const ENABLED = process.env.ENABLE_QDRANT === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const COLLECTION_NAME = 'jobs';
const EMBEDDING_DIM = 1536;

class QdrantIntegration {
  constructor() {
    this.client = null;
    this.enabled = ENABLED;
    this.initialized = false;
  }

  async init() {
    if (!this.enabled) {
      console.log('🔌 Qdrant integration is disabled (set ENABLE_QDRANT=true to enable)');
      return false;
    }

    if (!OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set, Qdrant integration disabled');
      this.enabled = false;
      return false;
    }

    try {
      this.client = new QdrantClient({
        url: QDRANT_URL,
        apiKey: QDRANT_API_KEY,
        // Skip version check for hosted instances
        checkCompatibility: false,
      });

      // Test connection
      await this.client.getCollections();
      console.log('✅ Qdrant connected:', QDRANT_URL);

      // Ensure collection exists
      await this.ensureCollection();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Qdrant initialization failed:', error.message);
      this.enabled = false;
      return false;
    }
  }

  async ensureCollection() {
    try {
      await this.client.getCollection(COLLECTION_NAME);
      console.log(`✓ Collection exists: ${COLLECTION_NAME}`);
    } catch (error) {
      // Collection doesn't exist, create it
      await this.client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: EMBEDDING_DIM,
          distance: 'Cosine',
        },
      });
      console.log(`✓ Created collection: ${COLLECTION_NAME}`);
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  async generateEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit to 8k chars
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Process a job and store in Qdrant
   * This is called during job ingestion
   */
  async processJob(job) {
    if (!this.enabled || !this.initialized) {
      return { success: false, reason: 'not_enabled' };
    }

    try {
      // Create searchable text from job
      const searchText = [
        job.title,
        job.company,
        job.description,
        job.location,
        job.required_skills?.join(', '),
        job.employment_type,
        job.experience_level,
      ].filter(Boolean).join(' ');

      // Generate embedding
      console.log(`🔄 Generating embedding for: ${job.title}`);
      const embedding = await this.generateEmbedding(searchText);

      // Store in Qdrant
      await this.client.upsert(COLLECTION_NAME, {
        points: [
          {
            id: job.id,
            vector: embedding,
            payload: {
              job_id: job.id,
              external_id: job.external_id,
              title: job.title,
              company: job.company,
              location: job.location,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              salary_currency: job.salary_currency,
              is_remote: job.is_remote,
              employment_type: job.employment_type,
              experience_level: job.experience_level,
              required_skills: job.required_skills || [],
              source: job.source,
              created_at: job.created_at,
            },
          },
        ],
      });

      console.log(`✅ Stored in Qdrant: ${job.title}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to store job in Qdrant: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch process multiple jobs
   */
  async batchProcessJobs(jobs) {
    if (!this.enabled || !this.initialized) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      const result = await this.processJob(job);
      if (result.success) {
        processed++;
      } else {
        failed++;
      }
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { processed, failed };
  }

  /**
   * Search for similar jobs
   */
  async searchSimilarJobs(jobId, limit = 5) {
    if (!this.enabled || !this.initialized) {
      return [];
    }

    try {
      const jobPoint = await this.client.retrieve(COLLECTION_NAME, {
        ids: [jobId],
        with_vector: true,
      });

      if (!jobPoint || jobPoint.length === 0) {
        return [];
      }

      const results = await this.client.search(COLLECTION_NAME, {
        vector: jobPoint[0].vector,
        limit: limit + 1,
        with_payload: true,
      });

      return results
        .filter(result => result.payload.job_id !== jobId)
        .slice(0, limit)
        .map(result => ({
          job_id: result.payload.job_id,
          title: result.payload.title,
          company: result.payload.company,
          similarity_score: result.score,
        }));
    } catch (error) {
      console.error('Failed to search similar jobs:', error);
      return [];
    }
  }

  /**
   * Get collection stats
   */
  async getStats() {
    if (!this.enabled || !this.initialized) {
      return { enabled: false };
    }

    try {
      const collection = await this.client.getCollection(COLLECTION_NAME);
      return {
        enabled: true,
        points_count: collection.points_count,
        url: QDRANT_URL,
      };
    } catch (error) {
      return { enabled: true, error: error.message };
    }
  }
}

// Export singleton
export const qdrantIntegration = new QdrantIntegration();
