-- Add is_developer flag to profiles for match mode toggle visibility
ALTER TABLE public.profiles 
ADD COLUMN is_developer BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for efficient lookups
CREATE INDEX idx_profiles_is_developer ON public.profiles(is_developer);

-- Set developer user (froste@hotmail.se)
UPDATE public.profiles 
SET is_developer = TRUE 
WHERE email = 'froste@hotmail.se';

-- Add column comment for documentation
COMMENT ON COLUMN public.profiles.is_developer IS 
  'Enables developer features like match mode toggle for A/B testing. Regular users only see Pre-Match mode.';