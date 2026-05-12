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

    // Optional payload: { target: "profile" | "job", jobId?: string }
    const body = await req.json().catch(() => ({})) as
      | { target?: "profile" | "job"; jobId?: string }
      | undefined;
    const target = body?.target ?? "profile";

    let inputText = "";

    if (target === "profile") {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("headline, target_roles, skills, experience_summary, career_goals, cv_text, location, experience_years")
        .eq("id", userId)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!profile) return json({ error: "Profile not found" }, 404);

      const parts = [
        profile.headline && `Headline: ${profile.headline}`,
        profile.target_roles?.length && `Target roles: ${profile.target_roles.join(", ")}`,
        profile.location && `Location: ${profile.location}`,
        profile.experience_years != null && `Experience: ${profile.experience_years} years`,
        profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
        profile.experience_summary && `Experience:\n${profile.experience_summary}`,
        profile.career_goals && `Goals:\n${profile.career_goals}`,
        profile.cv_text && `CV:\n${profile.cv_text.slice(0, 6000)}`,
      ].filter(Boolean);
      inputText = parts.join("\n\n");
      if (!inputText.trim()) return json({ error: "Profile is empty — fill it in first." }, 400);
    } else {
      if (!body?.jobId) return json({ error: "jobId is required for target=job" }, 400);
      const { data: job, error } = await supabase
        .from("job_applications")
        .select("role, company, location, description")
        .eq("id", body.jobId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!job) return json({ error: "Job not found" }, 404);
      inputText = [
        `Role: ${job.role}`,
        `Company: ${job.company}`,
        job.location && `Location: ${job.location}`,
        job.description && `Description:\n${(job.description ?? "").slice(0, 6000)}`,
      ].filter(Boolean).join("\n");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const embResp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: inputText,
      }),
    });

    if (embResp.status === 429) return json({ error: "Rate limit exceeded, try again shortly." }, 429);
    if (embResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!embResp.ok) {
      const t = await embResp.text();
      console.error("Embedding gateway error:", embResp.status, t);
      return json({ error: "Embedding service unavailable" }, 502);
    }

    const data = await embResp.json();
    const embedding = data?.data?.[0]?.embedding as number[] | undefined;
    if (!embedding || !Array.isArray(embedding)) {
      console.error("Invalid embedding response", JSON.stringify(data));
      return json({ error: "Invalid embedding response" }, 502);
    }

    // pgvector expects bracketed string literal
    const vectorLiteral = `[${embedding.join(",")}]`;

    if (target === "profile") {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ embedding: vectorLiteral })
        .eq("id", userId);
      if (upErr) return json({ error: upErr.message }, 500);
    } else {
      const { error: upErr } = await supabase
        .from("job_applications")
        .update({ embedding: vectorLiteral })
        .eq("id", body!.jobId!)
        .eq("user_id", userId);
      if (upErr) return json({ error: upErr.message }, 500);
    }

    return json({ success: true, dimensions: embedding.length, target });
  } catch (e) {
    console.error("embed-profile error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
