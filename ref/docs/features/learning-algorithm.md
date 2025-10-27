# 🧠 SwipeHire Learning Algorithm

## Overview
SwipeHire learns from every swipe to personalize job recommendations. The more you use it, the better it gets at showing you jobs you'll love.

## What We Learn

### 1. **Salary Preferences**
```javascript
// If user consistently swipes left on low-salary jobs
if (leftSwipes.filter(j => j.salary < 50000).length > 10) {
  learnedPreferences.min_salary_threshold = 50000
  learnedPreferences.salary_weight = 0.35 // Increase importance
}

// If user swipes right on jobs without salary info
if (rightSwipes.filter(j => !j.salary).length > 5) {
  learnedPreferences.salary_weight = 0.10 // Decrease importance
}
```

### 2. **Location Patterns**
```javascript
// Track which locations get right swipes
const locationScores = {}
rightSwipes.forEach(job => {
  locationScores[job.location] = (locationScores[job.location] || 0) + 1
})

// Boost top 3 locations
learnedPreferences.preferred_locations = 
  Object.entries(locationScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([location]) => location)
```

### 3. **Remote Work Preference**
```javascript
// Calculate remote preference
const remoteRightSwipes = rightSwipes.filter(j => j.is_remote).length
const remoteLeftSwipes = leftSwipes.filter(j => j.is_remote).length

if (remoteRightSwipes > remoteLeftSwipes * 2) {
  learnedPreferences.remote_weight = 0.40 // User loves remote!
  // Prioritize remote jobs
}
```

### 4. **Skill Match Tolerance**
```javascript
// What's the lowest match score user accepted?
const acceptedScores = rightSwipes.map(j => j.match_score)
const minAccepted = Math.min(...acceptedScores)

// Adjust threshold
if (minAccepted < 0.60) {
  learnedPreferences.min_acceptable_match_score = 0.50 // User is flexible
} else {
  learnedPreferences.min_acceptable_match_score = 0.70 // User is picky
}
```

### 5. **Company Size Preference**
```javascript
// Learn from company metadata
const likedCompanySizes = rightSwipes.map(j => j.metadata?.company_size)

if (likedCompanySizes.filter(s => s === 'startup').length > 10) {
  // User prefers startups
  learnedPreferences.preferred_company_types = ['startup', 'small']
}
```

### 6. **Job Title Patterns**
```javascript
// Extract keywords from liked job titles
const likedTitles = rightSwipes.map(j => j.title.toLowerCase())

// Common words in liked titles
const keywords = extractKeywords(likedTitles)
// e.g., ["senior", "lead", "engineer", "product"]

learnedPreferences.preferred_job_titles = keywords

// Avoid patterns
const dislikedTitles = leftSwipes.map(j => j.title.toLowerCase())
const avoidKeywords = extractKeywords(dislikedTitles)
// e.g., ["junior", "intern", "manager"]

learnedPreferences.avoided_keywords = avoidKeywords
```

### 7. **Time-Based Patterns**
```javascript
// When does user engage most?
const swipesByHour = groupBy(swipes, s => new Date(s.created_at).getHours())

// Send notifications at peak times
learnedPreferences.best_notification_time = 
  Object.entries(swipesByHour)
    .sort((a, b) => b[1].length - a[1].length)[0][0]
```

## Confidence Score

The system builds confidence over time:

```javascript
function calculateConfidence(user) {
  const totalSwipes = user.total_swipes
  
  // Need at least 20 swipes to be confident
  if (totalSwipes < 20) return totalSwipes / 20
  
  // Need balanced data (not all left or all right)
  const balance = Math.min(
    user.right_swipe_rate,
    1 - user.right_swipe_rate
  ) * 2
  
  // More swipes = more confidence (max at 100 swipes)
  const volume = Math.min(totalSwipes / 100, 1)
  
  return (balance * 0.4) + (volume * 0.6)
}
```

## Adaptive Matching Score

The final match score combines:
1. **Base algorithm** (CV + preferences)
2. **Learned preferences** (behavior patterns)
3. **Confidence weight** (how much to trust learned data)

```javascript
function adaptiveMatchScore(job, user, learnedPrefs) {
  // Base score from CV matching
  const baseScore = calculateBaseScore(job, user.cv_data)
  
  // Learned score from behavior
  const learnedScore = calculateLearnedScore(job, learnedPrefs)
  
  // Blend based on confidence
  const confidence = learnedPrefs.confidence_score
  
  return (baseScore * (1 - confidence)) + (learnedScore * confidence)
}

function calculateLearnedScore(job, prefs) {
  let score = 0.5 // Start neutral
  
  // Salary boost/penalty
  if (job.salary_min >= prefs.min_salary_threshold) {
    score += 0.15 * prefs.salary_weight
  }
  
  // Location boost
  if (prefs.preferred_locations.includes(job.location)) {
    score += 0.20 * prefs.location_weight
  }
  
  // Avoid penalty
  if (prefs.avoided_locations.includes(job.location)) {
    score -= 0.30
  }
  
  // Remote boost
  if (job.is_remote && prefs.remote_weight > 0.30) {
    score += 0.25
  }
  
  // Title keyword boost
  const titleWords = job.title.toLowerCase().split(' ')
  const hasPreferredKeyword = titleWords.some(w => 
    prefs.preferred_job_titles.includes(w)
  )
  if (hasPreferredKeyword) score += 0.15
  
  // Avoid keyword penalty
  const hasAvoidedKeyword = titleWords.some(w => 
    prefs.avoided_keywords.includes(w)
  )
  if (hasAvoidedKeyword) score -= 0.25
  
  return Math.max(0, Math.min(1, score))
}
```

## Progressive Enhancement

### Week 1 (0-20 swipes)
- Use base algorithm only
- Collect data silently
- Show "Learning your preferences..." message

### Week 2 (20-50 swipes)
- Start blending learned preferences (30% weight)
- Show "Getting better at matching..." message

### Week 3+ (50+ swipes)
- Full personalization (up to 60% weight)
- Show "Personalized for you" badge on jobs

## Privacy & Control

Users can:
1. **View learned preferences** in settings
2. **Reset learning** to start fresh
3. **Disable learning** (use base algorithm only)
4. **Export swipe data** (GDPR compliance)

## Future Enhancements

### Collaborative Filtering
```javascript
// Find similar users
const similarUsers = findUsersWithSimilarSwipes(currentUser)

// Recommend jobs they liked
const recommendations = getSimilarUsersLikedJobs(similarUsers)
  .filter(job => currentUser.hasNotSeen(job))
```

### A/B Testing
- Test different weight combinations
- Measure: right swipe rate, application rate, time to hire

### Deep Learning (Future)
- Train neural network on swipe patterns
- Predict swipe direction before showing
- Only show jobs with >70% predicted right swipe

## Metrics to Track

1. **Right Swipe Rate** - Are we showing better jobs?
2. **Application Rate** - Are users actually applying?
3. **Time to Match** - How fast do users find jobs they like?
4. **Session Length** - Are users more engaged?
5. **Return Rate** - Do users come back?

## Implementation Priority

### Phase 1 (Week 1) - Data Collection ✅
- [x] Create swipe_events table
- [x] Create learned_preferences table
- [x] Add tracking to swipe handler

### Phase 2 (Week 2) - Basic Learning
- [ ] Calculate salary threshold
- [ ] Track location preferences
- [ ] Update match-jobs function

### Phase 3 (Week 3) - Adaptive Scoring
- [ ] Implement confidence score
- [ ] Blend base + learned scores
- [ ] Show personalization indicators

### Phase 4 (Month 2) - Advanced Features
- [ ] Collaborative filtering
- [ ] A/B testing framework
- [ ] User preference dashboard

### Phase 5 (Month 3+) - ML/AI
- [ ] Train ML model
- [ ] Predictive scoring
- [ ] Auto-apply suggestions
