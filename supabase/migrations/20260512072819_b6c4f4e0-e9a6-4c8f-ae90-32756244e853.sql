
CREATE OR REPLACE FUNCTION public.match_jobs_for_user(
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
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    ja.id AS job_id,
    ja.role,
    ja.company,
    ROUND((1 - (ja.embedding <=> p.embedding))::numeric, 4)::float AS similarity
  FROM public.job_applications ja
  JOIN public.profiles p ON p.id = auth.uid()
  WHERE ja.user_id = auth.uid()
    AND ja.embedding IS NOT NULL
    AND p.embedding IS NOT NULL
    AND (1 - (ja.embedding <=> p.embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

DROP FUNCTION IF EXISTS public.match_jobs_for_user(uuid, float, int);
