# LazyJobs Backlog

**Last Updated:** 2025-10-25  
**Status:** Active Development - TypeScript Migration Complete! 🎉

---

## 🔥 High Priority (Do Next)

### 1. Fix Education Display in CV Insights
**Issue:** Education field shows `.title` but n8n returns `.degree`  
**Impact:** Users see "Not specified" instead of their education  
**Effort:** 5 minutes  
**File:** `src/components/CVInsights.jsx` line 50-52

```javascript
// Change from:
const education = cvData.education[0].title
// To:
const education = cvData.education[0].degree
```

---

## 📋 Medium Priority (Nice to Have)

### 2. Refactor: Extract Shared Header Component
**Issue:** SwipeInterface has 3 duplicate headers (loading, no-jobs, main)  
**Impact:** Hard to maintain, easy to miss updates  
**Effort:** 30-60 minutes  
**Benefit:** DRY principle, easier maintenance, consistency

**Current:**
```jsx
if (loading) return <div>Header 1 + Loading</div>
if (noJobs) return <div>Header 2 + No Jobs</div>
return <div>Header 3 + Main</div>
```

**Proposed:**
```jsx
return (
  <div>
    <Header /> {/* Shared component */}
    {loading && <Loading />}
    {noJobs && <NoJobs />}
    {!loading && !noJobs && <JobStack />}
  </div>
)
```

**Files:**
- Create: `src/components/Header.jsx`
- Update: `src/components/SwipeInterface.jsx`

**Decision:** Keep current architecture for now, refactor when adding 3+ more header features.

---

### 3. ~~Delete Old Application Assistant Files~~ ✅ COMPLETED
**Status:** ✅ Deleted during TypeScript migration (2025-10-25)  
**Files deleted:**
- `ApplicationModal.jsx` (old CSS version)
- `ApplicationModal.css` (old styles)

**Kept:** `ApplicationModalTailwind.tsx` (active version)

---

### 4. HTML → Markdown in OpenJobs
**Issue:** Job descriptions stored as HTML in OpenJobs  
**Impact:** Frontend has to clean HTML every time  
**Effort:** 2-3 hours  
**Benefit:** Clean data at source, better performance

**Current Flow:**
```
OpenJobs → HTML → LazyJobs → Clean HTML → Display
```

**Proposed Flow:**
```
OpenJobs → Markdown → LazyJobs → Display
```

**Implementation:**
- Add HTML → Markdown conversion in OpenJobs connectors
- Use library like `turndown` or `html-to-md`
- Store clean text in database
- Remove frontend cleaning (`htmlToText.js` becomes optional)

**Files:**
- OpenJobs: `/connectors/remoteok/connector.go`
- LazyJobs: Keep `src/lib/htmlToText.js` as fallback

---

## 🎨 UI/UX Improvements

### 5. User Feedback: Theme Toggle Placement
**Status:** Testing in production  
**Action:** Gather user feedback on header theme toggle  
**Questions:**
- Did you notice the theme toggle?
- Is it easy to find?
- Does it feel cluttered or clean?
- Do you use it more now?
- Would you prefer it somewhere else?

**Decision Point:** After 1-2 weeks of user feedback

---

## 🧪 Testing & Quality

### 6. Test with All 3 CVs
**Issue:** Only tested with Angela's CV (75%)  
**Todo:** Test with Ben (60%) and Tom (90%)  
**Verify:**
- Skills extraction works
- Match scores accurate
- Dark mode displays correctly
- All sections render

**Files:**
- `cv-ben-60percent.txt`
- `cv-angela-75percent.txt`
- `cv-tom-90percent.txt`

---

### 7. Add Linting Rule for Theme Consistency
**Issue:** Easy to accidentally use `@media (prefers-color-scheme: dark)`  
**Solution:** Add ESLint/Stylelint rule to prevent it

**Implementation:**
```json
// .eslintrc or stylelint config
{
  "rules": {
    "no-prefers-color-scheme": "error"
  }
}
```

**Custom rule:** Detect `@media (prefers-color-scheme: dark)` and suggest `.dark` selector instead.

---

## 📚 Documentation

### 8. Document Theme System
**Issue:** No documentation on theme architecture  
**Impact:** Easy to make mistakes (like we did!)

**Create:** `docs/architecture/THEME_SYSTEM.md`

**Content:**
- How ThemeContext works
- Why we use `.dark` selector
- Why NOT to use `@media (prefers-color-scheme: dark)`
- How to add dark mode to new components
- Examples

---

### 9. Update Component Guidelines
**Issue:** No guidelines for new components

**Create:** `docs/development/COMPONENT_GUIDELINES.md`

**Content:**
- Always use Tailwind `dark:` classes
- Never use external CSS files (prefer inline Tailwind)
- Theme toggle should work everywhere
- Testing checklist
- Code review checklist

---

## 🚀 Features (Future)

### 10. Complete Results View in Application Assistant
**Status:** Basic implementation done  
**Enhancement:** Add more features
- Syntax highlighting for code in CVs
- Rich text preview
- PDF export option
- Email preview with formatting

---

### 11. CV Version History
**Feature:** Track CV changes over time  
**Benefit:** Users can see what was extracted from each upload  
**Effort:** Medium (2-3 hours)

**Implementation:**
- Store CV versions in `cv_versions` table
- Show history in Profile Settings
- Allow rollback to previous version

---

### 12. Job Description Preview in Swipe
**Feature:** Expandable job description in job cards  
**Status:** Already implemented in Matches, could add to Swipe  
**Effort:** 30 minutes

---

## 🔧 Technical Debt

### 13. Consolidate Feature Flags
**Issue:** Feature flags scattered across files  
**Solution:** Centralize in one place with documentation

**Current:**
- `src/lib/featureFlags.js`
- `.env` variables
- Supabase `app_settings` table

**Proposed:** Document which flags go where and why.

---

### 14. Optimize Bundle Size
**Action:** Analyze and reduce bundle size  
**Tools:** `vite-bundle-visualizer`

**Check:**
- Unused dependencies
- Large libraries
- Code splitting opportunities
- Lazy loading

---

## 📊 Analytics & Monitoring

### 15. Track Theme Toggle Usage
**Metric:** How often users switch themes  
**Implementation:** Add analytics event to `toggleTheme()`

```javascript
const toggleTheme = () => {
  setIsDark(prev => !prev)
  analytics.track('theme_toggled', { to: !isDark ? 'dark' : 'light' })
}
```

---

### 16. Sentry Error Grouping
**Issue:** Errors not well-organized in Sentry  
**Action:** Add better error context and tags

---

## 🎯 Completed (Archive)

### October 2025 - TypeScript Migration 🚀
✅ **Complete JS → TS migration** - 2025-10-25
- Converted 9 files (components, hooks, libs)
- 100% TypeScript coverage for production code
- All config files converted (.ts/.mjs)
- Build passes with no errors

✅ **Type definitions fixed** - 2025-10-25
- Added missing Job, Profile, Match fields
- Fixed Supabase type definitions
- Added SwipeEvent interface
- 80% error reduction

✅ **Documentation reorganization** - 2025-10-25
- Deleted 9 obsolete migration docs
- Created organized docs/ structure
- Updated docs/README.md index
- Root directory cleaned (31 → 5 files)

✅ **Bug fixes** - 2025-10-25
- Fixed matches deletion (missing DELETE RLS policy)
- Fixed config file extensions
- Cleaned up legacy connectors

### October 2025 - Features & UI
✅ **Dark mode for CV Insights** - 2025-10-21  
✅ **Skills flattening (technical_skills → skills_flat)** - 2025-10-21  
✅ **n8n CV parser improvements** - 2025-10-21  
✅ **HTML cleaning for job descriptions** - 2025-10-21  
✅ **Expandable job descriptions in Matches** - 2025-10-21  
✅ **Application Assistant Tailwind rewrite** - 2025-10-21  
✅ **Theme toggle in header** - 2025-10-21  
✅ **Text contrast fixes** - 2025-10-21  

---

## 📝 Notes

### Decision Log

**2025-10-21:** Decided to keep duplicate headers in SwipeInterface for now. Will refactor when adding 3+ more header features. Trade-off: simpler logic vs. more code.

**2025-10-21:** Moved theme toggle to header (hybrid approach - in header AND settings). Testing with users for feedback.

**2025-10-21:** Built new Tailwind-based Application Assistant modal alongside old one, tested, then switched over. Old files can be deleted.

### Priorities

**Focus on:**
1. User-facing features
2. Bug fixes
3. Performance
4. Documentation

**Defer:**
1. Refactoring (unless painful)
2. Over-optimization
3. Speculative features

---

## 🤝 Contributing

When adding to backlog:
1. Add to appropriate priority section
2. Include effort estimate
3. List affected files
4. Explain impact/benefit
5. Move to "Completed" when done
