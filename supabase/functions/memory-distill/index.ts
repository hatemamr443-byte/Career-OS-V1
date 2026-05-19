// Memory Distiller — reads the user's last 30 days of events and extracts
// durable career-memory facts + narrative insights.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { buildCareerContext, recordMemory } from "../_shared/context.ts";

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
const FEATURE = "memory-distill";

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
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const ctx = await buildCareerContext(userId, {
      include: ["profile", "memory", "recent_events", "decisions", "rejection_patterns"],
      eventLimit: 80,
      decisionLimit: 10,
      feature: FEATURE,
      model: MODEL,
    });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: ctx.systemPreamble },
          {
            role: "user",
            content: ctx.contextBlocks + "\n\n## TASK\nDistill durable career-memory facts and 1-3 strategic insights from the activity above. Only emit facts you can defend with concrete evidence. Lower confidence (0.3-0.6) for weak signal, higher (0.7-0.95) for strong/repeated signal.",
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "distill_memory",
            description: "Return distilled facts + narrative insights.",
            parameters: {
              type: "object",
              properties: {
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
                },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      kind: { type: "string", enum: ["trajectory", "pattern", "warning", "opportunity", "strategic_note"] },
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["kind", "title", "body"],
                    additionalProperties: false,
                  },
                  maxItems: 3,
                },
              },
              required: ["memory_updates", "insights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "distill_memory" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit exceeded." }, 429);
    if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!aiResp.ok) return json({ error: "AI gateway error" }, 502);

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return json({ error: "AI returned no output" }, 502);
    const parsed = JSON.parse(toolCall.function.arguments);

    for (const m of parsed.memory_updates ?? []) {
      try { await recordMemory(userId, m.key, m.value, m.confidence, FEATURE); }
      catch (e) { console.error(e); }
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    if (parsed.insights?.length) {
      await admin.from("career_insights").insert(
        parsed.insights.map((i: any) => ({
          user_id: userId,
          kind: i.kind,
          title: i.title,
          body: i.body,
          evidence: {},
        })),
      );
    }

    return json({
      memory_count: (parsed.memory_updates ?? []).length,
      insight_count: (parsed.insights ?? []).length,
    });
  } catch (e) {
    console.error("memory-distill error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
