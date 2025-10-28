# OpenJobs Connector

Fetches jobs from the OpenJobs aggregation platform, which provides unified access to multiple job sources.

## Features

- **Multi-source aggregation**: Access jobs from Arbetsförmedlingen, EURES/Adzuna, and Remotive through a single API
- **Standardized format**: All jobs are pre-normalized by OpenJobs
- **Deduplication**: OpenJobs handles duplicate detection across sources
- **Automatic sync**: OpenJobs syncs every 6 hours automatically

## Setup

```bash
cd connectors/openjobs
npm install
cp .env.example .env
# Edit .env with your configuration
```

## Usage

```bash
npm start
```

## Configuration

- `OPENJOBS_API_URL`: OpenJobs API endpoint (default: http://localhost:8080)
- `INGEST_URL`: LazyJobs ingest endpoint
- `CONNECTOR_API_KEY`: Your LazyJobs connector API key
- `ENABLE_ENRICHMENT`: Enable AI skill extraction (default: true)

## Data Flow

```
OpenJobs API → Fetch → Transform → LazyJobs Ingest → AI Enrichment
```

## Sources

This connector aggregates jobs from:
- **Arbetsförmedlingen**: Swedish public employment service
- **EURES/Adzuna**: European job mobility portal
- **Remotive**: Remote-first job platform

## Deployment

Deploy as a cron job or scheduled task:

```bash
# Run every 6 hours
0 */6 * * * cd /path/to/connectors/openjobs && npm start
```

## Testing

Test the connector locally:

```bash
# Make sure OpenJobs is running on localhost:8080
npm start
```

Or test against deployed OpenJobs:

```bash
OPENJOBS_API_URL=https://your-openjobs-instance.com npm start
```
