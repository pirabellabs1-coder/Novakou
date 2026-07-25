// Rate limiter anti-brute-force (login, 2FA, reset, OTP…).
// 5 tentatives / 15 min puis lockout 15 min.
//
// Redis (Upstash REST) dès que configuré → compteur PARTAGÉ entre toutes les
// lambdas Vercel (sinon, en mémoire par instance, la limite est multipliée par
// le nombre de lambdas et remise à zéro aux cold starts). Repli mémoire
// transparent si Redis absent/en erreur. Voir lib/rate-limit/store.ts.

import {
  redisEnabled,
  redisIncr,
  redisGet,
  redisSetEx,
  redisDel,
  redisPttl,
} from "@/lib/rate-limit/store";

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const LOCKOUT_MS = 15 * 60 * 1000; // 15 min
const WINDOW_SEC = Math.ceil(WINDOW_MS / 1000);
const LOCKOUT_SEC = Math.ceil(LOCKOUT_MS / 1000);

const countKey = (key: string) => `rl:auth:${key}`;
const lockKey = (key: string) => `rl:authlock:${key}`;

// ── Repli mémoire (par instance) ────────────────────────────────────────────
function checkMemory(key: string) {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record) return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null };
  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: record.lockedUntil };
  }
  if (record.lockedUntil && now >= record.lockedUntil) {
    attempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null };
  }
  if (now - record.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null };
  }
  const remaining = MAX_ATTEMPTS - record.count;
  return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining), lockedUntil: null };
}

function recordMemory(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null });
    return;
  }
  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }
}

// ── API publique (async) ────────────────────────────────────────────────────
export async function checkRateLimit(
  key: string,
): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil: number | null }> {
  if (!redisEnabled()) return checkMemory(key);
  try {
    const lockTtl = await redisPttl(lockKey(key));
    if (lockTtl > 0) {
      return { allowed: false, remainingAttempts: 0, lockedUntil: Date.now() + lockTtl };
    }
    const raw = await redisGet(countKey(key));
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    const remaining = MAX_ATTEMPTS - count;
    return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining), lockedUntil: null };
  } catch {
    return checkMemory(key);
  }
}

export async function recordFailedAttempt(key: string): Promise<void> {
  if (!redisEnabled()) return recordMemory(key);
  try {
    const n = await redisIncr(countKey(key), WINDOW_SEC);
    if (n === null) return recordMemory(key);
    if (n >= MAX_ATTEMPTS) {
      await redisSetEx(lockKey(key), "1", LOCKOUT_SEC);
    }
  } catch {
    recordMemory(key);
  }
}

export async function resetAttempts(key: string): Promise<void> {
  if (!redisEnabled()) {
    attempts.delete(key);
    return;
  }
  try {
    await redisDel(countKey(key), lockKey(key));
  } catch {
    attempts.delete(key);
  }
}

// Nettoyage périodique du repli mémoire.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
      if (record.lockedUntil && now >= record.lockedUntil) attempts.delete(key);
      else if (now - record.firstAttemptAt > WINDOW_MS) attempts.delete(key);
    }
  }, 5 * 60 * 1000);
}
