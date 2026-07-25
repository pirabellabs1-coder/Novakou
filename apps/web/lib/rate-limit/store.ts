/**
 * Store partagé pour le rate-limiting et les jetons courts (reset mot de passe).
 *
 * Serverless-safe : sur Vercel, chaque lambda a sa PROPRE mémoire et redémarre
 * au cold start → un `Map` au niveau module ne partage rien entre instances
 * (les compteurs anti-brute-force sont donc multipliés par le nombre de lambdas
 * et remis à zéro sans cesse). Ce module bascule sur **Upstash Redis** dès que
 * les variables d'env sont présentes, via son API REST (aucune dépendance npm,
 * aucune connexion TCP persistante — idéal serverless).
 *
 * Activation : définir `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * (Upstash → « REST API »). Absent ou en erreur → repli mémoire transparent
 * (comportement identique à aujourd'hui, jamais de blocage du login).
 */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function redisEnabled(): boolean {
  return !!(REST_URL && REST_TOKEN);
}

/** Exécute une commande Redis via l'API REST Upstash. `null` si indispo/erreur. */
async function redisCmd(args: (string | number)[]): Promise<unknown | null> {
  if (!redisEnabled()) return null;
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
  if (!redisEnabled()) return null;
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

/**
 * Incrémente un compteur de fenêtre glissante. Pose le TTL uniquement au 1er
 * hit (EXPIRE NX) pour ne pas prolonger la fenêtre à chaque requête.
 * Renvoie le compteur courant, ou `null` si Redis indisponible (→ repli mémoire).
 */
export async function redisIncr(key: string, windowSec: number): Promise<number | null> {
  const out = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, windowSec, "NX"],
  ]);
  if (!out || typeof out[0] !== "number") return null;
  return out[0];
}

/** GET simple. `null` si absent ou Redis indispo. */
export async function redisGet(key: string): Promise<string | null> {
  const v = await redisCmd(["GET", key]);
  return typeof v === "string" ? v : v == null ? null : String(v);
}

/** SET avec expiration (secondes). Renvoie true si écrit côté Redis. */
export async function redisSetEx(key: string, value: string, ttlSec: number): Promise<boolean> {
  const v = await redisCmd(["SET", key, value, "EX", ttlSec]);
  return v === "OK";
}

/** Supprime une ou plusieurs clés. */
export async function redisDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redisCmd(["DEL", ...keys]);
}

/** TTL restant en millisecondes (>0), ou 0 si absent/indispo. */
export async function redisPttl(key: string): Promise<number> {
  const v = await redisCmd(["PTTL", key]);
  return typeof v === "number" && v > 0 ? v : 0;
}
