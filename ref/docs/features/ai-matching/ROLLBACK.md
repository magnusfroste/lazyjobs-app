# AI Matching Feature - Rollback Guide

This document explains how to disable or completely remove the AI Matching feature.

## Quick Disable (Recommended for Testing)

Simply set in `.env`:
```bash
VITE_ENABLE_AI_MATCHING=false
```

The feature will be disabled but code remains in place for easy re-enabling.

## Complete Removal

If you want to completely remove the AI matching code:

### 1. Delete New Files

```bash
# Core AI matching files
rm src/lib/aiMatching.js
rm src/lib/featureFlags.js
rm src/hooks/useAIMatching.js
rm src/components/MatchModeToggle.jsx
rm src/components/MatchModeToggle.css
rm ROLLBACK_AI_MATCHING.md
```

### 2. Remove Code Blocks

Search for and remove all code blocks marked with:
```javascript
// ============ AI MATCHING FEATURE START ============
// ... code ...
// ============ AI MATCHING FEATURE END ==============
```

Files that may contain these markers:
- `src/components/JobStack.jsx` (or your main stack component)
- Any other components that import AI matching

### 3. Remove from .env

Delete these lines from `.env` and `.env.example`:
```bash
# AI Matching (Optional - can be removed)
VITE_ENABLE_AI_MATCHING=true
VITE_AI_MATCHING_PREMIUM=false
VITE_AI_MATCHING_SHOW_STATS=true
```

### 4. Revert qdrant.js Changes

Remove the `searchByText` method from `src/lib/qdrant.js` (lines added for AI matching).

Or keep it - it doesn't hurt anything if unused.

### 5. Test

```bash
npm run dev
```

Verify the app works without AI matching.

## Verification Checklist

- [ ] App starts without errors
- [ ] Job stack loads normally
- [ ] No AI matching toggle visible
- [ ] Existing keyword matching works
- [ ] No console errors related to AI matching

## Rollback Reasons

Common reasons you might want to rollback:

1. **Performance issues** - AI matching too slow
2. **Cost concerns** - OpenAI API costs too high
3. **Quality issues** - AI matches not better than keyword
4. **Complexity** - Want to simplify codebase
5. **Testing complete** - A/B test showed keyword matching is better

## Re-enabling

To re-enable after disabling:

```bash
VITE_ENABLE_AI_MATCHING=true
```

That's it! All code is still in place.

## Support

If you encounter issues during rollback:

1. Check git history: `git log --oneline --grep="AI MATCHING"`
2. Review this commit for all changes made
3. Restore from backup if needed

## Notes

- The Qdrant integration itself is separate and can remain
- Keyword matching is completely independent
- No database migrations needed for rollback
- User data is not affected
