# LazyJobs Data Connectors

> ⚠️ **IMPORTANT:** The connector code in this directory is **NOT deployed to Vercel**. It runs as a separate Docker container on Easypanel and is kept here for version control and documentation.

This directory contains data pipeline connectors that fetch jobs from external sources and ingest them into LazyJobs.

## Architecture Overview

```
External Sources (OpenJobs) → Connector → AI Enrichment → Supabase → LazyJobs Frontend
```

## Active Connectors

### OpenJobs Connector
**Location:** `connectors/openjobs/`  
**Status:** ✅ Active  
**Sources:** Arbetsförmedlingen, EURES/Adzuna, Remotive, RemoteOK

The OpenJobs connector is the primary data pipeline for LazyJobs. It:
- Fetches jobs from the centralized OpenJobs aggregation platform
- Transforms job data to LazyJobs format
- Enriches jobs with AI-powered skills extraction
- Stores embeddings in Qdrant for semantic search
- Ingests jobs into Supabase via the `ingest-jobs` edge function

**Key Features:**
- ✅ Multi-source aggregation (4 job sources)
- ✅ Batch processing for efficiency
- ✅ AI enrichment integration
- ✅ Qdrant semantic search support
- ✅ Retry logic and error handling
- ✅ Continuous or cron-based operation

See [`openjobs/README.md`](openjobs/README.md) for detailed documentation.

## Data Flow

### 1. External Sources
OpenJobs platform aggregates jobs from:
- **Arbetsförmedlingen** (Swedish Public Employment Service)
- **EURES/Adzuna** (European Job Portal)
- **Remotive** (Remote Jobs Platform)
- **RemoteOK** (Remote Tech Jobs)

### 2. Connector (This Directory)
The connector:
1. Fetches jobs from OpenJobs API
2. Filters new jobs (checks against existing)
3. Transforms to LazyJobs format
4. Enriches with AI (skills extraction)
5. Stores embeddings in Qdrant
6. Ingests to Supabase

### 3. Supabase Edge Functions
**Ingest Endpoint:** `supabase/functions/ingest-jobs/`
- Validates API key
- Upserts jobs to database
- Handles duplicates via `external_id`

### 4. Frontend
React app displays jobs to users with:
- Swipe interface
- AI-powered matching
- Semantic search
- Application assistant

## Environment Variables

Each connector requires configuration via `.env`:

```bash
# OpenJobs API
OPENJOBS_API_URL=https://your-openjobs-instance.com

# LazyJobs Supabase
INGEST_URL=https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs
CONNECTOR_API_KEY=your-connector-api-key
SUPABASE_ANON_KEY=your-anon-key

# Optional: AI Enrichment
ENABLE_ENRICHMENT=true
ENRICHMENT_URL=https://your-n8n-instance.com/webhook/enrich-jobs

# Optional: Qdrant Semantic Search
ENABLE_QDRANT=true
QDRANT_URL=https://your-qdrant-instance.com
OPENAI_API_KEY=sk-...

# Scheduling
RUN_CONTINUOUSLY=true
SYNC_INTERVAL_HOURS=6
# OR
CRON_SCHEDULE=0 7 * * *
```

## Deployment

### Local Development
```bash
cd connectors/openjobs
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Production (Docker/Easypanel)
See [`openjobs/EASYPANEL_DEPLOYMENT.md`](openjobs/EASYPANEL_DEPLOYMENT.md) for deployment guide.

**Easypanel:**
1. Create service from Dockerfile
2. Add environment variables
3. Deploy (runs continuously)

**Manual Cron:**
```bash
0 */6 * * * cd /path/to/connectors/openjobs && npm start
```

## Monitoring

### Check Connector Logs
```bash
# Docker
docker logs -f openjobs-connector

# Easypanel
# View logs in UI
```

### Check Job Sources in Database
```sql
SELECT 
  metadata->>'original_source' as source,
  COUNT(*) as count
FROM jobs
GROUP BY metadata->>'original_source'
ORDER BY count DESC;
```

### Check Recent Jobs
```sql
SELECT 
  title,
  company,
  metadata->>'original_source' as source,
  created_at
FROM jobs
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### No New Jobs
- Check OpenJobs API is accessible
- Verify connector API key is correct
- Check Supabase edge function logs

### Enrichment Failures
- Verify enrichment webhook is accessible
- Check n8n workflow is active
- Temporarily disable: `ENABLE_ENRICHMENT=false`

### Qdrant Errors
- Verify Qdrant instance is accessible
- Check OpenAI API key is valid
- Temporarily disable: `ENABLE_QDRANT=false`

## Documentation

- [`openjobs/README.md`](openjobs/README.md) - Connector documentation
- [`../docs/setup/OPENJOBS_INTEGRATION.md`](../docs/setup/OPENJOBS_INTEGRATION.md) - Integration guide
- [`openjobs/EASYPANEL_DEPLOYMENT.md`](openjobs/EASYPANEL_DEPLOYMENT.md) - Deployment guide
- [`openjobs/CONTINUOUS_MODE.md`](openjobs/CONTINUOUS_MODE.md) - Scheduling guide

## Support

For issues or questions:
1. Check connector logs
2. Check Supabase edge function logs
3. Verify environment variables
4. Review documentation above
