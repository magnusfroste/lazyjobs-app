# JobMatch - Project Overview

## Vision

An open platform for job matching that uses AI to connect job seekers with opportunities through an intuitive, Tinder-like swipe interface. The platform is designed to be extensible through a connector plugin system that allows developers to contribute job sources.

## Architecture

### Frontend (Progressive Web App)
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion (swipe gestures)
- **State Management**: React hooks + Supabase real-time
- **PWA**: Service Worker, Web App Manifest

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Email/password + OAuth (Google, etc.)
- **Edge Functions**: Deno-based serverless functions
- **Storage**: For CV uploads (future)
- **Real-time**: WebSocket subscriptions (future)

### External Integrations
- **n8n**: CV OCR processing webhook (existing)
- **AI APIs**: OpenAI/Anthropic for matching (future)
- **Connector Plugins**: Open ecosystem for job sources

## Database Schema

```
profiles (extends auth.users)
├── id (UUID, PK)
├── email
├── full_name
├── cv_data (JSONB) - Extracted CV information
└── preferences (JSONB) - Job preferences

jobs
├── id (UUID, PK)
├── connector_id (FK) - Source connector
├── external_id - Unique ID from source
├── title, company, description
├── location, salary_min, salary_max
├── is_remote, employment_type
├── required_skills (array)
├── experience_level
└── metadata (JSONB)

swipes
├── id (UUID, PK)
├── user_id (FK)
├── job_id (FK)
├── direction (left/right)
└── created_at

matches (right swipes)
├── id (UUID, PK)
├── user_id (FK)
├── job_id (FK)
├── match_score (AI score)
└── is_applied

connectors (plugin registry)
├── id (UUID, PK)
├── name, description
├── api_key (unique)
├── is_active
└── developer_email
```

## User Flow

1. **Sign Up/Login** → Email verification or OAuth
2. **Upload CV** → (Optional) n8n processes and extracts data
3. **Set Preferences** → Location, salary, remote, etc.
4. **Swipe Jobs** → AI-ranked jobs shown one at a time
5. **View Matches** → See liked jobs (future feature)
6. **Apply** → Track applications (future feature)

## Connector Ecosystem

### How It Works

1. **Developer registers** connector in database
2. **Gets API key** for authentication
3. **Builds connector** (scraper, API client, etc.)
4. **POSTs jobs** to Edge Function endpoint
5. **Platform validates** and stores jobs
6. **Users see jobs** in swipe interface

### Connector Types

- **API Connectors**: LinkedIn, Indeed, Glassdoor APIs
- **Web Scrapers**: Company career pages
- **RSS Parsers**: Job feed aggregators
- **Custom**: Internal job boards, ATS integrations

### Revenue Model (Future)

- Free tier: Basic connectors
- Premium: Advanced connectors with better data
- Marketplace: Developers earn from connector usage
- Enterprise: White-label solutions

## AI Matching Strategy

### Current (Simple Algorithm)
- Skill matching (keyword overlap)
- Location preference
- Salary range
- Remote preference
- Recency boost

### Future (AI-Powered)
- **CV Analysis**: Extract skills, experience, preferences
- **Semantic Matching**: Beyond keyword matching
- **Learning**: Improve based on swipe patterns
- **Personalization**: Adapt to user behavior

### Integration Options

1. **n8n Workflow**
   - User CV → n8n → AI API → Ranked jobs
   - Pros: Use existing infrastructure
   - Cons: Additional latency

2. **Edge Function**
   - Direct AI API call from Edge Function
   - Pros: Faster, simpler
   - Cons: More API costs

3. **Hybrid**
   - Simple matching in Edge Function
   - Complex AI in n8n for batch processing
   - Best of both worlds

## Roadmap

### Phase 1: MVP (Current)
- ✅ Basic swipe interface
- ✅ Authentication
- ✅ Database schema
- ✅ Connector API
- ✅ Edge Functions
- ✅ PWA setup

### Phase 2: Core Features (Next 2-4 weeks)
- [ ] CV upload + n8n integration
- [ ] User preferences page
- [ ] Matches view (liked jobs)
- [ ] Basic AI matching
- [ ] First 3-5 connectors

### Phase 3: Enhanced UX (4-8 weeks)
- [ ] Job details modal
- [ ] Application tracking
- [ ] Email notifications
- [ ] Search/filter
- [ ] User profile
- [ ] Settings page

### Phase 4: Growth (2-3 months)
- [ ] Connector marketplace
- [ ] Developer portal
- [ ] Analytics dashboard
- [ ] Mobile apps (React Native)
- [ ] Advanced AI matching
- [ ] Company profiles

### Phase 5: Scale (3-6 months)
- [ ] Premium features
- [ ] Team accounts
- [ ] API for third parties
- [ ] White-label solution
- [ ] International expansion

## Technical Debt & Improvements

### Current Limitations
- No pagination (loads 20 jobs at a time)
- Simple matching algorithm
- No job search/filter
- No undo stack (only 1 level)
- No offline support yet

### Performance Optimizations
- Implement virtual scrolling for large datasets
- Add Redis caching for hot jobs
- Optimize images (job logos)
- Lazy load job descriptions
- Prefetch next jobs

### Security Enhancements
- Rate limiting on Edge Functions
- API key rotation system
- Audit logs for connector actions
- CAPTCHA for signup
- 2FA for accounts

## Deployment Strategy

### Development
- Local: `npm run dev`
- Supabase: Cloud project (free tier)
- n8n: Self-hosted

### Staging
- Frontend: Vercel preview deployments
- Database: Supabase staging project
- Edge Functions: Separate Supabase project

### Production
- Frontend: Vercel (or Cloudflare Pages)
- Database: Supabase Pro
- CDN: Cloudflare
- Monitoring: Sentry, LogRocket
- Analytics: Plausible

## Cost Estimates

### MVP (0-100 users)
- Supabase: Free tier
- Vercel: Free tier
- Domain: $12/year
- **Total: ~$1/month**

### Growth (100-1K users)
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- AI API: ~$50/month
- **Total: ~$95/month**

### Scale (1K-10K users)
- Supabase Team: $599/month
- Vercel: $20-100/month
- AI API: $200-500/month
- CDN: $50/month
- **Total: ~$900-1200/month**

## Success Metrics

### User Engagement
- Daily active users (DAU)
- Swipes per session
- Match rate (right swipes / total swipes)
- Return rate (7-day, 30-day)

### Platform Health
- Jobs added per day
- Active connectors
- Job freshness (avg age)
- API uptime

### Business Metrics
- User signups
- CV uploads
- Applications sent
- Connector registrations

## Competitive Advantages

1. **Open Ecosystem**: Anyone can add job sources
2. **AI Matching**: Better than keyword search
3. **Mobile-First**: Optimized for phone usage
4. **Speed**: Swipe through jobs in seconds
5. **Privacy**: User controls their data

## Risks & Mitigations

### Technical Risks
- **Supabase limits**: Migrate to self-hosted if needed
- **AI costs**: Implement caching, batch processing
- **Scaling**: Use read replicas, CDN

### Business Risks
- **Job quality**: Implement connector rating system
- **Spam**: Require connector approval
- **Competition**: Focus on UX and AI quality

### Legal Risks
- **Data privacy**: GDPR compliance
- **Job scraping**: Respect ToS, use APIs when possible
- **User data**: Clear privacy policy

## Contributing

See `CONNECTOR_API.md` for building connectors.

## License

MIT - See LICENSE file

## Contact

- Email: support@jobmatch.example.com
- GitHub: github.com/jobmatch
- Discord: discord.gg/jobmatch
