-- ============ PROFILES: extend ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS target_roles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_summary text,
  ADD COLUMN IF NOT EXISTS career_goals text;

-- ============ JOB STATUS ENUM ============
DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM
    ('saved','applied','screening','interview','offer','rejected','ghosted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ JOB APPLICATIONS ============
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  location text,
  source_url text,
  salary_range text,
  notes text,
  status public.job_status NOT NULL DEFAULT 'saved',
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_apps_user ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_user_status ON public.job_applications(user_id, status);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own jobs select" ON public.job_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own jobs insert" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own jobs update" ON public.job_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own jobs delete" ON public.job_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_job_apps_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ XP EVENTS ============
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  amount integer NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_user_created ON public.xp_events(user_id, created_at DESC);
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp select" ON public.xp_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ USER STATS ============
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stats select" ON public.user_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ STATS CREATE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_stats(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();

-- backfill stats for existing users
INSERT INTO public.user_stats(user_id)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;

-- ============ XP / STREAK ENGINE ============
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _type text, _amount int, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _last date;
  _new_streak int;
BEGIN
  INSERT INTO public.xp_events(user_id, event_type, amount, meta)
  VALUES (_user_id, _type, _amount, _meta);

  INSERT INTO public.user_stats(user_id, total_xp, last_active_date, current_streak, longest_streak)
  VALUES (_user_id, _amount, _today, 1, 1)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_active_date INTO _last FROM public.user_stats WHERE user_id = _user_id;

  IF _last IS NULL OR _last < _today - 1 THEN
    _new_streak := 1;
  ELSIF _last = _today - 1 THEN
    _new_streak := (SELECT current_streak FROM public.user_stats WHERE user_id = _user_id) + 1;
  ELSE
    _new_streak := (SELECT current_streak FROM public.user_stats WHERE user_id = _user_id);
  END IF;

  UPDATE public.user_stats
  SET total_xp = total_xp + _amount,
      level = GREATEST(1, 1 + ((total_xp + _amount) / 100)),
      current_streak = _new_streak,
      longest_streak = GREATEST(longest_streak, _new_streak),
      last_active_date = _today,
      updated_at = now()
  WHERE user_id = _user_id;
END $$;

-- ============ JOB APP XP TRIGGER ============
CREATE OR REPLACE FUNCTION public.on_job_app_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.award_xp(NEW.user_id, 'job_created', 10,
      jsonb_build_object('job_id', NEW.id, 'company', NEW.company, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.award_xp(NEW.user_id, 'job_status_change', 5,
        jsonb_build_object('job_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_job_app_xp_ins ON public.job_applications;
CREATE TRIGGER trg_job_app_xp_ins
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_job_app_change();

DROP TRIGGER IF EXISTS trg_job_app_xp_upd ON public.job_applications;
CREATE TRIGGER trg_job_app_xp_upd
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_job_app_change();

-- ============ PROFILE XP TRIGGER ============
CREATE OR REPLACE FUNCTION public.on_profile_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.headline IS DISTINCT FROM OLD.headline)
     OR (NEW.target_roles IS DISTINCT FROM OLD.target_roles)
     OR (NEW.skills IS DISTINCT FROM OLD.skills)
     OR (NEW.experience_summary IS DISTINCT FROM OLD.experience_summary)
     OR (NEW.career_goals IS DISTINCT FROM OLD.career_goals) THEN
    PERFORM public.award_xp(NEW.id, 'profile_updated', 15, '{}'::jsonb);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profile_xp ON public.profiles;
CREATE TRIGGER trg_profile_xp
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_profile_update();

-- updated_at on profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();