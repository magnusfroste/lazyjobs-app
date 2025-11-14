# Push Notifications Setup Guide

This guide explains how to configure push notifications for LazyJobs.

## Overview

Push notifications alert users immediately when new jobs match their profile above their configured threshold. The system uses Web Push API with VAPID authentication.

## Architecture

```
Job Match Created → Database Trigger → Edge Function → Push Service → User's Browser
```

1. **Job matches** are created by the `match-jobs` edge function
2. **Database trigger** `on_new_job_match` fires on insert to `job_matches` table
3. **Edge function** `send-push-notification` sends push to all user devices
4. **Service worker** receives push and displays notification
5. **User clicks** notification → app opens to job

## Prerequisites

You need VAPID keys (Voluntary Application Server Identification). These authenticate your application with push services.

### Generate VAPID Keys

**Option 1: Online Generator**
1. Visit https://web-push-codelab.glitch.me/
2. Click "Generate Keys"
3. Copy both the Public Key and Private Key

**Option 2: Command Line**
```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: BNhKBFOSs-Gl...
Private Key: 1234abc...
```

## Configuration Steps

### 1. Add VAPID Keys to Supabase Secrets ✅

**Already done!** You've added:
- `VAPID_PUBLIC_KEY` 
- `VAPID_PRIVATE_KEY`

These are used by the `send-push-notification` edge function.

### 2. Add Public Key to Frontend

The VAPID public key needs to be accessible in the browser (it's safe to expose).

**Option A: Add to .env file** (Recommended)
```bash
# Add to .env
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

**Option B: Hardcode in config**
Edit `src/lib/pushConfig.ts` and replace the default key:
```typescript
export const VAPID_PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE";
```

⚠️ **IMPORTANT**: The public key in the frontend MUST match the one in Supabase secrets!

### 3. Deploy Edge Function

The edge function is automatically deployed. You can check the logs here:
https://supabase.com/dashboard/project/arqugyvmegxonaerjbzd/functions/send-push-notification/logs

### 4. Test Notifications

1. Go to Profile → Push Notifications
2. Click "Enable Push Notifications"
3. Allow notifications in browser prompt
4. Trigger a match by running the match-jobs function
5. You should receive a push notification!

## Database Tables

### push_subscriptions
Stores user's push notification subscriptions:
- `user_id`: User who subscribed
- `endpoint`: Push service endpoint URL
- `p256dh`: Encryption key
- `auth`: Authentication secret
- `user_agent`: Browser info

### profiles.notifications_enabled
Boolean flag to enable/disable notifications per user.

## How It Works

### 1. User Subscribes (Frontend)
```typescript
// src/hooks/usePushNotifications.ts
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY,
});

// Save to database
await supabase.from("push_subscriptions").insert({
  user_id, endpoint, p256dh, auth
});
```

### 2. Match Created (Database)
When a job match is inserted:
```sql
-- Trigger fires
CREATE TRIGGER on_new_job_match
  AFTER INSERT ON job_matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_of_match();
```

### 3. Edge Function Sends Push
```typescript
// supabase/functions/send-push-notification/index.ts
- Fetches user's subscriptions
- Sends to all devices
- Removes invalid subscriptions (410/404 errors)
```

### 4. Service Worker Displays Notification
```typescript
// src/sw.ts
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, options);
});
```

### 5. User Clicks Notification
```typescript
// Service worker opens app with deep link
self.clients.openWindow('/swipe?jobId=123');

// Swipe page handles the jobId
const jobId = searchParams.get('jobId');
```

## Thresholds

Notifications use the same threshold as the swipe slider:
- Stored in `profiles.preferences.match_threshold` 
- Default: 65%
- Only jobs matching above this threshold trigger notifications

## Troubleshooting

### Notifications not appearing?
1. Check browser permissions: Settings → Notifications → Allow
2. Verify you're subscribed: Profile → Push Notifications → should show "Notifications enabled ✅"
3. Check edge function logs for errors
4. Verify VAPID keys match between frontend and backend

### "Push failed with status 403"?
- VAPID keys don't match
- Check that public key in `src/lib/pushConfig.ts` matches Supabase secret

### "Subscription failed"?
- Browser doesn't support push (Safari < 16.4)
- User denied permission
- Service worker not registered

### Duplicate notifications?
- User has multiple subscriptions (multiple devices/browsers)
- This is normal! Notifications go to all subscribed devices

## Browser Support

✅ Chrome/Edge: Full support  
✅ Firefox: Full support  
✅ Safari 16.4+: Full support  
❌ Safari < 16.4: Not supported  
❌ iOS Safari < 16.4: Not supported  

## Security

- **Public Key**: Safe to expose, used for subscription
- **Private Key**: Must stay secret, only in edge functions
- **Endpoint URLs**: Unique per subscription, not transferable
- **RLS Policies**: Users can only view/manage their own subscriptions

## Monitoring

Check edge function logs:
```
✅ Notification sent to endpoint: https://fcm.googleapis...
❌ Failed to send to subscription 123: Invalid subscription
🗑️ Removing invalid subscription 456
```

Monitor in Supabase Dashboard:
https://supabase.com/dashboard/project/arqugyvmegxonaerjbzd/functions/send-push-notification/logs

## Future Enhancements

- 📧 Email fallback if push fails
- ⏰ Digest mode (daily summary)
- 🎯 Notification categories (urgent vs normal)
- 📱 Native mobile push via Capacitor
- 🔕 Do Not Disturb hours
