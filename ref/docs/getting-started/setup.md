# JobMatch Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://arqugyvmegxonaerjbzd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get your keys from: Supabase Dashboard > Settings > API

### 3. Set Up Database
1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Paste and run the query

This creates all necessary tables and security policies.

### 4. Enable Authentication
1. Go to Authentication > Providers
2. Enable **Email** provider
3. (Optional) Enable **Google OAuth**:
   - Add OAuth credentials from Google Cloud Console
   - Set authorized redirect URI: `http://localhost:5173`

### 5. Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

## Next Steps

### Add Sample Jobs
To test the swipe interface, add some sample jobs:

```sql
-- In Supabase SQL Editor
INSERT INTO jobs (title, company, description, location, salary_min, salary_max, is_remote, employment_type, required_skills, experience_level, url, posted_at)
VALUES 
  ('Senior React Developer', 'TechCorp', 'We are looking for an experienced React developer...', 'San Francisco, CA', 120000, 180000, true, 'full-time', ARRAY['React', 'TypeScript', 'Node.js'], 'senior', 'https://example.com/job1', NOW()),
  ('Frontend Engineer', 'StartupXYZ', 'Join our fast-growing startup...', 'Remote', 90000, 130000, true, 'full-time', ARRAY['JavaScript', 'Vue.js', 'CSS'], 'mid', 'https://example.com/job2', NOW()),
  ('Full Stack Developer', 'BigCo', 'Build scalable applications...', 'New York, NY', 100000, 150000, false, 'full-time', ARRAY['Python', 'Django', 'React'], 'mid', 'https://example.com/job3', NOW());
```

### Set Up n8n CV Processing (Optional)
If you have an n8n instance with CV OCR:

1. Create a webhook in n8n that accepts PDF uploads
2. Configure it to return structured CV data (JSON)
3. Update the user profile upload to call this webhook

### Create Your First Connector
See `CONNECTOR_API.md` for details on building job connectors.

## Deployment

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Supabase Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref arqugyvmegxonaerjbzd

# Create and deploy edge function
supabase functions new ingest-jobs
# Add your function code
supabase functions deploy ingest-jobs
```

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after changing `.env`

### "No jobs showing"
- Run the sample jobs SQL above
- Check Supabase Dashboard > Table Editor > jobs
- Verify `is_active = true` for jobs

### Authentication not working
- Check Supabase Dashboard > Authentication > Providers
- Verify Email provider is enabled
- Check browser console for errors

### PWA not installing
- PWA only works over HTTPS (or localhost)
- Check browser console for service worker errors
- Verify `manifest.json` is accessible

## Database Schema Overview

- **profiles**: User accounts (extends auth.users)
- **jobs**: Job listings from connectors
- **swipes**: User swipe history (left/right)
- **matches**: Jobs user liked
- **connectors**: Registered job source plugins

All tables have Row Level Security (RLS) enabled for data protection.
