// Shared career-context builder used by every AI edge function.
// Assembles a stable system preamble + context blocks from profile, memory,
// recent events, and recent decisions — then logs the snapshot for observability.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export type ContextInclude =
  | "profile"
  | "memory"
  | "recent_events"
  | "decisions"
  | "rejection_patterns";

export interface BuildContextOpts {
  include: ContextInclude[];
  jobId?: string;
  eventLimit?: number;
  decisionLimit?: number;
  feature: string;
  model: string;
}

export interface CareerContext {
  systemPreamble: string;
  contextBlocks: string;
  snapshotId: string | null;
  contextHash: string;
}

const SYSTEM_PREAMBLE = [
  "You are the Career OS strategic intelligence engine.",
  "You have persistent memory of this user across every interaction.",
  "Be analytical, specific, and honest — never generic, never inflated.",
  "Cite concrete evidence from the provided memory + events whenever you reason.",
  "Tone: senior career strategist. Concise. No filler. No emoji.",
].join("\n");

async function sha256(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function admin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function buildCareerContext(
  userId: string,
  opts: BuildContextOpts,
): Promise<CareerContext> {
  const sb = admin();
  const blocks: string[] = [];

  if (opts.include.includes("profile")) {
    const { data: p } = await sb.from("profiles").select(
      "headline, target_roles, skills, experience_summary, career_goals, experience_years, location, cv_text",
    ).eq("id", userId).maybeSingle();
    if (p) {
      const lines: string[] = ["## PROFILE"];
      if (p.headline) lines.push(`Headline: ${p.headline}`);
      if (p.target_roles?.length) lines.push(`Target roles: ${p.target_roles.join(", ")}`);
      if (p.skills?.length) lines.push(`Skills: ${p.skills.join(", ")}`);
      if (p.experience_years) lines.push(`YoE: ${p.experience_years}`);
      if (p.location) lines.push(`Location: ${p.location}`);
      if (p.experience_summary) lines.push(`Experience: ${p.experience_summary.slice(0, 1200)}`);
      if (p.career_goals) lines.push(`Goals: ${p.career_goals.slice(0, 600)}`);
      blocks.push(lines.join("\n"));
    }
  }

  if (opts.include.includes("memory")) {
    const { data: mem } = await sb.from("career_memory")
      .select("key, value, confidence, updated_at")
      .eq("user_id", userId)
      .order("confidence", { ascending: false })
      .limit(40);
    if (mem?.length) {
      const lines = ["## MEMORY (distilled facts the system knows about this user)"];
      for (const m of mem) {
        lines.push(
          `- [${(m.confidence as number).toFixed(2)}] ${m.key}: ${JSON.stringify(m.value)}`,
        );
      }
      blocks.push(lines.join("\n"));
    }
  }

  if (opts.include.includes("recent_events")) {
    const limit = opts.eventLimit ?? 25;
    const { data: ev } = await sb.from("career_events")
      .select("kind, payload, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (ev?.length) {
      const lines = [`## RECENT EVENTS (last ${ev.length})`];
      for (const e of ev) {
        const date = new Date(e.created_at as string).toISOString().slice(0, 10);
        lines.push(`- ${date} ${e.kind} ${JSON.stringify(e.payload).slice(0, 220)}`);
      }
      blocks.push(lines.join("\n"));
    }
  }

  if (opts.include.includes("decisions")) {
    const limit = opts.decisionLimit ?? 5;
    const { data: dec } = await sb.from("decisions")
      .select("decision, confidence, fit_score, roi_score, growth_score, burnout_risk, salary_alignment, reasoning, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (dec?.length) {
      const lines = ["## RECENT DECISIONS"];
      for (const d of dec) {
        lines.push(
          `- ${d.decision} (conf ${(d.confidence as number).toFixed(2)}) fit=${d.fit_score} roi=${d.roi_score} growth=${d.growth_score} burnout=${d.burnout_risk} salary=${d.salary_alignment} — ${(d.reasoning as string).slice(0, 200)}`,
        );
      }
      blocks.push(lines.join("\n"));
    }
  }

  if (opts.include.includes("rejection_patterns")) {
    const { data: rej } = await sb.from("career_events")
      .select("payload, created_at")
      .eq("user_id", userId)
      .eq("kind", "job_rejected")
      .order("created_at", { ascending: false })
      .limit(15);
    if (rej?.length) {
      const lines = ["## REJECTION HISTORY"];
      for (const r of rej) lines.push(`- ${JSON.stringify(r.payload).slice(0, 200)}`);
      blocks.push(lines.join("\n"));
    }
  }

  const contextBlocks = blocks.join("\n\n");
  const contextHash = await sha256(contextBlocks);

  // Observability snapshot (best-effort)
  let snapshotId: string | null = null;
  try {
    const { data } = await sb.from("ai_context_snapshots").insert({
      user_id: userId,
      feature: opts.feature,
      context_hash: contextHash,
      tokens_in: Math.ceil(contextBlocks.length / 4),
      model: opts.model,
    }).select("id").single();
    snapshotId = (data?.id as string) ?? null;
  } catch (_e) { /* non-fatal */ }

  return { systemPreamble: SYSTEM_PREAMBLE, contextBlocks, snapshotId, contextHash };
}

export async function recordMemory(
  userId: string,
  key: string,
  value: unknown,
  confidence: number,
  source: string,
): Promise<void> {
  const sb = admin();
  await sb.rpc("upsert_career_memory", {
    _user_id: userId,
    _key: key,
    _value: value as any,
    _confidence: confidence,
    _source: source,
  });
}

export async function appendEvent(
  userId: string,
  kind: string,
  source: string,
  refId: string | null,
  payload: Record<string, unknown>,
  weight = 1,
): Promise<void> {
  const sb = admin();
  await sb.rpc("append_career_event", {
    _user_id: userId,
    _kind: kind,
    _source: source,
    _ref_id: refId,
    _payload: payload as any,
    _weight: weight,
  });
}
