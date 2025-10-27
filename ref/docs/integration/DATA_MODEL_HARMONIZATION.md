# Data Model Harmonization: OpenJobs ↔ LazyJobs

**Goal:** Ensure OpenJobs captures all data needed for LazyJobs matching while keeping both systems clean and extensible.

## Current State Comparison

### OpenJobs Schema (`job_posts` table)
```sql
CREATE TABLE job_posts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    salary VARCHAR(255),                    -- ⚠️ String (not parsed)
    employment_type VARCHAR(100),
    experience_level VARCHAR(100),
    posted_date TIMESTAMP,
    expires_date TIMESTAMP,
    requirements TEXT[],                    -- ✅ Array
    benefits TEXT[],                        -- ✅ Array
    fields JSONB,                           -- ✅ Flexible metadata
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### LazyJobs Schema (`jobs` table)
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    external_id TEXT UNIQUE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    location TEXT,
    salary_min INTEGER,                     -- ✅ Parsed min
    salary_max INTEGER,                     -- ✅ Parsed max
    salary_currency TEXT DEFAULT 'USD',     -- ✅ Currency
    is_remote BOOLEAN DEFAULT false,        -- ✅ Remote flag
    employment_type TEXT,
    required_skills TEXT[],                 -- ✅ Skills for matching
    experience_level TEXT,
    url TEXT,                               -- ✅ Application URL
    metadata JSONB DEFAULT '{}',            -- ✅ Flexible metadata
    is_active BOOLEAN DEFAULT true,
    posted_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Key Differences for Matching

### 1. **Salary** ⚠️ CRITICAL FOR MATCHING
**OpenJobs:** String (e.g., "SEK 45,000 - 65,000/month")  
**LazyJobs:** Parsed integers (salary_min, salary_max, salary_currency)

**Impact:** LazyJobs needs parsed salary for range matching

### 2. **Skills** ✅ CRITICAL FOR MATCHING
**OpenJobs:** `requirements` array (general requirements)  
**LazyJobs:** `required_skills` array (specific skills for AI matching)

**Impact:** Both have arrays, but LazyJobs enriches with AI

### 3. **Remote Work** ⚠️ IMPORTANT FOR MATCHING
**OpenJobs:** Not explicit (can be in location or fields)  
**LazyJobs:** `is_remote` boolean flag

**Impact:** LazyJobs needs explicit remote flag for filtering

### 4. **Application URL** ⚠️ IMPORTANT FOR UX
**OpenJobs:** In `fields.source_url`  
**LazyJobs:** Dedicated `url` column

**Impact:** Users need direct apply link

## Harmonization Strategy

### Option 1: Enhance OpenJobs (RECOMMENDED) ✅

**Pros:**
- Single source of truth
- Better data quality at source
- All consumers benefit
- Easier to maintain

**Cons:**
- Need to update OpenJobs schema
- Migration required

### Option 2: Transform in LazyJobs Connector

**Pros:**
- No OpenJobs changes needed
- Quick to implement

**Cons:**
- Duplicate logic
- Inconsistent across consumers
- Harder to maintain

## Recommended Approach: Enhance OpenJobs

### Phase 1: Add Fields to OpenJobs (Non-Breaking)

Add new columns to `job_posts` table:

```sql
-- Add salary parsing
ALTER TABLE job_posts 
ADD COLUMN salary_min INTEGER,
ADD COLUMN salary_max INTEGER,
ADD COLUMN salary_currency VARCHAR(10) DEFAULT 'USD';

-- Add remote flag
ALTER TABLE job_posts 
ADD COLUMN is_remote BOOLEAN DEFAULT false;

-- Add application URL
ALTER TABLE job_posts 
ADD COLUMN url TEXT;

-- Keep original salary string for reference
-- (already exists as 'salary')
```

### Phase 2: Update Arbetsförmedlingen Connector

Enhance the connector to parse and populate new fields:

```go
func (ac *ArbetsformedlingenConnector) transformAFJob(af AFJob) models.JobPost {
    // Parse salary
    salaryMin, salaryMax, currency := ac.parseSalary(af.SalaryDescription)
    
    // Detect remote
    isRemote := ac.detectRemote(af)
    
    // Extract URL
    url := ac.extractURL(af)
    
    job := models.JobPost{
        ID:              fmt.Sprintf("af-%s", af.ID),
        Title:           af.Headline,
        Company:         af.Employer.Name,
        Description:     ac.extractDescription(af),
        Location:        ac.formatLocation(af),
        Salary:          af.SalaryDescription,  // Keep original
        SalaryMin:       salaryMin,             // ⭐ NEW
        SalaryMax:       salaryMax,             // ⭐ NEW
        SalaryCurrency:  currency,              // ⭐ NEW
        IsRemote:        isRemote,              // ⭐ NEW
        URL:             url,                   // ⭐ NEW
        EmploymentType:  ac.mapEmploymentType(af.EmploymentType.ConceptLabel),
        ExperienceLevel: ac.mapExperienceLevel(af.ExperienceRequired),
        PostedDate:      ac.parseAFDate(af.PublicationDate),
        ExpiresDate:     ac.parseAFDate(af.LastApplicationDate),
        Requirements:    ac.extractRequirements(af),
        Benefits:        ac.extractBenefits(af),
        Fields: map[string]interface{}{
            "source":       "arbetsformedlingen",
            "source_url":   url,
            "original_id":  af.ID,
            "country":      af.WorkplaceAddress.Country,
            "region":       af.WorkplaceAddress.Region,
            "municipality": af.WorkplaceAddress.Municipality,
            "connector":    "arbetsformedlingen",
            "fetched_at":   time.Now(),
        },
    }
    
    return job
}

// Helper functions to add:

func (ac *ArbetsformedlingenConnector) parseSalary(salaryStr string) (int, int, string) {
    // Parse "SEK 45,000 - 65,000/month" → (45000, 65000, "SEK")
    // Implementation needed
}

func (ac *ArbetsformedlingenConnector) detectRemote(af AFJob) bool {
    // Check if location contains "remote", "distans", "hemarbete"
    // Or check workplace address
    location := strings.ToLower(ac.formatLocation(af))
    description := strings.ToLower(af.Description.Text)
    
    remoteKeywords := []string{"remote", "distans", "hemarbete", "fjärr"}
    for _, keyword := range remoteKeywords {
        if strings.Contains(location, keyword) || strings.Contains(description, keyword) {
            return true
        }
    }
    return false
}
```

### Phase 3: Update OpenJobs Model

```go
// pkg/models/job.go
type JobPost struct {
    ID              string                 `json:"id" db:"id"`
    Title           string                 `json:"title" db:"title"`
    Company         string                 `json:"company" db:"company"`
    Description     string                 `json:"description" db:"description"`
    Location        string                 `json:"location" db:"location"`
    Salary          string                 `json:"salary" db:"salary"`
    SalaryMin       *int                   `json:"salary_min,omitempty" db:"salary_min"`        // ⭐ NEW
    SalaryMax       *int                   `json:"salary_max,omitempty" db:"salary_max"`        // ⭐ NEW
    SalaryCurrency  string                 `json:"salary_currency,omitempty" db:"salary_currency"` // ⭐ NEW
    IsRemote        bool                   `json:"is_remote" db:"is_remote"`                    // ⭐ NEW
    URL             string                 `json:"url,omitempty" db:"url"`                      // ⭐ NEW
    EmploymentType  string                 `json:"employment_type" db:"employment_type"`
    ExperienceLevel string                 `json:"experience_level" db:"experience_level"`
    PostedDate      time.Time              `json:"posted_date" db:"posted_date"`
    ExpiresDate     time.Time              `json:"expires_date" db:"expires_date"`
    Requirements    []string               `json:"requirements" db:"requirements"`
    Benefits        []string               `json:"benefits" db:"benefits"`
    Fields          map[string]interface{} `json:"fields" db:"fields"`
}
```

### Phase 4: Update LazyJobs Connector

Simplify transformation since OpenJobs now provides parsed data:

```javascript
function transformJob(openJob) {
  return {
    external_id: `openjobs_${openJob.id}`,
    title: openJob.title,
    company: openJob.company,
    description: openJob.description || '',
    location: openJob.location || '',
    
    // ⭐ Use parsed salary from OpenJobs
    salary_min: openJob.salary_min || null,
    salary_max: openJob.salary_max || null,
    salary_currency: openJob.salary_currency || 'USD',
    
    // ⭐ Use remote flag from OpenJobs
    is_remote: openJob.is_remote || false,
    
    // ⭐ Use URL from OpenJobs
    url: openJob.url || openJob.fields?.source_url || '',
    
    employment_type: openJob.employment_type || 'full-time',
    experience_level: openJob.experience_level || 'mid-level',
    posted_at: openJob.posted_date,
    
    // Skills from requirements (will be enriched by AI)
    required_skills: openJob.requirements || [],
    
    metadata: {
      source: 'openjobs',
      original_source: openJob.fields?.source || openJob.fields?.connector,
      original_id: openJob.fields?.original_id || openJob.id,
      benefits: openJob.benefits || [],
      expires_date: openJob.expires_date,
      raw_data: openJob.fields || {},
      fetched_at: new Date().toISOString()
    }
  }
}
```

## Data Quality for Matching

### Critical Fields (Must Have)
1. ✅ **Title** - For search and display
2. ✅ **Company** - For filtering and display
3. ✅ **Description** - For AI skill extraction
4. ✅ **Required Skills** - For matching algorithm
5. ⚠️ **Salary Range** - For filtering (needs parsing)
6. ⚠️ **Is Remote** - For filtering (needs detection)
7. ⚠️ **URL** - For application (needs extraction)

### Important Fields (Should Have)
8. ✅ **Location** - For geographic matching
9. ✅ **Employment Type** - For filtering
10. ✅ **Experience Level** - For matching

### Nice to Have
11. ✅ **Benefits** - For display
12. ✅ **Posted Date** - For freshness
13. ✅ **Expires Date** - For cleanup

## Implementation Priority

### Priority 1: Essential for Matching ⚡
1. **Add salary parsing** to OpenJobs connectors
2. **Add remote detection** to OpenJobs connectors
3. **Add URL extraction** to OpenJobs connectors
4. **Update OpenJobs schema** with new columns
5. **Update OpenJobs model** (JobPost struct)

### Priority 2: Improve Data Quality 📊
6. **Enhance Arbetsförmedlingen connector** with parsing
7. **Enhance RemoteOK connector** (already has remote=true)
8. **Enhance EURES connector** with parsing
9. **Enhance Remotive connector** (already has remote=true)

### Priority 3: Optimization 🚀
10. **Add indexes** on new columns (salary_min, is_remote)
11. **Add validation** for salary ranges
12. **Add tests** for parsing functions

## Migration Script for OpenJobs

```sql
-- migrations/002_add_matching_fields.sql

-- Add new columns for better matching
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_job_posts_salary_min ON job_posts (salary_min) WHERE salary_min IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_posts_is_remote ON job_posts (is_remote) WHERE is_remote = true;

-- Backfill is_remote from existing data (optional)
UPDATE job_posts 
SET is_remote = true 
WHERE 
    LOWER(location) LIKE '%remote%' 
    OR LOWER(location) LIKE '%distans%'
    OR LOWER(description) LIKE '%remote%'
    OR fields->>'source' IN ('remoteok', 'remotive');

-- Backfill URL from fields (optional)
UPDATE job_posts 
SET url = fields->>'source_url'
WHERE url IS NULL AND fields->>'source_url' IS NOT NULL;
```

## Benefits of This Approach

1. ✅ **Single Source of Truth** - OpenJobs has complete data
2. ✅ **Better Matching** - LazyJobs gets structured data
3. ✅ **All Consumers Benefit** - Any app using OpenJobs gets better data
4. ✅ **Easier Maintenance** - Parsing logic in one place
5. ✅ **Backward Compatible** - Keep original fields, add new ones
6. ✅ **Gradual Migration** - Can update connectors one by one

## Next Steps

1. **Create migration** for OpenJobs database
2. **Update JobPost model** in OpenJobs
3. **Add helper functions** for salary parsing and remote detection
4. **Update Arbetsförmedlingen connector** first (most used)
5. **Test with LazyJobs** connector
6. **Roll out to other connectors** (RemoteOK, EURES, Remotive)

---

**Recommendation:** Start with Priority 1 items. This will immediately improve matching quality in LazyJobs while keeping both systems clean and maintainable.
