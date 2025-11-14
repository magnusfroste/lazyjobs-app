-- Enable RLS on job_matches table
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own matches
CREATE POLICY "Users can view own matches"
  ON public.job_matches
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Service role can manage all matches (for n8n workflow)
CREATE POLICY "Service role can manage all matches"
  ON public.job_matches
  FOR ALL
  USING (auth.role() = 'service_role');