# AI Match Jobs Edge Function

Supabase Edge Function for semantic job matching using Qdrant vector search.

## Features

- ✅ **Secure** - OpenAI API key stays server-side
- ✅ **Fast** - Generates embeddings and searches Qdrant in one call
- ✅ **Smart** - Filters out already swiped jobs
- ✅ **Scalable** - Runs on Supabase edge network

## Environment Variables

Set these in your Supabase project:

```bash
QDRANT_URL=https://n8n-qdrant.katsu6.easypanel.host
OPENAI_API_KEY=sk-proj-...
```

## Deployment

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref arqugyvmegxonaerjbzd

# Deploy the function
supabase functions deploy ai-match-jobs

# Set environment variables
supabase secrets set QDRANT_URL=https://n8n-qdrant.katsu6.easypanel.host
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/arqugyvmegxonaerjbzd/functions
2. Click "Create Function"
3. Name: `ai-match-jobs`
4. Copy the code from `index.ts`
5. Add environment variables in Settings → Edge Functions

## API

### Request

```typescript
POST https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ai-match-jobs

{
  "user_id": "uuid",
  "limit": 50  // optional, default 50
}
```

### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "Senior React Developer",
      "company": "Tech Corp",
      "match_score": 0.89,  // Similarity score (0-1)
      "match_type": "ai",
      ...
    }
  ],
  "count": 25,
  "method": "ai_semantic"
}
```

## How It Works

1. **Fetch Profile** - Gets user's CV data and preferences from database
2. **Build Search Text** - Combines title, bio, skills, preferences into searchable text
3. **Generate Embedding** - Calls OpenAI to create 1536-dimensional vector
4. **Search Qdrant** - Finds semantically similar jobs using cosine similarity
5. **Filter Swiped** - Removes jobs the user has already seen
6. **Return Results** - Sends matched jobs with similarity scores

## Testing

```bash
# Test locally
supabase functions serve ai-match-jobs

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ai-match-jobs \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-user-id", "limit": 10}'
```

## Cost

- **OpenAI**: ~$0.0001 per request (text-embedding-3-small)
- **Supabase**: Free tier includes 500K edge function invocations/month
- **Qdrant**: Free (self-hosted)

**Total**: ~$0.01 per 100 AI matches

## Monitoring

Check logs in Supabase Dashboard:
- Functions → ai-match-jobs → Logs
- Look for: 🤖 🔮 🔍 ✅ emojis

## Troubleshooting

### "Failed to generate embedding"
- Check OPENAI_API_KEY is set correctly
- Verify API key has credits

### "Failed to search Qdrant"
- Check QDRANT_URL is accessible
- Verify `jobs` collection exists
- Check Qdrant has indexed vectors

### "Profile not found"
- User must complete onboarding first
- CV data must be parsed and stored

## Related Files

- Frontend: `/src/lib/aiMatching.js`
- Ingestion: `/scripts/ingest-to-qdrant-simple.js`
- Toggle UI: `/src/components/MatchModeToggle.jsx`
