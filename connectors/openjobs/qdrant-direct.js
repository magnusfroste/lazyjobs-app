/**
 * Direct Qdrant REST API Client
 * Workaround for @qdrant/js-client-rest connection issues
 * Uses native fetch instead of the official client
 */

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const ENABLED = process.env.ENABLE_QDRANT === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const COLLECTION_NAME = 'jobs';
const EMBEDDING_DIM = 1536;

class QdrantDirectClient {
  constructor() {
    this.baseUrl = QDRANT_URL;
    this.apiKey = QDRANT_API_KEY;
    this.enabled = ENABLED;
    this.initialized = false;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qdrant API error ${response.status}: ${error}`);
    }

    return await response.json();
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
      // Test connection
      await this.request('/collections');
      console.log('✅ Qdrant connected:', this.baseUrl);

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
      await this.request(`/collections/${COLLECTION_NAME}`);
      console.log(`✓ Collection exists: ${COLLECTION_NAME}`);
    } catch (error) {
      // Collection doesn't exist, create it
      try {
        await this.request(`/collections/${COLLECTION_NAME}`, {
          method: 'PUT',
          body: JSON.stringify({
            vectors: {
              size: EMBEDDING_DIM,
              distance: 'Cosine',
            },
          }),
        });
        console.log(`✓ Created collection: ${COLLECTION_NAME}`);
      } catch (createError) {
        throw new Error(`Failed to create collection: ${createError.message}`);
      }
    }
  }

  async generateEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  // Generate numeric ID from string (simple hash)
  stringToNumericId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async processJob(job) {
    if (!this.enabled || !this.initialized) {
      return { success: false, reason: 'not_enabled' };
    }

    try {
      // Generate numeric ID from external_id or use existing id
      const numericId = job.id || this.stringToNumericId(job.external_id || job.title);
      
      const searchText = [
        job.title,
        job.company,
        job.description,
        job.location,
        job.required_skills?.join(', '),
        job.employment_type,
        job.experience_level,
      ].filter(Boolean).join(' ');

      console.log(`🔄 Generating embedding for: ${job.title}`);
      const embedding = await this.generateEmbedding(searchText);

      await this.request(`/collections/${COLLECTION_NAME}/points`, {
        method: 'PUT',
        body: JSON.stringify({
          points: [
            {
              id: numericId,
              vector: embedding,
              payload: {
                job_id: job.id,
                external_id: job.external_id,
                title: job.title,
                company: job.company,
                description: job.description, // Full job description
                location: job.location,
                salary_min: job.salary_min,
                salary_max: job.salary_max,
                salary_currency: job.salary_currency,
                is_remote: job.is_remote,
                employment_type: job.employment_type,
                experience_level: job.experience_level,
                required_skills: job.required_skills || [],
                url: job.url, // Application URL
                posted_at: job.posted_at,
                is_active: job.is_active,
                source: job.source,
                metadata: job.metadata, // Additional context
                created_at: job.created_at,
              },
            },
          ],
        }),
      });

      console.log(`✅ Stored in Qdrant: ${job.title}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to store job in Qdrant: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

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
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { processed, failed };
  }

  async searchSimilarJobs(jobId, limit = 5) {
    if (!this.enabled || !this.initialized) {
      return [];
    }

    try {
      const pointData = await this.request(`/collections/${COLLECTION_NAME}/points/${jobId}`);
      
      if (!pointData.result || !pointData.result.vector) {
        return [];
      }

      const searchResult = await this.request(`/collections/${COLLECTION_NAME}/points/search`, {
        method: 'POST',
        body: JSON.stringify({
          vector: pointData.result.vector,
          limit: limit + 1,
          with_payload: true,
        }),
      });

      return searchResult.result
        .filter(result => result.id !== jobId)
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

  async getStats() {
    if (!this.enabled || !this.initialized) {
      return { enabled: false };
    }

    try {
      const collection = await this.request(`/collections/${COLLECTION_NAME}`);
      return {
        enabled: true,
        points_count: collection.result.points_count,
        url: this.baseUrl,
      };
    } catch (error) {
      return { enabled: true, error: error.message };
    }
  }
}

export const qdrantIntegration = new QdrantDirectClient();
