-- Astro Bitz leaderboard schema for the shared Supabase project.
-- This migration is intentionally idempotent so it can be reapplied safely.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.astro_bitz_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  score BIGINT NOT NULL,
  wave INTEGER NOT NULL,
  rank TEXT NOT NULL,
  anonymous_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT astro_bitz_leaderboard_player_name_length
    CHECK (char_length(btrim(player_name)) BETWEEN 1 AND 24),
  CONSTRAINT astro_bitz_leaderboard_score_range
    CHECK (score BETWEEN 0 AND 9007199254740991),
  CONSTRAINT astro_bitz_leaderboard_wave_range
    CHECK (wave BETWEEN 1 AND 1000000),
  CONSTRAINT astro_bitz_leaderboard_rank_length
    CHECK (char_length(btrim(rank)) BETWEEN 1 AND 32),
  CONSTRAINT astro_bitz_leaderboard_anonymous_id_length
    CHECK (char_length(anonymous_id) BETWEEN 1 AND 128)
);

CREATE INDEX IF NOT EXISTS astro_bitz_leaderboard_score_created_at_idx
  ON public.astro_bitz_leaderboard (score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS astro_bitz_leaderboard_created_at_score_idx
  ON public.astro_bitz_leaderboard (created_at DESC, score DESC);

CREATE INDEX IF NOT EXISTS astro_bitz_leaderboard_anonymous_score_idx
  ON public.astro_bitz_leaderboard (anonymous_id, score DESC);

ALTER TABLE public.astro_bitz_leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read Astro Bitz leaderboard"
  ON public.astro_bitz_leaderboard;
CREATE POLICY "Public can read Astro Bitz leaderboard"
  ON public.astro_bitz_leaderboard
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can submit Astro Bitz scores"
  ON public.astro_bitz_leaderboard;

REVOKE ALL ON public.astro_bitz_leaderboard FROM anon, authenticated;
GRANT SELECT ON public.astro_bitz_leaderboard TO anon, authenticated;

-- Run records are private. The browser receives only a one-time UUID from the
-- security-definer function below and never gets table access.
CREATE TABLE IF NOT EXISTS public.astro_bitz_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  submitted_at TIMESTAMPTZ,
  score BIGINT,
  wave INTEGER,
  player_name TEXT,

  CONSTRAINT astro_bitz_runs_anonymous_id_length
    CHECK (char_length(anonymous_id) BETWEEN 1 AND 128)
);

CREATE INDEX IF NOT EXISTS astro_bitz_runs_anonymous_started_idx
  ON public.astro_bitz_runs (anonymous_id, started_at DESC);

ALTER TABLE public.astro_bitz_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.astro_bitz_runs FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_astro_bitz_run(p_anonymous_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  IF p_anonymous_id IS NULL
    OR char_length(p_anonymous_id) NOT BETWEEN 1 AND 128 THEN
    RAISE EXCEPTION 'Invalid anonymous identifier' USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(*)
    FROM public.astro_bitz_runs
    WHERE anonymous_id = p_anonymous_id
      AND started_at > clock_timestamp() - INTERVAL '1 minute'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many runs started' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.astro_bitz_runs (anonymous_id)
  VALUES (p_anonymous_id)
  RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_astro_bitz_score(
  p_run_id UUID,
  p_anonymous_id TEXT,
  p_player_name TEXT,
  p_score BIGINT,
  p_wave INTEGER,
  p_rank TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run public.astro_bitz_runs%ROWTYPE;
  v_elapsed_seconds DOUBLE PRECISION;
  v_expected_rank TEXT;
BEGIN
  SELECT *
  INTO v_run
  FROM public.astro_bitz_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown run' USING ERRCODE = '22023';
  END IF;

  IF v_run.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Run already submitted' USING ERRCODE = '22023';
  END IF;

  IF p_anonymous_id IS NULL OR v_run.anonymous_id <> p_anonymous_id THEN
    RAISE EXCEPTION 'Run owner mismatch' USING ERRCODE = '22023';
  END IF;

  IF p_player_name IS NULL
    OR char_length(btrim(p_player_name)) NOT BETWEEN 2 AND 24
    OR p_score IS NULL OR p_score < 0
    OR p_wave IS NULL OR p_wave NOT BETWEEN 1 AND 1000000
    OR p_rank IS NULL OR char_length(btrim(p_rank)) NOT BETWEEN 1 AND 32 THEN
    RAISE EXCEPTION 'Invalid score payload' USING ERRCODE = '22023';
  END IF;

  v_elapsed_seconds := EXTRACT(EPOCH FROM (clock_timestamp() - v_run.started_at));

  IF v_elapsed_seconds < GREATEST(2, (p_wave - 1) * 8)
    OR v_elapsed_seconds > 21600 THEN
    RAISE EXCEPTION 'Implausible run duration' USING ERRCODE = '22023';
  END IF;

  IF p_score > p_wave::BIGINT * 3000 THEN
    RAISE EXCEPTION 'Implausible score for wave' USING ERRCODE = '22023';
  END IF;

  v_expected_rank := CASE
    WHEN p_score >= 35000 THEN 'Astro Bitz'
    WHEN p_score >= 28000 THEN 'Celestial Master'
    WHEN p_score >= 24000 THEN 'Galactic Champion'
    WHEN p_score >= 20000 THEN 'Nebula Sovereign'
    WHEN p_score >= 16500 THEN 'Cosmic Guardian'
    WHEN p_score >= 13000 THEN 'Void Commander'
    WHEN p_score >= 10000 THEN 'Legendary Pilot'
    WHEN p_score >= 7500 THEN 'Fleet Admiral'
    WHEN p_score >= 5500 THEN 'Sky Marshal'
    WHEN p_score >= 4000 THEN 'Star Colonel'
    WHEN p_score >= 3000 THEN 'Flight Captain'
    WHEN p_score >= 2200 THEN 'Wing Commander'
    WHEN p_score >= 1500 THEN 'Squadron Leader'
    WHEN p_score >= 1000 THEN 'Aviator'
    WHEN p_score >= 600 THEN 'Pilot'
    WHEN p_score >= 300 THEN 'Navigator'
    WHEN p_score >= 100 THEN 'Rookie'
    ELSE 'Cadet'
  END;

  IF btrim(p_rank) <> v_expected_rank THEN
    RAISE EXCEPTION 'Rank does not match score' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.astro_bitz_leaderboard (
    player_name,
    score,
    wave,
    rank,
    anonymous_id
  ) VALUES (
    btrim(p_player_name),
    p_score,
    p_wave,
    v_expected_rank,
    p_anonymous_id
  );

  UPDATE public.astro_bitz_runs
  SET submitted_at = clock_timestamp(),
      score = p_score,
      wave = p_wave,
      player_name = btrim(p_player_name)
  WHERE id = p_run_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.start_astro_bitz_run(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_astro_bitz_score(UUID, TEXT, TEXT, BIGINT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_astro_bitz_run(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_astro_bitz_score(UUID, TEXT, TEXT, BIGINT, INTEGER, TEXT)
  TO anon, authenticated;

COMMENT ON TABLE public.astro_bitz_leaderboard IS
  'Public Astro Bitz scores hosted in the shared Supabase project.';
COMMENT ON COLUMN public.astro_bitz_leaderboard.anonymous_id IS
  'Browser-scoped pseudonymous identifier; not an authenticated user ID.';
COMMENT ON TABLE public.astro_bitz_runs IS
  'Private one-time run tickets used to validate Astro Bitz score submissions.';
