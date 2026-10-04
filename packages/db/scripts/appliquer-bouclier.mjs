#!/usr/bin/env node
/**
 * Applique le Bouclier Novakou (supabase/bouclier.sql) : tâches planifiées
 * exécutées par pg_cron dans Supabase, qui ne réveillent Vercel que s'il y a
 * du travail.
 *
 * Utilisation (depuis packages/db) :
 *   BOUCLIER_CRON_SECRET=<CRON_SECRET de PRODUCTION> \
 *     node --env-file=../../.env.local scripts/appliquer-bouclier.mjs
 *
 * Contrat :
 *  - Le secret n'est jamais écrit dans un fichier du dépôt : il est déposé dans
 *    le coffre Supabase (Vault) sous `novakou_cron_secret`. Sans
 *    BOUCLIER_CRON_SECRET, on garde celui déjà présent dans le coffre — et on
 *    refuse de continuer s'il n'y en a aucun (chaque réveil échouerait en 401).
 *  - Le CRON_SECRET de `.env.local` n'est PAS utilisé par défaut : il diffère de
 *    celui de production, et un secret faux ne se verrait qu'au premier 401.
 *  - bouclier.sql est idempotent : on le rejoue tel quel après modification.
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[bouclier] Ni DIRECT_URL ni DATABASE_URL.");
  process.exit(1);
}

const dbDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function deposerSecret() {
  const secret = process.env.BOUCLIER_CRON_SECRET?.trim();
  const [existant] = await prisma.$queryRaw`
    select id from vault.secrets where name = 'novakou_cron_secret'`;
  if (!secret) {
    if (!existant) throw new Error("BOUCLIER_CRON_SECRET absent et aucun secret dans le coffre.");
    console.log("[bouclier] Secret du coffre conservé.");
    return;
  }
  if (existant) {
    // `$executeRaw` : update_secret renvoie `void`, que `$queryRaw` ne sait pas lire.
    await prisma.$executeRaw`select vault.update_secret(${existant.id}::uuid, ${secret})`;
  } else {
    await prisma.$executeRaw`
      select vault.create_secret(${secret}, 'novakou_cron_secret',
        'CRON_SECRET de production — utilisé par bouclier.reveiller()')`;
  }
  console.log("[bouclier] Secret déposé dans le coffre.");
}

try {
  // Le secret D'ABORD : sans lui, chaque réveil planifié échouerait. Le coffre
  // (supabase_vault) est installé d'office sur tout projet Supabase, il ne
  // dépend pas de bouclier.sql.
  await deposerSecret();

  // Le CLI Prisma est lancé par `node` directement : passer par le .CMD de
  // Windows exigerait un shell, qui recollerait l'URL de la base sans échappement.
  const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
  const r = spawnSync(
    process.execPath,
    [prismaCli, "db", "execute", "--file", path.join(dbDir, "supabase", "bouclier.sql"), "--url", url],
    { stdio: "inherit", cwd: dbDir },
  );
  if (r.status !== 0) throw new Error("échec de bouclier.sql");

  const jobs = await prisma.$queryRaw`
    select jobname, schedule from cron.job where jobname like 'nk-%' order by jobname`;
  console.log(`[bouclier] ${jobs.length} tâches planifiées :`);
  for (const j of jobs) console.log(`  ${j.schedule.padEnd(14)} ${j.jobname}`);
} catch (e) {
  console.error("[bouclier]", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
