-- Update RLS policies for connector_sync_history
-- Run this if you already created the table with the old policy

-- Drop old policy
DROP POLICY IF EXISTS "Allow connector access" ON connector_sync_history;

-- Create new policies
-- 1. Allow anyone to read (public monitoring data)
CREATE POLICY "Allow public read" ON connector_sync_history
  FOR SELECT
  USING (true);

-- 2. Only allow authenticated writes (connectors with anon key)
CREATE POLICY "Allow authenticated write" ON connector_sync_history
  FOR INSERT
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Update view to use security_invoker (inherit RLS from base table)
DROP VIEW IF EXISTS connector_latest_sync;
CREATE OR REPLACE VIEW connector_latest_sync
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (connector_name)
  connector_name,
  sync_time AS last_sync_time,
  success AS last_sync_success,
  jobs_fetched,
  jobs_ingested,
  error_message,
  metadata
FROM connector_sync_history
ORDER BY connector_name, sync_time DESC;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'connector_sync_history';
