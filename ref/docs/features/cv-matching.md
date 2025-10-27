# CV-Based Job Matching

## How It Works

Your JobMatch platform now uses AI-powered matching based on CV data!

### Flow

1. **User uploads CV** (PDF) in Settings
2. **n8n processes CV** → Extracts structured data
3. **Data saved to database** → `profiles.cv_data`
4. **Matching algorithm ranks jobs** → Based on CV + preferences
5. **Jobs shown in order** → Best matches first!

## Your CV Data Structure

Based on your n8n parser response:

```json
{
  "name": "Magnus Froste",
  "email": "cmfroste@gmail.com",
  "phone": "0761090788",
  "role": "Product Development Leader",
  "bio": "Product Development Leader | Driving Growth...",
  "experience_years": 21.25,
  "skills": [
    "Product Management",
    "Product Development",
    "Cloud",
    "IoT",
    "AI",
    "Python",
    "AWS",
    "Azure",
    // ... 40+ skills
  ],
  "work_experience": [...],
  "education": [...],
  "languages": [...]
}
```

## Matching Algorithm

The `match-jobs` Edge Function scores each job based on:

### 1. **Skill Matching** (30% weight)
- Compares `cv_data.skills` with `job.required_skills`
- More matched skills = higher score
- Example: If you have "Python, AWS, React" and job requires "Python, AWS, Docker"
  - 2/3 skills match = +0.20 score boost

### 2. **Remote Preference** (20% weight)
- If `preferences.remote_only = true` and `job.is_remote = true`
  - Score +0.20
- If you want remote but job isn't
  - Score -0.30

### 3. **Salary Match** (20% weight)
- If `job.salary_min >= preferences.salary_min`
  - Score +0.20
- If job pays less than desired
  - Score -0.10

### 4. **Location Match** (15% weight)
- Compares `preferences.location` with `job.location`
- Partial matches count (e.g., "San Francisco" matches "San Francisco, CA")

### 5. **Employment Type** (10% weight)
- Matches `preferences.employment_types` with `job.employment_type`
- Full-time, part-time, contract, internship

### 6. **Recency Boost** (5% weight)
- Jobs posted in last 7 days get +0.05 score

## Example Scoring

For Magnus with skills in Product Management, Cloud, AI, Python:

**Job A: Senior Product Manager @ Tech Corp**
- Skills: Product Management, Agile, Stakeholder Management
- Match: 1/3 skills = +0.10
- Remote: Yes (+0.20)
- Salary: $150k (above $120k min) = +0.20
- Location: San Francisco (matches) = +0.15
- **Total Score: 0.65** ⭐

**Job B: Junior Developer @ Startup**
- Skills: JavaScript, React, Node.js
- Match: 0/3 skills = +0.00
- Remote: No (-0.30)
- Salary: $80k (below $120k min) = -0.10
- Location: Austin (doesn't match) = +0.00
- **Total Score: 0.10** ❌

Jobs are sorted by score, so Job A appears first!

## Testing the Matching

### 1. Upload Your CV
```
Settings → Upload CV → Select PDF → n8n processes it
```

### 2. Set Preferences
```
Settings → Job Preferences:
- Location: "Stockholm" or "Remote"
- Minimum Salary: 100000
- Remote only: ✓
- Employment Types: Full-time, Contract
```

### 3. Swipe!
Jobs will now be ranked by how well they match your profile!

## Improving the Algorithm

### Current: Rule-Based
Simple scoring based on keyword matching and preferences.

### Future: AI-Powered
Replace the scoring logic with OpenAI/Anthropic:

```typescript
// In match-jobs Edge Function
const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'You are a job matching expert. Score how well this job matches the candidate.'
    }, {
      role: 'user',
      content: `
        Candidate CV: ${JSON.stringify(cvData)}
        Job: ${JSON.stringify(job)}
        
        Return a score from 0-1 and explain why.
      `
    }]
  })
})
```

### Benefits of AI Matching
- **Semantic understanding**: "Product Manager" matches "Product Owner"
- **Context awareness**: Understands seniority levels
- **Career progression**: Suggests growth opportunities
- **Cultural fit**: Analyzes company descriptions
- **Personalization**: Learns from swipe patterns

## Monitoring Match Quality

Track these metrics:

1. **Match Rate**: % of right swipes vs total swipes
2. **Score Distribution**: Are high-scored jobs getting liked?
3. **Feedback Loop**: Do users apply to matched jobs?

## Next Steps

1. ✅ **Upload your CV** to test matching
2. ✅ **Set preferences** for better results
3. ✅ **Add more jobs** to see ranking in action
4. 🔄 **Iterate on algorithm** based on user feedback
5. 🚀 **Integrate AI** for semantic matching

## Your CV is Ready!

Your n8n parser returns perfect data structure. Just:
1. Click Settings (⚙️)
2. Upload PDF
3. Watch the magic happen! ✨

The matching algorithm will use your 40+ skills, 21 years experience, and preferences to rank jobs perfectly for you!
