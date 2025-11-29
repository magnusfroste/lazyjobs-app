-- Fix mutable search_path for all database functions

-- 1. update_connector_state
CREATE OR REPLACE FUNCTION public.update_connector_state(
  p_connector_name text, 
  p_last_sync_time timestamp with time zone, 
  p_success boolean DEFAULT true, 
  p_jobs_fetched integer DEFAULT 0, 
  p_jobs_ingested integer DEFAULT 0, 
  p_error_message text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- 2. expire_old_jobs
CREATE OR REPLACE FUNCTION public.expire_old_jobs()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE jobs
  SET is_active = false
  WHERE is_active = true
    AND (
      (metadata->>'expires_date' IS NOT NULL 
       AND (metadata->>'expires_date')::timestamptz < NOW())
      OR
      created_at < NOW() - INTERVAL '30 days'
    );
  
  RAISE NOTICE 'Expired % jobs', (SELECT COUNT(*) FROM jobs WHERE is_active = false);
END;
$$;

-- 3. update_learned_preferences (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.update_learned_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO learned_preferences (user_id, total_swipes)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_swipes = learned_preferences.total_swipes + 1,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$;

-- 4. calculate_swipe_stats (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.calculate_swipe_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE learned_preferences
  SET right_swipe_rate = (
    SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(*), 0)
    FROM swipe_events
    WHERE user_id = NEW.user_id AND direction = 'right'
  ) / NULLIF((
    SELECT COUNT(*)
    FROM swipe_events
    WHERE user_id = NEW.user_id
  ), 0)
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- 5. handle_new_user (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;