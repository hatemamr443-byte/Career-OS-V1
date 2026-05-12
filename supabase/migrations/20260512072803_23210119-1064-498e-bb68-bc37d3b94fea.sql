
-- Task 4: profile upgrade (skip cols already present)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS cv_text TEXT,
  ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN NOT NULL DEFAULT true;

-- Task 6: pgvector
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_profiles_embedding
  ON public.profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_job_applications_embedding
  ON public.job_applications USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Matching function: returns ranked jobs for the calling user
CREATE OR REPLACE FUNCTION public.match_jobs_for_user(
  p_user_id uuid,
  match_threshold float DEFAULT 0.72,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  job_id uuid,
  role text,
  company text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ja.id AS job_id,
    ja.role,
    ja.company,
    ROUND((1 - (ja.embedding <=> p.embedding))::numeric, 4)::float AS similarity
  FROM public.job_applications ja
  JOIN public.profiles p ON p.id = p_user_id
  WHERE ja.user_id = p_user_id
    AND ja.embedding IS NOT NULL
    AND p.embedding IS NOT NULL
    AND (1 - (ja.embedding <=> p.embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_jobs_for_user(uuid, float, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_jobs_for_user(uuid, float, int) TO authenticated;
