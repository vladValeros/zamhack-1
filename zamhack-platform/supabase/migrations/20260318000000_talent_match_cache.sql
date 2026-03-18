-- Create talent_match_cache table
CREATE TABLE IF NOT EXISTS public.talent_match_cache (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score        integer     NOT NULL CHECK (score >= 0 AND score <= 100),
  reason       text,
  computed_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT talent_match_cache_company_student_unique UNIQUE (company_id, student_id)
);

-- Fast lookup by company, ordered by score descending
CREATE INDEX IF NOT EXISTS idx_talent_match_cache_company_score
  ON public.talent_match_cache (company_id, score DESC);

-- Enable RLS
ALTER TABLE public.talent_match_cache ENABLE ROW LEVEL SECURITY;

-- Company users can only read their own match rows
CREATE POLICY "company_users_read_own_matches"
  ON public.talent_match_cache
  FOR SELECT
  USING (auth.uid() = company_id);
