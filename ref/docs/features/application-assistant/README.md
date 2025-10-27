# Application Assistant Feature

Generate tailored CVs, cover letters, and email drafts with automatic language detection.

## 🎯 Features

- ✅ **Auto-detects language** from job description (Swedish/English)
- ✅ **User language preference** - Always English, Always Swedish, or Auto
- ✅ **Tailored CV** - Reorders sections to highlight relevant experience
- ✅ **Cover letter** - Professional, personalized to job requirements
- ✅ **Email draft** - Ready-to-send application email
- ✅ **One-click copy/download** - Markdown format

## 🔄 How It Works

```
User matches with job → Click "Apply Now"
  ↓
Modal opens with language options
  ↓
User selects: Auto-detect / English / Swedish
  ↓
Edge function generates:
  1. Detects job language (if auto)
  2. Fetches user CV from profile
  3. Calls OpenAI to generate:
     - Tailored CV (reordered for relevance)
     - Cover letter (personalized)
     - Email draft (ready to send)
  ↓
User reviews, edits, copies, or downloads
```

## 🌍 Language Detection

### Priority:
1. **User override** in modal (English/Swedish/Auto)
2. **User preference** saved in profile
3. **Auto-detect** from job description

### Auto-Detection:
Scans job description for Swedish keywords:
- `och, att, för, med, som, är, på, vi, du, söker, arbete, tjänst`
- If 3+ keywords found → Swedish
- Otherwise → English

**Example:**
```
Job: "Vi söker en Senior Developer för vårt team i Stockholm"
→ Detected: Swedish (keywords: vi, söker, för)
→ Generates CV + cover letter in Swedish
```

## 📁 Files

### Backend
- `/supabase/functions/generate-application/index.ts` - Edge function
- `/supabase/functions/generate-application/README.md` - API docs

### Frontend
- `/src/features/application-assistant/ApplicationModal.jsx` - Main modal
- `/src/features/application-assistant/ApplicationModal.css` - Styles
- `/src/features/application-assistant/useApplicationGenerator.js` - React hook
- `/src/lib/featureFlags.js` - Feature flags (updated)

### Config
- `.env` - Feature flags

## 🚀 Setup

### 1. Enable Feature

```bash
# .env
VITE_ENABLE_APPLICATION_ASSISTANT=true
VITE_APPLICATION_ASSISTANT_PREMIUM=false  # Set true for premium-only
```

### 2. Deploy Edge Function

```bash
cd supabase
supabase functions deploy generate-application
```

### 3. Add User Preference Column (Optional)

```sql
ALTER TABLE profiles 
ADD COLUMN application_language_preference VARCHAR(10) DEFAULT 'auto';
-- Values: 'auto', 'en', 'sv'
```

### 4. Integrate into Job Card

```jsx
import { ApplicationModal } from '../features/application-assistant/ApplicationModal';
import { FEATURES } from '../lib/featureFlags';

function JobCard({ job, userId, isPremium }) {
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  return (
    <div className="job-card">
      {/* Existing card content */}
      
      {/* ============ APPLICATION ASSISTANT FEATURE START ============ */}
      {FEATURES.APPLICATION_ASSISTANT && (
        <button 
          className="apply-btn"
          onClick={() => setShowApplicationModal(true)}
        >
          📝 Apply Now
        </button>
      )}

      {showApplicationModal && (
        <ApplicationModal
          job={job}
          userId={userId}
          isPremium={isPremium}
          onClose={() => setShowApplicationModal(false)}
        />
      )}
      {/* ============ APPLICATION ASSISTANT FEATURE END ============== */}
    </div>
  );
}
```

## 💰 Pricing

### OpenAI Cost (per application):
- CV generation: ~2000 tokens = $0.006
- Cover letter: ~1000 tokens = $0.003
- Email: ~300 tokens = $0.001
- **Total: ~$0.01 per application**

### Monetization Options:

**Option 1: Freemium**
- Free: 5 applications/month
- Premium: Unlimited applications

**Option 2: Pay-per-use**
- $2 per application
- Includes CV + cover letter + email

**Option 3: Premium Feature**
- Set `VITE_APPLICATION_ASSISTANT_PREMIUM=true`
- Only premium users can access

## 🎨 User Experience

### 1. Job Match
User swipes right → Job matched → "Apply Now" button appears

### 2. Language Selection
Modal opens with 3 options:
- 🌍 **Auto-detect** (default) - Smart detection
- 🇬🇧 **English** - Always English
- 🇸🇪 **Swedish** - Always Swedish

### 3. Generation
"✨ Generate Application" → Loading (~5-10 seconds)

### 4. Review
Tabs: CV | Cover Letter | Email
- Preview in modal
- Copy to clipboard
- Download as Markdown
- Edit if needed

### 5. Apply
- Copy email and paste in email client
- Or click "Open in Email Client" (pre-filled)

## 📊 Analytics

Track these events:

```javascript
{
  event: 'application_generated',
  job_id: 'uuid',
  language: 'sv',
  components: ['cv', 'cover_letter', 'email'],
  timestamp: '2025-10-18T...'
}

{
  event: 'application_copied',
  component: 'cv',
  language: 'en'
}

{
  event: 'application_downloaded',
  component: 'cover_letter',
  format: 'markdown'
}
```

## 🧪 Testing

### Test Auto-Detection

**Swedish Job:**
```
Title: "Senior Utvecklare"
Description: "Vi söker en erfaren utvecklare för vårt team..."
→ Should detect Swedish
```

**English Job:**
```
Title: "Senior Developer"
Description: "We are looking for an experienced developer..."
→ Should detect English
```

**Mixed Job:**
```
Title: "Senior Developer"
Description: "Vi söker en developer med erfarenhet av React..."
→ Should detect Swedish (more Swedish keywords)
```

### Test Generation

```bash
curl -X POST https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/generate-application \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test-job-id",
    "user_id": "test-user-id",
    "language_override": "auto"
  }'
```

## 🔒 Premium Gate

If `VITE_APPLICATION_ASSISTANT_PREMIUM=true`:

```jsx
{isPremiumFeature && !isPremium && (
  <div className="premium-gate">
    <span className="premium-badge">✨ Premium Feature</span>
    <p>Upgrade to generate tailored applications</p>
    <button className="upgrade-btn">Upgrade to Premium</button>
  </div>
)}
```

## 🚨 Troubleshooting

### "Failed to generate"
- Check OpenAI API key is set
- Verify user has CV data in profile
- Check edge function logs

### Wrong language detected
- User can override with language selector
- Save preference in profile for future applications

### CV looks generic
- Ensure user CV has detailed experience
- Job description should have clear requirements
- Try regenerating with different language

## 🎯 Future Enhancements

- [ ] PDF export (not just Markdown)
- [ ] Multiple CV templates
- [ ] A/B test different prompts
- [ ] Save generated applications
- [ ] Track application success rate
- [ ] LinkedIn profile import
- [ ] Multi-language support (German, French, etc.)

## 📝 Notes

- Feature is **isolated** - can be disabled with feature flag
- **No database changes** required (except optional language preference)
- Uses existing CV data from onboarding
- **Keeps LazyJobs simple** - only shows after match
- Can be **extracted** to standalone product later
