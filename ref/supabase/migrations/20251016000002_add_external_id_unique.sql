-- Add unique constraint on external_id for upsert operations
-- This replaces the old (connector_id, external_id) composite constraint

-- Create unique index on external_id
CREATE UNIQUE INDEX IF NOT EXISTS jobs_external_id_unique 
ON jobs(external_id);

-- Verify the constraint
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'jobs'
  AND indexname = 'jobs_external_id_unique';
