# Jooble Job API Integration

**Status:** 🔑 API Key Received  
**Date:** 2025-10-21  
**API Key:** `9ffe2933-0695-4eca-a9d0-4a58ebf6655d`

---

## 📋 Overview

Jooble is a job search engine that aggregates listings from thousands of websites worldwide.

**Benefits:**
- ✅ Access to millions of jobs globally
- ✅ Free tier available (100 requests/day)
- ✅ Simple REST API
- ✅ Supports multiple countries/languages
- ✅ Fresh job postings

---

## 🔑 API Key

**Key:** `9ffe2933-0695-4eca-a9d0-4a58ebf6655d`

**Added to:**
- ✅ `.env` (local development)
- ⚠️ Need to add to Supabase secrets (production)

---

## 📚 API Documentation

**Official Docs:** https://jooble.org/api/about  
**Endpoint:** `https://jooble.org/api/{API_KEY}`  
**Method:** POST  
**Rate Limit:** 100 requests/day (free tier)

---

## 🔧 API Request Format

### **Example Request:**

```bash
curl -X POST \
  https://jooble.org/api/9ffe2933-0695-4eca-a9d0-4a58ebf6655d \
  -H 'Content-Type: application/json' \
  -d '{
    "keywords": "JavaScript Developer",
    "location": "Stockholm, Sweden",
    "radius": "25",
    "page": "1"
  }'
```

### **Request Parameters:**

```json
{
  "keywords": "JavaScript Developer",  // Job title/keywords
  "location": "Stockholm, Sweden",     // City, country
  "radius": "25",                      // Search radius in km
  "page": "1",                         // Page number (1-99)
  "datecreatedfrom": "2024-10-01",    // Optional: Filter by date
  "salary": "50000"                    // Optional: Min salary
}
```

---

## 📥 API Response Format

```json
{
  "totalCount": 1234,
  "jobs": [
    {
      "title": "Senior JavaScript Developer",
      "location": "Stockholm, Sweden",
      "snippet": "We are looking for an experienced JavaScript developer...",
      "salary": "50000-70000 SEK",
      "source": "LinkedIn",
      "type": "Full-time",
      "link": "https://example.com/job/12345",
      "company": "Tech Company AB",
      "updated": "2024-10-20T10:30:00Z",
      "id": "12345"
    }
  ]
}
```

---

## 🎯 Integration Plan

### **Phase 1: n8n Scraper** (Recommended)
Create an n8n workflow to fetch jobs daily:

```
1. Schedule Node (daily at 2am)
   ↓
2. HTTP Request to Jooble API
   ↓
3. Transform data to LazyJobs format
   ↓
4. Upsert to Supabase jobs table
```

**Benefits:**
- ✅ Runs in background
- ✅ No frontend API calls
- ✅ Caches results in database
- ✅ Stays within rate limits

### **Phase 2: Direct Integration** (Future)
Add Jooble as a real-time job source:
- Search jobs on demand
- Show fresh results
- Combine with other sources

---

## 🗺️ Supported Countries

Jooble supports **70+ countries**, including:
- 🇸🇪 Sweden
- 🇬🇧 UK
- 🇺🇸 USA
- 🇩🇪 Germany
- 🇫🇷 France
- 🇪🇸 Spain
- 🇮🇹 Italy
- 🇳🇱 Netherlands
- And many more...

---

## 💡 Use Cases for LazyJobs

### **1. Expand Job Sources**
Currently using:
- Arbetsförmedlingen (Sweden)
- EURES (EU)
- Remotive (Remote)
- RemoteOK (Remote)

**Add Jooble for:**
- More Swedish jobs
- International opportunities
- Startup jobs
- Tech companies

### **2. Fill Gaps**
- Jobs not on other platforms
- Smaller companies
- Fresh postings
- Niche roles

### **3. Better Matching**
- More jobs = better matches
- Diverse sources
- Higher match rates

---

## 🚀 Implementation Steps

### **Step 1: Test API**
```bash
# Test with curl
curl -X POST \
  https://jooble.org/api/9ffe2933-0695-4eca-a9d0-4a58ebf6655d \
  -H 'Content-Type: application/json' \
  -d '{"keywords": "JavaScript", "location": "Stockholm"}'
```

### **Step 2: Create n8n Workflow**
1. Create new workflow in n8n
2. Add Schedule Trigger (daily)
3. Add HTTP Request node
4. Add data transformation
5. Add Supabase insert

### **Step 3: Map to LazyJobs Schema**
Transform Jooble response to match your `jobs` table:

```javascript
// n8n Code Node
const joobleJobs = $input.all();

return joobleJobs.map(job => ({
  json: {
    title: job.json.title,
    company: job.json.company,
    location: job.json.location,
    description: job.json.snippet,
    url: job.json.link,
    salary_min: extractSalary(job.json.salary),
    job_type: job.json.type,
    source: 'jooble',
    external_id: `jooble_${job.json.id}`,
    posted_at: job.json.updated,
    scraped_at: new Date().toISOString()
  }
}));
```

### **Step 4: Add to Supabase Secrets**
```bash
# For production
supabase secrets set JOOBLE_API_KEY=9ffe2933-0695-4eca-a9d0-4a58ebf6655d
```

### **Step 5: Monitor Usage**
- Track daily request count
- Stay within 100/day limit
- Upgrade if needed

---

## 📊 Rate Limits

### **Free Tier:**
- 100 requests/day
- No credit card required
- Perfect for testing

### **Paid Tiers:**
- Contact Jooble for pricing
- Higher limits
- Priority support

### **Optimization:**
- Cache results in database
- Fetch once daily
- Don't call on every user search

---

## ⚠️ Important Notes

1. **API Key Security:**
   - ✅ Added to `.env` (gitignored)
   - ⚠️ Don't commit to git
   - ⚠️ Don't expose in frontend
   - ✅ Use in n8n or Supabase Edge Functions only

2. **Rate Limiting:**
   - 100 requests/day on free tier
   - Plan your scraping schedule
   - Cache results

3. **Data Quality:**
   - Jooble aggregates from many sources
   - Some duplicates possible
   - Validate data before inserting

4. **Attribution:**
   - Jooble requires attribution
   - Add "Jobs powered by Jooble" on your site
   - Link back to Jooble

---

## 🎯 Next Steps

1. **Test API** - Verify key works
2. **Create n8n workflow** - Daily job scraper
3. **Map data** - Transform to LazyJobs format
4. **Test with small batch** - 10-20 jobs
5. **Monitor results** - Check quality
6. **Scale up** - Increase to 100/day
7. **Add attribution** - "Jobs powered by Jooble"

---

## 📞 Support

**Jooble Support:** https://jooble.org/info/en/contact  
**API Issues:** api@jooble.com  
**Documentation:** https://jooble.org/api/about

---

**Status:** Ready to integrate! 🚀  
**Priority:** Medium (expands job sources)  
**Effort:** 2-3 hours for n8n workflow
