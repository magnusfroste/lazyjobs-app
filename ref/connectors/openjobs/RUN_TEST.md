# Run Qdrant Test

## ⚠️ Action Required

**Add your OpenAI API key to `.env` in this directory:**

```bash
# Edit /Users/mafr/Code/LazyJobs/connectors/openjobs/.env
# Replace this line:
OPENAI_API_KEY=your-openai-key-here

# With your actual key:
OPENAI_API_KEY=sk-proj-...
```

## Then Run Test

```bash
node test-qdrant.js
```

## Expected Output

```
🧪 Testing Qdrant Integration
============================================================

1️⃣  Initializing Qdrant connection...
✅ Qdrant connected: https://n8n-qdrant.katsu6.easypanel.host

2️⃣  Getting collection stats...
📊 Current jobs in Qdrant: 0

3️⃣  Storing test jobs...
   ✅ Senior React Developer
   ✅ Frontend Engineer
   ✅ Backend Developer - Go

4️⃣  Verifying storage...
📊 Total jobs in Qdrant: 3

5️⃣  Testing similarity search...
   📋 Similar jobs found:
   1. Frontend Engineer (87.3% match)
   2. Backend Developer (45.2% match)

✅ Test Complete!
```

## Configuration

Your Qdrant is already configured:
- ✅ `ENABLE_QDRANT=true`
- ✅ `QDRANT_URL=https://n8n-qdrant.katsu6.easypanel.host`
- ⚠️ `OPENAI_API_KEY=your-openai-key-here` ← **ADD THIS**

## After Test Passes

Run the full connector to populate Qdrant with all jobs:

```bash
node fetch-jobs.js
```

This will fetch all jobs from OpenJobs and store them in Qdrant with semantic embeddings!
