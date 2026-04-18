#!/usr/bin/env node
/**
 * Smoke test: hit every new API endpoint and verify they return a sensible
 * response code. Many will return 401 (unauthenticated) and that's OK —
 * we just want to confirm the route compiles and loads.
 */

const BASE = process.env.BASE_URL || "http://localhost:3001";

const TESTS = [
  // ── Tracking ───────────────────────────────────────────────────────────
  { name: "POST /api/tracking/event (valid payload)", method: "POST", path: "/api/tracking/event",
    body: { events: [{ id: `smoke-${Date.now()}`, type: "page_view", sessionId: "smoke-session", path: "/", timestamp: new Date().toISOString(), deviceType: "desktop" }] },
    expect: (r) => r.ok && r.json?.recorded >= 0 },
  { name: "POST /api/tracking/event (empty)", method: "POST", path: "/api/tracking/event",
    body: { events: [] },
    expect: (r) => r.ok && r.json?.recorded === 0 },
  { name: "POST /api/tracking/sessions (start)", method: "POST", path: "/api/tracking/sessions",
    body: { action: "start", sessionId: "smoke-session", deviceType: "desktop", path: "/" },
    expect: (r) => r.ok },

  // ── Auth (will be 401 without session) ───────────────────────────────
  { name: "GET /api/auth/me-2fa (no auth)", method: "GET", path: "/api/auth/me-2fa",
    expect: (r) => r.status === 401 },
  { name: "GET /api/auth/sessions (no auth)", method: "GET", path: "/api/auth/sessions",
    expect: (r) => r.status === 401 },
  { name: "POST /api/auth/verify-2fa (no auth)", method: "POST", path: "/api/auth/verify-2fa",
    body: { code: "123456" }, expect: (r) => r.status === 401 },

  // ── Cart (guest flow should work) ────────────────────────────────────
  { name: "GET /api/formations/apprenant/cart (guest)", method: "GET", path: "/api/formations/apprenant/cart",
    expect: (r) => r.ok && typeof r.json?.guest === "boolean" },

  // ── Mentor (401 without session) ─────────────────────────────────────
  { name: "GET /api/formations/mentor/packs", method: "GET", path: "/api/formations/mentor/packs",
    expect: (r) => r.status === 401 },
  { name: "GET /api/formations/mentor/notes", method: "GET", path: "/api/formations/mentor/notes",
    expect: (r) => r.status === 401 },
  { name: "GET /api/formations/mentor/resources", method: "GET", path: "/api/formations/mentor/resources",
    expect: (r) => r.status === 401 },
  { name: "GET /api/formations/mentor/profile", method: "GET", path: "/api/formations/mentor/profile",
    expect: (r) => r.status === 401 },

  // ── Vendeur (requires auth) ─────────────────────────────────────────
  { name: "GET /api/formations/vendeur/bundles", method: "GET", path: "/api/formations/vendeur/bundles",
    expect: (r) => r.status === 401 },

  // ── Apprenant ───────────────────────────────────────────────────────
  { name: "GET /api/formations/apprenant/gamification", method: "GET", path: "/api/formations/apprenant/gamification",
    expect: (r) => r.status === 401 },

  // ── Upsell (public, needs kind+id) ──────────────────────────────────
  { name: "GET /api/formations/upsell (missing params)", method: "GET", path: "/api/formations/upsell",
    expect: (r) => r.status === 400 },
  { name: "GET /api/formations/upsell (bogus id)", method: "GET", path: "/api/formations/upsell?kind=formation&id=nonexistent",
    expect: (r) => r.ok && Array.isArray(r.json?.data) },

  // ── Cron endpoints (should need auth if CRON_SECRET is set) ─────────
  { name: "GET /api/cron/mentor-reminders", method: "GET", path: "/api/cron/mentor-reminders",
    expect: (r) => r.ok || r.status === 401 },
  { name: "GET /api/cron/churn-alert", method: "GET", path: "/api/cron/churn-alert",
    expect: (r) => r.ok || r.status === 401 },
];

async function runTest(t) {
  const url = `${BASE}${t.path}`;
  try {
    const opts = {
      method: t.method,
      headers: { "Content-Type": "application/json" },
    };
    if (t.body) opts.body = JSON.stringify(t.body);
    const res = await fetch(url, opts);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-json */ }
    const result = { ok: res.ok, status: res.status, json, text: text.slice(0, 150) };
    const passed = t.expect(result);
    if (passed) {
      return { name: t.name, ok: true, status: res.status };
    }
    return {
      name: t.name, ok: false, status: res.status,
      snippet: text.slice(0, 200),
    };
  } catch (e) {
    return { name: t.name, ok: false, err: e.message };
  }
}

(async () => {
  console.log(`Testing ${BASE}...`);
  console.log("=".repeat(60));
  let pass = 0;
  let fail = 0;
  const failures = [];
  for (const t of TESTS) {
    const r = await runTest(t);
    if (r.ok) {
      console.log(`✓ ${r.status} ${t.name}`);
      pass++;
    } else {
      console.log(`✗ ${r.status ?? "?"} ${t.name} ${r.err ? "→ " + r.err : ""}`);
      if (r.snippet) console.log(`    ${r.snippet}`);
      fail++;
      failures.push(r);
    }
  }
  console.log("=".repeat(60));
  console.log(`RÉSULTAT: ${pass} OK · ${fail} KO`);
  process.exit(fail > 0 ? 1 : 0);
})();
