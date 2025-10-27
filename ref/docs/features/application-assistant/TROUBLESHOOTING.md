# Troubleshooting - Application Assistant

## Common Errors & Solutions

### ❌ "Failed to send a request to the Edge Function"

This error can have several causes. Follow these steps:

---

## 1. Check OpenAI API Key

The edge function requires an OpenAI API key to generate applications.

### **Verify it's set:**
```bash
cd /Users/mafr/Code/LazyJobs
supabase secrets list
```

**Expected output:**
```
OPENAI_API_KEY | d94790ddae776bad0fb7c9985b9a0bd0...
```

### **If missing, set it:**
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

### **Test it works:**
```bash
curl -X POST https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/generate-application \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test-job-id",
    "user_id": "test-user-id"
  }'
```

---

## 2. Check Browser Console

Open browser DevTools (F12) and check the Console tab for detailed errors.

### **Common error messages:**

#### **"OpenAI API key not configured"**
**Solution:** Set the OpenAI API key (see step 1)

#### **"Job not found"**
**Cause:** Invalid job_id
**Solution:** Make sure you're testing with a real job from your database

#### **"Profile not found"**
**Cause:** User doesn't have a profile or CV data
**Solution:** Complete onboarding and upload CV first

#### **"Network error" or "CORS error"**
**Cause:** Edge function not deployed or CORS misconfigured
**Solution:** Redeploy the function:
```bash
supabase functions deploy generate-application
```

---

## 3. Check Edge Function Logs

View logs in Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/arqugyvmegxonaerjbzd/functions
2. Click on `generate-application`
3. Click "Logs" tab
4. Look for errors

**Common log errors:**

#### **"OPENAI_API_KEY not set"**
Set the secret (see step 1)

#### **"Invalid API key"**
Your OpenAI key is invalid or expired. Get a new one from https://platform.openai.com/api-keys

#### **"Rate limit exceeded"**
You've hit OpenAI's rate limit. Wait a few minutes or upgrade your OpenAI plan.

---

## 4. Test Edge Function Directly

Test the function without the UI:

```bash
curl -X POST https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/generate-application \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "REAL_JOB_ID_FROM_DATABASE",
    "user_id": "YOUR_USER_ID",
    "language_override": "en",
    "include": ["cv", "cover_letter", "email"]
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "language": "en",
    "job_title": "Senior Developer",
    "company": "Tech Corp",
    "cv": "# Your Name\n\n## Experience...",
    "cover_letter": "Dear Hiring Manager...",
    "email": {
      "subject": "Application: Senior Developer",
      "body": "Dear Hiring Manager..."
    }
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Detailed error info"
}
```

---

## 5. Check User Has CV Data

The function requires CV data to generate applications.

### **Check in database:**
```sql
SELECT id, full_name, cv_data 
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

**Expected:** `cv_data` should be a JSON object with:
```json
{
  "name": "John Doe",
  "title": "Senior Developer",
  "experience": [...],
  "skills": [...],
  ...
}
```

**If empty:** User needs to complete onboarding and upload CV.

---

## 6. Verify Feature Flag

Make sure the feature is enabled in `.env`:

```bash
# .env
VITE_ENABLE_APPLICATION_ASSISTANT=true
```

**After changing:** Restart dev server:
```bash
npm run dev
```

---

## 7. Check Network Tab

Open DevTools → Network tab → Try generating application

### **Look for the request:**
- **Name:** `generate-application`
- **Status:** Should be `200 OK`
- **Response:** Should contain `success: true`

### **If Status is 400:**
- Check request payload (job_id and user_id are required)

### **If Status is 404:**
- Edge function not deployed or wrong URL

### **If Status is 500:**
- Check edge function logs for detailed error

---

## 8. Common Issues & Quick Fixes

### **Modal doesn't open**
**Cause:** Feature flag disabled or auto-open preference off
**Solution:** 
1. Check `.env` has `VITE_ENABLE_APPLICATION_ASSISTANT=true`
2. Go to Settings → Application Assistant → Enable "Auto-open after match"
3. Or apply from "My Matches" view

### **"Apply Now" button not showing**
**Cause:** Job already marked as applied
**Solution:** Only shows for jobs you haven't applied to yet

### **Generation takes too long**
**Cause:** OpenAI API is slow
**Solution:** Normal - can take 5-15 seconds. Show loading state to user.

### **Wrong language detected**
**Cause:** Job description has mixed languages or unclear indicators
**Solution:** User can override in modal (Auto / English / Swedish)

### **Generated content is generic**
**Cause:** User's CV data is minimal or job description is vague
**Solution:** 
1. Upload more detailed CV
2. Try regenerating
3. Edit generated content manually

---

## 9. Debugging Checklist

Run through this checklist:

- [ ] OpenAI API key is set in Supabase secrets
- [ ] Edge function is deployed (`supabase functions list`)
- [ ] Feature flag is enabled in `.env`
- [ ] Dev server is running (`npm run dev`)
- [ ] User has completed onboarding
- [ ] User has CV data in profile
- [ ] Job exists in database
- [ ] Browser console shows no errors
- [ ] Network request returns 200 OK

---

## 10. Still Not Working?

### **Get detailed error info:**

1. **Browser Console:**
   - Open DevTools (F12)
   - Console tab
   - Look for red errors

2. **Network Tab:**
   - DevTools → Network
   - Find `generate-application` request
   - Click it → Response tab
   - Copy error message

3. **Edge Function Logs:**
   - Supabase Dashboard → Functions → generate-application → Logs
   - Look for recent errors

### **Test with minimal example:**

```javascript
// In browser console
const { data, error } = await supabase.functions.invoke('generate-application', {
  body: {
    job_id: 'REAL_JOB_ID',
    user_id: 'YOUR_USER_ID',
    language_override: 'en',
    include: ['cv']
  }
})

console.log('Result:', data, error)
```

---

## Quick Reference

### **Redeploy function:**
```bash
supabase functions deploy generate-application
```

### **Check secrets:**
```bash
supabase secrets list
```

### **Set OpenAI key:**
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### **View function URL:**
```
https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/generate-application
```

### **Test endpoint:**
```bash
curl -X POST [FUNCTION_URL] \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"job_id":"...","user_id":"..."}'
```

---

## Need More Help?

1. Check edge function logs in Supabase Dashboard
2. Look at browser console for client-side errors
3. Test the function directly with curl
4. Verify all prerequisites are met (API key, CV data, etc.)

The error message should now include more details to help identify the issue!
