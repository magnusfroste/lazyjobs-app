-- Check if your profile exists
SELECT * FROM profiles;

-- If no profile exists, check auth users
SELECT id, email FROM auth.users;

-- Check if trigger is working
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
