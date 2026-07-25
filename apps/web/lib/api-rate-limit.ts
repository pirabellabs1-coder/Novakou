// Rate limiter par clé pour les routes API.
// Redis (Upstash REST) dès que configuré → partagé entre toutes les lambdas
// Vercel ; sinon repli mémoire (par instance). Voir lib/rate-limit/store.ts.

import { redisIncr } from "@/lib/rate-limit/store";

const requests = new Map<string, { count: number; resetAt: number }>();

// Nettoyage des entrées expirées (repli mémoire) toutes les 5 minutes.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of requests.entries()) {
      if (now > val.resetAt) requests.delete(key);
    }
  }, 5 * 60 * 1000);
}

function rateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requests.get(key);
  if (!record || now > record.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

export async function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000,
): Promise<{ allowed: boolean; remaining: number }> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const n = await redisIncr(`rl:${key}`, windowSec);
  if (n !== null) {
    // n = compteur APRÈS incrément (1 au premier appel de la fenêtre).
    return { allowed: n <= maxRequests, remaining: Math.max(0, maxRequests - n) };
  }
  // Redis indisponible → repli mémoire (par instance).
  return rateLimitMemory(key, maxRequests, windowMs);
}
