# Progressive Loading Implementation (Archived)

**Date Archived:** 2025-11-14  
**Reason:** Replaced by pre-computed matches architecture using `job_matches` table  
**Use Case:** LLM-based job matching with on-demand analysis

---

## Concept

Progressive loading was designed to optimize expensive LLM matching calls by:
1. Starting with a small batch (5 jobs)
2. Analyzing more jobs in the background as the user swiped
3. Appending new matches to the stack without disrupting the current card

**Goal:** Only analyze jobs that the user is likely to see, saving API costs and time.

---

## Architecture

### 1. Hook: `src/hooks/useJobs.ts`

**Key Features:**
- Dynamic limit that increases based on user interaction
- Background fetching with cooldown mechanism (5 seconds)
- Append mode vs. replace mode for job array updates
- Pending fetch queue to prevent race conditions

**State Management:**
```typescript
const [dynamicLimit, setDynamicLimit] = useState(matchMode === "llm" ? 5 : topN);
const [backgroundFetching, setBackgroundFetching] = useState(false);
const lastFetchTimeRef = useRef<number>(0);
const pendingFetchRef = useRef<NodeJS.Timeout | null>(null);
```

**Key Function: `loadJobs()`**
```typescript
loadJobs(isBackgroundFetch = false, limitOverride?: number, appendToExisting = false)
```

- `isBackgroundFetch`: If true, sets backgroundFetching state (doesn't block main loading state)
- `limitOverride`: Allows caller to specify exact limit (bypasses dynamicLimit)
- `appendToExisting`: If true, appends new jobs to existing array instead of replacing

**Cooldown Logic:**
- 5-second cooldown between background fetches
- Queued fetches scheduled via `setTimeout` if cooldown is active
- Prevents hammering the LLM edge function

**Deduplication:**
```typescript
setJobs(prevJobs => {
  const existingIds = new Set(prevJobs.map(j => j.id));
  const newJobs = filtered.filter(j => !existingIds.has(j.id));
  return [...prevJobs, ...newJobs];
});
```

**Exported API:**
```typescript
return { 
  jobs, 
  loading, 
  error, 
  refetch: loadJobs, 
  triggerBackgroundFetch, 
  dynamicLimit, 
  backgroundFetching 
};
```

---

### 2. Consumer: `src/pages/Swipe.tsx`

**Progressive Loading Strategy:**

**Phase 1: Initial Load (5 jobs)**
```typescript
const { jobs, loading, triggerBackgroundFetch, backgroundFetching } = useJobs(
  user?.id,
  true,
  "llm",
  0.65,
  5 // Initial limit
);
```

**Phase 2: First Swipe Trigger (25 jobs)**
```typescript
useEffect(() => {
  if (currentIndex === 1 && !firstFetchTriggered && matchMode === "llm") {
    triggerBackgroundFetch?.(25);
    setFirstFetchTriggered(true);
  }
}, [currentIndex]);
```

**Phase 3: Continuous Top-Up (25 jobs per trigger)**
```typescript
useEffect(() => {
  const shouldFetchMore = 
    matchMode === "llm" && 
    jobs.length > 0 && 
    remainingJobs <= 10 && 
    !backgroundFetching;

  if (shouldFetchMore) {
    triggerBackgroundFetch?.(25);
  }
}, [remainingJobs, backgroundFetching]);
```

---

### 3. UI Feedback: `src/components/JobCard.tsx`

**Progress Footer:**
```tsx
{isActive && (
  <div className="bg-muted/30 px-6 py-3 text-center text-sm text-muted-foreground">
    {isBackgroundFetching ? (
      <div className="flex items-center justify-center gap-2">
        <div className="w-3 h-3 border-2 border-primary animate-spin" />
        <span>Analyzing more jobs... ({totalJobsAnalyzed} analyzed so far)</span>
      </div>
    ) : (
      <span>{totalJobsAnalyzed} jobs analyzed • Tap score for details</span>
    )}
  </div>
)}
```

**Props Passed:**
- `isBackgroundFetching`: Shows spinner when loading
- `totalJobsAnalyzed`: Running count of jobs analyzed (jobs.length)

---

## Flow Diagram

```
User Opens /swipe (LLM mode)
  ↓
[Initial Load: 5 jobs] → Edge Function: match-jobs-llm (limit=5)
  ↓
User swipes first card (currentIndex becomes 1)
  ↓
[Trigger: First swipe detected]
  ↓
[Background Fetch: 25 jobs] → Edge Function: match-jobs-llm (limit=25)
  ↓                              ↓
  |                         Jobs analyzed
  |                              ↓
  |                         Append to existing array (dedupe by ID)
  ↓                              ↓
User keeps swiping              Stack grows from 5 → 30 jobs
  ↓
remainingJobs <= 10
  ↓
[Trigger: Stack low]
  ↓
[Background Fetch: 25 more jobs] → Edge Function: match-jobs-llm (limit=25)
  ↓
Append again → Stack now has 55 jobs
  ↓
(Repeat as needed)
```

---

## Challenges Faced

### 1. **Race Conditions**
- Initial load and first background fetch could overlap
- Solution attempted: Cooldown mechanism with queued fetches
- **Problem:** Cooldown scheduling didn't preserve `appendToExisting` flag

### 2. **CardStack Instability**
- Original key: `key={\`${matchMode}-${currentIndex}\`}`
- Caused CardStack to remount on every swipe → cards replayed animation
- Fixed by: `key={matchMode}` (only remount on mode change)

### 3. **Confusing "Jobs Left" Counter**
- Showed "3 left" then "28 left" then "2 left" as jobs were appended
- Users confused: "How many jobs are there really?"
- Solution: Removed "jobs left", only showed "X jobs analyzed"

### 4. **Cards Disappearing While Reading**
- Jobs array replaced instead of appended during background fetch
- Caused by: Bug in cooldown setTimeout not passing `appendToExisting=true`
- Stack became unstable, current card could be replaced

### 5. **Stale State Updates**
- Multiple in-flight requests could update state out of order
- Needed request sequencing to ensure only latest request updates state

---

## Why We Moved Away

### The Fundamental Problem
**Best matches might never appear if user doesn't swipe far enough.**

With progressive loading:
- Job #1 (80% match) appears immediately
- Job #47 (95% match - PERFECT!) only appears after 46 swipes
- User gives up at job #20, never sees their dream job

### The Solution
**Pre-computed matches in `job_matches` table:**
- n8n workflow analyzes ALL jobs for ALL users nightly
- Results stored with match_score, recommendation, breakdown
- Frontend simply queries: `ORDER BY match_score DESC LIMIT 100`
- Best matches appear FIRST, guaranteed

### Additional Benefits
1. **No race conditions** - no background fetches during swipe
2. **Stable UI** - job list doesn't change while swiping
3. **Instant loading** - no edge function calls during swipe
4. **Better UX** - users see their best matches immediately
5. **Scalable** - batch processing is more efficient than on-demand

---

## If You Need to Restore This

### Required Files
1. `src/hooks/useJobs.ts` - Progressive loading logic
2. `src/pages/Swipe.tsx` - Trigger logic with useEffect
3. `src/components/JobCard.tsx` - Progress footer UI

### Edge Function Required
- `supabase/functions/match-jobs-llm/index.ts`
- Must support `limit` parameter for batch sizing

### Key Props to Pass
```typescript
// In Swipe.tsx
const { 
  jobs, 
  loading, 
  triggerBackgroundFetch, 
  backgroundFetching 
} = useJobs(userId, true, "llm", 0.65, 5);

// To JobCard
<JobCard
  isBackgroundFetching={backgroundFetching}
  totalJobsAnalyzed={jobs.length}
  // ...
/>
```

### Testing Checklist
- [ ] Initial 5 jobs load
- [ ] After first swipe, 25 more jobs fetch in background
- [ ] When 10 jobs remain, another 25 fetch
- [ ] Cooldown prevents rapid-fire requests
- [ ] Jobs append without replacing current card
- [ ] Progress footer shows accurate count
- [ ] No cards disappear while reading

---

## Lessons Learned

1. **Progressive loading is complex** - race conditions, state management, timing
2. **UX matters more than optimization** - seeing best matches first > saving API calls
3. **Batch processing > on-demand** - pre-compute overnight, serve instantly
4. **Simple is better** - static sorted list > dynamic progressive loading
5. **Don't over-optimize early** - we built complexity before validating the need

---

## Code Snippets for Reference

### Cooldown Logic (From useJobs.ts)
```typescript
const COOLDOWN_MS = 5000;

if (isBackgroundFetch && timeSinceLastFetch < COOLDOWN_MS) {
  const waitTime = COOLDOWN_MS - timeSinceLastFetch;
  pendingFetchRef.current = setTimeout(() => {
    loadJobs(isBackgroundFetch, limitOverride, appendToExisting); // KEY: preserve flags
  }, waitTime);
  return;
}
```

### Append with Deduplication
```typescript
if (appendToExisting && isBackgroundFetch) {
  setJobs(prevJobs => {
    const existingIds = new Set(prevJobs.map(j => j.id));
    const newJobs = filtered.filter(j => !existingIds.has(j.id));
    console.log(`➕ Appending ${newJobs.length} new jobs`);
    return [...prevJobs, ...newJobs];
  });
}
```

### Progressive Trigger Logic
```typescript
// Phase 1: First swipe
if (currentIndex === 1 && !firstFetchTriggered && matchMode === "llm") {
  triggerBackgroundFetch(25);
  setFirstFetchTriggered(true);
}

// Phase 2: Continuous top-up
if (matchMode === "llm" && remainingJobs <= 10 && !backgroundFetching) {
  triggerBackgroundFetch(25);
}
```

---

**End of Documentation**
