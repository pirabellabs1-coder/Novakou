// Dédupe .env.local — garde la dernière valeur de chaque clé.
// Crée un backup .env.local.bak-<timestamp> avant d'écraser.
// Owner : Amélie Lefèvre — bureau 2026-05-26 (Henrik blocker #1).

import fs from "node:fs";
import path from "node:path";

const ENV = path.resolve(".env.local");
if (!fs.existsSync(ENV)) {
  console.error("❌ .env.local introuvable au cwd :", process.cwd());
  process.exit(1);
}

const raw = fs.readFileSync(ENV, "utf8");
const lines = raw.split(/\r?\n/);

// Parse en gardant les commentaires + lignes vides à leur position relative,
// mais en éliminant les clés dupliquées en conservant la DERNIÈRE occurrence
// (celle qui gagne dans le parser dotenv de Next.js).
const lastValueByKey = new Map();
for (const line of lines) {
  const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
  if (m) lastValueByKey.set(m[1], line);
}

const seen = new Set();
const out = [];
let removed = 0;
for (const line of lines) {
  const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
  if (!m) {
    out.push(line);
    continue;
  }
  const key = m[1];
  if (seen.has(key)) {
    removed++;
    continue; // Skip — la dernière occurrence sera utilisée
  }
  // Utilise la DERNIÈRE valeur du fichier pour cette clé,
  // mais place-la à la première position où la clé apparaissait.
  out.push(lastValueByKey.get(key));
  seen.add(key);
}

// Backup avant écrasement
const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const bak = `${ENV}.bak-${ts}`;
fs.writeFileSync(bak, raw, "utf8");

const cleaned = out.join("\n");
fs.writeFileSync(ENV, cleaned, "utf8");

console.log(`✅ Dédupliqué : ${removed} lignes redondantes retirées.`);
console.log(`   Backup : ${path.basename(bak)}`);
console.log(`   Avant : ${lines.length} lignes — Après : ${out.length} lignes`);
console.log(`   Clés uniques : ${seen.size}`);
