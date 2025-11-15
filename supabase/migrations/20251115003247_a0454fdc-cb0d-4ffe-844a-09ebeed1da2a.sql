-- Enable pg_net extension for HTTP calls from database triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update the notify_user_of_match function to call edge function directly
-- without requiring database settings (since send-push-notification is public)
CREATE OR REPLACE FUNCTION public.notify_user_of_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    RAISE LOG 'Notifications disabled for user %', NEW.profile_id;
    RETURN NEW;
  END IF;

  -- Get match threshold (default to 65 if not set)
  v_match_threshold := COALESCE((v_profile.preferences->>'match_threshold')::integer, 65);

  -- Skip if match score below threshold
  IF NEW.match_score < v_match_threshold THEN
    RAISE LOG 'Match score % below threshold % for user %', NEW.match_score, v_match_threshold, NEW.profile_id;
    RETURN NEW;
  END IF;

  -- Get job details
  SELECT * INTO v_job FROM jobs WHERE id = NEW.job_id;

  RAISE LOG 'Sending push notification for user % (score: %, threshold: %)', NEW.profile_id, NEW.match_score, v_match_threshold;

  -- Call edge function to send push notification (public endpoint, no auth needed)
  PERFORM
    net.http_post(
      url := 'https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
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
$function$;