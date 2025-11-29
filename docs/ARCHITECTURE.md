# LazyJobs Architecture

This document describes the architecture and design patterns used in the LazyJobs application.

## Overview

LazyJobs is a job-matching application built with React, TypeScript, and Supabase. Users swipe through AI-matched job listings, save matches, and generate application materials.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Query, React Context
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **Animations**: Framer Motion

## Directory Structure

```
src/
├── components/          # React components
│   ├── ui/              # shadcn/ui base components
│   ├── layout/          # Layout components (PageContainer, etc.)
│   └── onboarding/      # Onboarding flow components
├── contexts/            # React contexts (Theme, DenseMode)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and config
├── pages/               # Route page components
├── services/            # Data access layer (Supabase queries)
├── types/               # TypeScript type definitions
└── integrations/        # External integrations (Supabase client/types)

supabase/
├── functions/           # Edge functions
└── migrations/          # Database migrations
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Components                         │
│  (pages/Swipe.tsx, pages/Matches.tsx, etc.)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Custom Hooks                             │
│  useAuth, useProfile, useJobs, useMatches, useSwipe, etc.       │
│  - Manage component state                                        │
│  - Handle loading/error states                                   │
│  - Provide optimistic updates                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Service Layer                            │
│  authService, profileService, jobService, matchService, etc.    │
│  - Direct Supabase queries                                       │
│  - Data transformation                                           │
│  - Error handling                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│  - PostgreSQL database                                           │
│  - Row Level Security (RLS)                                      │
│  - Edge Functions (job matching, application generation)         │
│  - Realtime subscriptions                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Patterns

### 1. Hook-Service Separation

Hooks manage React state and lifecycle, while services handle data access:

```typescript
// Hook: manages state, loading, errors
export const useProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      profileService.getProfile(userId).then(setProfile);
    }
  }, [userId]);

  return { profile, loading };
};

// Service: pure data access
class ProfileService {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  }
}
```

### 2. Settings Persistence

User settings are persisted in three layers:

1. **React State**: Immediate UI updates
2. **localStorage**: Cross-page persistence, instant reads
3. **Database**: Cross-device sync, source of truth

```
User changes setting
        │
        ▼
┌──────────────────┐
│  Update State    │ ← Immediate UI feedback
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Save localStorage│ ← Survives page refresh
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Debounced DB    │ ← 500ms delay, cross-device
└──────────────────┘
```

### 3. Auth State Management

Authentication follows Supabase best practices:

```typescript
useEffect(() => {
  let mounted = true;

  // Set up listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then((session) => {
    if (mounted) {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
```

### 4. Job Loading Guards

Jobs are only fetched after the profile loads to ensure stable thresholds:

```typescript
// Wait for profile to load before fetching jobs
const { jobs } = useJobs(
  profileLoading ? undefined : user?.id,  // Guard
  true,
  matchMode,
  keywordThreshold  // Now stable
);
```

This prevents race conditions where jobs load with localStorage threshold, then reload with profile threshold.

## Context Providers

### ThemeProvider
Manages light/dark/system theme with localStorage persistence.

### DenseModeProvider
Manages compact/normal display mode for UI density.

Provider hierarchy in `App.tsx`:
```tsx
<QueryClientProvider>
  <ThemeProvider>
    <DenseModeProvider>
      <TooltipProvider>
        {/* App content */}
      </TooltipProvider>
    </DenseModeProvider>
  </ThemeProvider>
</QueryClientProvider>
```

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, preferences, CV data |
| `jobs` | Job listings from connectors |
| `job_matches` | AI-computed user-job match scores |
| `swipes` | User swipe history |
| `matches` | User's saved/liked jobs |
| `applications` | Generated application materials |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `match-jobs` | AI-powered job matching |
| `generate-application` | Generate cover letter/CV |
| `ingest-jobs` | Process job data from connectors |
| `send-push-notification` | Send web push notifications |

## Security

- **Row Level Security (RLS)**: All tables have RLS policies
- **Auth Required**: Most operations require authenticated user
- **User Isolation**: Users can only access their own data

## Performance Considerations

1. **Debounced Saves**: Settings save to DB with 500ms debounce
2. **Profile-Guarded Loads**: Jobs wait for profile to prevent double-fetch
3. **Optimistic Updates**: UI updates immediately, syncs in background
4. **React Query Caching**: Automatic request deduplication and caching
