-- Add cron job to automatically expire old jobs in LazyJobs
-- Jobs expire if:
-- 1. expires_date has passed (from metadata)
-- 2. Job is older than 30 days (created_at)

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to expire old jobs
CREATE OR REPLACE FUNCTION expire_old_jobs()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE jobs
  SET is_active = false
  WHERE is_active = true
    AND (
      -- Expired by explicit expiration date (stored in metadata)
      (metadata->>'expires_date' IS NOT NULL 
       AND (metadata->>'expires_date')::timestamptz < NOW())
      OR
      -- Expired by age (30 days since created)
      created_at < NOW() - INTERVAL '30 days'
    );
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the number of jobs expired
  RAISE NOTICE 'Expired % jobs at %', expired_count, NOW();
END;
$$;

-- Schedule cron job to run daily at 2:00 AM
SELECT cron.schedule(
  'expire-old-jobs',           -- Job name
  '0 2 * * *',                 -- Cron schedule (2 AM daily)
  $$SELECT expire_old_jobs()$$ -- SQL to execute
);

-- Verify cron job was created
SELECT * FROM cron.job WHERE jobname = 'expire-old-jobs';

-- Run once immediately to expire existing old jobs
SELECT expire_old_jobs();

-- Add comment
COMMENT ON FUNCTION expire_old_jobs() IS 'Automatically sets is_active=false for jobs that have expired or are older than 30 days';
