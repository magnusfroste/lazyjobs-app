# Supabase-Based Configuration

LazyJobs now uses **Supabase for dynamic configuration** instead of environment variables!

## 🎯 Benefits

- ✅ **Toggle features without rebuild/redeploy**
- ✅ **Single source of truth** (Supabase table)
- ✅ **Cached for performance** (localStorage + memory)
- ✅ **No Vercel env vars needed** (except Supabase URL/Key)
- ✅ **A/B testing ready** (future: per-user flags)

---

## 📊 How It Works

### **Architecture**

```
1. App loads → Fetch config from Supabase app_settings table
2. Cache in localStorage (5 min TTL)
3. Components check FEATURES.AI_MATCHING (reads from cache)
4. Update table → Users get new config on next visit
```

### **Database Table**

```sql
app_settings
- key (TEXT, PRIMARY KEY)
- value (JSONB)
- description (TEXT)
- updated_at (TIMESTAMPTZ)
```

---

## 🔧 Usage

### **Check Feature Flags**

```javascript
import { FEATURES } from './lib/featureFlags'

// Check if feature is enabled
if (FEATURES.AI_MATCHING) {
  // Show AI matching toggle
}

if (FEATURES.APPLICATION_ASSISTANT) {
  // Show application assistant
}
```

### **Get Config Values**

```javascript
import { getConfig } from './lib/featureFlags'

const qdrantUrl = getConfig('qdrant_url')
const webhookUrl = getConfig('cv_webhook_url')
```

### **Force Refresh Config**

```javascript
import { getAppConfig } from './lib/config'

// Force refresh from Supabase
await getAppConfig(true)
```

---

## ⚙️ Updating Settings

### **Via Supabase Dashboard**

1. Go to **Table Editor** → `app_settings`
2. Edit the `value` JSON:

```json
{
  "ai_matching": true,
  "ai_matching_premium": false,
  "application_assistant": true,
  ...
}
```

3. Save
4. Users get updated config on next visit (or after 5 min cache expires)

### **Via SQL**

```sql
-- Enable AI matching
UPDATE app_settings
SET value = jsonb_set(value, '{ai_matching}', 'true')
WHERE key = 'features';

-- Disable application assistant
UPDATE app_settings
SET value = jsonb_set(value, '{application_assistant}', 'false')
WHERE key = 'features';

-- Update config URL
UPDATE app_settings
SET value = jsonb_set(value, '{qdrant_url}', '"https://new-url.com"')
WHERE key = 'config';
```

---

## 🚀 Setup (Already Done!)

### **Migration Applied**

```bash
# Migration file
supabase/migrations/20251020_app_settings.sql
```

**Run locally:**
```bash
cd supabase
supabase db push
```

**Push to production:**
Already auto-applied via Supabase CLI!

---

## 🔑 Environment Variables

### **Required (Frontend)**

Only these 2 are needed in Vercel:

```bash
VITE_SUPABASE_URL=https://arqugyvmegxonaerjbzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### **Removed (No Longer Needed in Vercel)**

```bash
# ❌ No longer needed!
VITE_ENABLE_AI_MATCHING
VITE_AI_MATCHING_PREMIUM
VITE_ENABLE_APPLICATION_ASSISTANT
VITE_APPLICATION_ASSISTANT_PREMIUM
VITE_QDRANT_ENABLED
VITE_QDRANT_URL
VITE_N8N_CV_WEBHOOK_URL
```

**These are now in the `app_settings` table!**

---

## 📝 Current Settings

```json
{
  "features": {
    "ai_matching": true,
    "ai_matching_premium": false,
    "ai_matching_show_stats": true,
    "application_assistant": true,
    "application_assistant_premium": false,
    "qdrant_enabled": true
  },
  "config": {
    "qdrant_url": "https://n8n-qdrant.katsu6.easypanel.host",
    "cv_webhook_url": "https://agent.froste.eu/webhook/cvparser"
  }
}
```

---

## 🔮 Future Enhancements

### **Per-User Feature Flags**

```sql
-- Add user_id column for A/B testing
ALTER TABLE app_settings 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Different flags for different users
INSERT INTO app_settings (key, value, user_id)
VALUES ('features', '{"ai_matching": true}', 'user-123');
```

### **Premium Features**

```javascript
// Check if user has premium access
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_status')
  .single()

const hasPremium = profile?.subscription_status === 'active'

if (FEATURES.AI_MATCHING && (hasPremium || !FEATURES.AI_MATCHING_PREMIUM_ONLY)) {
  // Show AI matching
}
```

---

## 🐛 Troubleshooting

### **Config Not Loading**

1. Check browser console for errors
2. Clear localStorage: `localStorage.removeItem('app_config')`
3. Force refresh: `getAppConfig(true)`
4. Check Supabase RLS policies

### **Features Not Showing**

1. Check `app_settings` table exists
2. Verify `key = 'features'` row exists
3. Check JSON structure matches expected format
4. Verify RLS policy allows SELECT

### **Fallback Behavior**

If Supabase fails, app falls back to:
1. localStorage cache (if available)
2. Environment variables (local dev only)
3. All features disabled (safe default)

---

## ✅ Checklist

- [x] Migration applied to Supabase
- [x] Default settings inserted
- [x] RLS policies configured
- [x] App fetches config on load
- [x] Config cached in localStorage
- [x] Components use FEATURES object
- [x] Vercel env vars cleaned up

---

**No more rebuilds to toggle features!** 🎉
