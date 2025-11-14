-- Create notification_history table to track all push notifications sent
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  badge TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries by user
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id, sent_at DESC);

-- Create index for job lookups
CREATE INDEX idx_notification_history_job_id ON public.notification_history(job_id);

-- Enable RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notification history
CREATE POLICY "Users can view own notification history"
  ON public.notification_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read/clicked/dismissed)
CREATE POLICY "Users can update own notifications"
  ON public.notification_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can insert notifications (from edge function)
CREATE POLICY "Service role can insert notifications"
  ON public.notification_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Comment on table
COMMENT ON TABLE public.notification_history IS 'Tracks all push notifications sent to users for history and analytics';