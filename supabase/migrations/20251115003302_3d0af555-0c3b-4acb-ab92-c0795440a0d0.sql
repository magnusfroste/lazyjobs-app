-- Fix security: Set search_path for notify_user_of_match function
ALTER FUNCTION public.notify_user_of_match() SET search_path = public, pg_temp;