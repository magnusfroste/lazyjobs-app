/**
 * Ingest LazyJobs jobs into Qdrant for semantic search
 * Run this script to populate Qdrant with job embeddings
 */

import { createClient } from '@supabase/supabase-js';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const QDRANT_URL = process.env.VITE_QDRANT_URL || process.env.QDRANT_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const COLLECTION_NAME = 'jobs';
const EMBEDDING_DIM = 1536;
const BATCH_SIZE = 10;

async function main() {
  console.log('🚀 Starting Qdrant ingestion...\n');

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const qdrant = new QdrantClient({ 
    url: QDRANT_URL, // Easypanel Traefik handles HTTPS routing
  });
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Create collection
  console.log('📦 Creating Qdrant collection...');
  try {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: EMBEDDING_DIM,
        distance: 'Cosine',
      },
    });
    console.log('✅ Collection created\n');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Collection already exists\n');
    } else {
      throw error;
    }
  }

  // Fetch jobs from LazyJobs database
  console.log('📥 Fetching jobs from LazyJobs database...');
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('❌ Error fetching jobs:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${jobs.length} jobs\n`);

  // Process jobs in batches
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(jobs.length / BATCH_SIZE)}...`);

    for (const job of batch) {
      try {
        // Build search text from job
        const searchText = [
          job.title,
          job.company,
          job.description,
          job.location,
          job.employment_type,
          job.experience_level,
          job.required_skills?.join(', '),
        ].filter(Boolean).join(' ');

        // Generate embedding
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: searchText,
        });

        const embedding = response.data[0].embedding;

        // Store in Qdrant
        await qdrant.upsert(COLLECTION_NAME, {
          points: [{
            id: job.id,
            vector: embedding,
            payload: {
              job_id: job.id,
              external_id: job.external_id,
              title: job.title,
              company: job.company,
              description: job.description,
              location: job.location,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              salary_currency: job.salary_currency,
              is_remote: job.is_remote,
              employment_type: job.employment_type,
              experience_level: job.experience_level,
              required_skills: job.required_skills || [],
              url: job.url,
              posted_at: job.posted_at,
              is_active: job.is_active,
              source: job.source,
              metadata: job.metadata,
              created_at: job.created_at,
              match_score: job.match_score,
            },
          }],
        });

        processed++;
        process.stdout.write(`\r✅ Processed: ${processed}/${jobs.length}`);
      } catch (error) {
        errors++;
        console.error(`\n❌ Error processing job ${job.id}:`, error.message);
      }
    }

    // Small delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n\n🎉 Ingestion complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Success rate: ${((processed / jobs.length) * 100).toFixed(1)}%`);
}

main().catch(console.error);
