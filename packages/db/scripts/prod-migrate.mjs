#!/usr/bin/env node
/**
 * Applique les migrations Prisma en production.
 *
 * Utilisation dans le build Vercel : `node ../../packages/db/scripts/prod-migrate.mjs`
 *
 * Contrat :
 *  - Sans DIRECT_URL/DATABASE_URL, on sort proprement (build local sans base ne casse pas).
 *  - Si une migration est marquée FAILED (finished_at IS NULL ET rolled_back_at IS NULL)
 *    dans `_prisma_migrations`, on la retire du journal AVANT `migrate deploy`.
 *    Motif : Prisma refuse d'avancer tant qu'une migration échouée n'est pas résolue,
 *    et nos migrations sont écrites idempotentes → un simple redéploiement doit passer.
 *  - Puis on délègue à `prisma migrate deploy`.
 */

import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.log("[prod-migrate] Ni DIRECT_URL ni DATABASE_URL — étape sautée.");
  process.exit(0);
}

const dbDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = path.join(dbDir, "prisma", "schema.prisma");
if (!existsSync(schema)) {
  console.error("[prod-migrate] schema.prisma introuvable :", schema);
  process.exit(1);
}

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const env = { ...process.env, DATABASE_URL: url };

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { stdio: "inherit", env, cwd: dbDir, ...opts });
}

// 1) Purge des migrations en échec via prisma db execute (pas de dépendance pg).
try {
  const dir = mkdtempSync(path.join(tmpdir(), "prisma-purge-"));
  const sqlFile = path.join(dir, "purge.sql");
  writeFileSync(
    sqlFile,
    `DELETE FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL;\n`,
    "utf8",
  );
  console.log("[prod-migrate] purge des migrations en échec…");
  const p = run(pnpm, ["exec", "prisma", "db", "execute", "--url", url, "--file", sqlFile]);
  if (p.status !== 0) {
    console.warn(
      "[prod-migrate] purge non exécutée (base neuve ou table absente) — on continue.",
    );
  }
} catch (e) {
  console.warn("[prod-migrate] purge sautée :", e?.message || e);
}

// 2) Application des migrations.
console.log("[prod-migrate] prisma migrate deploy…");
const r = run(pnpm, ["exec", "prisma", "migrate", "deploy", "--schema", schema]);
if (r.status !== 0) {
  console.error("[prod-migrate] migrate deploy a échoué (code", r.status, ")");
  process.exit(r.status ?? 1);
}
console.log("[prod-migrate] migrations appliquées ✅");
