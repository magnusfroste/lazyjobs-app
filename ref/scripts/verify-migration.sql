-- Verify Migration Success
-- Run this in Supabase SQL Editor to confirm everything is working

-- 1. Verify connectors table is gone
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'connectors'
) as connectors_table_exists;
-- Expected: false

-- 2. Verify connector_id column is gone from jobs
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'jobs' 
  AND column_name = 'connector_id'
) as connector_id_column_exists;
-- Expected: false

-- 3. Show current jobs table structure
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- 4. Verify source tracking in metadata
SELECT 
  COUNT(*) as total_jobs,
  COUNT(metadata->>'source') as jobs_with_source,
  COUNT(metadata->>'original_source') as jobs_with_original_source
FROM jobs;

-- 5. Show job sources breakdown
SELECT 
  metadata->>'original_source' as source,
  COUNT(*) as count
FROM jobs
WHERE metadata->>'original_source' IS NOT NULL
GROUP BY metadata->>'original_source'
ORDER BY count DESC;

-- 6. Sample jobs with source tracking
SELECT 
  id,
  title,
  company,
  metadata->>'source' as source,
  metadata->>'original_source' as original_source,
  created_at
FROM jobs
ORDER BY created_at DESC
LIMIT 10;

-- ✅ If all queries run successfully, migration is complete!
