
-- Drop dependent objects
DROP INDEX IF EXISTS public.idx_profiles_embedding;
DROP INDEX IF EXISTS public.idx_job_applications_embedding;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.job_applications DROP COLUMN IF EXISTS embedding;

DROP EXTENSION IF EXISTS vector;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.profiles
  ADD COLUMN embedding extensions.vector(1536);

ALTER TABLE public.job_applications
  ADD COLUMN embedding extensions.vector(1536);

CREATE INDEX idx_profiles_embedding
  ON public.profiles USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_job_applications_embedding
  ON public.job_applications USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);
