# Metadata Mapping: OpenJobs ↔ LazyJobs

## Current Situation

### OpenJobs Storage
```sql
-- Standard columns for structured data
title, company, description, location, salary, 
salary_min, salary_max, salary_currency, is_remote, url,
employment_type, experience_level, posted_date, expires_date

-- Arrays for lists
requirements TEXT[]
benefits TEXT[]

-- JSONB for connector-specific data
fields JSONB  -- Contains: source, connector, original_id, tags, etc.
```

### LazyJobs Storage
```sql
-- Standard columns (similar to OpenJobs)
title, company, description, location,
salary_min, salary_max, salary_currency, is_remote, url,
employment_type, required_skills, experience_level, posted_at

-- JSONB for ALL extra data
metadata JSONB  -- Contains: source, original_source, benefits, expires_date, raw_data, etc.
```

## Key Difference

**OpenJobs:**
- Uses dedicated columns for common fields (`requirements`, `benefits`)
- Uses `fields` JSONB only for connector-specific extras

**LazyJobs:**
- Uses `required_skills` array for skills
- Uses `metadata` JSONB for EVERYTHING extra (benefits, expires_date, source info, raw data)

## What LazyJobs Needs in Metadata

```javascript
metadata: {
  source: 'openjobs',                    // ✅ Available in fields.source
  original_source: 'arbetsformedlingen', // ✅ Available in fields.connector
  original_id: 'af-123',                 // ✅ Available in fields.original_id
  benefits: ['Remote work', '...'],      // ⚠️ In OpenJobs.benefits array
  expires_date: '2025-11-16',            // ⚠️ In OpenJobs.expires_date column
  raw_data: {...},                       // ✅ Available in fields
  fetched_at: '2025-10-16T...',          // ✅ Available in fields.fetched_at
  
  // Additional useful fields from OpenJobs.fields:
  region: 'Stockholm',                   // ✅ Available in fields.region
  municipality: 'Stockholm',             // ✅ Available in fields.municipality
  country: 'Sweden',                     // ✅ Available in fields.country
  tags: ['React', 'Node.js'],           // ✅ Available in fields.tags
  company_logo: 'https://...',          // ✅ Available in fields.company_logo
  apply_url: 'https://...',             // ✅ Available in fields.apply_url
}
```

## Solution: Enhanced Transformation

The LazyJobs connector already does this correctly! It combines:
1. OpenJobs standard fields → LazyJobs standard columns
2. OpenJobs arrays (benefits, requirements) → LazyJobs metadata + required_skills
3. OpenJobs.fields JSONB → LazyJobs metadata.raw_data

### Current Transformation (Already Good!)

```javascript
function transformJob(openJob) {
  return {
    // Standard fields
    external_id: `openjobs_${openJob.id}`,
    title: openJob.title,
    company: openJob.company,
    // ... other standard fields
    
    // Skills from requirements array
    required_skills: openJob.requirements || [],
    
    // Metadata combines everything
    metadata: {
      source: 'openjobs',
      original_source: openJob.fields?.connector,
      original_id: openJob.id,
      benefits: openJob.benefits || [],        // ⭐ From array
      expires_date: openJob.expires_date,      // ⭐ From column
      raw_data: openJob.fields || {},          // ⭐ All JSONB data
      fetched_at: new Date().toISOString()
    }
  }
}
```

## What's Actually Stored

### In OpenJobs Database
```json
{
  "id": "remoteok-1128302",
  "title": "Business Development Account Executive",
  "company": "Strive Pharmacy",
  "requirements": ["growth", "lead", "sales"],
  "benefits": ["Remote work"],
  "fields": {
    "source": "remoteok",
    "connector": "remoteok",
    "original_id": "1128302",
    "tags": ["growth", "lead", "sales"],
    "company_logo": "",
    "apply_url": "https://...",
    "fetched_at": "2025-10-16T..."
  }
}
```

### In LazyJobs Database (After Transformation)
```json
{
  "external_id": "openjobs_remoteok-1128302",
  "title": "Business Development Account Executive",
  "company": "Strive Pharmacy",
  "required_skills": ["growth", "lead", "sales"],
  "metadata": {
    "source": "openjobs",
    "original_source": "remoteok",
    "original_id": "remoteok-1128302",
    "benefits": ["Remote work"],
    "raw_data": {
      "source": "remoteok",
      "connector": "remoteok",
      "original_id": "1128302",
      "tags": ["growth", "lead", "sales"],
      "company_logo": "",
      "apply_url": "https://...",
      "fetched_at": "2025-10-16T..."
    },
    "fetched_at": "2025-10-16T..."
  }
}
```

## Comparison: What's Available

| Data | OpenJobs | LazyJobs | Mapping |
|------|----------|----------|---------|
| **Source tracking** | ✅ fields.source | ✅ metadata.source | Direct |
| **Original connector** | ✅ fields.connector | ✅ metadata.original_source | Direct |
| **Original ID** | ✅ fields.original_id | ✅ metadata.original_id | Direct |
| **Benefits** | ✅ benefits[] array | ✅ metadata.benefits | Array → JSONB |
| **Expires date** | ✅ expires_date column | ✅ metadata.expires_date | Column → JSONB |
| **Skills/Tags** | ✅ requirements[] | ✅ required_skills[] | Array → Array |
| **Location details** | ✅ fields.region, municipality | ✅ metadata.raw_data.region | JSONB → JSONB |
| **Company logo** | ✅ fields.company_logo | ✅ metadata.raw_data.company_logo | JSONB → JSONB |
| **Apply URL** | ✅ fields.apply_url | ✅ metadata.raw_data.apply_url | JSONB → JSONB |
| **Fetched timestamp** | ✅ fields.fetched_at | ✅ metadata.fetched_at | JSONB → JSONB |

## Conclusion

✅ **The current setup is good!** 

**OpenJobs approach:**
- More normalized (dedicated columns for common fields)
- Better for querying (can filter on benefits, requirements directly)
- Cleaner schema

**LazyJobs approach:**
- More flexible (everything extra in metadata)
- Simpler schema (fewer columns)
- Easier to extend

**Both work well together** because:
1. LazyJobs connector transforms OpenJobs structure → LazyJobs structure
2. All data is preserved (nothing lost)
3. Both JSONB fields (`fields` and `metadata`) serve similar purposes

## Recommendation

**Keep both as-is!** They serve different purposes:

**OpenJobs** = Data aggregation layer
- Normalized structure for efficient querying
- Dedicated columns for common fields
- `fields` JSONB for connector-specific extras

**LazyJobs** = Application layer
- Flexible metadata for UI needs
- All extra data in one place
- Easy to add new fields without schema changes

The transformation layer (OpenJobs connector) handles the mapping perfectly.

## If You Want to Enhance

### Option 1: Add More to OpenJobs.fields
```go
Fields: map[string]interface{}{
    "source": "arbetsformedlingen",
    "connector": "arbetsformedlingen",
    "original_id": af.ID,
    "region": af.WorkplaceAddress.Region,
    "municipality": af.WorkplaceAddress.Municipality,
    "country": af.WorkplaceAddress.Country,
    "fetched_at": time.Now(),
    // ⭐ Add more as needed
    "application_deadline": af.LastApplicationDate,
    "job_type": af.JobType,
    "working_hours": af.WorkingHours,
}
```

### Option 2: Keep LazyJobs metadata rich
```javascript
metadata: {
    source: 'openjobs',
    original_source: openJob.fields?.connector,
    original_id: openJob.id,
    benefits: openJob.benefits || [],
    expires_date: openJob.expires_date,
    // ⭐ Add everything from fields
    ...openJob.fields,
    fetched_at: new Date().toISOString()
}
```

---

**Bottom line:** Your current setup is well-designed! Both systems use JSONB for flexibility, just with different naming (`fields` vs `metadata`). The transformation handles it perfectly.
