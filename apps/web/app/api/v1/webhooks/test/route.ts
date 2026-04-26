import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import { apiError, apiSuccess } from "@/lib/api/v1-helpers";

/**
 * POST /api/v1/webhooks/test
 *
 * Envoie un événement test à l'URL d'un webhook configuré, signé via HMAC-SHA256
 * avec le secret. Renvoie le statut HTTP de la livraison + la durée.
 *
 * Body:
 *   - webhookId: string  (id du webhook à tester)
 *   - event:     string  (type d'événement, défaut "order.paid")
 *
 * Scope requis : admin
 */
export async function POST(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "admin" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("INVALID_PARAMS", "Body JSON invalide", 400);
    }

    const webhookId = (body as Record<string, unknown>).webhookId;
    const eventInput = (body as Record<string, unknown>).event;
    if (typeof webhookId !== "string") {
      return apiError("INVALID_PARAMS", "webhookId requis", 400);
    }

    const webhook = await prisma.vendorWebhook.findFirst({
      where: { id: webhookId, instructeurId: ctx.instructeurId },
      select: {
        id: true,
        url: true,
        secret: true,
        events: true,
      },
    });
    if (!webhook) return apiError("NOT_FOUND", "Webhook introuvable", 404);

    const event =
      typeof eventInput === "string" ? eventInput : "order.paid";

    const payload = {
      event,
      isTest: true,
      timestamp: new Date().toISOString(),
      data: {
        orderId: "ord_test_" + Math.random().toString(36).slice(2, 10),
        productId: "prod_test_" + Math.random().toString(36).slice(2, 10),
        productTitle: "Produit test",
        buyerEmail: "test@example.com",
        amount: 45000,
        currency: "XOF",
      },
    };

    const bodyStr = JSON.stringify(payload);
    const signature = webhook.secret
      ? crypto
          .createHmac("sha256", webhook.secret)
          .update(bodyStr)
          .digest("hex")
      : null;

    const startedAt = Date.now();
    let statusCode = 0;
    let errorMsg: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Novakou-Webhook/1.0",
          ...(signature ? { "X-Novakou-Signature": signature } : {}),
        },
        body: bodyStr,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      statusCode = res.status;
    } catch (err) {
      errorMsg =
        err instanceof Error
          ? err.message
          : "Échec de la livraison (réseau / timeout)";
    }

    const duration = Date.now() - startedAt;
    const ok = statusCode >= 200 && statusCode < 300;

    // Mark lastFiredAt and bump failureCount on failure (non-blocking)
    prisma.vendorWebhook
      .update({
        where: { id: webhook.id },
        data: {
          lastFiredAt: new Date(),
          failureCount: ok ? 0 : { increment: 1 },
        },
      })
      .catch(() => null);

    return apiSuccess({
      success: ok,
      delivery: {
        statusCode,
        duration,
        url: webhook.url,
        signed: !!signature,
        ...(errorMsg ? { error: errorMsg } : {}),
      },
      payloadSent: payload,
    });
  } catch (err) {
    console.error("[v1/webhooks/test POST]", err);
    return apiError(
      "SERVER_ERROR",
      err instanceof Error ? err.message : "Erreur serveur",
      500,
    );
  }
}
