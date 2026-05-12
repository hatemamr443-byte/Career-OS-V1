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
    // Auth
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

    // Input validation
    const body = await req.json().catch(() => null) as
      | { cv?: string; jd?: string; jobId?: string }
      | null;
    if (!body) return json({ error: "Invalid JSON" }, 400);

    const cv = (body.cv ?? "").toString().trim();
    const jd = (body.jd ?? "").toString().trim();
    const jobId = body.jobId?.toString();

    if (cv.length < 20) return json({ error: "CV is too short (min 20 chars)" }, 400);
    if (jd.length < 20) return json({ error: "Job description is too short (min 20 chars)" }, 400);
    if (cv.length > 20000 || jd.length > 20000) return json({ error: "Input too long" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const model = "google/gemini-2.5-flash";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: [
              "You are a strict, senior technical recruiter evaluating CV↔JD fit.",
              "Scoring rubric (be conservative, avoid inflation):",
              "- 90-100: Near-perfect match. All required skills present with clear, recent, direct experience. Reserved for exceptional alignment.",
              "- 75-89: Strong match. Meets all required skills and most preferred ones with relevant experience.",
              "- 60-74: Decent match. Meets most required skills but with notable gaps in depth, recency, or scope.",
              "- 40-59: Weak match. Missing one or more required skills or lacking relevant experience.",
              "- 0-39: Poor match. Multiple required skills missing or fundamentally different background.",
              "Rules:",
              "1. Heavily penalize each missing REQUIRED skill, years-of-experience gap, or domain mismatch (subtract meaningfully per gap).",
              "2. Reward only DIRECT evidence: exact keyword/tech matches, quantified outcomes, and experience clearly demonstrated in the CV. Do not assume transferable skills unless explicit.",
              "3. Do NOT inflate. When in doubt, score lower. Never default to 70-80 as a 'safe' middle.",
              "4. Strengths/weaknesses must be SPECIFIC to this CV and JD — cite concrete skills, tools, years, or responsibilities. No generic phrases like 'good communicator', 'team player', 'strong technical background'.",
              "5. Recommendation: 1–2 sentences, actionable and job-specific (e.g., what to learn/highlight for THIS role). No filler.",
              "Always call the return_score tool with structured output.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `CV:\n"""\n${cv}\n"""\n\nJOB DESCRIPTION:\n"""\n${jd}\n"""\n\nApply the rubric strictly. Return a fit score (0-100), exactly 3 specific strengths (each citing a concrete skill/experience that matches the JD), exactly 3 specific weaknesses (each naming a missing or weak required item from the JD), and a 1–2 sentence job-specific recommendation.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_score",
              description: "Return the structured fit assessment.",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                  },
                  recommendation: { type: "string" },
                },
                required: ["score", "strengths", "weaknesses", "recommendation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_score" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit exceeded, please try again shortly." }, 429);
    if (aiResp.status === 402) return json({ error: "AI credits exhausted. Add funds in Workspace → Usage." }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI gateway error" }, 502);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call in AI response", JSON.stringify(aiJson));
      return json({ error: "AI returned no structured output" }, 502);
    }

    let parsed: {
      score: number;
      strengths: string[];
      weaknesses: string[];
      recommendation: string;
    };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return json({ error: "AI output malformed" }, 502);
    }

    // Persist if we have a job id (optional)
    let saved: { id: string } | null = null;
    if (jobId) {
      const { data, error } = await supabase
        .from("job_scores")
        .insert({
          user_id: userId,
          job_id: jobId,
          score: parsed.score,
          strengths: parsed.strengths,
          weaknesses: parsed.weaknesses,
          recommendation: parsed.recommendation,
          model,
          cv_snapshot: cv,
          jd_snapshot: jd,
        })
        .select("id")
        .single();
      if (error) {
        console.error("Insert score failed:", error);
        // Don't fail the request — return the analysis anyway
      } else {
        saved = data;
      }
    }

    return json({ ...parsed, model, id: saved?.id ?? null });
  } catch (e) {
    console.error("score-job error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
