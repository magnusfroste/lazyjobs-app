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

// Version tracking for deployment verification
const VERSION = '2025-11-17T08:00:00Z' // Updated to filter by is_active
const DEPLOYED_AT = new Date().toISOString() // Auto-captured on container start

// Configuration
const OPENJOBS_API_URL = process.env.OPENJOBS_API_URL || 'http://localhost:8080'
const INGEST_URL = process.env.INGEST_URL
const CONNECTOR_API_KEY = process.env.CONNECTOR_API_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ENABLE_ENRICHMENT = process.env.ENABLE_ENRICHMENT !== 'false'
const ENRICHMENT_URL = process.env.ENRICHMENT_URL

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
async function fetchOpenJobs(limit = 100, offset = 0, retries = 3, lastSync) {
  console.log(`🌐 Fetching jobs from OpenJobs (limit: ${limit}, offset: ${offset})...`)
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use created_after for incremental sync - only fetch jobs added to OpenJobs since last sync!
      const url = `${OPENJOBS_API_URL}/jobs?created_after=${lastSync}&is_active=true&limit=${limit}&offset=${offset}`
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout (increased for large datasets)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        // Try to get error body for more details
        let errorBody = ''
        try {
          errorBody = await response.text()
        } catch (e) {
          errorBody = 'Could not read error body'
        }
        console.error(`❌ API Error Details:`)
        console.error(`   URL: ${url}`)
        console.error(`   Status: ${response.status} ${response.statusText}`)
        console.error(`   Body: ${errorBody.substring(0, 500)}`)
        throw new Error(`OpenJobs API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        console.error(`❌ API returned success=false:`, data)
        throw new Error(`OpenJobs API returned error: ${data.message}`)
      }
      
      const jobs = data.data || []
      console.log(`✅ Fetched ${jobs.length} jobs from OpenJobs`)
      
      return jobs
    } catch (error) {
      // Log detailed error info
      if (error.name === 'AbortError') {
        console.error(`⏱️  Request timeout after 60 seconds`)
      }
      
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff, max 10s
        console.warn(`⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`)
        console.warn(`   Error type: ${error.name}`)
        console.log(`⏳ Retrying in ${waitTime/1000}s...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else {
        console.error('❌ Error fetching from OpenJobs:', error.message)
        console.error('   Error type:', error.name)
        console.error('   Stack:', error.stack)
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
  // Validate required fields
  if (!openJob.id || !openJob.title) {
    console.warn(`⚠️  Skipping job with missing required fields:`, {
      id: openJob.id,
      title: openJob.title,
      company: openJob.company
    })
    return null
  }
  
  const salary = parseSalary(openJob.salary)
  const isRemote = isRemoteJob(openJob)
  
  // Extract URL from fields or construct default
  const url = openJob.fields?.source_url || 
              openJob.fields?.url || 
              openJob.url ||
              `${OPENJOBS_API_URL}/jobs/${openJob.id}`
  
  // OpenJobs is the SOURCE OF TRUTH for requirements
  // ALL plugins now populate requirements[] array (structured or keyword extraction)
  // No need to extract from fields - that would create duplicates!
  const skills = [
    ...(openJob.requirements || [])
  ]
  
  // Deduplicate and clean (in case of any duplicates from OpenJobs)
  const uniqueSkills = [...new Set(skills.filter(s => s && s.trim()))]
  
  // Use is_active from OpenJobs API (OpenJobs filters by is_active=true)
  // Fallback to true if not provided (shouldn't happen with updated OpenJobs)
  const isActive = openJob.is_active !== undefined ? openJob.is_active : true
  
  return {
    external_id: openJob.id,  // Use original OpenJobs ID (no prefix needed)
    title: openJob.title || 'Untitled Position',
    company: openJob.company || 'Company Not Specified',
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
 * Get last sync timestamp from Supabase connector_sync_history table
 * Reads the most recent sync record for this connector
 */
async function getLastSyncTime() {
  try {
    const supabaseUrl = INGEST_URL.split('/functions/')[0] // Extract base Supabase URL
    const response = await fetch(`${supabaseUrl}/rest/v1/connector_sync_history?connector_name=eq.openjobs&select=sync_time&order=sync_time.desc&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch connector sync history: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data && data.length > 0 && data[0].sync_time) {
      console.log(`📊 Retrieved last sync time from database: ${data[0].sync_time}`)
      return data[0].sync_time
    }
    
    // Default to 7 days ago if no history exists
    const defaultTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    console.warn(`⚠️  No previous sync history found in database, using default: ${defaultTime}`)
    return defaultTime
  } catch (error) {
    // If query fails, default to 7 days ago
    const defaultTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    console.warn(`⚠️  Failed to get sync history from database: ${error.message}`)
    console.warn(`   Using default: ${defaultTime}`)
    return defaultTime
  }
}

/**
 * Save sync record to Supabase connector_sync_history table
 * Simple REST POST - appends a new row for each sync
 */
async function saveLastSyncTime(timestamp, stats = {}) {
  try {
    const supabaseUrl = INGEST_URL.split('/functions/')[0] // Extract base Supabase URL
    const response = await fetch(`${supabaseUrl}/rest/v1/connector_sync_history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal' // Don't return the inserted row
      },
      body: JSON.stringify({
        connector_name: 'openjobs',
        sync_time: timestamp,
        success: stats.success !== false,
        jobs_fetched: stats.jobs_fetched || 0,
        jobs_ingested: stats.jobs_ingested || 0,
        error_message: stats.error_message || null,
        metadata: stats.metadata || null
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to save sync history: ${response.status} - ${errorText}`)
    }
    
    console.log(`💾 Saved sync record to database: ${timestamp}`)
    if (stats.jobs_fetched) console.log(`   Jobs fetched: ${stats.jobs_fetched}`)
    if (stats.jobs_ingested) console.log(`   Jobs ingested: ${stats.jobs_ingested}`)
  } catch (error) {
    console.error('❌ Failed to save sync history to database:', error.message)
    // Don't throw - we don't want to fail the whole sync just because history save failed
  }
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
    // Prepare jobs for N8N - ensure each has an 'id' field for matching
    const jobsForEnrichment = jobs.map(job => ({
      ...job,
      id: job.external_id  // N8N expects 'id' field
    }))
    
    const response = await fetch(ENRICHMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobs: jobsForEnrichment })
    })
    
    if (!response.ok) {
      console.warn(`⚠️  Enrichment API returned ${response.status}, continuing with original jobs`)
      return jobs
    }
    
    const result = await response.json()
    
    // Handle different response formats
    let enrichmentResponse
    if (Array.isArray(result)) {
      enrichmentResponse = result
    } else if (result.jobs) {
      enrichmentResponse = result.jobs
    } else if (result.data) {
      enrichmentResponse = result.data
    } else if (result.enriched_jobs) {
      // N8N format: { enriched_jobs: [...] }
      enrichmentResponse = result.enriched_jobs
    } else {
      console.warn('⚠️  Unexpected enrichment response format, using original jobs')
      console.log('   Response:', JSON.stringify(result).slice(0, 200))
      return jobs
    }

    // Create a map of enriched data by job ID for safe matching
    const enrichmentMap = new Map()
    enrichmentResponse.forEach(enrichedData => {
      if (enrichedData.id) {
        enrichmentMap.set(enrichedData.id, enrichedData)
      }
    })

    // ONLY extract and add skills - NEVER replace any other fields!
    const enrichedJobs = jobs.map((originalJob) => {
      // Try to find enrichment by ID, fallback to empty object
      const enrichedData = enrichmentMap.get(originalJob.external_id) || {}

      // Combine all skill types from AI enrichment
      let aiExtractedSkills = []

      if (enrichedData.extracted_skills && Array.isArray(enrichedData.extracted_skills)) {
        aiExtractedSkills.push(...enrichedData.extracted_skills)
      }

      if (enrichedData.extracted_tools && Array.isArray(enrichedData.extracted_tools)) {
        aiExtractedSkills.push(...enrichedData.extracted_tools)
      }

      if (enrichedData.soft_skills && Array.isArray(enrichedData.soft_skills)) {
        aiExtractedSkills.push(...enrichedData.soft_skills)
      }

      if (enrichedData.extracted_languages && Array.isArray(enrichedData.extracted_languages)) {
        aiExtractedSkills.push(...enrichedData.extracted_languages)
      }

      // Combine original skills + AI extracted skills
      const combinedSkills = [
        ...(originalJob.required_skills || []),
        ...aiExtractedSkills
      ]

      // Remove duplicates and clean
      const uniqueSkills = [...new Set(combinedSkills.filter(skill => 
        skill && typeof skill === 'string' && skill.trim()
      ))]

      // Return original job with ONLY skills updated
      return {
        ...originalJob,
        required_skills: uniqueSkills
      }
    })
    
    console.log(`✅ AI enrichment complete (${enrichedJobs.length} jobs)`)
    
    // Show sample enrichment
    const sampleJob = enrichedJobs[0]
    if (sampleJob?.required_skills?.length > 0) {
      console.log(`   Sample skills: ${sampleJob.required_skills.slice(0, 5).join(', ')}...`)
    }
    
    return enrichedJobs
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
  
  // Log sample job for debugging
  if (jobs.length > 0) {
    const sample = jobs[0]
    console.log(`   Sample job:`, {
      external_id: sample.external_id,
      title: sample.title,
      company: sample.company,
      skills_count: sample.required_skills?.length || 0
    })
  }
  
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
  console.log('✅ Ingestion complete:', JSON.stringify(result, null, 2))
  
  // Log detailed results
  if (result.inserted || result.new) {
    console.log(`   ✨ Inserted: ${result.inserted || result.new || 0} jobs`)
  }
  if (result.updated) {
    console.log(`   🔄 Updated: ${result.updated} jobs`)
  }
  if (result.skipped) {
    console.log(`   ⏭️  Skipped: ${result.skipped} jobs`)
  }
  if (result.errors && result.errors.length > 0) {
    console.log(`   ⚠️  Errors: ${result.errors.length}`)
    console.log(`   First error:`, result.errors[0])
  }
  
  return result
}

/**
 * Check which job IDs already exist in LazyJobs
 * Queries the database to avoid re-processing existing jobs
 */
async function getExistingJobIds(externalIds) {
  if (!externalIds || externalIds.length === 0) return []
  
  try {
    const checkExistingUrl = INGEST_URL.replace('ingest-jobs', 'check-existing-jobs')
    console.log(`   Calling edge function: ${checkExistingUrl}`)
    
    const response = await fetch(checkExistingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ external_ids: externalIds })
    })
    
    if (!response.ok) {
      console.warn('⚠️  Edge function returned non-OK status:', response.status)
      const errorText = await response.text()
      console.warn('   Response:', errorText)
      return []
    }
    
    const { existing_ids, error } = await response.json()
    
    if (error) {
      console.warn('⚠️  Edge function returned error:', error)
      return []
    }
    
    return existing_ids || []
  } catch (error) {
    console.warn('⚠️  Could not check existing jobs, will rely on database deduplication')
    console.warn('   Error:', error.message)
    console.warn('   Stack:', error.stack)
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
    console.log('='.repeat(80))
    console.log(`⏰ OpenJobs Connector v${VERSION}`)
    console.log(`🚀 Started at: ${DEPLOYED_AT}`)
    console.log('='.repeat(80))
    console.log('\n📍 Configuration:')
    console.log(`   OpenJobs API: ${OPENJOBS_API_URL}`)
    console.log(`   LazyJobs Ingest: ${INGEST_URL}`)
    console.log(`   AI Enrichment: ${ENABLE_ENRICHMENT ? 'Enabled' : 'Disabled'}`)
    console.log(`   Batch Size: ${BATCH_SIZE}`)
    console.log(`   Sync Interval: ${SYNC_INTERVAL_HOURS} hours`)
    console.log()
    
    // Health check OpenJobs API
    console.log('🏥 Checking OpenJobs API health...')
    try {
      const healthResponse = await fetch(`${OPENJOBS_API_URL}/health`, {
        headers: { 'Accept': 'application/json' }
      })
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        console.log(`✅ OpenJobs API is healthy (status: ${healthData.data?.status})`)
      } else {
        console.warn(`⚠️  OpenJobs API health check returned: ${healthResponse.status}`)
      }
    } catch (error) {
      console.error(`❌ OpenJobs API health check failed: ${error.message}`)
      throw new Error('Cannot connect to OpenJobs API')
    }
    
    // Get last sync time for incremental sync
    const lastSync = await getLastSyncTime()
    console.log(`📅 Last sync: ${lastSync}`)
    
    // Fetch ONLY NEW jobs from OpenJobs (using created_after filter)
    console.log(`🌐 Fetching jobs created after ${lastSync}...`)
    const allJobs = await fetchOpenJobs(500, 0, 3, lastSync) // Fetch up to 500 new jobs
    
    if (allJobs.length === 0) {
      console.log('\n✅ No new jobs from OpenJobs since last sync')
      return
    }
    
    console.log(`📥 Fetched ${allJobs.length} new jobs from OpenJobs`)
    
    // Filter to only new jobs (not already in LazyJobs)
    const newJobs = await filterNewJobs(allJobs)
    
    if (newJobs.length === 0) {
      console.log('\n✅ No new jobs to process - all jobs already exist in LazyJobs')
      return
    }
    
    console.log(`\n📦 Processing ${newJobs.length} new jobs...`)
    
    // Transform to LazyJobs format (filter out nulls from failed transforms)
    const transformedJobs = newJobs.map(transformJob).filter(job => job !== null)
    console.log(`🔄 Transformed ${transformedJobs.length} jobs`)
    
    if (transformedJobs.length === 0) {
      console.log('\n⚠️  No valid jobs after transformation')
      return
    }
    
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

    console.log('\n🎉 Success!')
    console.log(`📊 Processed: ${totalProcessed} jobs in ${totalBatches} batches`)
    console.log(`✨ New: ${totalInserted} jobs`)
    console.log(`🔄 Updated: ${totalUpdated} jobs`)
    console.log(`⏭️  Skipped: ${totalSkipped} jobs`)
    
    // Save last sync time and stats for next incremental sync
    await saveLastSyncTime(new Date().toISOString(), {
      success: true,
      jobs_fetched: allJobs.length,
      jobs_ingested: totalInserted,
      metadata: {
        processed: totalProcessed,
        updated: totalUpdated,
        skipped: totalSkipped,
        batches: totalBatches
      }
    })
    
  } catch (error) {
    console.error('\n💥 Error:', error.message)
    console.error(error.stack)
    
    // Save error state
    await saveLastSyncTime(new Date().toISOString(), {
      success: false,
      error_message: error.message,
      metadata: {
        error_stack: error.stack?.substring(0, 500) // Truncate stack trace
      }
    })
    
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
    console.log(`⏰ Cron triggered at: ${new Date().toLocaleString()} (v${VERSION})`)
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
