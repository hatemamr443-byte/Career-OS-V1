// Decision Engine V2 — strategic, memory-aware job evaluation.
// Reads career memory + recent events; writes a structured decision back to the brain.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { buildCareerContext, recordMemory, appendEvent } from "../_shared/context.ts";

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

const MODEL = "google/gemini-2.5-pro";
const FEATURE = "decide-job";

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

    const body = await req.json().catch(() => null) as { jobId?: string; jd?: string } | null;
    if (!body?.jobId) return json({ error: "jobId required" }, 400);
    const jobId = body.jobId;

    // Load the job (RLS-protected via user's token)
    const { data: job, error: jobErr } = await supabase
      .from("job_applications")
      .select("id, role, company, location, salary_range, description, status")
      .eq("id", jobId)
      .maybeSingle();
    if (jobErr || !job) return json({ error: "Job not found" }, 404);

    const jd = (body.jd ?? job.description ?? "").toString().trim();
    if (jd.length < 20) return json({ error: "Job description is too short" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const ctx = await buildCareerContext(userId, {
      include: ["profile", "memory", "recent_events", "decisions", "rejection_patterns"],
      jobId,
      eventLimit: 20,
      decisionLimit: 5,
      feature: FEATURE,
      model: MODEL,
    });

    const userPrompt = [
      ctx.contextBlocks,
      "",
      "## TARGET JOB",
      `Company: ${job.company}`,
      `Role: ${job.role}`,
      job.location ? `Location: ${job.location}` : "",
      job.salary_range ? `Salary: ${job.salary_range}` : "",
      "",
      "Description:",
      jd.slice(0, 8000),
      "",
      "## TASK",
      "Evaluate this opportunity strategically using the memory + history above.",
      "Score 0-100 for: fit (CV match), roi (compensation+career value vs effort), growth (skill+seniority trajectory), burnout_risk (workload/culture red flags inferred), salary_alignment (vs user's known salary floor/expectation).",
      "Pick decision ∈ {apply, maybe, stretch, skip} with calibrated confidence 0-1.",
      "List 3 concrete strengths, 3 concrete weaknesses, and 1-3 tradeoffs as {pro, con}.",
      "Write a 2-4 sentence reasoning citing specific memory facts or past events.",
      "Emit memory_updates for any NEW persistent fact you learned (e.g. confirmed preferred stack, salary floor refinement, rejection pattern). Skip if nothing new.",
    ].filter(Boolean).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: ctx.systemPreamble },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "decide_job",
            description: "Return the strategic decision for this job.",
            parameters: {
              type: "object",
              properties: {
                decision: { type: "string", enum: ["apply", "maybe", "stretch", "skip"] },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                fit_score: { type: "integer", minimum: 0, maximum: 100 },
                roi_score: { type: "integer", minimum: 0, maximum: 100 },
                growth_score: { type: "integer", minimum: 0, maximum: 100 },
                burnout_risk: { type: "integer", minimum: 0, maximum: 100 },
                salary_alignment: { type: "integer", minimum: 0, maximum: 100 },
                strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                weaknesses: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                tradeoffs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { pro: { type: "string" }, con: { type: "string" } },
                    required: ["pro", "con"],
                    additionalProperties: false,
                  },
                  minItems: 1, maxItems: 4,
                },
                reasoning: { type: "string" },
                memory_updates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: { type: "string" },
                      value: {},
                      confidence: { type: "number", minimum: 0, maximum: 1 },
                    },
                    required: ["key", "value", "confidence"],
                    additionalProperties: false,
                  },
                  default: [],
                },
              },
              required: [
                "decision", "confidence", "fit_score", "roi_score", "growth_score",
                "burnout_risk", "salary_alignment", "strengths", "weaknesses",
                "tradeoffs", "reasoning",
              ],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "decide_job" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit exceeded." }, 429);
    if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI gateway error" }, 502);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call", JSON.stringify(aiJson));
      return json({ error: "AI returned no structured output" }, 502);
    }

    let parsed: any;
    try { parsed = JSON.parse(toolCall.function.arguments); }
    catch (e) { return json({ error: "AI output malformed" }, 502); }

    // Persist decision via service role (bypasses RLS)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: saved } = await admin.from("decisions").insert({
      user_id: userId,
      job_id: jobId,
      decision: parsed.decision,
      confidence: parsed.confidence,
      fit_score: parsed.fit_score,
      roi_score: parsed.roi_score,
      growth_score: parsed.growth_score,
      burnout_risk: parsed.burnout_risk,
      salary_alignment: parsed.salary_alignment,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      tradeoffs: parsed.tradeoffs,
      reasoning: parsed.reasoning,
      evidence_event_ids: [],
      model: MODEL,
    }).select("id").single();

    // Apply memory updates
    if (Array.isArray(parsed.memory_updates)) {
      for (const m of parsed.memory_updates) {
        try { await recordMemory(userId, m.key, m.value, m.confidence, FEATURE); }
        catch (e) { console.error("recordMemory failed:", e); }
      }
    }

    // Emit scoring event
    await appendEvent(userId, "job_scored", FEATURE, jobId, {
      decision: parsed.decision,
      confidence: parsed.confidence,
      fit: parsed.fit_score,
      roi: parsed.roi_score,
    }, 2);

    return json({ ...parsed, id: saved?.id ?? null, model: MODEL });
  } catch (e) {
    console.error("decide-job error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
