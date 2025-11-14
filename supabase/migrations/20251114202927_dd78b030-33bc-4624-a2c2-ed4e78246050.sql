-- Create push_subscriptions table for Web Push notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own subscriptions" 
  ON public.push_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" 
  ON public.push_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" 
  ON public.push_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Add notification preference to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Function to notify user of new match
CREATE OR REPLACE FUNCTION public.notify_user_of_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile record;
  v_job record;
  v_match_threshold integer;
BEGIN
  -- Get user profile with notification settings
  SELECT p.*, pr.preferences->>'match_threshold' as threshold
  INTO v_profile
  FROM profiles p
  LEFT JOIN profiles pr ON pr.id = NEW.profile_id
  WHERE p.id = NEW.profile_id;

  -- Skip if notifications disabled
  IF NOT COALESCE(v_profile.notifications_enabled, true) THEN
    RETURN NEW;
  END IF;

  -- Get match threshold (default to 65 if not set)
  v_match_threshold := COALESCE((v_profile.preferences->>'match_threshold')::integer, 65);

  -- Skip if match score below threshold
  IF NEW.match_score < v_match_threshold THEN
    RETURN NEW;
  END IF;

  -- Get job details
  SELECT * INTO v_job FROM jobs WHERE id = NEW.job_id;

  -- Call edge function to send push notification
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'user_id', NEW.profile_id,
        'job_id', NEW.job_id,
        'match_score', NEW.match_score,
        'job_title', v_job.title,
        'company', v_job.company
      )
    );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to send push notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on job_matches
DROP TRIGGER IF EXISTS on_new_job_match ON public.job_matches;
CREATE TRIGGER on_new_job_match
  AFTER INSERT ON public.job_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_of_match();