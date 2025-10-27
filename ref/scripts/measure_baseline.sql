-- JobMatch Baseline Metrics
-- Run this in Supabase SQL Editor before implementing AI enrichment
-- Date: 2025-10-12

-- ============================================
-- 1. JOB DATA QUALITY
-- ============================================
SELECT 
  'Job Data Quality' as metric_category,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE required_skills IS NULL OR array_length(required_skills, 1) IS NULL OR array_length(required_skills, 1) = 0) as jobs_with_empty_skills,
  ROUND(COUNT(*) FILTER (WHERE required_skills IS NULL OR array_length(required_skills, 1) IS NULL OR array_length(required_skills, 1) = 0)::numeric / COUNT(*) * 100, 2) as pct_empty_skills,
  ROUND(AVG(COALESCE(array_length(required_skills, 1), 0)), 2) as avg_skills_per_job
FROM jobs
WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================
-- 2. MATCH SCORE DISTRIBUTION
-- ============================================
SELECT 
  'Match Score Distribution' as metric_category,
  COUNT(*) as total_matches,
  COUNT(*) FILTER (WHERE match_score < 0.3) as bad_matches_under_30,
  COUNT(*) FILTER (WHERE match_score >= 0.3 AND match_score < 0.7) as medium_matches_30_70,
  COUNT(*) FILTER (WHERE match_score >= 0.7) as good_matches_over_70,
  ROUND(AVG(match_score) * 100, 2) as avg_match_score_pct
FROM matches
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- 3. USER SWIPE BEHAVIOR
-- ============================================
SELECT 
  'User Swipe Behavior' as metric_category,
  COUNT(*) as total_swipes,
  COUNT(*) FILTER (WHERE direction = 'right') as right_swipes,
  COUNT(*) FILTER (WHERE direction = 'left') as left_swipes,
  ROUND(COUNT(*) FILTER (WHERE direction = 'right')::numeric / NULLIF(COUNT(*), 0) * 100, 2) as right_swipe_rate_pct
FROM swipes
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- 4. SAMPLE BAD MATCHES (High score but no skills)
-- ============================================
SELECT 
  'Sample Bad Matches' as metric_category,
  j.title,
  j.company,
  j.location,
  COALESCE(array_length(j.required_skills, 1), 0) as num_required_skills,
  ROUND(m.match_score * 100, 0) as match_score_pct,
  m.created_at::date as matched_date
FROM matches m
JOIN jobs j ON j.id = m.job_id
WHERE m.match_score > 0.5
  AND (j.required_skills IS NULL OR array_length(j.required_skills, 1) IS NULL OR array_length(j.required_skills, 1) = 0)
  AND m.created_at > NOW() - INTERVAL '7 days'
ORDER BY m.match_score DESC
LIMIT 10;

-- ============================================
-- 5. ACTIVE USERS
-- ============================================
SELECT 
  'Active Users' as metric_category,
  COUNT(DISTINCT user_id) as total_users_with_swipes,
  ROUND(AVG(swipe_count), 2) as avg_swipes_per_user
FROM (
  SELECT user_id, COUNT(*) as swipe_count
  FROM swipes
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY user_id
) user_swipes;
