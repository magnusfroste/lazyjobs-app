# Continuous Operation Mode

The OpenJobs connector now runs continuously inside the Docker container with configurable sync intervals.

## 🔧 Configuration

### Environment Variables

```bash
# Enable continuous mode (default: true)
RUN_CONTINUOUSLY=true

# Sync interval in hours (default: 6)
SYNC_INTERVAL_HOURS=6
```

## ⏰ Sync Interval Options

| Interval | Use Case |
|----------|----------|
| `1` | Hourly - For high-frequency updates |
| `6` | Every 6 hours - **Recommended default** |
| `12` | Twice daily - Moderate frequency |
| `24` | Daily - Low frequency |

## 🚀 How It Works

1. **Container starts** → Runs first sync immediately
2. **Checks LazyJobs database** → Identifies new jobs only
3. **Processes new jobs** → Enriches and ingests
4. **Sleeps** → Waits for configured interval
5. **Repeats** → Loops forever

## 📊 Example Output

```
🔄 Continuous mode enabled - syncing every 6 hours

🚀 OpenJobs Connector Starting...
✅ Found 243 existing jobs, 0 new jobs to process
✅ No new jobs to process - all jobs already exist in LazyJobs

⏰ Next sync at: 10/19/2025, 5:56:00 PM
💤 Sleeping for 6 hours...
────────────────────────────────────────────────────────────────

[6 hours later...]

🚀 OpenJobs Connector Starting...
✅ Found 243 existing jobs, 7 new jobs to process
📦 Processing 7 new jobs...
🤖 Enriching 7 jobs with AI...
✅ Successfully ingested 7 jobs

⏰ Next sync at: 10/19/2025, 11:56:00 PM
💤 Sleeping for 6 hours...
```

## 🐳 Docker Deployment

The container runs continuously - **no external cron needed!**

### Easypanel Setup

1. Create service with Dockerfile
2. Add environment variables:
   ```
   RUN_CONTINUOUSLY=true
   SYNC_INTERVAL_HOURS=6
   ```
3. Deploy - container will run forever

### Docker Compose

```yaml
services:
  openjobs-connector:
    build: .
    environment:
      - RUN_CONTINUOUSLY=true
      - SYNC_INTERVAL_HOURS=6
    restart: unless-stopped
```

## 🔄 Manual/Cron Mode

To run once and exit (for external cron):

```bash
RUN_CONTINUOUSLY=false npm start
```

Then set up external cron:
```bash
0 */6 * * * docker run --env-file .env lazyjobs-openjobs-connector
```

## ⚡ Benefits

✅ **No external cron needed** - Built into container
✅ **Configurable interval** - Adjust via environment variable
✅ **Incremental sync** - Only processes new jobs
✅ **Error recovery** - Retries after 1 hour on failure
✅ **Resource efficient** - Sleeps between syncs

## 🛡️ Error Handling

If sync fails:
- Logs error
- Waits 1 hour
- Retries automatically
- Continues running (doesn't crash)

## 📝 Logs

Monitor container logs to see:
- When syncs run
- How many new jobs found
- Next sync time
- Any errors

```bash
# Easypanel: View logs in UI
# Docker: docker logs -f container-name
```

## 🎯 Production Recommendation

**For Easypanel deployment:**
```bash
RUN_CONTINUOUSLY=true
SYNC_INTERVAL_HOURS=6
```

This gives you:
- Automatic syncing every 6 hours
- No external scheduling needed
- Self-contained container
- Easy to adjust frequency
