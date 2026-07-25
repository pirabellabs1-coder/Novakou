/**
 * Store des jetons de réinitialisation de mot de passe.
 *
 * Redis (Upstash REST) dès que configuré → un lien créé sur une lambda est
 * validable sur une autre (indispensable en serverless : sinon le lien échoue
 * dès qu'une autre instance traite la confirmation). Repli mémoire transparent.
 * Voir lib/rate-limit/store.ts.
 */

import crypto from "crypto";
import { redisEnabled, redisGet, redisSetEx, redisDel } from "@/lib/rate-limit/store";

const TTL_SEC = 60 * 60; // 1 heure
const resetTokens = new Map<string, { email: string; expiresAt: number }>();
const rkey = (token: string) => `pwreset:${token}`;

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of resetTokens.entries()) if (now > v.expiresAt) resetTokens.delete(k);
  }, 5 * 60 * 1000);
}

/** Génère un jeton sécurisé et le stocke avec expiration 1 h. */
export async function generateResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const em = email.toLowerCase();
  if (redisEnabled()) {
    await redisSetEx(rkey(token), em, TTL_SEC);
  }
  // Toujours en mémoire aussi (repli same-instance si Redis a un raté).
  resetTokens.set(token, { email: em, expiresAt: Date.now() + TTL_SEC * 1000 });
  return token;
}

/** Valide un jeton sans le consommer. */
export async function validateResetToken(
  token: string,
): Promise<{ valid: boolean; email?: string; error?: string }> {
  if (redisEnabled()) {
    const em = await redisGet(rkey(token));
    if (em) return { valid: true, email: em };
  }
  const record = resetTokens.get(token);
  if (!record) return { valid: false, error: "Lien invalide ou expire." };
  if (Date.now() > record.expiresAt) {
    resetTokens.delete(token);
    return { valid: false, error: "Lien expire. Demandez un nouveau lien." };
  }
  return { valid: true, email: record.email };
}

/** Consomme (supprime) un jeton après changement de mot de passe réussi. */
export async function consumeResetToken(token: string): Promise<void> {
  resetTokens.delete(token);
  if (redisEnabled()) await redisDel(rkey(token));
}
