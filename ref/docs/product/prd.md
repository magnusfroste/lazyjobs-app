# JobMatch - Product Requirements Document (PRD)

## Vision & Mission

**Vision**: The simplest way to find your next job.

**Mission**: Upload CV → Swipe → Match → Apply. Nothing more, nothing less.

## Guiding Principles

1. **Keep It Stupid Simple (KISS)** - If it's not essential, cut it.
2. **Less is More** - Every feature must justify its existence.
3. **Mobile First** - Optimized for thumb-driven, one-handed use.
4. **Speed** - From CV upload to first swipe in under 60 seconds.
5. **Zero Friction** - No endless forms, no complex filters, no analysis paralysis.

## Core User Flow

```
1. Sign Up (email/OAuth) → 30 seconds
2. Upload CV (PDF) → 15 seconds  
3. Start Swiping → immediate
4. View Matches → 1 tap
5. Apply → 1 tap to external link
```

**Total time to first swipe: < 60 seconds**

## Core Features (MVP)

### 1. Authentication
- **Email + Password** (simple, works everywhere)
- **OAuth** (Google, LinkedIn - optional)
- **Email verification** (security)
- **NO**: Social login spam, complex password rules, 2FA (yet)

### 2. CV Upload
- **Upload PDF** → n8n processes → Extract skills, experience
- **Auto-fill preferences** from CV (location, salary expectations)
- **Show extracted data** (name, role, years, top 10 skills)
- **NO**: Manual skill entry, resume builders, multiple CVs

### 3. Swipe Interface
- **One job at a time** (focus)
- **Swipe left** = Not interested
- **Swipe right** = Interested (creates match)
- **Undo** = Oops, go back one
- **Match score badge** = Show % match (transparency)
- **NO**: Filters, search, sorting, bulk actions

### 4. Job Card
- **Title & Company** (big, bold)
- **Location + Remote badge**
- **Salary range** (if available)
- **Top 5 required skills** (pills)
- **Employment type** (full-time, contract, etc.)
- **Match score** (% badge)
- **NO**: Long descriptions, company logos, apply buttons (yet)

### 5. Matches View
- **List of liked jobs** (chronological)
- **Mark as Applied** (checkbox)
- **View Job** (external link to original posting)
- **Remove Match** (cleanup)
- **NO**: Notes, reminders, application tracking (yet)

### 6. Settings
- **Profile**: Name, email (read-only)
- **CV Upload**: Replace CV anytime
- **Preferences**: Location, min salary, remote only, employment types
- **Logout**
- **NO**: Account deletion, privacy settings, notifications (yet)

## AI Matching Algorithm

### Current (Rule-Based)
- **Skill matching** (30%): Your skills vs job requirements
- **Salary** (20%): Job pays ≥ your minimum
- **Remote** (20%): Matches your preference
- **Location** (15%): Partial string match
- **Employment type** (10%): Full-time, contract, etc.
- **Recency** (5%): Newer jobs boosted

### Future (AI-Powered)
- **Semantic matching**: "Product Manager" = "Product Owner"
- **Career progression**: Suggest growth opportunities
- **Learning from swipes**: Improve based on patterns
- **NO**: Over-engineering, black box AI, slow responses

## Technical Architecture

### Frontend
- **React 19** + **Vite** (fast, modern)
- **TailwindCSS** (utility-first, mobile-first)
- **Framer Motion** (smooth swipe animations)
- **Supabase JS** (auth + data)
- **PWA** (installable, works offline)

### Backend
- **Supabase** (PostgreSQL + Auth + Edge Functions)
- **Row Level Security** (data protection)
- **Edge Functions** (serverless, fast)
- **n8n** (CV processing, job connectors)

### Mobile
- **PWA first** (no app store friction)
- **Native apps later** (React Native, if needed)

## Data Model (Simplified)

```
profiles
├── id, email, name
├── cv_data (JSONB) - Extracted from CV
└── preferences (JSONB) - Job preferences

jobs
├── id, title, company, description
├── location, salary_min, salary_max
├── is_remote, employment_type
├── required_skills (array)
└── connector_id (source)

swipes
├── user_id, job_id
├── direction (left/right)
└── created_at

matches (right swipes only)
├── user_id, job_id
├── match_score (0-1)
├── is_applied (boolean)
└── created_at
```

## User Personas

### Primary: "The Busy Professional"
- **Age**: 25-45
- **Goal**: Find better job without wasting time
- **Pain**: Job boards are overwhelming, too many irrelevant jobs
- **Behavior**: Swipes during commute, lunch break, evening
- **Success**: Finds 3-5 relevant jobs per week, applies to 1-2

### Secondary: "The Career Changer"
- **Age**: 30-50
- **Goal**: Transition to new role/industry
- **Pain**: Not sure what matches their transferable skills
- **Behavior**: Explores different job types, learns from matches
- **Success**: Discovers opportunities they didn't know existed

## Success Metrics

### Engagement
- **Time to first swipe**: < 60 seconds
- **Swipes per session**: 10-20 jobs
- **Session frequency**: 3-5x per week
- **Match rate**: 20-30% (right swipes)

### Quality
- **Match score accuracy**: 70%+ of high-scored jobs get liked
- **Application rate**: 10-20% of matches get applied to
- **User retention**: 40%+ return after 7 days

### Growth
- **Signups per week**: Track growth
- **Active users**: Weekly/monthly active
- **Jobs added**: New jobs per day
- **Connectors**: Active job sources

## Roadmap

### Phase 1: MVP (DONE ✅)
- Basic swipe interface
- CV upload + n8n processing
- Match scoring
- Matches view
- Settings

### Phase 2: Polish (Next 2 weeks)
- **Onboarding flow**: 3-step wizard (signup → upload CV → preferences)
- **Empty states**: Better messaging when no jobs
- **Loading states**: Skeletons, progress indicators
- **Error handling**: Friendly error messages
- **Mobile polish**: Gestures, haptics, animations

### Phase 3: Growth (Weeks 3-4)
- **5-10 job connectors**: Real job sources
- **Email notifications**: Weekly digest of new matches
- **Share feature**: Share jobs with friends
- **Feedback loop**: "Why this match?" explanation

### Phase 4: Scale (Month 2)
- **AI matching**: OpenAI/Anthropic integration
- **Application tracking**: Track where you applied
- **Company profiles**: Learn about companies
- **Salary insights**: Market data

### Phase 5: Monetization (Month 3+)
- **Premium features**: Unlimited swipes, priority matching
- **Recruiter tools**: Post jobs, see candidates
- **Connector marketplace**: Developers earn from connectors
- **White-label**: B2B solution for companies

## What We WON'T Build (Anti-Roadmap)

❌ **Resume builder** - Use existing tools
❌ **Job search** - Defeats the purpose of swiping
❌ **Advanced filters** - Analysis paralysis
❌ **Messaging/chat** - Go to company site
❌ **Interview scheduling** - External tools exist
❌ **Salary negotiation** - Out of scope
❌ **Career coaching** - Different product
❌ **Social features** - Not LinkedIn
❌ **Job alerts** - Email digest is enough
❌ **Save for later** - Swipe right or left, decide now

## Design Principles

### Mobile First
- **Thumb zone**: All actions within easy reach
- **Large tap targets**: 44x44px minimum
- **Swipe gestures**: Natural, intuitive
- **Minimal text**: Scannable, not readable
- **Fast loading**: < 2 seconds

### Visual Hierarchy
1. **Job title** (largest, boldest)
2. **Company** (secondary)
3. **Match score** (badge, top right)
4. **Key details** (location, salary, remote)
5. **Skills** (pills, scannable)

### Color System
- **Primary**: Blue (trust, professional)
- **Success**: Green (remote, applied)
- **Warning**: Yellow (low match)
- **Danger**: Red (reject)
- **Neutral**: Gray (text, backgrounds)

### Typography
- **Headings**: Bold, 24-32px
- **Body**: Regular, 16-18px
- **Small**: 14px (badges, labels)
- **Mobile**: 16px minimum (readability)

## Content Strategy

### Job Descriptions
- **Keep original** from source
- **Show preview** (first 200 chars)
- **Full text** on external link

### Match Explanations
- **Show score** (transparency)
- **Future**: "Why this match?" breakdown
  - "5/7 skills match"
  - "Salary above your minimum"
  - "Remote as preferred"

### Empty States
- **No jobs**: "You've seen all jobs! Check back tomorrow."
- **No matches**: "Start swiping to find your matches!"
- **No CV**: "Upload your CV to get better matches"

## Privacy & Security

### Data Collection
- **Minimal**: Email, name, CV data, swipe history
- **Purpose**: Matching only
- **NO**: Tracking, analytics abuse, selling data

### Data Retention
- **CV data**: Until user deletes account
- **Swipe history**: 90 days (for learning)
- **Matches**: Until user removes

### GDPR Compliance
- **Right to access**: Export your data
- **Right to delete**: Delete account + all data
- **Right to portability**: Download CV data

## Competitive Advantages

1. **Speed**: 60 seconds to first swipe (vs 10+ minutes on LinkedIn)
2. **Simplicity**: One job at a time (vs overwhelming lists)
3. **AI Matching**: Better than keyword search
4. **Mobile First**: Designed for phone (vs desktop-first)
5. **Open Ecosystem**: Anyone can add job sources

## Risks & Mitigations

### Risk: Job Quality
- **Mitigation**: Connector approval, user ratings, spam detection

### Risk: Not Enough Jobs
- **Mitigation**: Build 10+ connectors quickly, focus on quality over quantity

### Risk: Poor Matches
- **Mitigation**: Iterate on algorithm, collect feedback, add AI

### Risk: User Fatigue
- **Mitigation**: Limit swipes per day (gamification), weekly digest

### Risk: Competition
- **Mitigation**: Speed to market, better UX, open ecosystem

## Launch Strategy

### Pre-Launch (Week 1)
- **Beta testers**: 20-50 users
- **Feedback**: Iterate on UX
- **Content**: 100+ jobs loaded

### Launch (Week 2)
- **Product Hunt**: Main launch channel
- **Reddit**: r/forhire, r/remotejobs
- **Twitter/X**: Thread about the vision
- **Hacker News**: "Show HN: Tinder for Jobs"

### Post-Launch (Weeks 3-4)
- **Iterate**: Based on feedback
- **Content**: Add more connectors
- **Growth**: Referral system

## Success Definition

### Week 1
- ✅ 100+ signups
- ✅ 50+ CVs uploaded
- ✅ 1000+ swipes
- ✅ 200+ matches

### Month 1
- ✅ 500+ active users
- ✅ 10,000+ swipes
- ✅ 5+ active connectors
- ✅ 20%+ match rate

### Month 3
- ✅ 2,000+ active users
- ✅ 50,000+ swipes
- ✅ 20+ active connectors
- ✅ Revenue model validated

## Open Questions

1. **Swipe limit?** Unlimited or daily cap (e.g., 50/day)?
2. **Monetization timing?** Month 3 or wait longer?
3. **Native apps?** PWA sufficient or build React Native?
4. **AI provider?** OpenAI, Anthropic, or local model?
5. **Connector approval?** Manual review or automated?

## Conclusion

**JobMatch is the simplest way to find your next job.**

Upload CV → Swipe → Match → Apply.

Everything else is noise.

---

**Version**: 1.0  
**Last Updated**: 2025-10-10  
**Owner**: Magnus Froste  
**Status**: MVP Complete, Ready for Beta
