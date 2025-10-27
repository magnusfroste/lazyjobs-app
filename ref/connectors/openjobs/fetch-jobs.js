#!/usr/bin/env node

/**
 * OpenJobs Connector for LazyJobs
 * Fetches jobs from OpenJobs aggregation platform
 * OpenJobs provides unified access to multiple job sources:
 * - Arbetsförmedlingen (Swedish)
 * - EURES/Adzuna (European)
 * - Remotive (Remote jobs)
 */

import 'dotenv/config'
import { qdrantIntegration } from './qdrant-direct.js'

// Configuration
const OPENJOBS_API_URL = process.env.OPENJOBS_API_URL || 'http://localhost:8080'
const INGEST_URL = process.env.INGEST_URL
const CONNECTOR_API_KEY = process.env.CONNECTOR_API_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const ENABLE_ENRICHMENT = process.env.ENABLE_ENRICHMENT !== 'false'
const ENRICHMENT_URL = process.env.ENRICHMENT_URL
const ENABLE_QDRANT = process.env.ENABLE_QDRANT === 'true'

// Batch processing settings
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50') // Process 50 jobs at a time for AI enrichment
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || '1000') // 1 second delay between batches

// Continuous operation settings
const RUN_CONTINUOUSLY = process.env.RUN_CONTINUOUSLY !== 'false' // Default: true
const SYNC_INTERVAL_HOURS = parseInt(process.env.SYNC_INTERVAL_HOURS || '24') // Default: 24 hours
const CRON_SCHEDULE = process.env.CRON_SCHEDULE // e.g., "0 6 * * *" for 6 AM daily

/**
 * Fetch jobs from OpenJobs API with retry logic
 */
async function fetchOpenJobs(limit = 100, offset = 0, retries = 3) {
  console.log(`🌐 Fetching jobs from OpenJobs (limit: ${limit}, offset: ${offset})...`)
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `${OPENJOBS_API_URL}/jobs?limit=${limit}&offset=${offset}`
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`OpenJobs API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(`OpenJobs API returned error: ${data.message}`)
      }
      
      const jobs = data.data || []
      console.log(`✅ Fetched ${jobs.length} jobs from OpenJobs`)
      
      return jobs
    } catch (error) {
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff, max 10s
        console.warn(`⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`)
        console.log(`⏳ Retrying in ${waitTime/1000}s...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else {
        console.error('❌ Error fetching from OpenJobs:', error.message)
        throw error
      }
    }
  }
  
  throw new Error('Failed to fetch after all retries')
}

/**
 * Parse salary string to extract min/max values
 * Handles formats like:
 * - "SEK 45,000 - 65,000/month"
 * - "€4,500 - €6,500/month"
 * - "€120,000+"
 */
function parseSalary(salaryStr) {
  if (!salaryStr) return { min: null, max: null, currency: null }
  
  // Extract currency
  let currency = 'USD' // default
  if (salaryStr.includes('SEK') || salaryStr.includes('kr')) currency = 'SEK'
  else if (salaryStr.includes('€') || salaryStr.includes('EUR')) currency = 'EUR'
  else if (salaryStr.includes('£') || salaryStr.includes('GBP')) currency = 'GBP'
  else if (salaryStr.includes('DKK')) currency = 'DKK'
  
  // Extract numbers (remove spaces, commas)
  const numbers = salaryStr.match(/\d+[\d\s,]*/g)
  if (!numbers || numbers.length === 0) return { min: null, max: null, currency }
  
  const cleanNumbers = numbers.map(n => parseInt(n.replace(/[\s,]/g, '')))
  
  // If range detected (e.g., "45000 - 65000")
  if (cleanNumbers.length >= 2) {
    return {
      min: Math.min(...cleanNumbers),
      max: Math.max(...cleanNumbers),
      currency
    }
  }
  
  // Single number (e.g., "€120,000+")
  return {
    min: cleanNumbers[0],
    max: null,
    currency
  }
}

/**
 * Detect if job is remote based on location and metadata
 */
function isRemoteJob(job) {
  const location = (job.location || '').toLowerCase()
  const description = (job.description || '').toLowerCase()
  
  // Check location field
  if (location.includes('remote') || location.includes('distans') || location.includes('anywhere')) {
    return true
  }
  
  // Check fields metadata
  if (job.fields) {
    if (job.fields.is_remote === true) return true
    if (job.fields.candidate_required_location === 'Remote') return true
  }
  
  // Check description for remote keywords
  if (description.includes('remote') || description.includes('work from home') || description.includes('distans')) {
    return true
  }
  
  return false
}

/**
 * Transform OpenJobs format to LazyJobs format
 */
function transformJob(openJob) {
  const salary = parseSalary(openJob.salary)
  const isRemote = isRemoteJob(openJob)
  
  // Extract URL from fields or construct default
  const url = openJob.fields?.source_url || 
              openJob.fields?.url || 
              `${OPENJOBS_API_URL}/jobs/${openJob.id}`
  
  // OpenJobs is the SOURCE OF TRUTH for requirements
  // ALL plugins now populate requirements[] array (structured or keyword extraction)
  // No need to extract from fields - that would create duplicates!
  const skills = [
    ...(openJob.requirements || [])
  ]
  
  // Deduplicate and clean (in case of any duplicates from OpenJobs)
  const uniqueSkills = [...new Set(skills.filter(s => s && s.trim()))]
  
  // Determine if job is active (LinkedIn-style expiration)
  const isActive = calculateJobActiveStatus(openJob)
  
  return {
    external_id: `openjobs_${openJob.id}`,
    title: openJob.title,
    company: openJob.company || 'Unknown Company',
    description: openJob.description || '',
    location: openJob.location || 'Not specified',
    salary_min: salary.min,
    salary_max: salary.max,
    salary_currency: salary.currency,
    is_remote: isRemote,
    employment_type: openJob.employment_type || 'full-time',
    required_skills: uniqueSkills,
    experience_level: openJob.experience_level || 'mid',
    url: url,
    posted_at: openJob.posted_date || new Date().toISOString(),
    is_active: isActive,
    metadata: {
      source: 'openjobs',
      original_source: openJob.fields?.source || openJob.fields?.connector || 'unknown',
      original_id: openJob.id,
      benefits: openJob.benefits || [],
      expires_date: openJob.expires_date,
      raw_data: openJob.fields || {},
      fetched_at: new Date().toISOString()
    }
  }
}

/**
 * Calculate if job should be active based on expiration rules
 * LinkedIn-style: Jobs expire after 30-60 days or when expires_date is reached
 */
function calculateJobActiveStatus(openJob) {
  const now = new Date()
  
  // Check explicit expiration date
  if (openJob.expires_date) {
    const expiresDate = new Date(openJob.expires_date)
    if (now > expiresDate) {
      return false // Expired by date
    }
  }
  
  // Check age-based expiration (60 days default)
  if (openJob.posted_date) {
    const postedDate = new Date(openJob.posted_date)
    const daysSincePosted = (now - postedDate) / (1000 * 60 * 60 * 24)
    
    // Auto-expire after 60 days if no explicit expires_date
    if (!openJob.expires_date && daysSincePosted > 60) {
      return false // Too old
    }
  }
  
  return true // Active
}

/**
 * Enrich jobs with AI-powered skills extraction
 */
async function enrichJobs(jobs) {
  if (!ENABLE_ENRICHMENT || !ENRICHMENT_URL) {
    console.log('⏭️  AI enrichment disabled, skipping...')
    return jobs
  }

  console.log(`🤖 Enriching ${jobs.length} jobs with AI...`)
  
  try {
    const response = await fetch(ENRICHMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobs })
    })
    
    if (!response.ok) {
      console.warn(`⚠️  Enrichment API returned ${response.status}, continuing with original jobs`)
      return jobs
    }
    
    const result = await response.json()
    
    // Handle different response formats
    let enrichedJobs
    if (Array.isArray(result)) {
      enrichedJobs = result
    } else if (result.jobs) {
      enrichedJobs = result.jobs
    } else if (result.data) {
      enrichedJobs = result.data
    } else if (result.enriched_jobs) {
      // N8N format: { enriched_jobs: [...] }
      enrichedJobs = result.enriched_jobs
    } else {
      console.warn('⚠️  Unexpected enrichment response format, using original jobs')
      console.log('   Response:', JSON.stringify(result).slice(0, 200))
      return jobs
    }

    // Merge enriched data back into original jobs
    const mergedJobs = jobs.map((originalJob, index) => {
      const enrichedData = enrichedJobs[index] || {}

      // Handle N8N format: combine extracted_skills, extracted_tools, soft_skills, extracted_languages
      let combinedSkills = [...(originalJob.required_skills || [])] // Start with original skills

      if (enrichedData.extracted_skills && Array.isArray(enrichedData.extracted_skills)) {
        combinedSkills.push(...enrichedData.extracted_skills)
      }

      if (enrichedData.extracted_tools && Array.isArray(enrichedData.extracted_tools)) {
        combinedSkills.push(...enrichedData.extracted_tools)
      }

      if (enrichedData.soft_skills && Array.isArray(enrichedData.soft_skills)) {
        // Add soft skills with prefix to distinguish
        const prefixedSoftSkills = enrichedData.soft_skills.map(skill => `Soft: ${skill}`)
        combinedSkills.push(...prefixedSoftSkills)
      }

      // Remove duplicates and clean
      const uniqueSkills = [...new Set(combinedSkills.filter(skill => skill && typeof skill === 'string' && skill.trim()))]

      return {
        ...originalJob,
        required_skills: uniqueSkills,
        // Add other enriched fields
        ...(enrichedData.experience_level && { experience_level: enrichedData.experience_level }),
        ...(enrichedData.description && { description: enrichedData.description }),
        ...(enrichedData.extracted_languages && { languages: enrichedData.extracted_languages }),
        ...(enrichedData.extracted_tools && { tools: enrichedData.extracted_tools }),
        ...(enrichedData.confidence && { enrichment_confidence: enrichedData.confidence })
      }
    })
    
    console.log(`✅ AI enrichment complete (${mergedJobs.length} jobs)`)
    
    // Show sample enrichment
    const sampleJob = mergedJobs[0]
    if (sampleJob?.required_skills?.length > 0) {
      console.log(`   Sample skills: ${sampleJob.required_skills.slice(0, 5).join(', ')}...`)
    }
    
    return mergedJobs
  } catch (error) {
    console.warn(`⚠️  Enrichment failed: ${error.message}, continuing with original jobs`)
    return jobs
  }
}

/**
 * Ingest jobs to LazyJobs platform
 */
async function ingestJobs(jobs) {
  if (!INGEST_URL || !CONNECTOR_API_KEY) {
    console.error('❌ Missing INGEST_URL or CONNECTOR_API_KEY')
    return
  }

  console.log(`📤 Ingesting ${jobs.length} jobs to LazyJobs...`)
  
  const response = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-connector-api-key': CONNECTOR_API_KEY
    },
    body: JSON.stringify({
      jobs,
      source: 'openjobs',
      api_key: CONNECTOR_API_KEY
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ingest failed: ${response.status} - ${error}`)
  }

  const result = await response.json()
  console.log('✅ Ingestion complete:', result)
  return result
}

/**
 * Check which job IDs already exist in LazyJobs
 * Queries the database to avoid re-processing existing jobs
 */
async function getExistingJobIds(externalIds) {
  if (!externalIds || externalIds.length === 0) return []
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = INGEST_URL.split('/functions')[0]
    const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY)
    
    // Query jobs table for existing external_ids
    const { data, error } = await supabase
      .from('jobs')
      .select('external_id')
      .in('external_id', externalIds)
    
    if (error) {
      console.warn('⚠️  Could not check existing jobs:', error.message)
      return []
    }
    
    return data.map(job => job.external_id)
  } catch (error) {
    console.warn('⚠️  Could not check existing jobs, will rely on database deduplication')
    return []
  }
}

/**
 * Filter out jobs that already exist in LazyJobs
 */
async function filterNewJobs(jobs) {
  console.log('\n🔍 Checking which jobs already exist in LazyJobs...')
  
  const externalIds = jobs.map(j => `openjobs_${j.id}`)
  const existingIds = await getExistingJobIds(externalIds)
  
  const newJobs = jobs.filter(job => {
    const externalId = `openjobs_${job.id}`
    return !existingIds.includes(externalId)
  })
  
  console.log(`✅ Found ${existingIds.length} existing jobs, ${newJobs.length} new jobs to process`)
  
  return newJobs
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 OpenJobs Connector Starting...\n')
    console.log(`📍 OpenJobs API: ${OPENJOBS_API_URL}`)
    console.log(`📍 LazyJobs Ingest: ${INGEST_URL}`)
    console.log(`🤖 AI Enrichment: ${ENABLE_ENRICHMENT ? 'Enabled' : 'Disabled'}`)
    console.log(`🔍 Qdrant Semantic Search: ${ENABLE_QDRANT ? 'Enabled' : 'Disabled'}\n`)
    
    // Initialize Qdrant if enabled
    if (ENABLE_QDRANT) {
      await qdrantIntegration.init()
    }
    
    // Fetch ALL jobs from OpenJobs (paginate if needed)
    let allJobs = []
    let offset = 0
    const limit = 100
    
    while (true) {
      const batch = await fetchOpenJobs(limit, offset)
      if (batch.length === 0) break
      
      allJobs = allJobs.concat(batch)
      console.log(`   Fetched ${batch.length} jobs (total: ${allJobs.length})`)
      
      if (batch.length < limit) break // Last page
      offset += limit
    }
    
    // Filter to only new jobs (not already in LazyJobs)
    const newJobs = await filterNewJobs(allJobs)
    
    if (newJobs.length === 0) {
      console.log('\n✅ No new jobs to process - all jobs already exist in LazyJobs')
      return
    }
    
    console.log(`\n📦 Processing ${newJobs.length} new jobs...`)
    
    // Transform to LazyJobs format
    const transformedJobs = newJobs.map(transformJob)
    console.log(`🔄 Transformed ${transformedJobs.length} jobs`)
    
    // Show sample of sources
    const sources = [...new Set(transformedJobs.map(j => j.metadata.original_source))]
    console.log(`📊 Sources: ${sources.join(', ')}`)
    
    // ⭐ Process jobs in batches to avoid AI enrichment token limits
    console.log(`\n📦 Processing in batches of ${BATCH_SIZE} jobs...`)

    const totalBatches = Math.ceil(transformedJobs.length / BATCH_SIZE)
    const allEnrichedJobs = []
    let totalProcessed = 0
    let totalInserted = 0
    let totalUpdated = 0
    let totalSkipped = 0

    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * BATCH_SIZE
      const batchEnd = Math.min(batchStart + BATCH_SIZE, transformedJobs.length)
      const batchJobs = transformedJobs.slice(batchStart, batchEnd)

      console.log(`\n🔄 Processing batch ${i + 1}/${totalBatches} (${batchJobs.length} jobs)...`)

      try {
        // Enrich this batch of jobs with AI
        const enrichedBatch = await enrichJobs(batchJobs)

        // Ingest this batch to LazyJobs
        const batchResult = await ingestJobs(enrichedBatch)

        // Update totals
        totalProcessed += batchJobs.length
        totalInserted += batchResult.inserted || batchResult.new || 0
        totalUpdated += batchResult.updated || 0
        totalSkipped += batchResult.skipped || 0

        // Collect all enriched jobs for Qdrant processing
        allEnrichedJobs.push(...enrichedBatch)

        console.log(`✅ Batch ${i + 1}/${totalBatches} complete: ${batchResult.inserted || batchResult.new || 0} new, ${batchResult.updated || 0} updated`)

        // Delay between batches (except for the last one)
        if (i < totalBatches - 1 && BATCH_DELAY_MS > 0) {
          console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`)
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
        }

      } catch (error) {
        console.error(`❌ Batch ${i + 1}/${totalBatches} failed:`, error.message)
        // Continue with next batch instead of failing the entire process
        if (!ENABLE_ENRICHMENT) {
          // If enrichment is disabled, try to ingest without enrichment
          try {
            console.log(`⏳ Retrying batch without enrichment...`)
            const batchResult = await ingestJobs(batchJobs)
            totalProcessed += batchJobs.length
            totalInserted += batchResult.inserted || batchResult.new || 0
            totalUpdated += batchResult.updated || 0
            totalSkipped += batchResult.skipped || 0
            allEnrichedJobs.push(...batchJobs)
            console.log(`✅ Batch ${i + 1}/${totalBatches} retry successful: ${batchResult.inserted || batchResult.new || 0} new`)
          } catch (retryError) {
            console.error(`❌ Batch ${i + 1}/${totalBatches} retry also failed:`, retryError.message)
          }
        }
      }
    }

    // 🔍 Store in Qdrant for semantic search (if enabled)
    if (ENABLE_QDRANT) {
      console.log('\n🔍 Storing jobs in Qdrant for semantic search...')
      const qdrantResult = await qdrantIntegration.batchProcessJobs(allEnrichedJobs)
      console.log(`✅ Qdrant: ${qdrantResult.processed} stored, ${qdrantResult.failed} failed`)

      // Show stats
      const stats = await qdrantIntegration.getStats()
      if (stats.enabled) {
        console.log(`📊 Qdrant total jobs: ${stats.points_count}`)
      }
    }

    console.log('\n🎉 Success!')
    console.log(`📊 Processed: ${totalProcessed} jobs in ${totalBatches} batches`)
    console.log(`✨ New: ${totalInserted} jobs`)
    console.log(`🔄 Updated: ${totalUpdated} jobs`)
    console.log(`⏭️  Skipped: ${totalSkipped} jobs`)
    
  } catch (error) {
    console.error('\n💥 Error:', error.message)
    console.error(error.stack)
    if (!RUN_CONTINUOUSLY) {
      process.exit(1)
    }
    throw error // Re-throw for continuous mode to handle
  }
}

/**
 * Run continuously with scheduled intervals
 */
async function runContinuously() {
  const intervalMs = SYNC_INTERVAL_HOURS * 60 * 60 * 1000
  
  console.log(`🔄 Continuous mode enabled - syncing every ${SYNC_INTERVAL_HOURS} hours\n`)
  
  while (true) {
    try {
      await main()
      
      const nextSync = new Date(Date.now() + intervalMs)
      console.log(`\n⏰ Next sync at: ${nextSync.toLocaleString()}`)
      console.log(`💤 Sleeping for ${SYNC_INTERVAL_HOURS} hours...\n`)
      console.log('─'.repeat(80) + '\n')
      
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    } catch (error) {
      console.error('\n❌ Sync failed:', error.message)
      console.log('⏰ Retrying in 1 hour...\n')
      await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000))
    }
  }
}

/**
 * Run on cron schedule
 */
async function runOnSchedule() {
  const cron = await import('node-cron')
  
  console.log(`⏰ Cron mode enabled - schedule: ${CRON_SCHEDULE}`)
  console.log(`📅 Example: "0 6 * * *" = Every day at 6:00 AM\n`)
  
  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`❌ Invalid cron schedule: ${CRON_SCHEDULE}`)
    console.error('Example formats:')
    console.error('  "0 6 * * *"   - Every day at 6:00 AM')
    console.error('  "0 */6 * * *" - Every 6 hours')
    console.error('  "0 0 * * *"   - Every day at midnight')
    process.exit(1)
  }
  
  // Schedule the task
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`⏰ Cron triggered at: ${new Date().toLocaleString()}`)
    console.log('='.repeat(80) + '\n')
    
    try {
      await main()
    } catch (error) {
      console.error('\n❌ Sync failed:', error.message)
    }
  })
  
  console.log('✅ Cron scheduler started - waiting for scheduled time...\n')
  
  // Keep process alive
  await new Promise(() => {}) // Never resolves
}

// Start the connector
if (CRON_SCHEDULE) {
  // Use cron schedule (e.g., "0 6 * * *" for 6 AM daily)
  runOnSchedule()
} else if (RUN_CONTINUOUSLY) {
  // Use interval-based scheduling
  runContinuously()
} else {
  // Run once and exit (for manual/cron execution)
  main()
}
