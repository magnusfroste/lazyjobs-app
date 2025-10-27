# 🐛 Fix: Matches Not Deleting

## Problem
When you delete matches in "My Matches", they disappear temporarily but come back when you navigate away and return. The deletion doesn't persist.

## Root Cause
**Missing DELETE policy on the `matches` table!**

The Supabase RLS (Row Level Security) policies only allow:
- ✅ SELECT (view matches)
- ✅ INSERT (create matches)
- ✅ UPDATE (mark as applied)
- ❌ **DELETE (MISSING!)**

When you try to delete, Supabase silently blocks it due to RLS, but doesn't throw an error.

## The Fix

### Step 1: Add DELETE Policy to Supabase

Go to your Supabase SQL Editor and run this:

```sql
-- Add DELETE policy for matches table
CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE
  USING (auth.uid() = user_id);
```

**Or use the Supabase Dashboard:**
1. Go to: https://arqugyvmegxonaerjbzd.supabase.co/project/arqugyvmegxonaerjbzd/auth/policies
2. Find the `matches` table
3. Click "New Policy"
4. Select "Delete" operation
5. Policy name: `Users can delete own matches`
6. USING expression: `auth.uid() = user_id`
7. Click "Save"

### Step 2: Verify the Fix

After adding the policy, try deleting a match again:
1. Go to "My Matches"
2. Delete a match
3. Navigate to swipe stack and back
4. The match should stay deleted! ✅

### Step 3: Check Console for Errors

The updated code now shows alerts if deletion fails:
- Open browser console (F12)
- Try deleting a match
- You should see: `✅ Match deleted: [...]`
- If you see an error, it will show an alert with the message

## What Changed in Code

**File:** `src/components/MatchesView.tsx`

**Before:**
```typescript
const deleteMatch = async matchId => {
  if (!confirm('Remove this match?')) return
  try {
    const { error } = await supabase.from('matches').delete().eq('id', matchId)
    if (error) throw error
    setMatches(matches.filter(m => m.id !== matchId))
  } catch (err) {
    console.error('Error deleting match:', err) // Silent failure!
  }
}
```

**After:**
```typescript
const deleteMatch = async matchId => {
  if (!confirm('Remove this match?')) return
  try {
    console.log('🗑️ Deleting match:', matchId)
    
    const { data, error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)
      .select() // Verify deletion
    
    if (error) {
      console.error('❌ Delete error:', error)
      alert(`Failed to delete match: ${error.message}`) // Show error!
      throw error
    }
    
    console.log('✅ Match deleted:', data)
    setMatches(matches.filter(m => m.id !== matchId))
  } catch (err) {
    console.error('❌ Error deleting match:', err)
    alert(`Error: ${err.message || 'Failed to delete match'}`) // Show error!
  }
}
```

## Testing

1. **Before fix:** Deletion appears to work but match comes back
2. **After fix:** Deletion persists across navigation

## Why This Happened

The original `fix-matches-policy.sql` script only added SELECT, INSERT, and UPDATE policies, but forgot DELETE:

```sql
-- Original script (incomplete)
CREATE POLICY "Users can view own matches" ON matches FOR SELECT ...
CREATE POLICY "Users can insert own matches" ON matches FOR INSERT ...
CREATE POLICY "Users can update own matches" ON matches FOR UPDATE ...
-- DELETE policy was missing! ❌
```

## Status

- ✅ Code updated with better error handling
- ⏳ **Database policy needs to be added** (run SQL above)
- ✅ SQL script created: `scripts/add-matches-delete-policy.sql`

## Quick Fix Command

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref arqugyvmegxonaerjbzd

# Run the migration
supabase db push
```

Or just run the SQL manually in the Supabase dashboard! 🚀
