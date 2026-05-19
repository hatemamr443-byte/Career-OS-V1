# AI Orchestration Layer + Memory — Implementation Plan

The goal: turn Career OS from "scattered AI features" into one persistent career brain. Every AI call reads and writes the same memory; the Decision Engine becomes the strategic core.

## Scope of this iteration

Three tightly-coupled pieces, shipped together:

1. **Career Memory Layer** — durable user intelligence (events, preferences, outcomes, trajectory)
2. **Shared AI Context Builder** — single function every edge function uses to assemble the prompt context
3. **Decision Engine V2** — reasoning, confidence, tradeoffs, ROI, growth, burnout, explainability

UX surfacing is minimal in this pass (a Memory panel on Profile + richer Score dialog). The full Unified Dashboard is the next iteration.

---

## 1 — Database (memory schema)

New tables, all RLS-protected to `auth.uid() = user_id`:

- **`career_events`** — append-only event log feeding the brain
  `id, user_id, kind, source, ref_id, payload jsonb, weight int, created_at`
  `kind`: `job_saved | job_applied | status_changed | job_scored | job_rejected | offer_received | recruiter_message | cv_updated | preference_changed | digest_opened | search_performed`

- **`career_memory`** — distilled, queryable facts (the "what the AI knows about you")
  `user_id, key, value jsonb, confidence float, source text, updated_at`
  Examples: `preferred_stack`, `salary_floor`, `rejection_patterns`, `winning_keywords`, `target_seniority`, `relocation_openness`, `burnout_signals`.

- **`career_insights`** — generated narratives (trajectory, patterns, recommendations)
  `id, user_id, kind, title, body, evidence jsonb, valid_until, created_at`
  `kind`: `trajectory | pattern | warning | opportunity | strategic_note`

- **`decisions`** — every Decision Engine V2 verdict
  `id, user_id, job_id, decision (apply|skip|maybe|stretch), confidence, fit_score, roi_score, growth_score, burnout_risk, salary_alignment, tradeoffs jsonb, reasoning text, evidence_event_ids uuid[], model, created_at`

- **`ai_context_snapshots`** — what context was sent to each AI call (debug + reproducibility)
  `id, user_id, feature, context_hash, tokens_in, model, created_at`

Indexes: `(user_id, created_at desc)` on events/decisions, `(user_id, key)` unique on memory.

Triggers: extend `on_job_app_change` to also insert into `career_events`. Add `on_job_score_insert` → `career_events`.

---

## 2 — Shared AI Context (edge-function module)

New file: `supabase/functions/_shared/context.ts` (Deno-importable, not deployed alone).

```ts
buildCareerContext(userId, opts: {
  include: ('profile'|'memory'|'recent_events'|'decisions'|'rejection_patterns')[],
  jobId?, eventLimit?, maxTokens?
}) → { systemPreamble, contextBlocks, snapshotId }
```

It pulls profile + top memory facts (by confidence) + last N events + last decisions, formats them into a stable markdown block, hashes it, logs to `ai_context_snapshots`. Every AI edge function calls this instead of building prompts from scratch — so memory automatically reaches every feature.

A second helper `recordMemory(userId, key, value, confidence, source)` upserts into `career_memory` and emits a `preference_changed` event.

---

## 3 — Decision Engine V2 (`score-job` → `decide-job`)

Rewrite the existing `score-job` function:

- Calls `buildCareerContext` with job + profile + memory + last 20 events + last 5 decisions.
- Uses **Lovable AI Gateway** with `google/gemini-2.5-pro` (reasoning model) + tool-calling for structured output:
  ```
  decide_job({
    decision, confidence (0-1),
    fit_score, roi_score, growth_score, burnout_risk, salary_alignment,
    strengths[], weaknesses[], tradeoffs[], reasoning,
    memory_updates[{key, value, confidence}]
  })
  ```
- Writes to `decisions`, applies `memory_updates` via `recordMemory`, emits `job_scored` event.
- Returns the full structured verdict to the client.

Old `job_scores` table stays for back-compat; new UI reads from `decisions`.

---

## 4 — Memory Distiller (background)

New edge function `memory-distill`:
- Reads last 30 days of `career_events` for a user
- LLM extracts patterns (rejection themes, winning keywords, salary band, preferred company size, etc.)
- Upserts into `career_memory` and `career_insights`

Triggered (a) on-demand from Profile page, (b) nightly via `pg_cron` for active users.

---

## 5 — Frontend touchpoints (minimal but real)

- **`useCareerMemory()` / `useCareerInsights()` / `useDecision(jobId)`** hooks
- **ScoreJobDialog** → renders V2 verdict: decision badge, confidence ring, the 5 sub-scores as bars, tradeoffs list, reasoning paragraph, "Why" expandable showing the evidence events used.
- **Profile → new "Career Memory" panel**: shows distilled facts (editable confidence + delete), recent insights, "Refresh memory" button calling `memory-distill`.
- **Dashboard**: one new card "What I learned about your career this week" pulling latest `career_insights`.
- All AI outputs render through one shared `<AIResponse>` component for unified tone (markdown, consistent icons, "AI" badge, source attribution).

---

## Technical details

- Edge functions: `decide-job`, `memory-distill`, shared `_shared/context.ts`.
- Models: Gemini Pro for `decide-job` (reasoning) and `memory-distill` (extraction); Flash for lighter tasks later.
- Tool-calling for ALL structured outputs (no JSON-in-prose parsing).
- Every AI call records an `ai_context_snapshots` row for observability.
- RLS on every new table; `career_events` insert allowed via SECURITY DEFINER functions only (not direct client inserts).
- Memory writes are append-then-upsert with confidence decay (older sources lose weight).

---

## Out of scope (next iterations)

- Unified Dashboard redesign (after memory exists)
- Recruiter Inbox / Interview Coach / CV Tailor (will plug into this layer)
- GDPR export/delete endpoints
- Billing / quotas
- Multi-provider fallback (Anthropic/OpenAI direct)

---

## Deliverables in this iteration

1. Migration: 5 new tables + RLS + indexes + trigger extensions
2. `_shared/context.ts` + `recordMemory` helper
3. `decide-job` edge function (replaces score-job logic)
4. `memory-distill` edge function + pg_cron schedule
5. Updated `ScoreJobDialog` with V2 verdict UI
6. Profile "Career Memory" panel
7. Dashboard "This week" insight card
8. Shared `<AIResponse>` component

Approve and I start with the migration.
