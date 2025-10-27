# Data Model Harmonization Summary

**Date:** October 16, 2025  
**Status:** 🎯 Plan Ready for Implementation

## Problem Identified

LazyJobs needs structured data for matching (salary ranges, remote flag, URLs), but OpenJobs currently stores some of this data as unstructured strings or in JSONB fields.

## Solution: Enhance OpenJobs (Single Source of Truth)

### ✅ What We're Adding to OpenJobs

**New Fields in `job_posts` table:**
1. `salary_min` (INTEGER) - Parsed minimum salary
2. `salary_max` (INTEGER) - Parsed maximum salary  
3. `salary_currency` (VARCHAR) - Currency code (USD, SEK, EUR)
4. `is_remote` (BOOLEAN) - Remote work flag
5. `url` (TEXT) - Direct application link

**Keep existing:**
- `salary` (STRING) - Original salary description for reference
- `fields` (JSONB) - Flexible metadata

## Benefits

### For LazyJobs (Matching)
- ✅ **Better salary filtering** - Users can filter by salary range
- ✅ **Remote work filtering** - Easy to find remote jobs
- ✅ **Direct applications** - One-click apply
- ✅ **Improved matching** - More structured data for algorithm

### For OpenJobs (Data Quality)
- ✅ **Structured data** - Easier to query and filter
- ✅ **All consumers benefit** - Any app using OpenJobs gets better data
- ✅ **Backward compatible** - Keep original fields
- ✅ **Better indexes** - Faster queries on salary and remote

### For Maintenance
- ✅ **Single source of truth** - Parsing logic in one place
- ✅ **Easier to test** - Centralized validation
- ✅ **Consistent across sources** - All connectors use same format

## Implementation Status

### ✅ Completed
1. **Migration created** - `002_add_matching_fields.sql`
2. **Model updated** - `pkg/models/job.go` with new fields
3. **Documentation** - Complete harmonization plan

### 🔄 Next Steps (Priority Order)

#### Priority 1: Database & Model (Ready to Deploy)
```bash
# Run in OpenJobs
cd /Users/mafr/Code/OpenJobs
psql $DATABASE_URL < migrations/002_add_matching_fields.sql
```

#### Priority 2: Update Connectors (Implement Parsing)

**Arbetsförmedlingen** (Most used):
- Add `parseSalary()` function
- Add `detectRemote()` function  
- Add `extractURL()` function
- Update `transformAFJob()` to populate new fields

**RemoteOK** (Already remote):
- Set `is_remote = true` for all jobs
- Parse salary if available
- Extract URL from slug

**EURES/Adzuna**:
- Parse salary from API
- Detect remote from location
- Extract application URL

**Remotive** (Already remote):
- Set `is_remote = true` for all jobs
- Parse salary if available
- Extract URL from API

#### Priority 3: Update LazyJobs Connector

Simplify transformation since OpenJobs provides structured data:
```javascript
// Use parsed data directly from OpenJobs
salary_min: openJob.salary_min || null,
salary_max: openJob.salary_max || null,
salary_currency: openJob.salary_currency || 'USD',
is_remote: openJob.is_remote || false,
url: openJob.url || openJob.fields?.source_url || '',
```

## Example: Arbetsförmedlingen Enhancement

### Before (Current)
```go
job := models.JobPost{
    Salary: "SEK 45,000 - 65,000/month",  // String
    Location: "Stockholm, Sweden",         // No remote flag
    Fields: map[string]interface{}{
        "source_url": "https://...",       // URL in metadata
    },
}
```

### After (Enhanced)
```go
job := models.JobPost{
    Salary: "SEK 45,000 - 65,000/month",  // Keep original
    SalaryMin: intPtr(45000),              // ⭐ Parsed
    SalaryMax: intPtr(65000),              // ⭐ Parsed
    SalaryCurrency: "SEK",                 // ⭐ Parsed
    IsRemote: false,                       // ⭐ Detected
    URL: "https://...",                    // ⭐ Extracted
    Location: "Stockholm, Sweden",
    Fields: map[string]interface{}{
        "source_url": "https://...",       // Keep for reference
    },
}
```

## Helper Functions to Implement

### 1. Salary Parsing
```go
func parseSalary(salaryStr string) (min *int, max *int, currency string) {
    // Parse patterns like:
    // "SEK 45,000 - 65,000/month"
    // "$50k - $70k"
    // "€40,000 - €60,000"
    // "50000-70000 SEK"
}
```

### 2. Remote Detection
```go
func detectRemote(location, description string) bool {
    keywords := []string{
        "remote", "distans", "hemarbete", "fjärr",
        "work from home", "wfh", "anywhere",
    }
    // Check location and description
}
```

### 3. URL Extraction
```go
func extractURL(jobData interface{}) string {
    // Extract from API response
    // Build from job ID if needed
    // Return direct application link
}
```

## Testing Plan

### 1. Database Migration
```sql
-- Verify columns added
\d job_posts

-- Check backfill results
SELECT 
    COUNT(*) as total,
    COUNT(is_remote) as with_remote,
    COUNT(url) as with_url
FROM job_posts;
```

### 2. Connector Testing
```bash
# Test Arbetsförmedlingen
curl -X POST http://localhost:8080/sync/manual

# Verify new fields populated
curl http://localhost:8080/jobs?limit=5 | jq '.data[] | {
    title, 
    salary_min, 
    salary_max, 
    is_remote, 
    url
}'
```

### 3. LazyJobs Integration
```bash
# Run OpenJobs connector
cd /Users/mafr/Code/LazyJobs/connectors/openjobs
npm start

# Verify jobs have structured data
```

## Rollout Plan

### Week 1: Foundation
- ✅ Run database migration
- ✅ Deploy updated OpenJobs model
- ✅ Test with existing data

### Week 2: Arbetsförmedlingen
- 🔄 Implement parsing functions
- 🔄 Update connector
- 🔄 Test and deploy

### Week 3: Other Connectors
- 🔄 Update RemoteOK (simple)
- 🔄 Update Remotive (simple)
- 🔄 Update EURES (moderate)

### Week 4: LazyJobs
- 🔄 Update connector transformation
- 🔄 Test matching improvements
- 🔄 Deploy to production

## Success Metrics

- ✅ **90%+ jobs have salary_min/max** (where salary exists)
- ✅ **100% remote jobs flagged** (RemoteOK, Remotive)
- ✅ **95%+ jobs have application URL**
- ✅ **Improved match quality** in LazyJobs
- ✅ **Faster salary filtering** queries

## Risk Mitigation

1. **Backward Compatibility** - Keep original fields
2. **Gradual Rollout** - Update connectors one by one
3. **Fallback Logic** - LazyJobs can still use fields.source_url if url is empty
4. **Testing** - Verify each connector before production

---

**Ready to implement!** Start with database migration, then enhance connectors one by one.

**Key Principle:** Less is more - focus on the fields that directly improve matching quality.
