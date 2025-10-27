# How LazyJobs Works

## Overview
Tinder for jobs. Swipe right to apply, left to skip. AI matches your CV to relevant jobs.

## User Flow

1. **Sign up** → Email/password
2. **Upload CV** → Parsed by n8n webhook (GPT-4o-mini)
3. **Set preferences** → Location, salary, remote
4. **Swipe jobs** → AI-ranked by match score
5. **View matches** → See your liked jobs

## Architecture

```
User → React App → Supabase → Edge Functions → n8n Webhooks
                      ↓
                  PostgreSQL
```

### Components

**Frontend** (`src/`)
- React + Vite + TailwindCSS
- Framer Motion for swipe animations
- Supabase Auth + Database client

**Backend** (`supabase/functions/`)
- `match-jobs` - Calculate match scores (skills, salary, location, remote)
- `ingest-jobs` - Receive jobs from connectors
- `parse-cv` - Trigger n8n to parse uploaded CVs

**Job Connectors** (`connectors/`)
- `arbetsformedlingen` - Swedish job board scraper
- Runs on cron (daily)
- Enriches jobs with AI-extracted skills

**AI Services** (n8n)
- CV parser - Extract skills, experience, education
- Job enricher - Extract missing skills from descriptions

## Data Flow

### 1. Job Ingestion
```
Arbetsförmedlingen API
  → Connector fetches 100 jobs
  → n8n enriches with GPT (extract skills)
  → Saved to jobs table
```

### 2. User Onboarding
```
User uploads CV
  → n8n parses with GPT
  → Saved to profiles.cv_data
  → match-jobs calculates scores
  → Jobs ranked by match_score
```

### 3. Swiping
```
User swipes right/left
  → Saved to swipes table
  → If right: Create match record
  → Next job shown
```

## Match Algorithm

**Score = 50% skills + 20% salary + 15% location + 15% remote**

- **Skills:** Keyword overlap between CV and job
- **Salary:** Job salary ≥ user minimum
- **Location:** City/region match
- **Remote:** Preference match

Jobs with <50% match are filtered out by default (adjustable slider).

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Framer Motion
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth
- **AI:** OpenAI GPT-4o-mini via n8n
- **Deployment:** Vercel (frontend), Supabase (backend), Easypanel (connectors)

## Key Features

✅ Swipe interface (mobile-optimized)  
✅ AI CV parsing  
✅ AI job enrichment  
✅ Match score breakdown  
✅ Adjustable match threshold  
✅ Undo swipes  
✅ View all matches  

## Cost

- **GPT-4o-mini:** ~$0.01 per user onboarding
- **Job enrichment:** ~$0.01 per 100 jobs
- **Supabase:** Free tier (up to 500MB DB)
- **Vercel:** Free tier
- **Total:** ~$5/month for 500 users

## Development

```bash
# Frontend
npm install
npm run dev

# Edge functions
npx supabase functions serve

# Connectors
cd connectors/arbetsformedlingen
npm install
npm start
```

## Metrics

Track in `METRICS_BASELINE.md`:
- Match quality (% good matches)
- User engagement (swipe rate)
- Job data quality (avg skills per job)
