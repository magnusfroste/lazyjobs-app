-- Add DELETE policy for matches table
-- This allows users to delete their own matches

-- Add DELETE policy
CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE
  USING (auth.uid() = user_id);

-- Verify all policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'matches'
ORDER BY cmd;
