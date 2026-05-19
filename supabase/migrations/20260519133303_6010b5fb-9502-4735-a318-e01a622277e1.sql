
REVOKE ALL ON FUNCTION public.append_career_event(uuid, text, text, uuid, jsonb, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_career_memory(uuid, text, jsonb, real, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_career_event(uuid, text, text, uuid, jsonb, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_career_memory(uuid, text, jsonb, real, text) TO service_role;
