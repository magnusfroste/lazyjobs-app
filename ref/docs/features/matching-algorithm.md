# 🎯 SwipeHire Matching Algorithm

## Overview
The matching algorithm calculates how well a job matches a user's CV and preferences. Scores range from 0% to 100%.

## Algorithm Weights

### Total Score Breakdown:
- **Skills**: 50% (MOST IMPORTANT!)
- **Salary**: 20%
- **Location**: 15%
- **Remote**: 10%
- **Employment Type**: 5%

---

## 1. Skill Matching (50% weight)

**Most critical factor!** Skills determine if you can actually do the job.

### Logic:
```javascript
if (user has skills AND job requires skills) {
  matchedSkills = intersection(userSkills, jobSkills)
  matchRatio = matchedSkills / jobSkills
  
  if (matchedSkills === 0) {
    skillScore = 0.1  // Very low! (10%)
  } else {
    skillScore = 0.3 + (matchRatio * 0.7)  // 30-100%
  }
} else if (job has no required skills) {
  skillScore = 0.5  // Neutral (50%)
} else {
  skillScore = 0.1  // User has no skills, job needs them (10%)
}

finalScore += skillScore * 0.5  // Apply 50% weight
```

### Examples:
- **0/5 skills match**: 10% × 50% = **5% contribution**
- **2/5 skills match**: 58% × 50% = **29% contribution**
- **5/5 skills match**: 100% × 50% = **50% contribution**

**Key Point**: Zero skill match = maximum 50% total score (even with perfect everything else)

---

## 2. Salary Matching (20% weight)

### Logic:
```javascript
if (user has min salary AND job has salary) {
  if (jobSalary >= userMinSalary) {
    salaryScore = 1.0  // Perfect! (100%)
  } else {
    salaryScore = jobSalary / userMinSalary  // Proportional
    salaryScore = max(0.2, salaryScore)  // Minimum 20%
  }
} else {
  salaryScore = 0.5  // Neutral if no data (50%)
}

finalScore += salaryScore * 0.2  // Apply 20% weight
```

### Examples:
- **Job: 60k, User wants: 50k**: 100% × 20% = **20% contribution**
- **Job: 40k, User wants: 50k**: 80% × 20% = **16% contribution**
- **Job: 30k, User wants: 50k**: 60% × 20% = **12% contribution**
- **No salary data**: 50% × 20% = **10% contribution**

---

## 3. Location Matching (15% weight)

### Logic:
```javascript
if (user has location preference AND job has location) {
  if (jobLocation.includes(userLocation)) {
    locationScore = 1.0  // Perfect match (100%)
  } else {
    locationScore = 0.3  // Different location (30%)
  }
} else {
  locationScore = 0.5  // Neutral (50%)
}

finalScore += locationScore * 0.15  // Apply 15% weight
```

### Examples:
- **Both Stockholm**: 100% × 15% = **15% contribution**
- **Different cities**: 30% × 15% = **4.5% contribution**
- **No location data**: 50% × 15% = **7.5% contribution**

---

## 4. Remote Preference (10% weight)

### Logic:
```javascript
if (user wants remote only) {
  remoteScore = job.isRemote ? 1.0 : 0.2  // 100% or 20%
} else if (job is remote) {
  remoteScore = 0.8  // Remote is a bonus (80%)
} else {
  remoteScore = 0.5  // Neutral (50%)
}

finalScore += remoteScore * 0.1  // Apply 10% weight
```

### Examples:
- **User wants remote, job is remote**: 100% × 10% = **10% contribution**
- **User wants remote, job is on-site**: 20% × 10% = **2% contribution**
- **User flexible, job is remote**: 80% × 10% = **8% contribution**

---

## 5. Employment Type (5% weight)

### Logic:
```javascript
if (user has type preference AND job has type) {
  if (userTypes.includes(jobType)) {
    employmentScore = 1.0  // Match (100%)
  } else {
    employmentScore = 0.3  // Mismatch (30%)
  }
} else {
  employmentScore = 0.5  // Neutral (50%)
}

finalScore += employmentScore * 0.05  // Apply 5% weight
```

### Examples:
- **Both full-time**: 100% × 5% = **5% contribution**
- **User wants full-time, job is contract**: 30% × 5% = **1.5% contribution**

---

## Example Calculations

### Example 1: Perfect Match
```
User: Software Engineer with React, Node.js, Python
Job: Senior Developer needing React, Node.js

Skills: 2/2 match = 100% × 50% = 50%
Salary: 70k vs 50k min = 100% × 20% = 20%
Location: Both Stockholm = 100% × 15% = 15%
Remote: Both remote = 100% × 10% = 10%
Type: Both full-time = 100% × 5% = 5%

TOTAL: 100% ✅ Perfect match!
```

### Example 2: Good Match
```
User: Frontend Developer with React, CSS
Job: Full Stack Developer needing React, Node.js, Python

Skills: 1/3 match = 43% × 50% = 21.5%
Salary: 55k vs 50k min = 100% × 20% = 20%
Location: Both Stockholm = 100% × 15% = 15%
Remote: Both remote = 100% × 10% = 10%
Type: Both full-time = 100% × 5% = 5%

TOTAL: 71.5% ✅ Good match
```

### Example 3: Bad Match (Your Bug!)
```
User: Marketing Manager (no tech skills)
Job: Full Stack Developer needing React, Node.js, Python

Skills: 0/3 match = 10% × 50% = 5%  ⚠️ CRITICAL!
Salary: 60k vs 50k min = 100% × 20% = 20%
Location: Both Stockholm = 100% × 15% = 15%
Remote: Both remote = 100% × 10% = 10%
Type: Both full-time = 100% × 5% = 5%

TOTAL: 55% ❌ Should be LOW, not 85%!
```

**OLD ALGORITHM BUG**: Started at 50% base, so even with zero skills you got 85%!  
**NEW ALGORITHM FIX**: Starts at 0%, skills are 50% weight, so zero skills = max 50% total.

---

## Why Skills Are 50%?

**Skills determine if you can do the job!**

- Salary, location, remote are **preferences** (nice to have)
- Skills are **requirements** (must have)
- Without skills, you literally cannot perform the role
- A remote, high-paying job is useless if you can't do it!

---

## Minimum Viable Scores

### By Category:
- **Excellent**: 80%+ (Apply immediately!)
- **Good**: 65-79% (Strong candidate)
- **Fair**: 50-64% (Possible match, stretch role)
- **Poor**: 35-49% (Significant gaps)
- **Bad**: <35% (Wrong fit)

### By Skill Match:
- **5/5 skills**: Can reach 100%
- **3/5 skills**: Max ~80%
- **1/5 skills**: Max ~60%
- **0/5 skills**: Max ~50%

---

## Future Improvements

### Phase 2: Experience Level
Add weight for seniority matching:
- Junior role + Junior user = +10%
- Senior role + Junior user = -15%

### Phase 3: Industry Match
Add weight for industry experience:
- FinTech job + FinTech experience = +5%

### Phase 4: Company Size
Add weight for company size preference:
- Startup job + Startup experience = +5%

### Phase 5: AI/ML Model
Replace rule-based with ML:
- Train on successful hires
- Learn complex patterns
- Predict application success

---

## Testing the Algorithm

### Test Cases:

1. **Perfect Match**:
   - User: React, Node.js, Python
   - Job: React, Node.js, Python
   - Expected: ~100%

2. **Partial Match**:
   - User: React, CSS
   - Job: React, Node.js, Python
   - Expected: ~60-70%

3. **No Skill Match**:
   - User: Marketing, Sales
   - Job: React, Node.js, Python
   - Expected: <50%

4. **High Salary Mismatch**:
   - User wants: 100k
   - Job offers: 50k
   - Expected: Significant penalty

---

## Deployment

To deploy the updated algorithm:

```bash
cd supabase/functions/match-jobs
supabase functions deploy match-jobs
```

Or deploy all functions:
```bash
supabase functions deploy
```

---

**Algorithm Version**: 2.0  
**Last Updated**: January 11, 2025  
**Status**: ✅ Fixed - Skills now properly weighted!
