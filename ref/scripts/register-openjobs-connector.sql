-- Register OpenJobs Connector in LazyJobs
-- Run this in your Supabase SQL Editor

-- Step 1: Register OpenJobs as a connector
INSERT INTO connectors (name, description, website_url, api_key, is_active, developer_email)
VALUES (
  'OpenJobs',
  'Multi-source job aggregation platform (Arbetsförmedlingen, EURES/Adzuna, Remotive, RemoteOK)',
  'http://localhost:8080',
  'connector_openjobs_' || gen_random_uuid()::text,
  true,
  'your@email.com'  -- Replace with your email
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  is_active = EXCLUDED.is_active,
  updated_at = NOW()
RETURNING id, name, api_key, is_active;

-- Step 2: View all connectors
SELECT 
  id,
  name,
  description,
  api_key,
  is_active,
  created_at
FROM connectors
ORDER BY created_at DESC;

-- Step 3: (Optional) Mark old connectors as legacy
-- Uncomment if you want to deactivate individual connectors
/*
UPDATE connectors 
SET 
  is_active = false,
  description = description || ' (Legacy - replaced by OpenJobs)',
  updated_at = NOW()
WHERE name IN ('Arbetsförmedlingen', 'RemoteOK')
  AND name != 'OpenJobs';
*/

-- Step 4: Copy the api_key from the results above and add it to:
-- /Users/mafr/Code/pipeline_x/connectors/openjobs/.env
-- 
-- CONNECTOR_API_KEY=connector_openjobs_XXXXX
