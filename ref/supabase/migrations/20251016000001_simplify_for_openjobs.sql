-- Simplify LazyJobs schema for OpenJobs integration
-- Since all jobs now come from OpenJobs, we don't need the connectors table

-- Step 1: Remove the foreign key constraint from jobs table
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_connector_id_fkey;

-- Step 2: Drop the connector_id column (no longer needed)
ALTER TABLE jobs 
DROP COLUMN IF EXISTS connector_id;

-- Step 3: Drop the connectors table
DROP TABLE IF EXISTS connectors;

-- Step 4: Add source tracking to metadata (already exists in metadata JSONB)
-- Jobs already have metadata.source and metadata.original_source from OpenJobs

-- Verify the simplified schema
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- Show sample job with source tracking in metadata
SELECT 
  id,
  title,
  company,
  metadata->>'source' as source,
  metadata->>'original_source' as original_source,
  created_at
FROM jobs
LIMIT 5;
