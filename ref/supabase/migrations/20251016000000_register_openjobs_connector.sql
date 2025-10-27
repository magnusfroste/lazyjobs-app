-- Register OpenJobs as a connector in LazyJobs
-- This allows OpenJobs to be tracked as the primary job source

-- Insert OpenJobs connector
INSERT INTO connectors (name, description, website_url, api_key, is_active, developer_email)
VALUES (
  'OpenJobs',
  'Centralized job aggregation platform with multi-source connectors (Arbetsförmedlingen, EURES/Adzuna, Remotive, RemoteOK)',
  'http://localhost:8080',
  'connector_openjobs_' || gen_random_uuid()::text,
  true,
  'your@email.com'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Optional: Deactivate old individual connectors since OpenJobs replaces them
UPDATE connectors 
SET is_active = false, 
    description = description || ' (Legacy - replaced by OpenJobs)',
    updated_at = NOW()
WHERE name IN ('Arbetsförmedlingen', 'RemoteOK')
  AND name != 'OpenJobs';

-- Show the registered connectors
SELECT 
  name,
  description,
  api_key,
  is_active,
  created_at
FROM connectors
ORDER BY created_at DESC;
