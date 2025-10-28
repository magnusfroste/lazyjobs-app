# LazyJobs Deployment Guide

## 🏗️ Architecture Overview

LazyJobs uses a **3-server architecture** for separation of concerns:

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   GitHub    │────▶│   Vercel     │     │   Easypanel    │
│  (Source)   │     │  (Frontend)  │     │  (Connector)   │
└─────────────┘     └──────┬───────┘     └────────┬───────┘
                           │                      │
                           │                      │
                           ▼                      ▼
                    ┌──────────────────────────────┐
                    │        Supabase              │
                    │  (Backend + Edge Functions)  │
                    └──────────────────────────────┘
```

### Components

1. **Vercel** - Frontend hosting
   - Hosts the React/Vite SPA
   - Auto-deploys from GitHub commits
   - Serves static assets with caching
   - SPA routing configured for client-side navigation

2. **Supabase** - Backend infrastructure
   - PostgreSQL database
   - Authentication
   - Edge functions (auto-deployed):
     - `ingest-jobs` - Receives jobs from connector
     - `match-jobs` - Matches jobs to user profiles
     - `generate-application` - AI-powered application generation

3. **Easypanel** - Data pipeline
   - Runs OpenJobs connector as Docker container
   - Fetches jobs from multiple sources
   - Enriches with AI (via n8n)
   - Stores embeddings in Qdrant
   - Calls Supabase `ingest-jobs` edge function

---

## 🚀 Deployment Instructions

### Frontend (Vercel)

**Initial Setup:**
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically triggers on push to main branch

**Environment Variables (Vercel Dashboard):**
```
# Supabase (required)
VITE_SUPABASE_URL=https://arqugyvmegxonaerjbzd.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Sentry error tracking
VITE_SENTRY_DSN=https://your-sentry-dsn
```

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node Version: 18.x or later

**Deploy:**
```bash
git push origin main  # Auto-deploys to Vercel
```

### Backend (Supabase)

**Edge Functions:**
Edge functions are auto-deployed when you push to GitHub. They're located in `supabase/functions/`.

**Database Migrations:**
Migrations are applied automatically. See `supabase/migrations/` for schema changes.

### Connector (Easypanel)

**Not deployed with Vercel!** The connector code in `connectors/openjobs/` is kept in the repo for version control but runs separately.

**Deployment:**
1. Build Docker image from `connectors/openjobs/Dockerfile`
2. Deploy to Easypanel or any Docker host
3. Set environment variables (see `connectors/openjobs/.env.example`)
4. Run as cron job or continuous service

See [`docs/setup/OPENJOBS_INTEGRATION.md`](docs/setup/OPENJOBS_INTEGRATION.md) for details.

---

## 🔧 Configuration Files

### `vercel.json`
- SPA routing configuration
- Security headers (X-Frame-Options, CSP, etc.)
- Cache headers for static assets

### `.vercelignore`
Excludes unnecessary files from Vercel deployment:
- Documentation (`docs/`, `*.md`)
- Reference code (`ref/`)
- Connector code (`connectors/`)
- Test files

---

## ✅ Verification Steps

After deploying, verify:

1. **Frontend loads correctly**
   - Visit your Vercel URL
   - Check all routes work (e.g., `/swipe`, `/profile`)
   - Refresh page on different routes (should not 404)

2. **Authentication works**
   - Sign up/login flow
   - Protected routes redirect correctly

3. **Jobs display**
   - Jobs load on swipe page
   - Matching works
   - Application generation works

4. **Console errors**
   - Open browser DevTools
   - Check for errors in Console tab
   - Verify API calls succeed in Network tab

5. **Static assets cached**
   - Check Network tab in DevTools
   - Assets should have `Cache-Control: max-age=31536000` header

---

## 🐛 Troubleshooting

### 404 on page refresh
**Problem:** Refreshing `/swipe` returns 404  
**Solution:** Ensure `vercel.json` has rewrite rules for SPA routing

### Environment variables not working
**Problem:** App can't connect to Supabase  
**Solution:** 
- Check environment variables in Vercel dashboard
- Redeploy after adding/changing env vars
- Ensure variables start with `VITE_` prefix

### Build fails
**Problem:** Vercel build fails  
**Solution:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to test

### Connector not fetching jobs
**Problem:** No new jobs appearing  
**Solution:**
- Connector runs separately on Easypanel (not Vercel!)
- Check Easypanel logs
- Verify connector environment variables
- See [`connectors/README.md`](connectors/README.md)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenJobs Integration](docs/setup/OPENJOBS_INTEGRATION.md)
- [Connector Architecture](connectors/README.md)
