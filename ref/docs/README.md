# 📚 LazyJobs Documentation

Complete documentation for the LazyJobs platform - **100% TypeScript** job matching app.

## 🚀 Getting Started

### Setup & Configuration
- **[Development Setup](setup/DEVELOPMENT.md)** - Local development environment
- **[Supabase Config](setup/SUPABASE_CONFIG.md)** - Database & auth setup
- **[OpenJobs Integration](setup/OPENJOBS_INTEGRATION.md)** - Job aggregation connector

## 🏗️ Architecture

### Core Architecture
- **[Project Structure](architecture/PROJECT_STRUCTURE.md)** - Codebase organization
- **[Clean Architecture](architecture/CLEAN_ARCHITECTURE.md)** - Best practices & patterns
- **[TypeScript Cleanup Plan](architecture/TYPESCRIPT_CLEANUP_PLAN.md)** - Type safety guidelines

### Legacy Architecture Docs
- **[Overview](architecture/overview.md)** - System architecture & vision
- **[How It Works](architecture/how-it-works.md)** - Data flow & components
- **[Connector API](architecture/connector-api.md)** - Build job connectors
- **[Enrichment Simplification](architecture/ENRICHMENT_SIMPLIFICATION.md)** - AI enrichment flow

## ✨ Features

### Application Assistant
AI-powered application generator with ethical safeguards:
- **[Overview](features/application-assistant/README.md)** - Feature documentation
- **[Settings Guide](features/application-assistant/SETTINGS.md)** - Configuration options
- **[AI Safeguards](features/application-assistant/AI_SAFEGUARDS.md)** - Ethics & transparency
- **[Troubleshooting](features/application-assistant/TROUBLESHOOTING.md)** - Debug guide

### AI Matching
Semantic job matching with A/B testing:
- **[Implementation](features/ai-matching/README.md)** - Architecture & setup
- **[Rollback Guide](features/ai-matching/ROLLBACK.md)** - Feature removal instructions

### Qdrant Vector Search
Optional semantic search integration:
- **[Overview](features/qdrant/README.md)** - Feature overview
- **[Quickstart](features/qdrant/QUICKSTART.md)** - 5-minute setup guide

### Legacy Feature Docs
- **[CV Matching](features/cv-matching.md)** - How CV parsing works
- **[Matching Algorithm](features/matching-algorithm.md)** - Job scoring logic
- **[Learning Algorithm](features/learning-algorithm.md)** - Personalization system
- **[Reinforcement Loop](features/reinforcement-loop.md)** - Adaptive learning
- **[n8n Integration](features/n8n-integration.md)** - Webhook setup & enrichment

## 📖 Guides

Practical guides and solutions:
- **[Onboarding Improvements](guides/ONBOARDING_IMPROVEMENT.md)** - UX enhancements
- **[Fix Matches Delete Bug](guides/FIX_MATCHES_DELETE_BUG.md)** - RLS policy fix reference

## 🚢 Deployment

Deploy to production:
- **[Deployment Guide](deployment/deployment.md)** - Deploy to Vercel & Easypanel
- **[Troubleshooting](deployment/troubleshooting.md)** - Fix common issues

## 📋 Product

Product strategy & planning:

- **[Roadmap](product/roadmap.md)** - Feature roadmap & phases
- **[PRD](product/prd.md)** - Product requirements document
- **[Metrics](product/metrics.md)** - Success metrics & KPIs
- **[Branding](product/branding.md)** - Brand guidelines & taglines

## 🔗 Integration

OpenJobs integration documentation:

- **[OpenJobs Integration](integration/OPENJOBS_INTEGRATION.md)** - Complete integration guide
- **[Data Model Harmonization](integration/DATA_MODEL_HARMONIZATION.md)** - Schema alignment
- **[Harmonization Summary](integration/HARMONIZATION_SUMMARY.md)** - Implementation plan
- **[Metadata Mapping](integration/METADATA_MAPPING.md)** - Field mapping guide

## 📦 Archive

Historical documentation:

### TypeScript Migration (Oct 2025)
- **[JS to TS Audit](archive/typescript-migration/JS_TO_TS_AUDIT.md)** - Final migration audit & results

### Development Sessions
- **[Session Summary](archive/session-summary.md)** - Development session notes
- **[Session 2 Summary](archive/session-2-summary.md)** - Additional session notes

---

## Quick Links

**Common Tasks:**
- [Add a new connector](architecture/connector-api.md)
- [Deploy to production](deployment/deployment.md)
- [Check connector status](deployment/troubleshooting.md#connector-issues)
- [Fix enrichment issues](deployment/troubleshooting.md#ai-enrichment-not-working)

**Utilities:**
```bash
node scripts/check-jobs.js        # Check job sync status
node scripts/check-today-jobs.js  # Verify enrichment working
```

---

**Need help?** Check [Troubleshooting](deployment/troubleshooting.md) or open an issue.
