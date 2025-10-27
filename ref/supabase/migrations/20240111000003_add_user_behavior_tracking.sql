-- User behavior tracking for ML/personalization

-- Track all swipe events with context
CREATE TABLE IF NOT EXISTS swipe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  
  -- Context at time of swipe
  match_score DECIMAL(3,2),
  time_spent_seconds INTEGER, -- How long they viewed the card
  viewed_breakdown BOOLEAN DEFAULT false, -- Did they flip the card?
  
  -- Job attributes (denormalized for ML)
  job_title TEXT,
  company_name TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT,
  is_remote BOOLEAN,
  employment_type TEXT,
  experience_level TEXT,
  required_skills JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT, -- Track sessions
  device_type TEXT -- mobile/desktop
);

-- Indexes for fast queries
CREATE INDEX idx_swipe_events_user_id ON swipe_events(user_id);
CREATE INDEX idx_swipe_events_direction ON swipe_events(direction);
CREATE INDEX idx_swipe_events_created_at ON swipe_events(created_at);

-- User preferences learned from behavior
CREATE TABLE IF NOT EXISTS learned_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Learned weights (0-1, higher = more important)
  salary_weight DECIMAL(3,2) DEFAULT 0.20,
  location_weight DECIMAL(3,2) DEFAULT 0.15,
  remote_weight DECIMAL(3,2) DEFAULT 0.20,
  skills_weight DECIMAL(3,2) DEFAULT 0.30,
  company_size_weight DECIMAL(3,2) DEFAULT 0.05,
  
  -- Learned thresholds
  min_acceptable_match_score DECIMAL(3,2) DEFAULT 0.50,
  min_salary_threshold INTEGER,
  
  -- Preferred attributes (learned from right swipes)
  preferred_locations JSONB DEFAULT '[]'::jsonb,
  preferred_companies JSONB DEFAULT '[]'::jsonb,
  preferred_industries JSONB DEFAULT '[]'::jsonb,
  preferred_job_titles JSONB DEFAULT '[]'::jsonb,
  
  -- Avoided attributes (learned from left swipes)
  avoided_locations JSONB DEFAULT '[]'::jsonb,
  avoided_companies JSONB DEFAULT '[]'::jsonb,
  avoided_keywords JSONB DEFAULT '[]'::jsonb,
  
  -- Stats
  total_swipes INTEGER DEFAULT 0,
  right_swipe_rate DECIMAL(3,2), -- % of right swipes
  avg_time_per_card INTEGER, -- seconds
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2) DEFAULT 0.0 -- How confident we are (0-1)
);

-- RLS Policies
ALTER TABLE swipe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own swipe events"
  ON swipe_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own swipe events"
  ON swipe_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own learned preferences"
  ON learned_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learned preferences"
  ON learned_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update learned preferences after each swipe
CREATE OR REPLACE FUNCTION update_learned_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update learned preferences
  INSERT INTO learned_preferences (user_id, total_swipes)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_swipes = learned_preferences.total_swipes + 1,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update preferences on each swipe
CREATE TRIGGER trigger_update_learned_preferences
  AFTER INSERT ON swipe_events
  FOR EACH ROW
  EXECUTE FUNCTION update_learned_preferences();

-- Function to calculate right swipe rate
CREATE OR REPLACE FUNCTION calculate_swipe_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE learned_preferences
  SET right_swipe_rate = (
    SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(*), 0)
    FROM swipe_events
    WHERE user_id = NEW.user_id AND direction = 'right'
  ) / NULLIF((
    SELECT COUNT(*)
    FROM swipe_events
    WHERE user_id = NEW.user_id
  ), 0)
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_calculate_swipe_stats
  AFTER INSERT ON swipe_events
  FOR EACH ROW
  EXECUTE FUNCTION calculate_swipe_stats();

COMMENT ON TABLE swipe_events IS 'Tracks every swipe with full context for ML/personalization';
COMMENT ON TABLE learned_preferences IS 'Stores learned user preferences from behavior patterns';
