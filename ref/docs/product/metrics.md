# JobMatch Metrics Baseline
**Date:** 2025-10-12  
**Before:** Job enrichment with AI

## Current State

### Job Data Quality
- **Total jobs in database:** TBD
- **Jobs with empty required_skills:** TBD
- **Average skills per job:** TBD
- **Jobs using occupation fallback:** TBD

### Match Quality (Sample User: demo@lazyjobs.ink)
- **CV Skills:** ["Kommunikation", "Event och presentation", "Kund- och lokalvård"]
- **Sample bad match:** Tandsköterska - 57% match (should be ~20%)
- **Jobs shown:** TBD
- **Average match score:** TBD
- **Jobs with <30% match:** TBD
- **Jobs with >70% match:** TBD

### User Behavior (Last 7 days)
- **Total users:** TBD
- **Average swipes per session:** TBD
- **Right swipe rate:** TBD
- **Left swipe rate:** TBD
- **Undo rate:** TBD

## Expected Improvements After AI Enrichment

### Job Data Quality
- **Jobs with empty required_skills:** 0% (all enriched)
- **Average skills per job:** 5-8 skills
- **Better skill coverage:** Languages, tools, soft skills extracted

### Match Quality
- **Sample bad match:** Tandsköterska - 20% match (correct!)
- **Jobs with <30% match:** Increase (filtering out bad matches)
- **Jobs with >70% match:** Increase (better skill matching)

### User Behavior
- **Right swipe rate:** Expected to increase (better matches)
- **Session length:** Expected to increase (more relevant jobs)
- **User satisfaction:** Higher quality matches

## How to Measure

### SQL Queries for Baseline:

```sql
-- 1. Job data quality
SELECT 
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE required_skills = '[]' OR required_skills IS NULL) as empty_skills,
  AVG(jsonb_array_length(COALESCE(required_skills, '[]'::jsonb))) as avg_skills_per_job
FROM jobs
WHERE created_at > NOW() - INTERVAL '30 days';

-- 2. Match score distribution
SELECT 
  COUNT(*) FILTER (WHERE match_score < 0.3) as bad_matches,
  COUNT(*) FILTER (WHERE match_score >= 0.3 AND match_score < 0.7) as medium_matches,
  COUNT(*) FILTER (WHERE match_score >= 0.7) as good_matches,
  AVG(match_score) as avg_match_score
FROM matches
WHERE created_at > NOW() - INTERVAL '7 days';

-- 3. User swipe behavior
SELECT 
  COUNT(*) as total_swipes,
  COUNT(*) FILTER (WHERE direction = 'right') as right_swipes,
  COUNT(*) FILTER (WHERE direction = 'left') as left_swipes,
  ROUND(COUNT(*) FILTER (WHERE direction = 'right')::numeric / COUNT(*) * 100, 2) as right_swipe_rate
FROM swipes
WHERE created_at > NOW() - INTERVAL '7 days';

-- 4. Sample bad matches (jobs with low skill overlap but high match score)
SELECT 
  j.title,
  j.company,
  j.required_skills,
  m.match_score,
  p.cv_data->'skills_flat' as user_skills
FROM matches m
JOIN jobs j ON j.id = m.job_id
JOIN profiles p ON p.user_id = m.user_id
WHERE m.match_score > 0.5
  AND (j.required_skills = '[]' OR j.required_skills IS NULL)
ORDER BY m.match_score DESC
LIMIT 10;
```

## Next Steps

1. ✅ Document baseline metrics
2. ⏳ Implement AI job enrichment
3. ⏳ Run for 7 days
4. ⏳ Compare metrics
5. ⏳ Calculate improvement %

---

**Target Improvements:**
- 📉 Bad matches (<30%): -50%
- 📈 Good matches (>70%): +100%
- 📈 Right swipe rate: +20%
- 📈 Average skills per job: +300% (2 → 6)
