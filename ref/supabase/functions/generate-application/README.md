# Generate Application Edge Function

Generates tailored CV, cover letter, and email draft for job applications with automatic language detection.

## Features

- ✅ **Auto-detects language** from job description (Swedish/English)
- ✅ **User language preference** override (auto/en/sv)
- ✅ **Tailored CV** - Reorders sections to highlight relevant experience
- ✅ **Cover letter** - Professional, personalized to job
- ✅ **Email draft** - Ready-to-send application email

## API

### Request

```typescript
POST /functions/v1/generate-application

{
  "job_id": "uuid",
  "user_id": "uuid",
  "language_override": "auto" | "en" | "sv",  // Optional, default: "auto"
  "include": ["cv", "cover_letter", "email"]  // Optional, default: all
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "language": "sv",  // Detected/selected language
    "job_title": "Senior Developer",
    "company": "Tech Corp",
    "cv": "# John Doe\n\n## Experience\n...",  // Markdown
    "cover_letter": "Dear Hiring Manager...",  // Markdown
    "email": {
      "subject": "Ansökan: Senior Developer",
      "body": "Hej,\n\nJag ansöker..."
    }
  }
}
```

## Language Detection

### Priority Order:
1. **User override** (`language_override` parameter)
2. **User preference** (saved in profile: `application_language_preference`)
3. **Auto-detect** from job description

### Auto-Detection Logic:
- Scans job title + description for Swedish keywords
- If 3+ Swedish words found → Swedish
- Otherwise → English

### Swedish Keywords:
`och, att, för, med, som, är, på, vi, du, söker, arbete, tjänst`

## Deployment

```bash
# Deploy function
supabase functions deploy generate-application

# Set secrets (if not already set)
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

## Cost

- **OpenAI**: ~$0.01-0.02 per application (gpt-4o-mini)
  - CV: ~2000 tokens
  - Cover letter: ~1000 tokens
  - Email: ~300 tokens

## Testing

```bash
curl -X POST https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/generate-application \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job-uuid",
    "user_id": "user-uuid",
    "language_override": "auto"
  }'
```

## User Preference

Add to profiles table:

```sql
ALTER TABLE profiles 
ADD COLUMN application_language_preference VARCHAR(10) DEFAULT 'auto';
-- Values: 'auto', 'en', 'sv'
```
