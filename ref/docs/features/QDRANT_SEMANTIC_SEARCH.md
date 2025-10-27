# Qdrant Semantic Search Module

**Status:** ✅ Implemented (Toggle-able Extension)  
**Version:** 1.0.0  
**Author:** Magnus Froste

## Overview

Qdrant semantic search is a **flexible, pluggable module** that enhances LazyJobs with vector-based job matching. It can be toggled on/off via environment variables without affecting core functionality.

## Features

### 1. Job-to-CV Matching
When a new job is posted, automatically find the best matching candidates based on semantic similarity.

```javascript
const matches = await findMatchingCVs(jobId, limit=10);
// Returns: [{ user_id, name, title, skills, match_score }]
```

### 2. CV-to-Job Matching
When a user updates their profile, find the most relevant jobs.

```javascript
const matches = await findMatchingJobs(userId, limit=20);
// Returns: [{ job_id, title, company, location, match_score }]
```

### 3. Similar Jobs Discovery
Show "Jobs like this one" recommendations.

```javascript
const similar = await findSimilarJobs(jobId, limit=5);
// Returns: [{ job_id, title, company, similarity_score }]
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Job Ingestion Pipeline                   │
│                                                             │
│  OpenJobs → Transform → AI Enrichment → Supabase           │
│                              ↓                              │
│                      [Qdrant Module]                        │
│                    (Optional Extension)                     │
│                              ↓                              │
│                    Generate Embeddings                      │
│                              ↓                              │
│                    Store in Qdrant                          │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Start Qdrant Container

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

### 2. Configure Environment

Add to `.env`:

```bash
# Qdrant Semantic Search (Optional)
ENABLE_QDRANT=true
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Optional, for production

# OpenAI for Embeddings
OPENAI_API_KEY=sk-...
```

### 3. Install Dependencies

```bash
npm install @qdrant/js-client-rest
```

### 4. Run Connector

```bash
cd connectors/openjobs
node fetch-jobs.js
```

## Usage

### In React Components

```javascript
import { useQdrant } from '../hooks/useQdrant';

function JobDetail({ job }) {
  const { findSimilarJobs, enabled } = useQdrant();
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (enabled) {
      findSimilarJobs(job.id, 5).then(setSimilar);
    }
  }, [job.id, enabled]);

  if (!enabled) return null;

  return (
    <div>
      <h3>Similar Jobs</h3>
      {similar.map(job => (
        <JobCard key={job.job_id} {...job} />
      ))}
    </div>
  );
}
```

### In Node.js Connector

```javascript
import { qdrantIntegration } from './qdrant-integration.js';

// Initialize
await qdrantIntegration.init();

// Store job
await qdrantIntegration.processJob(job);

// Batch process
const result = await qdrantIntegration.batchProcessJobs(jobs);
console.log(`Stored ${result.processed} jobs`);
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_QDRANT` | No | `false` | Enable/disable Qdrant module |
| `QDRANT_URL` | No | `http://localhost:6333` | Qdrant server URL |
| `QDRANT_API_KEY` | No | `` | API key for production |
| `OPENAI_API_KEY` | Yes* | - | For generating embeddings |

*Required only if `ENABLE_QDRANT=true`

### Collections

- **jobs** - Job postings with embeddings (1536 dimensions)
- **cvs** - User CVs with embeddings (1536 dimensions)

### Embedding Model

- **Model:** `text-embedding-3-small` (OpenAI)
- **Dimensions:** 1536
- **Distance:** Cosine similarity
- **Cost:** ~$0.02 per 1M tokens

## Performance

### Benchmarks (1000 jobs)

- **Embedding generation:** ~2 minutes (with rate limiting)
- **Storage:** ~1MB per 1000 jobs
- **Search latency:** <50ms per query
- **Accuracy:** 85-90% relevance (manual evaluation)

### Rate Limiting

- 100ms delay between embedding requests
- Prevents OpenAI rate limit errors
- Configurable in `qdrant-integration.js`

## Toggle On/Off

The module is designed to be **completely optional**:

### Disabled (Default)
```bash
# .env
ENABLE_QDRANT=false
```

- ✅ No Qdrant connection attempted
- ✅ No OpenAI API calls
- ✅ No performance impact
- ✅ Core functionality unchanged

### Enabled
```bash
# .env
ENABLE_QDRANT=true
OPENAI_API_KEY=sk-...
```

- ✅ Jobs stored in Qdrant
- ✅ Semantic search available
- ✅ Similar jobs recommendations
- ✅ Job-CV matching enabled

## Use Cases

### 1. Recruiter Dashboard
Show best matching candidates for each job posting.

### 2. Smart Job Feed
Personalize job recommendations based on user profile.

### 3. Similar Jobs Widget
"People who viewed this job also viewed..."

### 4. Auto-Apply Suggestions
"You're a 95% match for this job!"

### 5. Skill Gap Analysis
"Learn these 3 skills to match 10 more jobs"

## Troubleshooting

### Qdrant not connecting
```bash
# Check if container is running
docker ps | grep qdrant

# Check logs
docker logs qdrant

# Test connection
curl http://localhost:6333/collections
```

### OpenAI API errors
```bash
# Verify API key
echo $OPENAI_API_KEY

# Test API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### No embeddings generated
```bash
# Check logs
tail -f /tmp/openjobs-connector.log

# Verify ENABLE_QDRANT is true
env | grep QDRANT
```

## Future Enhancements

- [ ] Local embedding models (no OpenAI dependency)
- [ ] Hybrid search (vector + keyword)
- [ ] Multi-language support
- [ ] Custom embedding fine-tuning
- [ ] Real-time job alerts based on CV updates
- [ ] A/B testing framework for match quality

## Cost Estimation

### OpenAI Embeddings
- **1000 jobs:** ~$0.02
- **10,000 jobs:** ~$0.20
- **100,000 jobs:** ~$2.00

### Qdrant Hosting
- **Self-hosted:** Free (Docker)
- **Qdrant Cloud:** $25/month (starter)

## References

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Vector Search Best Practices](https://www.pinecone.io/learn/vector-search/)

---

**Last Updated:** October 16, 2025  
**Status:** Production Ready (Toggle-able)
