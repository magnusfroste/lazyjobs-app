-- Drop existing triggers first (all variants)
DROP TRIGGER IF EXISTS notify_user_of_new_match ON job_matches;
DROP TRIGGER IF EXISTS on_new_job_match ON job_matches;

-- Drop the function
DROP FUNCTION IF EXISTS notify_user_of_match();

-- Create new function for daily best match notifications
CREATE OR REPLACE FUNCTION public.send_daily_best_match_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user record;
  v_best_match record;
  v_random_chance numeric;
  v_already_notified boolean;
BEGIN
  -- Loop through all users with notifications enabled
  FOR v_user IN 
    SELECT id, preferences
    FROM profiles 
    WHERE notifications_enabled = true
  LOOP
    -- Generate random number between 0 and 1
    v_random_chance := random();
    
    -- 10% chance per hour (0.1)
    IF v_random_chance > 0.1 THEN
      CONTINUE; -- Skip this user this hour
    END IF;
    
    -- Check if user already got a notification today
    SELECT EXISTS(
      SELECT 1 FROM notification_history
      WHERE user_id = v_user.id
        AND sent_at >= CURRENT_DATE
        AND sent_at < CURRENT_DATE + INTERVAL '1 day'
    ) INTO v_already_notified;
    
    IF v_already_notified THEN
      RAISE LOG 'User % already notified today, skipping', v_user.id;
      CONTINUE;
    END IF;
    
    -- Find the best match created today that hasn't been notified yet
    SELECT 
      jm.job_id,
      jm.match_score,
      jm.profile_id,
      j.title as job_title,
      j.company
    INTO v_best_match
    FROM job_matches jm
    JOIN jobs j ON j.id = jm.job_id
    WHERE jm.profile_id = v_user.id
      AND jm.created_at >= CURRENT_DATE
      AND jm.created_at < CURRENT_DATE + INTERVAL '1 day'
      AND NOT EXISTS (
        SELECT 1 FROM notification_history nh
        WHERE nh.user_id = v_user.id 
          AND nh.job_id = jm.job_id
      )
      AND jm.match_score >= COALESCE((v_user.preferences->>'match_threshold')::integer, 65)
    ORDER BY jm.match_score DESC
    LIMIT 1;
    
    -- If we found a match, send notification
    IF v_best_match.job_id IS NOT NULL THEN
      RAISE LOG 'Sending best match notification to user % for job % (score: %)', 
        v_user.id, v_best_match.job_id, v_best_match.match_score;
      
      -- Call edge function to send push notification
      PERFORM
        net.http_post(
          url := 'https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'user_id', v_user.id,
            'job_id', v_best_match.job_id,
            'match_score', v_best_match.match_score,
            'job_title', v_best_match.job_title,
            'company', v_best_match.company
          )
        );
    ELSE
      RAISE LOG 'No suitable match found for user % today', v_user.id;
    END IF;
    
  END LOOP;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in send_daily_best_match_notification: %', SQLERRM;
END;
$function$;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run hourly between 08:00-17:00
SELECT cron.schedule(
  'send-daily-best-match-notifications',
  '0 8-17 * * *',
  $$SELECT send_daily_best_match_notification();$$
);