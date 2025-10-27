-- Fix jobs RLS policy - jobs should be publicly readable

-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;

-- Recreate policy - allow authenticated users to view active jobs
CREATE POLICY "Authenticated users can view active jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Also allow anonymous access if needed
CREATE POLICY "Public can view active jobs"
  ON jobs FOR SELECT
  TO anon
  USING (is_active = true);

-- Verify
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'jobs';

SELECT 'Jobs policies fixed!' as status;
