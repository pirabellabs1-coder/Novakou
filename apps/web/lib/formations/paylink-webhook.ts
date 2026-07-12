import crypto from "crypto";

/**
 * Utilitaires pour les liens de paiement INTÉGRÉS (redirection + webhook).
 *
 * Le webhook part du serveur Novakou vers l'URL du vendeur → on valide l'URL
 * (https + pas de cible interne, anti-SSRF) et on signe le corps en HMAC-SHA256
 * pour que le vendeur puisse vérifier l'authenticité (header X-Novakou-Signature).
 */

/** Bloque les cibles internes (loopback, réseaux privés, métadonnées cloud). */
function isInternalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 0 || a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

/**
 * Valide/normalise une URL fournie par le vendeur.
 * @param raw URL saisie
 * @param opts.requireHttps true = refuse http:// (recommandé pour un webhook)
 * @returns l'URL normalisée, ou null si invalide
 */
export function safeHttpUrl(raw: unknown, opts: { requireHttps?: boolean } = {}): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && (opts.requireHttps || u.protocol !== "http:")) return null;
    if (isInternalHost(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Signature HMAC-SHA256 (hex) d'un corps JSON. */
export function signWebhook(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/** Génère un secret de webhook. */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

export interface PaylinkWebhookPayload {
  event: "payment.succeeded";
  paymentRef: string;
  linkId: string;
  linkSlug: string;
  title: string;
  amount: number;
  currency: string;
  buyerEmail: string | null;
  buyerName: string | null;
  createdAt: string;
}

/**
 * Envoie le webhook signé au site du vendeur. Fire-and-forget : n'interrompt
 * jamais le fulfillment (les erreurs sont loguées). Timeout 10 s.
 */
export async function firePaylinkWebhook(
  webhookUrl: string,
  secret: string,
  payload: PaylinkWebhookPayload,
): Promise<void> {
  try {
    if (!safeHttpUrl(webhookUrl, { requireHttps: true })) return;
    const body = JSON.stringify(payload);
    const signature = secret ? signWebhook(secret, body) : "";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Novakou-Paylink/1.0",
          "X-Novakou-Event": payload.event,
          "X-Novakou-Signature": signature,
        },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.error("[paylink-webhook] échec envoi:", err);
  }
}
