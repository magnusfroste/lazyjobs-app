# Qdrant Semantic Search - Quick Start

## 🎯 What This Does

Adds **semantic job matching** to LazyJobs using vector embeddings. Jobs and CVs are compared by meaning, not just keywords.

**Example:**
- User profile: "React developer with 3 years experience"
- Matches jobs: "Frontend Engineer (React)", "UI Developer", "JavaScript Specialist"
- Even if job doesn't mention "React" explicitly!

## 🚀 Quick Setup (5 minutes)

### 1. Start Qdrant Container

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  qdrant/qdrant
```

### 2. Add to `.env`

```bash
# Enable Qdrant module
ENABLE_QDRANT=true
QDRANT_URL=http://localhost:6333

# OpenAI for embeddings
OPENAI_API_KEY=sk-your-key-here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Connector

```bash
cd connectors/openjobs
node fetch-jobs.js
```

You'll see:
```
🔍 Qdrant Semantic Search: Enabled
✅ Qdrant connected: http://localhost:6333
🔄 Generating embedding for: Senior React Developer
✅ Stored in Qdrant: Senior React Developer
📊 Qdrant total jobs: 150
```

## 🎨 Use in Your App

### Find Similar Jobs

```javascript
import { useQdrant } from './hooks/useQdrant';

function JobDetail({ job }) {
  const { findSimilarJobs, enabled } = useQdrant();
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (enabled) {
      findSimilarJobs(job.id, 5).then(setSimilar);
    }
  }, [job.id]);

  return (
    <div>
      <h3>Similar Jobs</h3>
      {similar.map(j => (
        <div key={j.job_id}>
          {j.title} at {j.company} ({j.similarity_score.toFixed(2)})
        </div>
      ))}
    </div>
  );
}
```

### Find Matching Jobs for User

```javascript
const { findMatchingJobs } = useQdrant();

// When user updates profile
const matches = await findMatchingJobs(userId, 20);
// Returns jobs ranked by semantic similarity
```

## 🔧 Toggle On/Off

### Disable (Default)
```bash
# .env
ENABLE_QDRANT=false
```
- No Qdrant connection
- No OpenAI API calls
- Core app works normally

### Enable
```bash
# .env
ENABLE_QDRANT=true
```
- Semantic search active
- Jobs stored in Qdrant
- Matching features available

## 📊 What Gets Stored

Each job becomes a 1536-dimensional vector based on:
- Title
- Company
- Description
- Location
- Required skills
- Employment type
- Experience level

## 💰 Cost

- **Qdrant:** Free (self-hosted Docker)
- **OpenAI Embeddings:** ~$0.02 per 1000 jobs
- **Example:** 10,000 jobs = $0.20

## 🎯 Use Cases

1. **"Jobs like this"** - Show similar positions
2. **Smart recommendations** - Match user profile to jobs
3. **Recruiter tools** - Find best candidates for job
4. **Auto-apply** - "You're a 95% match!"
5. **Skill gap analysis** - "Learn X to match 10 more jobs"

## 🔍 How It Works

```
Job → Text → OpenAI Embedding → 1536D Vector → Qdrant
                                                    ↓
User searches → Vector → Find similar → Ranked results
```

## 📚 Full Documentation

See [docs/features/QDRANT_SEMANTIC_SEARCH.md](docs/features/QDRANT_SEMANTIC_SEARCH.md)

## ❓ Troubleshooting

### Qdrant not connecting
```bash
docker ps | grep qdrant  # Check if running
curl http://localhost:6333/collections  # Test API
```

### No embeddings generated
```bash
# Check environment
env | grep QDRANT
env | grep OPENAI

# Check logs
tail -f /tmp/openjobs-connector.log
```

### OpenAI rate limits
Reduce batch size or add delays in `qdrant-integration.js`

---

**Ready to test?** Run the connector and watch jobs get stored in Qdrant! 🚀
