/**
 * Store partagé pour le rate-limiting et les jetons courts (reset mot de passe).
 *
 * Serverless-safe : sur Vercel, chaque lambda a sa PROPRE mémoire et redémarre
 * au cold start → un `Map` au niveau module ne partage rien entre instances
 * (les compteurs anti-brute-force sont donc multipliés par le nombre de lambdas
 * et remis à zéro sans cesse, et un jeton de réinitialisation posé par une
 * lambda est introuvable pour la suivante).
 *
 * Deux dorsales partagées, dans l'ordre :
 *  1. **Upstash Redis** (API REST) si `UPSTASH_REDIS_REST_URL` + `_TOKEN` ;
 *  2. sinon **Postgres** (table `CleValeur`, via Prisma) — toujours là en
 *     production. Ajoutée après l'audit du 2026-10-08 : les variables Upstash
 *     n'avaient pas suivi la migration Vercel, et la limite de tentatives de
 *     connexion n'existait plus que dans la mémoire de chaque lambda.
 * Les appelants gardent leur repli mémoire si les deux échouent.
 *
 * Les noms `redis*` sont conservés : cinq modules les importent, et la
 * sémantique (compteur à fenêtre, GET/SET avec expiration) est la même.
 */
const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function redisConfigure(): boolean {
  return !!(REST_URL && REST_TOKEN);
}

/** Un store PARTAGÉ entre instances est-il disponible (Redis ou Postgres) ? */
export function redisEnabled(): boolean {
  return redisConfigure() || !!process.env.DATABASE_URL;
}

// ── Upstash ─────────────────────────────────────────────────────────────────

/** Exécute une commande Redis via l'API REST Upstash. `null` si indispo/erreur. */
async function redisCmd(args: (string | number)[]): Promise<unknown | null> {
  if (!redisConfigure()) return null;
  try {
    const res = await fetch(`${REST_URL}/${args.map((a) => encodeURIComponent(String(a))).join("/")}`, {
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
      // Ne jamais mettre en cache un appel de compteur.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: unknown };
    return json.result ?? null;
  } catch {
    return null;
  }
}

/** Pipeline (plusieurs commandes atomiques côté serveur). `null` si indispo/erreur. */
async function redisPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!redisConfigure()) return null;
  try {
    const res = await fetch(`${REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(commands.map((c) => c.map(String))),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ result?: unknown }>;
    return Array.isArray(json) ? json.map((r) => r?.result ?? null) : null;
  } catch {
    return null;
  }
}

// ── Postgres (table CleValeur) ──────────────────────────────────────────────
//
// Horodatages comparés en UTC : Prisma écrit les DateTime en UTC naïf, et
// `timezone('utc', now())` rend un timestamp sans fuseau comparable.

async function pg() {
  const { prisma } = await import("@freelancehigh/db");
  return prisma;
}

async function pgIncr(key: string, windowSec: number): Promise<number | null> {
  try {
    const p = await pg();
    const rows = await p.$queryRaw<{ valeur: number }[]>`
      insert into "CleValeur" ("cle", "valeur", "expireLe")
      values (${key}, '1', timezone('utc', now()) + (${windowSec}::int * interval '1 second'))
      on conflict ("cle") do update set
        "valeur" = case when "CleValeur"."expireLe" <= timezone('utc', now()) then '1'
                        else (("CleValeur"."valeur")::int + 1)::text end,
        "expireLe" = case when "CleValeur"."expireLe" <= timezone('utc', now())
                          then timezone('utc', now()) + (${windowSec}::int * interval '1 second')
                          else "CleValeur"."expireLe" end
      returning ("valeur")::int as valeur`;
    return rows[0]?.valeur ?? null;
  } catch {
    return null;
  }
}

async function pgGet(key: string): Promise<string | null> {
  try {
    const p = await pg();
    const rows = await p.$queryRaw<{ valeur: string }[]>`
      select "valeur" from "CleValeur" where "cle" = ${key} and "expireLe" > timezone('utc', now())`;
    return rows[0]?.valeur ?? null;
  } catch {
    return null;
  }
}

async function pgSetEx(key: string, value: string, ttlSec: number): Promise<boolean> {
  try {
    const p = await pg();
    await p.$executeRaw`
      insert into "CleValeur" ("cle", "valeur", "expireLe")
      values (${key}, ${value}, timezone('utc', now()) + (${ttlSec}::int * interval '1 second'))
      on conflict ("cle") do update set "valeur" = excluded."valeur", "expireLe" = excluded."expireLe"`;
    return true;
  } catch {
    return false;
  }
}

async function pgDel(keys: string[]): Promise<void> {
  try {
    const p = await pg();
    const { Prisma } = await import("@prisma/client");
    await p.$executeRaw`delete from "CleValeur" where "cle" in (${Prisma.join(keys)})`;
  } catch {
    /* repli mémoire chez l'appelant */
  }
}

async function pgPttl(key: string): Promise<number> {
  try {
    const p = await pg();
    const rows = await p.$queryRaw<{ ms: number }[]>`
      select greatest(0, floor(extract(epoch from ("expireLe" - timezone('utc', now()))) * 1000))::int as ms
        from "CleValeur" where "cle" = ${key}`;
    return rows[0]?.ms ?? 0;
  } catch {
    return 0;
  }
}

// ── API publique ────────────────────────────────────────────────────────────

/**
 * Incrémente un compteur de fenêtre glissante. Pose le TTL uniquement au 1er
 * hit (EXPIRE NX) pour ne pas prolonger la fenêtre à chaque requête.
 * Renvoie le compteur courant, ou `null` si aucun store partagé ne répond
 * (→ repli mémoire chez l'appelant).
 */
export async function redisIncr(key: string, windowSec: number): Promise<number | null> {
  if (redisConfigure()) {
    const out = await redisPipeline([
      ["INCR", key],
      ["EXPIRE", key, windowSec, "NX"],
    ]);
    if (out && typeof out[0] === "number") return out[0];
  }
  return pgIncr(key, windowSec);
}

/** GET simple. `null` si absent ou store indispo. */
export async function redisGet(key: string): Promise<string | null> {
  if (redisConfigure()) {
    const v = await redisCmd(["GET", key]);
    if (v != null) return typeof v === "string" ? v : String(v);
  }
  return pgGet(key);
}

/** SET avec expiration (secondes). Renvoie true si écrit dans un store partagé. */
export async function redisSetEx(key: string, value: string, ttlSec: number): Promise<boolean> {
  if (redisConfigure()) {
    const v = await redisCmd(["SET", key, value, "EX", ttlSec]);
    if (v === "OK") return true;
  }
  return pgSetEx(key, value, ttlSec);
}

/** Supprime une ou plusieurs clés. */
export async function redisDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  if (redisConfigure()) await redisCmd(["DEL", ...keys]);
  await pgDel(keys);
}

/** TTL restant en millisecondes (>0), ou 0 si absent/indispo. */
export async function redisPttl(key: string): Promise<number> {
  if (redisConfigure()) {
    const v = await redisCmd(["PTTL", key]);
    if (typeof v === "number" && v > 0) return v;
  }
  return pgPttl(key);
}
