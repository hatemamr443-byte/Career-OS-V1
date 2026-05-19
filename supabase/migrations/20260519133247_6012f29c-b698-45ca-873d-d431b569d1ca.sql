
-- Career Memory + Decision Engine V2 schema

-- 1) career_events: append-only event log
CREATE TABLE public.career_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  source text NOT NULL DEFAULT 'system',
  ref_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  weight int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX career_events_user_created_idx ON public.career_events(user_id, created_at DESC);
CREATE INDEX career_events_kind_idx ON public.career_events(user_id, kind, created_at DESC);
ALTER TABLE public.career_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events select" ON public.career_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- No client INSERT policy: writes happen via SECURITY DEFINER functions only

-- 2) career_memory: distilled facts
CREATE TABLE public.career_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence real NOT NULL DEFAULT 0.5,
  source text NOT NULL DEFAULT 'system',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
CREATE INDEX career_memory_user_idx ON public.career_memory(user_id);
ALTER TABLE public.career_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory select" ON public.career_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own memory update" ON public.career_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own memory delete" ON public.career_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- INSERT happens via SECURITY DEFINER helper

-- 3) career_insights: generated narratives
CREATE TABLE public.career_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX career_insights_user_idx ON public.career_insights(user_id, created_at DESC);
ALTER TABLE public.career_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own insights select" ON public.career_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insights delete" ON public.career_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4) decisions: Decision Engine V2 verdicts
CREATE TABLE public.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  decision text NOT NULL,
  confidence real NOT NULL DEFAULT 0.5,
  fit_score int NOT NULL DEFAULT 0,
  roi_score int NOT NULL DEFAULT 0,
  growth_score int NOT NULL DEFAULT 0,
  burnout_risk int NOT NULL DEFAULT 0,
  salary_alignment int NOT NULL DEFAULT 0,
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  tradeoffs jsonb NOT NULL DEFAULT '[]'::jsonb,
  reasoning text NOT NULL DEFAULT '',
  evidence_event_ids uuid[] NOT NULL DEFAULT '{}',
  model text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX decisions_user_job_idx ON public.decisions(user_id, job_id, created_at DESC);
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own decisions select" ON public.decisions FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- INSERT only via SECURITY DEFINER edge function (service role bypasses RLS)

-- 5) ai_context_snapshots: observability
CREATE TABLE public.ai_context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  context_hash text NOT NULL,
  tokens_in int NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_context_user_idx ON public.ai_context_snapshots(user_id, created_at DESC);
ALTER TABLE public.ai_context_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots select" ON public.ai_context_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 6) Helper: append career event (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.append_career_event(
  _user_id uuid, _kind text, _source text, _ref_id uuid, _payload jsonb, _weight int DEFAULT 1
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.career_events(user_id, kind, source, ref_id, payload, weight)
  VALUES (_user_id, _kind, _source, _ref_id, COALESCE(_payload, '{}'::jsonb), COALESCE(_weight, 1))
  RETURNING id INTO _id;
  RETURN _id;
END $$;

-- 7) Helper: upsert career memory fact
CREATE OR REPLACE FUNCTION public.upsert_career_memory(
  _user_id uuid, _key text, _value jsonb, _confidence real, _source text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.career_memory(user_id, key, value, confidence, source, updated_at)
  VALUES (_user_id, _key, _value, COALESCE(_confidence, 0.5), COALESCE(_source, 'system'), now())
  ON CONFLICT (user_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        confidence = GREATEST(public.career_memory.confidence * 0.85, EXCLUDED.confidence),
        source = EXCLUDED.source,
        updated_at = now();

  PERFORM public.append_career_event(_user_id, 'preference_changed', _source, NULL,
    jsonb_build_object('key', _key, 'value', _value, 'confidence', _confidence), 1);
END $$;

-- 8) Extend existing trigger on job_applications to also emit career_events
CREATE OR REPLACE FUNCTION public.on_job_app_change()
 RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.award_xp(NEW.user_id, 'job_created', 10,
      jsonb_build_object('job_id', NEW.id, 'company', NEW.company, 'status', NEW.status));
    PERFORM public.append_career_event(NEW.user_id, 'job_saved', 'trigger', NEW.id,
      jsonb_build_object('company', NEW.company, 'role', NEW.role, 'status', NEW.status), 1);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.award_xp(NEW.user_id, 'job_status_change', 5,
        jsonb_build_object('job_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
      PERFORM public.append_career_event(NEW.user_id,
        CASE
          WHEN NEW.status::text = 'applied' THEN 'job_applied'
          WHEN NEW.status::text = 'rejected' THEN 'job_rejected'
          WHEN NEW.status::text = 'offer' THEN 'offer_received'
          ELSE 'status_changed'
        END,
        'trigger', NEW.id,
        jsonb_build_object('from', OLD.status, 'to', NEW.status, 'company', NEW.company, 'role', NEW.role), 2);
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- Make sure the trigger exists (it may already)
DROP TRIGGER IF EXISTS trg_on_job_app_change ON public.job_applications;
CREATE TRIGGER trg_on_job_app_change
AFTER INSERT OR UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.on_job_app_change();
