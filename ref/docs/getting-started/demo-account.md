# 🎭 Demo Account

## Quick Access

**Email:** `demo@lazyjobs.ink`  
**Password:** `123456`  
**URL:** https://www.lazyjobs.ink

## Features to Try

### 1. Swipe Interface
- Swipe right (like) or left (pass)
- Use action buttons at bottom
- See match percentage on each card

### 2. Card Flip 🔄
- Click info button (ℹ️) in top-right
- See detailed match breakdown
- View skills, salary, location scores

### 3. Match Score Slider 🎚️
- Adjust threshold in header
- Try: 50% (many jobs) → 75% (good) → 90% (perfect)
- See job count update in real-time

### 4. View Matches 📋
- Click list icon in header
- See all your right-swiped jobs

### 5. Settings ⚙️
- Update preferences
- Upload new CV (optional)

## Demo Data

- **~50 jobs** from Arbetsförmedlingen
- **Tech/IT focus** (Developer roles)
- **Stockholm area** jobs
- **Mix of remote and on-site**

## Limitations

- Demo account is **shared**
- Swipe history **reset daily** at midnight
- Can't change email/password

## Create Your Own Account

Click **"Sign Up"** to:
- ✅ Upload your real CV
- ✅ Get personalized matches
- ✅ Track applications
- ✅ Keep data private

---

## Setup (For Developers)

### Step 1: Create User in Supabase

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - Email: `demo@lazyjobs.ink`
   - Password: `123456`
   - Auto Confirm: ✅ Yes

### Step 2: Add Profile Data

```sql
-- Get demo user ID
SELECT id, email FROM auth.users WHERE email = 'demo@lazyjobs.ink';

-- Insert profile (replace USER_ID)
INSERT INTO profiles (id, email, full_name, cv_data, preferences)
VALUES (
  'USER_ID_HERE',
  'demo@lazyjobs.ink',
  'Demo User',
  '{
    "name": "Demo User",
    "role": "Full Stack Developer",
    "experience_years": 5,
    "education": "Bachelor in Computer Science",
    "skills_flat": ["JavaScript", "React", "Node.js", "Python", "TypeScript", "Docker", "AWS", "PostgreSQL"],
    "languages": ["English", "Swedish"],
    "target_roles": ["Full Stack Developer", "Backend Developer", "Frontend Developer"],
    "bio": "Experienced full-stack developer with 5 years building web applications."
  }'::jsonb,
  '{
    "salary_min": 50000,
    "location": "Stockholm",
    "remote_only": false,
    "employment_types": ["full-time"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  cv_data = EXCLUDED.cv_data,
  preferences = EXCLUDED.preferences;
```

### Step 3: Add Sample Swipes (Optional)

```sql
INSERT INTO swipes (user_id, job_id, direction)
SELECT 'USER_ID_HERE', id, 'right'
FROM jobs
WHERE match_score > 0.75
LIMIT 5
ON CONFLICT DO NOTHING;
```

### Step 4: Test

1. Go to https://www.lazyjobs.ink
2. Click **"Try Demo Account"**
3. Verify jobs are showing and swipes work

## Maintenance

### Reset Demo Daily (Cron Job)

```sql
-- Reset swipes
DELETE FROM swipes WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'demo@lazyjobs.ink'
);

-- Reset learned preferences
DELETE FROM learned_preferences WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'demo@lazyjobs.ink'
);

-- Reset swipe events
DELETE FROM swipe_events WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'demo@lazyjobs.ink'
);
```

## Troubleshooting

**Demo login not working?**
- Check user exists and is confirmed
- Try manual login with credentials

**No jobs showing?**
- Check jobs table: `SELECT COUNT(*) FROM jobs WHERE is_active = true`
- Verify match-jobs function is deployed

**CV Insights blank?**
- Check cv_data: `SELECT cv_data FROM profiles WHERE email = 'demo@lazyjobs.ink'`
- Should have `skills_flat`, `experience_years`, `education`

---

**Enjoy exploring LazyJobs!** 🚀
