-- Migration: Create connector_sync_history table for tracking all syncs
-- This is BETTER than connector_state because:
-- 1. Full history of all syncs (not just last one)
-- 2. Simple REST POST (no RPC needed)
-- 3. Easy to query trends and debug issues
-- 4. Can calculate success rate, average jobs, etc.

CREATE TABLE IF NOT EXISTS connector_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_name TEXT NOT NULL,
  sync_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  jobs_fetched INTEGER DEFAULT 0,
  jobs_ingested INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_connector_sync_history_name ON connector_sync_history(connector_name);
CREATE INDEX IF NOT EXISTS idx_connector_sync_history_time ON connector_sync_history(sync_time DESC);
CREATE INDEX IF NOT EXISTS idx_connector_sync_history_name_time ON connector_sync_history(connector_name, sync_time DESC);

-- Enable RLS
ALTER TABLE connector_sync_history ENABLE ROW LEVEL SECURITY;

-- Allow connector access (anon key can read/write)
CREATE POLICY "Allow connector access" ON connector_sync_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- View to get latest sync per connector (replaces connector_state table)
CREATE OR REPLACE VIEW connector_latest_sync AS
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

-- Insert initial sync record for OpenJobs connector
INSERT INTO connector_sync_history (connector_name, sync_time, success, jobs_fetched, jobs_ingested, metadata)
VALUES (
  'openjobs',
  NOW() - INTERVAL '7 days',  -- Start from 7 days ago
  true,
  0,
  0,
  '{"version": "2025-11-19", "description": "Initial sync record for OpenJobs connector"}'::jsonb
);

COMMENT ON TABLE connector_sync_history IS 'History of all connector syncs - one row per sync';
COMMENT ON COLUMN connector_sync_history.connector_name IS 'Connector identifier (e.g., openjobs, arbetsformedlingen)';
COMMENT ON COLUMN connector_sync_history.sync_time IS 'When this sync started';
COMMENT ON COLUMN connector_sync_history.success IS 'Whether sync completed successfully';
COMMENT ON COLUMN connector_sync_history.jobs_fetched IS 'Number of jobs fetched from source';
COMMENT ON COLUMN connector_sync_history.jobs_ingested IS 'Number of jobs successfully ingested to LazyJobs';
COMMENT ON COLUMN connector_sync_history.metadata IS 'Additional sync metadata (batches, errors, etc)';

-- Example queries:

-- Get last sync time for a connector
-- SELECT sync_time FROM connector_sync_history 
-- WHERE connector_name = 'openjobs' 
-- ORDER BY sync_time DESC LIMIT 1;

-- Get last 10 syncs for a connector
-- SELECT * FROM connector_sync_history 
-- WHERE connector_name = 'openjobs' 
-- ORDER BY sync_time DESC LIMIT 10;

-- Calculate success rate
-- SELECT 
--   connector_name,
--   COUNT(*) as total_syncs,
--   SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_syncs,
--   ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
-- FROM connector_sync_history
-- GROUP BY connector_name;

-- Get average jobs per sync
-- SELECT 
--   connector_name,
--   AVG(jobs_fetched) as avg_fetched,
--   AVG(jobs_ingested) as avg_ingested
-- FROM connector_sync_history
-- WHERE success = true
-- GROUP BY connector_name;
