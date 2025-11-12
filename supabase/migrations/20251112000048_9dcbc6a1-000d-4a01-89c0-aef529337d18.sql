-- Add RLS policy to allow service role to query all jobs for deduplication
-- This is needed by the OpenJobs connector to check which jobs already exist

CREATE POLICY "Service role can view all jobs for deduplication"
  ON jobs FOR SELECT
  TO service_role
  USING (true);

-- Verify policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'jobs'
ORDER BY policyname;