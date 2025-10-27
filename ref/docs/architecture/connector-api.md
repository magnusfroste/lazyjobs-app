# Connector Plugin API Documentation

## Overview

Connectors are plugins that fetch jobs from various sources and POST them to the JobMatch platform. This open architecture allows developers to create connectors for any job board, API, or website.

## Connector Registration

### 1. Register Your Connector

Contact the platform admin or use the registration API to get an API key:

```sql
-- Admin runs this in Supabase
INSERT INTO connectors (name, description, website_url, api_key, developer_email)
VALUES (
  'LinkedIn Jobs Connector',
  'Fetches jobs from LinkedIn API',
  'https://linkedin.com',
  'connector_linkedin_abc123xyz', -- Generate unique key
  'developer@example.com'
);
```

### 2. Get Your API Key

Your unique API key will be used to authenticate job submissions.

## Job Submission API

### Endpoint

```
POST https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs
```

### Headers

```
Authorization: Bearer YOUR_CONNECTOR_API_KEY
Content-Type: application/json
```

### Request Body

```json
{
  "jobs": [
    {
      "external_id": "unique-id-from-source",
      "title": "Senior React Developer",
      "company": "TechCorp Inc.",
      "description": "Full job description...",
      "location": "San Francisco, CA",
      "salary_min": 120000,
      "salary_max": 180000,
      "salary_currency": "USD",
      "is_remote": true,
      "employment_type": "full-time",
      "required_skills": ["React", "TypeScript", "Node.js"],
      "experience_level": "senior",
      "url": "https://source.com/job/123",
      "posted_at": "2025-10-10T12:00:00Z",
      "metadata": {
        "source_specific_field": "value"
      }
    }
  ]
}
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `external_id` | string | Yes | Unique ID from your source (prevents duplicates) |
| `title` | string | Yes | Job title |
| `company` | string | Yes | Company name |
| `description` | string | No | Full job description (markdown supported) |
| `location` | string | No | Job location (city, state/country) |
| `salary_min` | integer | No | Minimum salary (annual) |
| `salary_max` | integer | No | Maximum salary (annual) |
| `salary_currency` | string | No | Currency code (default: USD) |
| `is_remote` | boolean | No | Whether job is remote (default: false) |
| `employment_type` | string | No | full-time, part-time, contract, internship |
| `required_skills` | array | No | Array of skill strings |
| `experience_level` | string | No | junior, mid, senior, lead, executive |
| `url` | string | No | Link to original job posting |
| `posted_at` | timestamp | No | When job was posted (ISO 8601) |
| `metadata` | object | No | Additional connector-specific data |

### Response

**Success (200)**
```json
{
  "success": true,
  "inserted": 5,
  "updated": 2,
  "skipped": 1,
  "message": "Jobs processed successfully"
}
```

**Error (400/401/500)**
```json
{
  "error": "Invalid API key",
  "details": "..."
}
```

## Connector Types & Examples

### 1. API Connector

Fetch jobs from official APIs:

```javascript
// Example: Indeed API Connector
const fetchIndeedJobs = async () => {
  const response = await fetch('https://api.indeed.com/ads/apisearch?...')
  const data = await response.json()
  
  const jobs = data.results.map(job => ({
    external_id: `indeed_${job.jobkey}`,
    title: job.jobtitle,
    company: job.company,
    description: job.snippet,
    location: job.formattedLocation,
    url: job.url,
    posted_at: job.date
  }))
  
  // Submit to JobMatch
  await submitJobs(jobs)
}
```

### 2. Web Scraper

Scrape job listings from websites:

```javascript
// Example: Company Careers Page Scraper
const scrapeCompanyJobs = async () => {
  const html = await fetch('https://company.com/careers').then(r => r.text())
  const $ = cheerio.load(html)
  
  const jobs = []
  $('.job-listing').each((i, el) => {
    jobs.push({
      external_id: `company_${$(el).data('job-id')}`,
      title: $(el).find('.title').text(),
      company: 'Company Name',
      description: $(el).find('.description').text(),
      location: $(el).find('.location').text(),
      url: $(el).find('a').attr('href')
    })
  })
  
  await submitJobs(jobs)
}
```

### 3. RSS/Feed Parser

Parse job feeds:

```javascript
// Example: RSS Feed Connector
const parseJobFeed = async () => {
  const feed = await parser.parseURL('https://jobs.example.com/feed.xml')
  
  const jobs = feed.items.map(item => ({
    external_id: `rss_${item.guid}`,
    title: item.title,
    company: item['company'],
    description: item.contentSnippet,
    url: item.link,
    posted_at: item.pubDate
  }))
  
  await submitJobs(jobs)
}
```

## Best Practices

### 1. Deduplication
- Use unique `external_id` (e.g., `source_originalid`)
- Platform will skip duplicates automatically

### 2. Rate Limiting
- Respect source API rate limits
- Batch jobs (max 100 per request recommended)
- Use exponential backoff on errors

### 3. Data Quality
- Validate data before submission
- Normalize location formats
- Extract skills accurately
- Clean HTML from descriptions

### 4. Scheduling
- Run connectors on schedule (cron jobs)
- Update existing jobs if they change
- Mark jobs as inactive when expired

### 5. Error Handling
```javascript
const submitJobs = async (jobs) => {
  try {
    const response = await fetch(INGEST_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobs })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to submit jobs:', error)
    // Implement retry logic
  }
}
```

## Example Connector (Node.js)

```javascript
// linkedin-connector.js
import fetch from 'node-fetch'

const JOBMATCH_API = 'https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs'
const CONNECTOR_API_KEY = process.env.CONNECTOR_API_KEY

async function fetchLinkedInJobs() {
  // Fetch from LinkedIn API (pseudo-code)
  const linkedinJobs = await getLinkedInJobs()
  
  // Transform to JobMatch format
  const jobs = linkedinJobs.map(job => ({
    external_id: `linkedin_${job.id}`,
    title: job.title,
    company: job.companyName,
    description: job.description,
    location: job.location,
    salary_min: job.salaryRange?.min,
    salary_max: job.salaryRange?.max,
    is_remote: job.workplaceType === 'REMOTE',
    employment_type: job.employmentType.toLowerCase(),
    required_skills: job.skills,
    experience_level: mapExperienceLevel(job.seniorityLevel),
    url: job.url,
    posted_at: job.listedAt
  }))
  
  // Submit to JobMatch
  const response = await fetch(JOBMATCH_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONNECTOR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jobs })
  })
  
  const result = await response.json()
  console.log('Submitted:', result)
}

// Run every hour
setInterval(fetchLinkedInJobs, 60 * 60 * 1000)
```

## Testing Your Connector

1. **Register test connector** in Supabase
2. **Submit test job**:
```bash
curl -X POST https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [{
      "external_id": "test_001",
      "title": "Test Job",
      "company": "Test Company",
      "description": "This is a test job",
      "location": "Remote"
    }]
  }'
```
3. **Verify in Supabase**: Check `jobs` table for your submission
4. **Test in app**: Sign in and swipe to see your job

## Connector Marketplace (Coming Soon)

We're building a marketplace where developers can:
- Publish connectors
- Earn revenue from connector usage
- Share with the community

Interested? Email: connectors@jobmatch.example.com

## Support

- GitHub Issues: https://github.com/jobmatch/connectors
- Documentation: https://docs.jobmatch.example.com
- Discord: https://discord.gg/jobmatch
