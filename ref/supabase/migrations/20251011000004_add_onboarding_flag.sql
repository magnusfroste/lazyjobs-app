-- Add onboarding_completed column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users with CV data as onboarded
UPDATE profiles
SET onboarding_completed = TRUE
WHERE cv_data IS NOT NULL;

-- Comment
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed onboarding (uploaded CV or skipped)';
