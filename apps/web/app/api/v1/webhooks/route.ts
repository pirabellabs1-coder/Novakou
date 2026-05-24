import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import { apiError, apiSuccess } from "@/lib/api/v1-helpers";
import { SUPPORTED_EVENTS, isSupportedWebhookEvent } from "@/lib/webhooks/supported-events";

/**
 * GET /api/v1/webhooks
 *
 * Liste les webhooks configurés par le vendeur pour cette boutique.
 *
 * Scope requis : admin
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "admin" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const webhooks = await prisma.vendorWebhook.findMany({
      where: { instructeurId: ctx.instructeurId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastFiredAt: true,
        failureCount: true,
        createdAt: true,
      },
    });

    return apiSuccess({ webhooks, supportedEvents: SUPPORTED_EVENTS });
  } catch (err) {
    console.error("[v1/webhooks GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}

/**
 * POST /api/v1/webhooks
 *
 * Crée un nouveau webhook. Le secret est généré automatiquement (sera utilisé
 * pour signer les requêtes via HMAC-SHA256 dans le header `X-Novakou-Signature`).
 *
 * Body:
 *   - url:    string (https://… requis)
 *   - events: string[]  — au moins 1 événement supporté
 *
 * Le secret est retourné UNE SEULE FOIS dans la réponse.
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

    const url = (body as Record<string, unknown>).url;
    const events = (body as Record<string, unknown>).events;

    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return apiError(
        "INVALID_PARAMS",
        "url invalide (doit commencer par http:// ou https://)",
        400,
      );
    }
    if (!Array.isArray(events) || events.length === 0) {
      return apiError(
        "INVALID_PARAMS",
        `events requis (tableau non vide). Supportés : ${SUPPORTED_EVENTS.join(", ")}`,
        400,
      );
    }

    const filtered = events.filter(
      (e): e is string => typeof e === "string" && isSupportedWebhookEvent(e),
    );
    if (filtered.length === 0) {
      return apiError(
        "INVALID_PARAMS",
        `Aucun événement valide. Supportés : ${SUPPORTED_EVENTS.join(", ")}`,
        400,
      );
    }

    const secret = `wh_${crypto.randomBytes(32).toString("hex")}`;

    const webhook = await prisma.vendorWebhook.create({
      data: {
        instructeurId: ctx.instructeurId,
        url,
        events: filtered,
        secret,
        isActive: true,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiSuccess(
      {
        ...webhook,
        secret,
        warning:
          "Conservez ce secret en sécurité — il ne sera plus jamais affiché. Utilisez-le pour vérifier les signatures HMAC dans le header X-Novakou-Signature.",
      },
      undefined,
      201,
    );
  } catch (err) {
    console.error("[v1/webhooks POST]", err);
    return apiError(
      "SERVER_ERROR",
      err instanceof Error ? err.message : "Erreur serveur",
      500,
    );
  }
}
