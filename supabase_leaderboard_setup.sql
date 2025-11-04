-- Create leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  rank TEXT NOT NULL,
  anonymous_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT score_positive CHECK (score >= 0),
  CONSTRAINT wave_positive CHECK (wave >= 1)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON public.leaderboard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_anonymous_id ON public.leaderboard(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score_created_at ON public.leaderboard(score DESC, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read leaderboard
CREATE POLICY "Anyone can read leaderboard"
  ON public.leaderboard
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert scores (but not update/delete)
CREATE POLICY "Anyone can insert scores"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Grant access to anon role
GRANT SELECT, INSERT ON public.leaderboard TO anon;
GRANT USAGE ON SEQUENCE IF EXISTS public.leaderboard_id_seq TO anon;

-- Create a view for daily leaderboard (optional, for better performance)
CREATE OR REPLACE VIEW public.daily_leaderboard AS
SELECT
  id,
  player_name,
  score,
  wave,
  rank,
  anonymous_id,
  created_at,
  ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as position
FROM public.leaderboard
WHERE created_at >= CURRENT_DATE
ORDER BY score DESC, created_at ASC
LIMIT 100;

-- Create a view for weekly leaderboard (optional, for better performance)
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT
  id,
  player_name,
  score,
  wave,
  rank,
  anonymous_id,
  created_at,
  ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as position
FROM public.leaderboard
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY score DESC, created_at ASC
LIMIT 100;

-- Create a view for all-time leaderboard with rankings
CREATE OR REPLACE VIEW public.alltime_leaderboard AS
SELECT
  id,
  player_name,
  score,
  wave,
  rank,
  anonymous_id,
  created_at,
  ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as position
FROM public.leaderboard
ORDER BY score DESC, created_at ASC
LIMIT 100;

-- Grant access to views
GRANT SELECT ON public.daily_leaderboard TO anon;
GRANT SELECT ON public.weekly_leaderboard TO anon;
GRANT SELECT ON public.alltime_leaderboard TO anon;

COMMENT ON TABLE public.leaderboard IS 'Stores game leaderboard entries with scores, waves, and player ranks';
COMMENT ON COLUMN public.leaderboard.anonymous_id IS 'Anonymous identifier for tracking player scores without PII';
COMMENT ON COLUMN public.leaderboard.player_name IS 'Display name chosen by player (can be any string)';
COMMENT ON COLUMN public.leaderboard.score IS 'Final game score';
COMMENT ON COLUMN public.leaderboard.wave IS 'Highest wave reached';
COMMENT ON COLUMN public.leaderboard.rank IS 'Pilot rank achieved (Cadet, Ace, etc.)';
