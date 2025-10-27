/**
 * Ingest LazyJobs jobs into Qdrant using direct REST API
 * Simpler approach that works with Easypanel Traefik routing
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const QDRANT_URL = process.env.VITE_QDRANT_URL || process.env.QDRANT_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const COLLECTION_NAME = 'jobs';
const EMBEDDING_DIM = 1536;
const BATCH_SIZE = 5;

async function qdrantRequest(path, method = 'GET', body = null) {
  const url = `${QDRANT_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  return response.json();
}

async function main() {
  console.log('🚀 Starting Qdrant ingestion...\n');
  console.log(`Qdrant URL: ${QDRANT_URL}\n`);

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Create collection
  console.log('📦 Creating Qdrant collection...');
  try {
    await qdrantRequest(`/collections/${COLLECTION_NAME}`, 'PUT', {
      vectors: {
        size: EMBEDDING_DIM,
        distance: 'Cosine',
      },
    });
    console.log('✅ Collection created\n');
  } catch (error) {
    console.log('✅ Collection may already exist, continuing...\n');
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
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(jobs.length / BATCH_SIZE)}...`);

    const points = [];

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
        console.log(`  Generating embedding for: ${job.title}`);
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: searchText,
        });

        const embedding = response.data[0].embedding;

        points.push({
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
            created_at: job.created_at,
            match_score: job.match_score,
          },
        });

        processed++;
      } catch (error) {
        errors++;
        console.error(`  ❌ Error processing job ${job.id}:`, error.message);
      }
    }

    // Upsert batch to Qdrant
    if (points.length > 0) {
      try {
        console.log(`  Uploading ${points.length} points to Qdrant...`);
        await qdrantRequest(`/collections/${COLLECTION_NAME}/points`, 'PUT', {
          points,
        });
        console.log(`  ✅ Batch uploaded successfully`);
      } catch (error) {
        console.error(`  ❌ Error uploading batch:`, error.message);
        errors += points.length;
      }
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n\n🎉 Ingestion complete!`);
  console.log(`   Processed: ${processed}/${jobs.length}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Success rate: ${((processed / jobs.length) * 100).toFixed(1)}%`);
  
  // Check final collection status
  const status = await qdrantRequest(`/collections/${COLLECTION_NAME}`);
  console.log(`\n📊 Collection status:`);
  console.log(`   Points: ${status.result.points_count}`);
  console.log(`   Vectors: ${status.result.indexed_vectors_count || 'indexing...'}`);
}

main().catch(console.error);
