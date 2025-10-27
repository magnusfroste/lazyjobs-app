# LazyJobs Changelog

## [2.0.0] - 2025-10-16

### 🎉 Major Refactor: OpenJobs Integration

**Breaking Changes:**
- Replaced individual connectors with unified OpenJobs integration
- Removed `connectors` table from database schema
- Simplified enrichment flow

### Added
- ✅ **OpenJobs Connector** - Single source for all job data
- ✅ **4 Job Sources** via OpenJobs:
  - Arbetsförmedlingen (Swedish government jobs)
  - EURES/Adzuna (European jobs)
  - Remotive (Remote-first jobs)
  - RemoteOK (Remote tech jobs) - NEW!
- ✅ **Inline AI Enrichment** - Jobs enriched before database insertion
- ✅ **RemoteOK Connector** in OpenJobs - 99+ remote tech positions

### Changed
- 🔄 **Database Schema Simplified**
  - Removed `connectors` table
  - Removed `connector_id` foreign key from jobs
  - Added unique constraint on `external_id`
  - Source tracking now in `metadata.original_source`
- 🔄 **Edge Function Simplified**
  - API key validation via environment variable
  - No database lookup for connectors
  - Simplified upsert logic
- 🔄 **Enrichment Flow**
  - Moved from post-ingestion to pre-ingestion
  - Jobs arrive in database already enriched
  - Eliminated need for separate enrichment process
- 🔄 **Project Structure**
  - Renamed `pipeline_x` → `LazyJobs`
  - Archived legacy connectors to `archive/legacy-connectors/`
  - Consolidated documentation

### Removed
- ❌ Individual Arbetsförmedlingen connector (replaced by OpenJobs)
- ❌ Individual RemoteOK connector (replaced by OpenJobs)
- ❌ `connectors` database table
- ❌ Connector registration system
- ❌ Post-ingestion enrichment triggers

### Technical Details

**Database Migrations:**
- `20251016000001_simplify_for_openjobs.sql` - Schema simplification
- `20251016000002_add_external_id_unique.sql` - Unique constraint

**Files Archived:**
- `connectors/arbetsformedlingen/` → `archive/legacy-connectors/`
- `connectors/remoteok/` → `archive/legacy-connectors/`

**Documentation:**
- Created `/docs/OPENJOBS_INTEGRATION.md` - Complete integration guide
- Created `/archive/legacy-connectors/README.md` - Archive explanation
- Updated main `README.md` with new architecture

### Performance Improvements
- ⚡ Faster queries (no JOIN on connectors table)
- ⚡ Jobs arrive enriched (no waiting for enrichment)
- ⚡ Simpler codebase (easier to maintain)

### Benefits
1. **More Job Sources** - 4 sources instead of 2
2. **Simpler Architecture** - One connector instead of many
3. **Better Data Quality** - Centralized deduplication in OpenJobs
4. **Easier Scaling** - Add sources to OpenJobs, all consumers benefit
5. **Cleaner Codebase** - Less duplication, clearer structure

---

## [1.0.0] - 2024-10-10

### Initial Release
- React 19 + Vite frontend
- Supabase backend
- Swipe interface for job matching
- AI-powered job enrichment
- Individual connectors for Arbetsförmedlingen and RemoteOK

---

**Migration Guide:** See `/docs/OPENJOBS_INTEGRATION.md` for detailed migration information.
