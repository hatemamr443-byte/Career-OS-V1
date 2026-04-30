CREATE TABLE public.job_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  strengths TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  recommendation TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  cv_snapshot TEXT,
  jd_snapshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_scores_user_job ON public.job_scores(user_id, job_id, created_at DESC);

ALTER TABLE public.job_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own scores select"
  ON public.job_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "own scores insert"
  ON public.job_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own scores delete"
  ON public.job_scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);