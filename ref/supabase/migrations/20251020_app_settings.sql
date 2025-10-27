-- Create app_settings table for dynamic configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings (they're public config)
CREATE POLICY "Public read access" ON public.app_settings
  FOR SELECT USING (true);

-- Policy: Only authenticated users can update (optional - you might want service role only)
CREATE POLICY "Authenticated can update" ON public.app_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert default feature flags
INSERT INTO public.app_settings (key, value, description) VALUES
  ('features', '{
    "ai_matching": true,
    "ai_matching_premium": false,
    "ai_matching_show_stats": true,
    "application_assistant": true,
    "application_assistant_premium": false,
    "qdrant_enabled": true
  }'::jsonb, 'Feature flags for app functionality'),
  
  ('config', '{
    "qdrant_url": "https://n8n-qdrant.katsu6.easypanel.host",
    "cv_webhook_url": "https://agent.froste.eu/webhook/cvparser"
  }'::jsonb, 'Public configuration URLs and settings')

ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.app_settings IS 'Dynamic application settings and feature flags - no rebuild required to change';
