import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Helpers pour envoyer des webhooks sortants aux vendeurs.
 *
 * Flow :
 *   1. Un événement se produit (order.paid, review.created...)
 *   2. On cherche les VendorWebhook actifs du vendeur concerné, abonnés à ce type d'événement
 *   3. Pour chaque webhook, on POST le payload JSON signé HMAC-SHA256
 *   4. Retry simple (pas de queue complexe côté MVP) : si échec, on incrémente failureCount
 *      et on désactive si >= 10 échecs consécutifs
 */

export type WebhookLite = {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
  failureCount: number;
};

export type WebhookFireResult = {
  ok: boolean;
  httpStatus?: number;
  error?: string;
  durationMs: number;
};

/**
 * Envoie UN webhook à une URL avec signature HMAC.
 * Timeout 10s (au-delà on considère échec).
 */
export async function fireVendorWebhook(
  webhook: WebhookLite,
  event: string,
  data: Record<string, unknown>,
): Promise<WebhookFireResult> {
  const startedAt = Date.now();
  const body = JSON.stringify({
    event,
    data,
    webhook_id: webhook.id,
    timestamp: new Date().toISOString(),
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Novakou-Webhook/1.0",
    "X-Novakou-Event": event,
  };

  if (webhook.secret) {
    const signature = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");
    headers["X-Novakou-Signature"] = `sha256=${signature}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const durationMs = Date.now() - startedAt;
    const ok = res.ok;

    // Update stats
    await prisma.vendorWebhook
      .update({
        where: { id: webhook.id },
        data: {
          lastFiredAt: new Date(),
          failureCount: ok ? 0 : (webhook.failureCount ?? 0) + 1,
          // Auto-désactive après 10 échecs consécutifs
          ...((webhook.failureCount ?? 0) + 1 >= 10 && !ok ? { isActive: false } : {}),
        },
      })
      .catch(() => null);

    return { ok, httpStatus: res.status, durationMs };
  } catch (err) {
    clearTimeout(timeout);
    const durationMs = Date.now() - startedAt;
    const msg = err instanceof Error ? err.message : String(err);

    await prisma.vendorWebhook
      .update({
        where: { id: webhook.id },
        data: {
          lastFiredAt: new Date(),
          failureCount: (webhook.failureCount ?? 0) + 1,
          ...((webhook.failureCount ?? 0) + 1 >= 10 ? { isActive: false } : {}),
        },
      })
      .catch(() => null);

    return { ok: false, error: msg, durationMs };
  }
}

/**
 * Déclenche les webhooks abonnés à cet événement pour UN vendeur donné.
 * Fire-and-forget : on ne bloque pas l'action principale (ex: livrer la commande).
 */
export async function dispatchVendorEvent(
  instructeurId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const webhooks = await prisma.vendorWebhook.findMany({
      where: {
        instructeurId,
        isActive: true,
        events: { has: event },
      },
      select: { id: true, url: true, events: true, secret: true, isActive: true, failureCount: true },
    });

    if (webhooks.length === 0) return;

    // Fire all in parallel (pas de queue pour MVP)
    await Promise.all(webhooks.map((w) => fireVendorWebhook(w, event, data)));
  } catch (err) {
    console.error("[dispatchVendorEvent]", err);
    // Ne JAMAIS bloquer le flow principal sur un échec webhook
  }
}
