// VAPID Public Key for Web Push Notifications
// This key is PUBLIC and safe to expose in frontend code
// You can generate a new pair at: https://web-push-codelab.glitch.me/
// or by running: npx web-push generate-vapid-keys

// IMPORTANT: Replace this with your actual VAPID public key
// This should match the VAPID_PUBLIC_KEY you added to Supabase secrets
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  "BNhKBFOSs-Gl-e3DVvZqC9bDzQGQOeRqsqX8n5E0vdM0wKVtVvX8VZnGTJqSZQoZN7R5fZK4JnX8qJnQJ5K0fXc";

// Note: If VITE_VAPID_PUBLIC_KEY is not set in .env, 
// you'll need to replace the default value above with your actual public key
