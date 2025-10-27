-- Add application language preference column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS application_language_preference VARCHAR(10) DEFAULT 'auto';

-- Add comment
COMMENT ON COLUMN profiles.application_language_preference IS 'User preference for application language: auto, en, or sv';
