import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type RemoteOkJob = {
  id?: string | number;
  slug?: string;
  company?: string;
  position?: string;
  location?: string;
  url?: string;
  apply_url?: string;
  description?: string;
  tags?: string[];
  salary_min?: number;
  salary_max?: number;
  date?: string;
};

const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const formatSalary = (min?: number, max?: number) => {
  if (!min && !max) return null;
  const f = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${f(min)}–${f(max)}`;
  return f((min ?? max)!);
};

const matchesQuery = (job: RemoteOkJob, q: string) => {
  if (!q) return true;
  const hay = [job.position, job.company, job.location, ...(job.tags ?? [])]
    .filter(Boolean).join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).every((t) => hay.includes(t));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({})) as {
      query?: string;
      limit?: number;
      source?: "remoteok";
    };
    const query = (body.query ?? "").toString().trim().slice(0, 200);
    const limit = Math.min(Math.max(body.limit ?? 10, 1), 25);

    // Fetch from RemoteOK public feed (no key required)
    const resp = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "career-os-bot/1.0" },
    });
    if (!resp.ok) {
      console.error("RemoteOK fetch failed", resp.status);
      return json({ error: "Source unavailable" }, 502);
    }
    const raw = await resp.json() as unknown[];
    // First item is metadata, the rest are jobs
    const jobs = (raw as RemoteOkJob[])
      .filter((j) => j && j.position && j.company)
      .filter((j) => matchesQuery(j, query))
      .slice(0, limit);

    if (!jobs.length) return json({ inserted: 0, skipped: 0, items: [] });

    // Avoid duplicates by source_url
    const urls = jobs.map((j) => j.url ?? j.apply_url).filter(Boolean) as string[];
    const { data: existing } = await supabase
      .from("job_applications")
      .select("source_url")
      .eq("user_id", userId)
      .in("source_url", urls);
    const existingSet = new Set((existing ?? []).map((r) => r.source_url));

    const rows = jobs
      .map((j) => {
        const sourceUrl = j.url ?? j.apply_url ?? null;
        if (sourceUrl && existingSet.has(sourceUrl)) return null;
        const description = j.description
          ? stripHtml(j.description).slice(0, 9000)
          : null;
        return {
          user_id: userId,
          company: (j.company ?? "Unknown").slice(0, 120),
          role: (j.position ?? "Unknown").slice(0, 120),
          location: j.location ? j.location.slice(0, 120) : null,
          source_url: sourceUrl,
          salary_range: formatSalary(j.salary_min, j.salary_max),
          description,
          notes: j.tags?.length ? `Tags: ${j.tags.slice(0, 8).join(", ")}` : null,
          status: "saved" as const,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    if (!rows.length) return json({ inserted: 0, skipped: jobs.length, items: [] });

    const { data: inserted, error: insertErr } = await supabase
      .from("job_applications")
      .insert(rows)
      .select("id, company, role, source_url");

    if (insertErr) {
      console.error("Insert failed", insertErr);
      return json({ error: insertErr.message }, 500);
    }

    return json({
      inserted: inserted?.length ?? 0,
      skipped: jobs.length - rows.length,
      items: inserted ?? [],
    });
  } catch (e) {
    console.error("scrape-jobs error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
