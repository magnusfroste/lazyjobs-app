/**
 * Simple Job Connector Example
 * 
 * This example shows how to create a basic connector that fetches jobs
 * from a hypothetical API and submits them to JobMatch.
 */

const JOBMATCH_API = 'https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs'
const CONNECTOR_API_KEY = process.env.CONNECTOR_API_KEY || 'your_api_key_here'

/**
 * Submit jobs to JobMatch platform
 */
async function submitJobs(jobs) {
  try {
    const response = await fetch(JOBMATCH_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONNECTOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobs })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const result = await response.json()
    console.log('✅ Jobs submitted successfully:', result)
    return result
  } catch (error) {
    console.error('❌ Failed to submit jobs:', error.message)
    throw error
  }
}

/**
 * Fetch jobs from your source (example)
 */
async function fetchJobsFromSource() {
  // This is where you'd fetch from your actual source
  // Examples: API call, web scraping, RSS feed, etc.
  
  // Mock data for demonstration
  return [
    {
      id: 'job_001',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp',
      description: 'We are looking for an experienced full stack developer to join our team...',
      location: 'San Francisco, CA',
      salary: { min: 120000, max: 180000 },
      remote: true,
      type: 'full-time',
      skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      level: 'senior',
      url: 'https://example.com/jobs/001',
      postedDate: new Date().toISOString()
    },
    {
      id: 'job_002',
      title: 'Frontend Engineer',
      company: 'StartupXYZ',
      description: 'Join our fast-growing startup as a frontend engineer...',
      location: 'Remote',
      salary: { min: 90000, max: 130000 },
      remote: true,
      type: 'full-time',
      skills: ['Vue.js', 'JavaScript', 'CSS', 'Tailwind'],
      level: 'mid',
      url: 'https://example.com/jobs/002',
      postedDate: new Date().toISOString()
    }
  ]
}

/**
 * Transform source jobs to JobMatch format
 */
function transformJobs(sourceJobs) {
  return sourceJobs.map(job => ({
    external_id: `example_${job.id}`,
    title: job.title,
    company: job.company,
    description: job.description,
    location: job.location,
    salary_min: job.salary?.min,
    salary_max: job.salary?.max,
    salary_currency: 'USD',
    is_remote: job.remote,
    employment_type: job.type,
    required_skills: job.skills,
    experience_level: job.level,
    url: job.url,
    posted_at: job.postedDate,
    metadata: {
      source: 'example_connector',
      original_id: job.id
    }
  }))
}

/**
 * Main connector function
 */
async function runConnector() {
  console.log('🚀 Starting job connector...')
  
  try {
    // 1. Fetch jobs from source
    console.log('📥 Fetching jobs from source...')
    const sourceJobs = await fetchJobsFromSource()
    console.log(`Found ${sourceJobs.length} jobs`)

    // 2. Transform to JobMatch format
    console.log('🔄 Transforming jobs...')
    const transformedJobs = transformJobs(sourceJobs)

    // 3. Submit to JobMatch
    console.log('📤 Submitting jobs to JobMatch...')
    const result = await submitJobs(transformedJobs)

    console.log('✨ Connector completed successfully!')
    return result
  } catch (error) {
    console.error('💥 Connector failed:', error)
    throw error
  }
}

// Run the connector
if (import.meta.url === `file://${process.argv[1]}`) {
  runConnector()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { runConnector, submitJobs, transformJobs }
