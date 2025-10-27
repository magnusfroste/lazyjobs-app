# 🛋️ LazyJobs

**Tinder for jobs. Swipe right to apply, left to skip.**


🌐 **Live:** [lazyjobs.ink](https://www.lazyjobs.ink)  
🎭 **Demo:** demo@lazyjobs.ink / 123456

## Features

✅ AI-powered job matching with enrichment  
✅ Swipe interface (mobile-optimized PWA)  
✅ Match score breakdown & insights  
✅ Adjustable threshold slider  
✅ View all matches & track applications  
✅ Multi-source job aggregation via OpenJobs (Arbetsförmedlingen, EURES/Adzuna, Remotive)

## Tech Stack

**Frontend:** React 19 + Vite + TailwindCSS + Framer Motion  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Job Aggregation:** OpenJobs (Go service with multi-source connectors)  
**AI:** n8n + GPT-4o-mini for job enrichment  
**Deployment:** Vercel (frontend) + Easypanel (connectors)

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Supabase credentials to .env

# Run locally
npm run dev
```

Visit http://localhost:5173

## Documentation

### Getting Started
- **[Quickstart](docs/getting-started/quickstart.md)** - Get running in 10 minutes
- **[Setup Guide](docs/getting-started/setup.md)** - Detailed setup instructions
- **[Demo Account](docs/getting-started/demo-account.md)** - Try without signing up

### Architecture
- **[Overview](docs/architecture/overview.md)** - System architecture & vision
- **[How It Works](docs/architecture/how-it-works.md)** - Data flow & components
- **[Connector API](docs/architecture/connector-api.md)** - Build job connectors

### Deployment
- **[Deployment Guide](docs/deployment/deployment.md)** - Deploy to production
- **[Troubleshooting](docs/deployment/troubleshooting.md)** - Fix common issues

### Features
- **[CV Matching](docs/features/cv-matching.md)** - How CV parsing works
- **[Matching Algorithm](docs/features/matching-algorithm.md)** - Job scoring logic
- **[Learning Algorithm](docs/features/learning-algorithm.md)** - Personalization
- **[n8n Integration](docs/features/n8n-integration.md)** - Webhook setup

### Product
- **[Roadmap](docs/product/roadmap.md)** - Feature roadmap & phases
- **[PRD](docs/product/prd.md)** - Product requirements
- **[Metrics](docs/product/metrics.md)** - Success metrics
- **[Branding](docs/product/branding.md)** - Brand guidelines

## Project Structure

```
pipeline_x/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilities
├── supabase/               # Database & Edge Functions
│   ├── migrations/         # DB migrations
│   ├── functions/          # Edge Functions
│   └── schema.sql          # Database schema
├── connectors/             # Job source connectors
│   ├── openjobs/           # OpenJobs aggregator (primary)
│   ├── arbetsformedlingen/ # Legacy: Swedish jobs
│   └── remoteok/           # Legacy: Remote jobs
├── scripts/                # Utility scripts
│   ├── check-jobs.js       # Check job sync status
│   └── check-today-jobs.js # Check enrichment
├── docs/                   # Documentation
└── public/                 # Static assets
```

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Deployment
npm run deploy:vercel    # Deploy frontend
npm run deploy:functions # Deploy Edge Functions

# Utilities
node scripts/check-jobs.js        # Check connector status
node scripts/check-today-jobs.js  # Verify enrichment
```

## Contributing

We welcome contributions! See [Connector API](docs/architecture/connector-api.md) to build job connectors.

## Current Status

✅ **Production-ready MVP**
- Multi-source job aggregation via OpenJobs
  - Arbetsförmedlingen (Swedish)
  - EURES/Adzuna (European)
  - Remotive (Remote jobs)
- AI enrichment active (6-15 skills per job)
- Cron running every 6 hours
- PWA installable on mobile
- Demo account available

📚 **See Also**: [Integration Summary](INTEGRATION_SUMMARY.md) for OpenJobs architecture details

## License

MIT - See LICENSE file

---

**Built with ❤️ for the lazy job seeker**
