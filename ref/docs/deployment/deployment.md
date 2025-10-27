# Deployment Guide

## Prerequisites

- Supabase account with project created
- Node.js 18+ installed
- Supabase CLI installed: `npm install -g supabase`
- Git repository (for CI/CD)

## Step 1: Deploy Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Paste and execute the SQL

Verify tables were created:
- Go to Table Editor
- You should see: profiles, jobs, swipes, matches, connectors

## Step 2: Deploy Edge Functions

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link Your Project

```bash
supabase link --project-ref arqugyvmegxonaerjbzd
```

### Deploy Functions

```bash
# Deploy job ingestion function
supabase functions deploy ingest-jobs

# Deploy matching function
supabase functions deploy match-jobs
```

### Set Environment Variables

```bash
# These are automatically available in Edge Functions:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### Test Edge Functions

```bash
# Test ingest-jobs
curl -X POST \
  https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs \
  -H "Authorization: Bearer YOUR_CONNECTOR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [{
      "external_id": "test_001",
      "title": "Test Job",
      "company": "Test Company"
    }]
  }'
```

## Step 3: Deploy Frontend

### Option A: Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

2. **Deploy to Vercel**
```bash
npm install -g vercel
vercel login
vercel
```

3. **Set Environment Variables in Vercel**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`: https://arqugyvmegxonaerjbzd.supabase.co
     - `VITE_SUPABASE_ANON_KEY`: Your anon key

4. **Redeploy**
```bash
vercel --prod
```

### Option B: Netlify

1. **Build the project**
```bash
npm run build
```

2. **Deploy to Netlify**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

3. **Set Environment Variables**
   - Go to Netlify Dashboard > Site Settings > Environment Variables
   - Add the same variables as Vercel

### Option C: Static Hosting (Cloudflare Pages, GitHub Pages, etc.)

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## Step 4: Configure Authentication

### Enable OAuth Providers

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable desired providers (Google, GitHub, etc.)
3. Add OAuth credentials from provider
4. Set redirect URLs:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`

### Update Allowed Redirect URLs

1. Go to Authentication > URL Configuration
2. Add your production URL to allowed redirect URLs

## Step 5: Set Up CI/CD (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: |
          supabase functions deploy ingest-jobs
          supabase functions deploy match-jobs
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_REF: arqugyvmegxonaerjbzd
```

## Step 6: Create First Connector

### Register Connector in Database

```sql
INSERT INTO connectors (name, description, api_key, developer_email, is_active)
VALUES (
  'Test Connector',
  'Test connector for development',
  'connector_test_' || gen_random_uuid()::text,
  'your-email@example.com',
  true
)
RETURNING api_key;
```

Save the returned API key!

### Test Connector

Use the example connector:

```bash
cd examples
export CONNECTOR_API_KEY="your_api_key_here"
node simple-connector.js
```

## Step 7: Add Sample Jobs

For testing, add some sample jobs:

```sql
INSERT INTO jobs (
  title, company, description, location, 
  salary_min, salary_max, is_remote, 
  employment_type, required_skills, 
  experience_level, url, posted_at
)
VALUES 
  (
    'Senior React Developer',
    'TechCorp',
    'We are looking for an experienced React developer to join our team...',
    'San Francisco, CA',
    120000, 180000, true,
    'full-time',
    ARRAY['React', 'TypeScript', 'Node.js'],
    'senior',
    'https://example.com/job1',
    NOW()
  ),
  (
    'Frontend Engineer',
    'StartupXYZ',
    'Join our fast-growing startup...',
    'Remote',
    90000, 130000, true,
    'full-time',
    ARRAY['Vue.js', 'JavaScript', 'CSS'],
    'mid',
    'https://example.com/job2',
    NOW()
  );
```

## Step 8: Test the Application

1. Visit your deployed URL
2. Sign up for an account
3. Verify email (check spam folder)
4. Start swiping on jobs!

## Monitoring & Maintenance

### Monitor Edge Functions

```bash
# View function logs
supabase functions logs ingest-jobs
supabase functions logs match-jobs
```

### Monitor Database

- Go to Supabase Dashboard > Database > Logs
- Check for errors or slow queries

### Analytics

Set up analytics (optional):
- Google Analytics
- Plausible
- PostHog

### Backups

Supabase automatically backs up your database daily (Pro plan).

## Troubleshooting

### Edge Function Not Working

```bash
# Check function logs
supabase functions logs ingest-jobs --tail

# Redeploy
supabase functions deploy ingest-jobs
```

### Frontend Not Loading

- Check browser console for errors
- Verify environment variables are set
- Check Supabase URL and anon key

### Authentication Issues

- Verify email provider is enabled
- Check redirect URLs are correct
- Look at Supabase Auth logs

### Jobs Not Showing

- Check jobs table has data
- Verify `is_active = true`
- Check RLS policies are correct

## Scaling Considerations

### Database

- Add indexes for common queries
- Use connection pooling (Supabase handles this)
- Consider read replicas for high traffic

### Edge Functions

- Edge Functions auto-scale
- Monitor invocation counts
- Optimize function code for performance

### Frontend

- Enable CDN caching
- Optimize images
- Use code splitting

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Environment variables not committed to Git
- [ ] HTTPS enabled (automatic with Vercel/Netlify)
- [ ] API keys rotated regularly
- [ ] Rate limiting configured (Supabase handles this)
- [ ] CORS configured correctly

## Cost Optimization

### Supabase Free Tier Limits

- 500MB database
- 1GB file storage
- 2GB bandwidth
- 500K Edge Function invocations

### When to Upgrade

- More than 500 active users
- Need more storage
- Higher bandwidth requirements
- Want daily backups

## Next Steps

1. Set up monitoring and alerts
2. Create more connectors
3. Implement AI matching (OpenAI/Anthropic)
4. Add analytics
5. Build mobile apps
6. Create connector marketplace

## Support

- Documentation: See README.md
- Issues: GitHub Issues
- Email: support@jobmatch.example.com
