# LazyJobs Project Structure

**Last Updated:** October 16, 2025

## Overview

LazyJobs is a Tinder-style job matching platform with AI-powered enrichment, using OpenJobs as the centralized job aggregation source.

## Directory Structure

```
LazyJobs/
├── src/                          # React 19 Frontend
│   ├── components/               # UI components (swipe, cards, etc.)
│   ├── hooks/                    # Custom React hooks
│   ├── contexts/                 # React contexts (auth, etc.)
│   ├── lib/                      # Utilities and helpers
│   └── assets/                   # Images, icons
│
├── supabase/                     # Backend & Database
│   ├── functions/                # Edge Functions
│   │   └── ingest-jobs/          # Job ingestion endpoint
│   └── migrations/               # Database migrations
│
├── connectors/                   # Job Data Sources
│   └── openjobs/                 # ✅ Primary connector (4 sources)
│       ├── fetch-jobs.js         # Main logic with AI enrichment
│       ├── package.json
│       ├── .env
│       └── README.md
│
├── archive/                      # Legacy Code (Preserved)
│   └── legacy-connectors/
│       ├── arbetsformedlingen/   # Old Swedish jobs connector
│       ├── remoteok/             # Old RemoteOK connector
│       └── README.md             # Why they're archived
│
├── docs/                         # Documentation
│   ├── architecture/             # System design docs
│   ├── deployment/               # Deployment guides
│   ├── getting-started/          # Setup instructions
│   ├── features/                 # Feature documentation
│   └── OPENJOBS_INTEGRATION.md   # Integration guide
│
├── scripts/                      # Utility Scripts
│   ├── check-jobs.js             # Check job sync status
│   ├── check-today-jobs.js       # Verify enrichment
│   └── verify-migration.sql      # Database verification
│
├── public/                       # Static Assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── icons/                    # PWA icons
│
├── examples/                     # Code Examples
│
├── README.md                     # Main documentation
├── CHANGELOG.md                  # Version history
├── TODO.md                       # Task tracking
└── package.json                  # Dependencies
```

## Key Components

### Frontend (`src/`)
- **React 19** with Vite
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Swipe interface** for job matching
- **PWA** support (installable on mobile)

### Backend (`supabase/`)
- **PostgreSQL** database
- **Edge Functions** for serverless logic
- **Row Level Security** (RLS) for data protection
- **Real-time subscriptions** (optional)

### Job Pipeline (`connectors/openjobs/`)
1. Fetch jobs from OpenJobs API
2. Transform to LazyJobs format
3. **AI enrichment** (extract skills, improve descriptions)
4. Ingest to Supabase database

### OpenJobs Integration
**Single connector provides 4 job sources:**
- 🇸🇪 Arbetsförmedlingen (Swedish government jobs)
- 🇪🇺 EURES/Adzuna (European jobs)
- 🌍 Remotive (Remote-first jobs)
- 💻 RemoteOK (Remote tech jobs)

## Data Flow

```
┌─────────────────────────────────────────────┐
│              OpenJobs API                   │
│  (4 sources: AF, EURES, Remotive, RemoteOK) │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         OpenJobs Connector                  │
│  1. Fetch jobs                              │
│  2. Transform format                        │
│  3. AI enrichment (skills extraction)       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Edge Function (ingest-jobs)         │
│  - Validate API key                         │
│  - Upsert to database                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Supabase Database                   │
│  - Jobs table (enriched)                    │
│  - Profiles, swipes, matches                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         React Frontend                      │
│  - Swipe interface                          │
│  - Match scoring                            │
│  - Application tracking                     │
└─────────────────────────────────────────────┘
```

## Database Schema (Simplified)

```sql
-- Core tables
profiles          # User profiles and preferences
jobs              # Job listings (enriched with AI)
swipes            # User swipe history
matches           # Matched jobs

-- Jobs table structure
jobs:
  - id (UUID)
  - external_id (TEXT, UNIQUE)
  - title, company, description
  - location, salary_min, salary_max
  - required_skills (TEXT[])
  - metadata (JSONB)
    - source: "openjobs"
    - original_source: "arbetsformedlingen" | "eures" | "remotive" | "remoteok"
    - original_id
    - fetched_at
```

## Environment Variables

### Frontend (`.env`)
```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### OpenJobs Connector (`connectors/openjobs/.env`)
```bash
OPENJOBS_API_URL=http://localhost:8080
INGEST_URL=https://[project].supabase.co/functions/v1/ingest-jobs
CONNECTOR_API_KEY=connector_...
SUPABASE_ANON_KEY=eyJ...
ENABLE_ENRICHMENT=true
ENRICHMENT_URL=https://agent.froste.eu/webhook/enrich-jobs
```

### Edge Function (Supabase Secrets)
```bash
CONNECTOR_API_KEY=connector_...
```

## Running the Project

### Frontend Development
```bash
npm install
npm run dev
# Visit http://localhost:5173
```

### Job Connector (Manual)
```bash
cd connectors/openjobs
npm install
npm start
```

### Job Connector (Cron)
```bash
# Run every 6 hours
0 */6 * * * cd /path/to/LazyJobs/connectors/openjobs && npm start
```

## Deployment

- **Frontend:** Vercel (automatic from Git)
- **Backend:** Supabase (managed)
- **Connector:** Cron job on server or Easypanel

## Key Features

1. ✅ **Swipe Interface** - Tinder-style job browsing
2. ✅ **AI Enrichment** - Automatic skill extraction
3. ✅ **Match Scoring** - Compatibility percentage
4. ✅ **Multi-source** - 4 job sources via OpenJobs
5. ✅ **PWA** - Installable on mobile
6. ✅ **Real-time** - Instant updates

## Recent Changes (v2.0.0)

- ✅ Integrated OpenJobs (4 sources)
- ✅ Simplified database schema
- ✅ Moved enrichment to pre-ingestion
- ✅ Archived legacy connectors
- ✅ Cleaned project structure

## Documentation

- **Setup:** `/docs/getting-started/setup.md`
- **Architecture:** `/docs/architecture/overview.md`
- **OpenJobs Integration:** `/docs/OPENJOBS_INTEGRATION.md`
- **Deployment:** `/docs/deployment/deployment.md`

---

**Live:** [lazyjobs.ink](https://www.lazyjobs.ink)  
**Demo:** demo@lazyjobs.ink / 123456
