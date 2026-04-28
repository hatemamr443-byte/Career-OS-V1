#!/usr/bin/env node
/**
 * Production smoke test for Career OS.
 *
 * Validates against the LIVE deployment:
 *   1. Public pages load (200 OK + expected markers)
 *   2. Contact form insert works for anonymous users (RLS INSERT policy)
 *   3. Anonymous users CANNOT read contact_messages (RLS SELECT policy)
 *   4. Email/password signup works
 *   5. Email/password login works (or surfaces "email not confirmed")
 *   6. Authenticated user can read their own profile (auto-created via trigger)
 *   7. Authenticated user CANNOT read contact_messages unless admin
 *
 * Usage:
 *   node scripts/smoke-test.mjs
 *   node scripts/smoke-test.mjs --url https://httpscareer-os.lovable.app
 *   node scripts/smoke-test.mjs --email you+test@domain.com --password 'Sup3rSecret!'
 *
 * Env fallbacks: SMOKE_URL, SMOKE_EMAIL, SMOKE_PASSWORD,
 *                SUPABASE_URL, SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ---------- config ----------
const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const SITE_URL =
  argv.url || process.env.SMOKE_URL || "https://httpscareer-os.lovable.app";

const SUPABASE_URL =
  argv["supabase-url"] ||
  process.env.SUPABASE_URL ||
  "https://fsjwfvhgjnitvdpbfgse.supabase.co";

const SUPABASE_ANON_KEY =
  argv["anon-key"] ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzandmdmhnam5pdHZkcGJmZ3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzAxNDksImV4cCI6MjA5Mjk0NjE0OX0.9p3qussqX3X7QVYmmfpXnc5vXUwgSiF-U_s-JqftAZQ";

const stamp = Date.now();
const TEST_EMAIL =
  argv.email || process.env.SMOKE_EMAIL || `smoketest+${stamp}@careeros.test`;
const TEST_PASSWORD =
  argv.password || process.env.SMOKE_PASSWORD || `Smoke!${stamp}aA`;

// ---------- pretty output ----------
const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const results = [];
async function step(name, fn) {
  process.stdout.write(`  • ${name} ... `);
  const t0 = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - t0;
    console.log(c.green("PASS") + c.dim(` (${ms}ms)`) + (detail ? c.dim(` — ${detail}`) : ""));
    results.push({ name, ok: true });
  } catch (err) {
    const ms = Date.now() - t0;
    console.log(c.red("FAIL") + c.dim(` (${ms}ms)`));
    console.log(c.red(`      ${err?.message ?? err}`));
    results.push({ name, ok: false, err: err?.message ?? String(err) });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---------- tests ----------
async function fetchPage(path, mustInclude) {
  const res = await fetch(SITE_URL + path, { redirect: "follow" });
  assert(res.ok, `HTTP ${res.status} for ${path}`);
  if (mustInclude) {
    const html = await res.text();
    assert(
      html.toLowerCase().includes(mustInclude.toLowerCase()),
      `expected "${mustInclude}" in ${path}`,
    );
  }
  return `${res.status}`;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log(c.bold(`\nCareer OS — Production Smoke Test`));
  console.log(c.dim(`  site:  ${SITE_URL}`));
  console.log(c.dim(`  email: ${TEST_EMAIL}\n`));

  console.log(c.bold("Public pages"));
  await step("GET /",        () => fetchPage("/",        "career os"));
  await step("GET /signup",  () => fetchPage("/signup",  "career os"));
  await step("GET /contact", () => fetchPage("/contact", "career os"));
  await step("GET /privacy", () => fetchPage("/privacy", "career os"));
  await step("GET /terms",   () => fetchPage("/terms",   "career os"));

  console.log(c.bold("\nContact form (RLS: anon INSERT allowed)"));
  let insertedMessage = `Smoke test ${stamp}`;
  await step("Anonymous insert into contact_messages", async () => {
    const { error } = await supabase.from("contact_messages").insert({
      name: "Smoke Test",
      email: `smoke+${stamp}@careeros.test`,
      message: insertedMessage,
    });
    assert(!error, error?.message);
    return "inserted";
  });

  await step("Anonymous SELECT on contact_messages is blocked", async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id")
      .limit(1);
    // RLS returns no rows (data=[] / null) — never an error. Either way, no rows = pass.
    assert(!data || data.length === 0, "anon should not see any rows");
    return error ? `error ok: ${error.code}` : "no rows visible";
  });

  await step("Insert validation rejects empty name", async () => {
    const { error } = await supabase.from("contact_messages").insert({
      name: "",
      email: "x@y.com",
      message: "hi",
    });
    assert(!!error, "expected RLS check constraint violation");
    return `blocked: ${error.code}`;
  });

  console.log(c.bold("\nAuth"));
  let signedUp = false;
  await step("Email/password signup", async () => {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: { data: { full_name: "Smoke Test" } },
    });
    assert(!error, error?.message);
    signedUp = true;
    return data.user ? `user ${data.user.id.slice(0, 8)}…` : "signup ok";
  });

  let signedIn = false;
  await step("Email/password login", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error && /confirm/i.test(error.message)) {
      // Email-confirm flow is enabled — that's expected & secure.
      return c.yellow("email confirmation required (expected)");
    }
    assert(!error, error?.message);
    assert(data.session, "no session returned");
    signedIn = true;
    return "session established";
  });

  console.log(c.bold("\nRLS as authenticated user"));
  if (!signedIn) {
    console.log(c.dim("  (skipped — no session; email confirmation required)"));
  } else {
    await step("Can read own profile (auto-created via trigger)", async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email")
        .eq("id", user.id)
        .maybeSingle();
      assert(!error, error?.message);
      assert(data, "profile row missing — handle_new_user trigger may be off");
      return `profile ${data.email}`;
    });

    await step("Cannot read contact_messages (not admin)", async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("id")
        .limit(1);
      assert(!data || data.length === 0, "non-admin should see 0 rows");
      return "0 rows visible";
    });

    await supabase.auth.signOut();
  }

  // ---------- summary ----------
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(
    "\n" +
      c.bold(`Result: `) +
      (failed === 0 ? c.green(`${passed}/${results.length} passed`) : c.red(`${failed} failed, ${passed} passed`)),
  );
  if (failed > 0) {
    console.log(c.red("\nFailures:"));
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  - ${r.name}: ${r.err}`);
    }
    process.exit(1);
  }
  console.log(c.dim(`\nTip: re-run anytime with \`node scripts/smoke-test.mjs\`.\n`));
}

run().catch((e) => {
  console.error(c.red("\nFatal:"), e);
  process.exit(1);
});
