-- Migration: Create connector_state table for tracking sync state
-- This replaces the file-based state management

CREATE TABLE IF NOT EXISTS connector_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_name TEXT NOT NULL UNIQUE,
  last_sync_time TIMESTAMPTZ NOT NULL,
  last_sync_success BOOLEAN DEFAULT true,
  jobs_fetched INTEGER DEFAULT 0,
  jobs_ingested INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_connector_state_name ON connector_state(connector_name);

-- Disable RLS - this is backend-only data, not user-specific
ALTER TABLE connector_state ENABLE ROW LEVEL SECURITY;

-- Allow service role and anon key to read/write (for connectors)
CREATE POLICY "Allow connector access" ON connector_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default state for OpenJobs connector
INSERT INTO connector_state (connector_name, last_sync_time, metadata)
VALUES (
  'openjobs',
  NOW() - INTERVAL '7 days',  -- Start from 7 days ago
  '{"version": "2025-11-19", "description": "OpenJobs aggregation connector"}'::jsonb
)
ON CONFLICT (connector_name) DO NOTHING;

-- Function to update connector state
CREATE OR REPLACE FUNCTION update_connector_state(
  p_connector_name TEXT,
  p_last_sync_time TIMESTAMPTZ,
  p_success BOOLEAN DEFAULT true,
  p_jobs_fetched INTEGER DEFAULT 0,
  p_jobs_ingested INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO connector_state (
    connector_name,
    last_sync_time,
    last_sync_success,
    jobs_fetched,
    jobs_ingested,
    error_message,
    metadata,
    updated_at
  )
  VALUES (
    p_connector_name,
    p_last_sync_time,
    p_success,
    p_jobs_fetched,
    p_jobs_ingested,
    p_error_message,
    COALESCE(p_metadata, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (connector_name) DO UPDATE SET
    last_sync_time = EXCLUDED.last_sync_time,
    last_sync_success = EXCLUDED.last_sync_success,
    jobs_fetched = EXCLUDED.jobs_fetched,
    jobs_ingested = EXCLUDED.jobs_ingested,
    error_message = EXCLUDED.error_message,
    metadata = CASE 
      WHEN EXCLUDED.metadata IS NOT NULL THEN EXCLUDED.metadata
      ELSE connector_state.metadata
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE connector_state IS 'Tracks sync state for job connectors (OpenJobs, etc)';
COMMENT ON COLUMN connector_state.connector_name IS 'Unique identifier for the connector (e.g., openjobs, arbetsformedlingen)';
COMMENT ON COLUMN connector_state.last_sync_time IS 'Timestamp of last successful sync - used for incremental fetching';
COMMENT ON COLUMN connector_state.jobs_fetched IS 'Number of jobs fetched in last sync';
COMMENT ON COLUMN connector_state.jobs_ingested IS 'Number of jobs successfully ingested in last sync';
COMMENT ON COLUMN connector_state.metadata IS 'Additional connector-specific metadata';
