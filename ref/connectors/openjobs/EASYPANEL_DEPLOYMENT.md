# LazyJobs OpenJobs Connector - Easypanel Deployment

## 📦 Dockerfile Location
`/Users/mafr/Code/LazyJobs/connectors/openjobs/Dockerfile`

## 🔧 Environment Variables for Easypanel

Copy these into your Easypanel service configuration:

```bash
# OpenJobs API
OPENJOBS_API_URL=https://app-openjobs.katsu6.easypanel.host

# LazyJobs Ingest
INGEST_URL=https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs
CONNECTOR_API_KEY=connector_24b8fcfc-c933-42d1-add8-46bbd3f3d464
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycXVneXZtZWd4b25hZXJqYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDQzMTUsImV4cCI6MjA3NTY4MDMxNX0.Giag4p4aIdmJxv4KYybJKby1nhP9VBfz47amTccEb_Q

# AI Enrichment (optional)
ENABLE_ENRICHMENT=true
ENRICHMENT_URL=https://agent.froste.eu/webhook/enrich-jobs

# Qdrant Semantic Search (optional)
ENABLE_QDRANT=true
QDRANT_URL=https://n8n-qdrant.katsu6.easypanel.host
OPENAI_API_KEY=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

# Continuous Operation (for Docker/Easypanel)
RUN_CONTINUOUSLY=true
SYNC_INTERVAL_HOURS=6
```

### Sync Interval Options:
- `SYNC_INTERVAL_HOURS=1` - Every hour (frequent updates)
- `SYNC_INTERVAL_HOURS=6` - Every 6 hours (recommended, default)
- `SYNC_INTERVAL_HOURS=12` - Twice daily
- `SYNC_INTERVAL_HOURS=24` - Once daily

**Note:** Set `RUN_CONTINUOUSLY=false` if you want to run manually or with external cron

## 🚀 Easypanel Setup Steps

### 1. Create New Service
1. Go to your Easypanel project
2. Click **"Create Service"**
3. Choose **"From Source"** or **"Docker Image"**

### 2. Configure Source (if using Git)
- **Repository:** Your LazyJobs repo
- **Branch:** main
- **Dockerfile Path:** `connectors/openjobs/Dockerfile`
- **Build Context:** `connectors/openjobs`

### 3. Or Build & Push Image First
```bash
cd /Users/mafr/Code/LazyJobs/connectors/openjobs

# Build
docker build -t lazyjobs-openjobs-connector:latest .

# Tag for your registry
docker tag lazyjobs-openjobs-connector:latest registry.easypanel.host/lazyjobs-openjobs-connector:latest

# Push
docker push registry.easypanel.host/lazyjobs-openjobs-connector:latest
```

### 4. Service Configuration
- **Name:** `lazyjobs-openjobs-connector`
- **Type:** Worker (not web service - no port needed)
- **Restart Policy:** Always
- **Environment Variables:** (paste from above)

### 5. Schedule (Choose One)

#### Option A: Cron Job in Easypanel
Set up a cron schedule in Easypanel:
- **Schedule:** `0 */6 * * *` (every 6 hours)
- **Command:** `node fetch-jobs.js`

#### Option B: Internal Loop (Recommended)
The connector will run continuously with internal scheduling.
No cron needed - just deploy and it runs every 6 hours automatically.

## 📊 Monitoring

### Check Logs
In Easypanel, view service logs to see:
```
🚀 OpenJobs Connector Starting...
🌐 Fetching jobs from OpenJobs (limit: 100, offset: 0)...
✅ Fetched 100 jobs from OpenJobs
🤖 Enriching 100 jobs with AI...
✅ AI enrichment complete
🔍 Adding 100 jobs to Qdrant...
✅ Qdrant integration complete
📤 Ingesting 100 jobs to LazyJobs...
✅ Successfully ingested 100 jobs
🎉 Job sync complete!
```

### Health Check
The connector runs once and exits. For continuous operation, modify `fetch-jobs.js` to loop.

## 🔄 Continuous Operation (Optional)

To make it run continuously instead of once:

Add to the end of `fetch-jobs.js`:
```javascript
// Run every 6 hours
const SYNC_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

async function runContinuously() {
  while (true) {
    try {
      console.log('🔄 Starting scheduled sync...');
      await main();
      console.log(`⏰ Next sync in 6 hours...`);
      await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL));
    } catch (error) {
      console.error('❌ Sync failed:', error);
      console.log('⏰ Retrying in 1 hour...');
      await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
    }
  }
}

// Start continuous operation
runContinuously();
```

## 🧪 Test Locally First

```bash
cd /Users/mafr/Code/LazyJobs/connectors/openjobs

# Build
docker build -t lazyjobs-openjobs-connector:latest .

# Run with env file
docker run --env-file .env lazyjobs-openjobs-connector:latest

# Or run with inline env vars
docker run \
  -e OPENJOBS_API_URL=https://app-openjobs.katsu6.easypanel.host \
  -e INGEST_URL=https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs \
  -e CONNECTOR_API_KEY=connector_24b8fcfc-c933-42d1-add8-46bbd3f3d464 \
  lazyjobs-openjobs-connector:latest
```

## ✅ Deployment Checklist

- [ ] Dockerfile created in `connectors/openjobs/`
- [ ] .dockerignore created
- [ ] Environment variables prepared
- [ ] Tested locally with Docker
- [ ] Created service in Easypanel
- [ ] Added environment variables in Easypanel
- [ ] Deployed and verified logs
- [ ] Jobs appearing in LazyJobs database

## 🎯 Expected Behavior

1. Container starts
2. Fetches jobs from OpenJobs API
3. Enriches with AI (if enabled)
4. Adds to Qdrant (if enabled)
5. Pushes to LazyJobs Supabase
6. Exits (or loops if continuous mode)

## 🐛 Troubleshooting

### No jobs syncing
- Check OpenJobs API is accessible
- Verify CONNECTOR_API_KEY is correct
- Check Supabase edge function logs

### Enrichment failing
- Verify ENRICHMENT_URL is accessible
- Check n8n webhook is active
- Disable enrichment temporarily: `ENABLE_ENRICHMENT=false`

### Qdrant errors
- Verify QDRANT_URL is accessible
- Check OPENAI_API_KEY is valid
- Disable Qdrant temporarily: `ENABLE_QDRANT=false`

## 📝 Notes

- The connector is stateless - can be restarted anytime
- Duplicate jobs are handled by LazyJobs (external_id unique constraint)
- Sync frequency can be adjusted by changing schedule or loop interval
- Each sync fetches up to 100 jobs (configurable in code)
