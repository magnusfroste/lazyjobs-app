# 🔧 Troubleshooting Guide

## Connector Issues

### Easypanel Cron Status

**Check if cron is running:**
```bash
node scripts/check-jobs.js
```

**Expected output:**
- Last sync < 7 hours ago (cron runs every 6 hours)
- Jobs being added regularly
- Enrichment working (if enabled)

### AI Enrichment Not Working

**Symptoms:**
- Jobs have only 1 skill
- No `ai_enriched` metadata
- Average skills per job = 1.0

**Fix:**

1. **Add environment variables in Easypanel:**
   ```
   ENRICHMENT_URL=https://agent.froste.eu/webhook/enrich-jobs
   ENABLE_ENRICHMENT=true
   ```

2. **Restart container**

3. **Wait for next cron run** (within 6 hours)

4. **Verify:**
   ```bash
   node scripts/check-today-jobs.js
   ```

**Expected after fix:**
- Enriched: 100%
- Avg skills: 5-15 per job
- AI confidence: 0.9-0.95

### Test Enrichment Webhook

```bash
curl -X POST https://agent.froste.eu/webhook/enrich-jobs \
  -H "Content-Type: application/json" \
  -d '{"jobs":[{"id":"test","title":"Developer","description":"React and Node.js","existing_skills":["React"]}]}'
```

Should return enriched skills in ~2 seconds.

### Connector Not Syncing

**Check logs in Easypanel:**
- Look for errors
- Verify API key is set
- Check network connectivity

**Common errors:**

**"CONNECTOR_API_KEY not set"**
- Add environment variable in Easypanel
- Verify .env file (if using docker-compose)

**"Ingest failed: 401"**
- API key is wrong or connector not active
- Check: `SELECT * FROM connectors WHERE api_key = 'your_key';`

**"API error: 429"**
- Rate limited
- Reduce frequency or limit

---

## Database Issues

### No Jobs Showing

**Check jobs exist:**
```sql
SELECT COUNT(*) FROM jobs WHERE is_active = true;
```

**Check RLS policies:**
```sql
SELECT * FROM jobs LIMIT 5;
```

If empty, RLS might be blocking. Check policies in Supabase dashboard.

### Match Scores Not Calculating

**Verify match-jobs function is deployed:**
```bash
supabase functions list
```

**Test function:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/match-jobs \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY"
```

### Demo Account Not Working

**Check user exists:**
```sql
SELECT * FROM auth.users WHERE email = 'demo@lazyjobs.ink';
```

**Check profile:**
```sql
SELECT * FROM profiles WHERE email = 'demo@lazyjobs.ink';
```

**Reset demo:**
```sql
DELETE FROM swipes WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'demo@lazyjobs.ink'
);
```

---

## Frontend Issues

### Jobs Not Loading

**Check browser console** for errors.

**Common issues:**
- Supabase credentials wrong
- RLS policies blocking access
- Network error

**Verify .env:**
```bash
cat .env
```

Should have valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Swipes Not Saving

**Check network tab** - look for failed POST requests.

**Verify RLS policies** allow inserts:
```sql
-- Test insert
INSERT INTO swipes (user_id, job_id, direction)
VALUES (auth.uid(), 'some-job-id', 'right');
```

### PWA Not Installing

**Requirements:**
- HTTPS (localhost or production)
- Valid manifest.json
- Service worker registered

**Check:**
1. Open DevTools → Application → Manifest
2. Verify all fields are valid
3. Check Service Worker is active

---

## Deployment Issues

### Vercel Build Failing

**Check build logs** in Vercel dashboard.

**Common issues:**
- Missing environment variables
- Node version mismatch
- Dependency errors

**Fix:**
```bash
# Test build locally
npm run build

# Check for errors
npm run lint
```

### Edge Functions Not Deploying

**Check Supabase CLI:**
```bash
supabase functions list
```

**Deploy manually:**
```bash
supabase functions deploy ingest-jobs
supabase functions deploy match-jobs
```

**Check logs:**
```bash
supabase functions logs ingest-jobs
```

---

## Performance Issues

### Slow Job Loading

**Check query performance:**
```sql
EXPLAIN ANALYZE
SELECT * FROM jobs
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 20;
```

**Add indexes if needed:**
```sql
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
```

### High API Costs

**Reduce AI calls:**
- Cache enrichment results
- Batch process jobs
- Use cheaper models

**Monitor usage:**
- Check Supabase dashboard
- Review n8n execution logs
- Track API costs

---

## Monitoring

### Check System Health

```bash
# Jobs synced today
node scripts/check-today-jobs.js

# Overall stats
node scripts/check-jobs.js

# Test enrichment
node scripts/test-enrichment.js
```

### Supabase Metrics

Dashboard → Settings → Usage
- Database size
- API requests
- Bandwidth
- Storage

### Connector Logs

**Easypanel:**
- View logs in dashboard
- Check for errors
- Monitor sync frequency

**Docker:**
```bash
docker logs -f arbetsformedlingen-sync
```

---

## Getting Help

1. **Check logs** first (browser console, Supabase, Easypanel)
2. **Search docs** in `/docs` folder
3. **Test components** individually
4. **Check GitHub issues** for similar problems

**Useful commands:**
```bash
# Check all jobs
node scripts/check-jobs.js

# Check today's jobs
node scripts/check-today-jobs.js

# Test enrichment
curl https://agent.froste.eu/webhook/enrich-jobs

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM jobs"
```

---

**Most issues are environment variable or RLS policy related. Check those first!**
