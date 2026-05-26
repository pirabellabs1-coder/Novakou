// Audit des env vars Vercel — liste les clés présentes sans révéler les valeurs.
// Identifie les trous par rapport à .env.local.

import fs from "node:fs";

const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const teamQ = TEAM_ID ? `?teamId=${TEAM_ID}` : "";

const res = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env${teamQ}`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const data = await res.json();
const envs = data.envs ?? [];

// Group by key → targets
const byKey = new Map();
for (const e of envs) {
  if (!byKey.has(e.key)) byKey.set(e.key, new Set());
  for (const t of e.target ?? []) byKey.get(e.key).add(t);
}

// Lire .env.local pour comparer
const local = fs.readFileSync(".env.local", "utf8");
const localKeys = new Set();
for (const line of local.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
  if (m) localKeys.add(m[1]);
}

const vercelKeys = new Set(byKey.keys());

console.log(`\n📦 Vercel a ${vercelKeys.size} clé(s), .env.local en a ${localKeys.size}.\n`);

console.log("=== Clés sur Vercel SANS production ===");
let missingProd = 0;
for (const [k, targets] of [...byKey.entries()].sort()) {
  if (!targets.has("production")) {
    console.log(`  ⚠  ${k} : [${[...targets].join(",")}]`);
    missingProd++;
  }
}
if (missingProd === 0) console.log("  ✅ Toutes les clés Vercel ciblent production.");

console.log("\n=== Clés dans .env.local MAIS PAS sur Vercel ===");
const missing = [...localKeys].filter((k) => !vercelKeys.has(k)).sort();
if (missing.length === 0) console.log("  ✅ Aucune clé manquante.");
else for (const k of missing) console.log(`  ❌ ${k}`);

console.log("\n=== Clés Sentry attendues ===");
for (const k of ["SENTRY_DSN", "SENTRY_ORG", "SENTRY_PROJECT", "SENTRY_AUTH_TOKEN", "NEXT_PUBLIC_SENTRY_DSN"]) {
  console.log(`  ${vercelKeys.has(k) ? "✅" : "❌"} ${k}`);
}
