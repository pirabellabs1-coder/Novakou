import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import { apiError, apiSuccess } from "@/lib/api/v1-helpers";
import { isSupportedWebhookEvent } from "@/lib/webhooks/supported-events";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/webhooks/:id
 *
 * Détail d'un webhook (sans le secret).
 *
 * Scope requis : admin
 */
export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "admin" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const webhook = await prisma.vendorWebhook.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastFiredAt: true,
        failureCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!webhook) return apiError("NOT_FOUND", "Webhook introuvable", 404);
    return apiSuccess(webhook);
  } catch (err) {
    console.error("[v1/webhooks/:id GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}

/**
 * PATCH /api/v1/webhooks/:id
 *
 * Met à jour un webhook. Champs modifiables : url, events, isActive.
 *
 * Scope requis : admin
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "admin" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("INVALID_PARAMS", "Body JSON invalide", 400);
    }

    const existing = await prisma.vendorWebhook.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
      select: { id: true },
    });
    if (!existing) return apiError("NOT_FOUND", "Webhook introuvable", 404);

    const url = (body as Record<string, unknown>).url;
    const events = (body as Record<string, unknown>).events;
    const isActive = (body as Record<string, unknown>).isActive;

    if (url !== undefined && (typeof url !== "string" || !/^https?:\/\//i.test(url))) {
      return apiError("INVALID_PARAMS", "url invalide", 400);
    }
    if (events !== undefined && !Array.isArray(events)) {
      return apiError("INVALID_PARAMS", "events doit être un tableau", 400);
    }

    const filteredEvents =
      events !== undefined
        ? (events as unknown[]).filter(
            (e): e is string =>
              typeof e === "string" && isSupportedWebhookEvent(e),
          )
        : undefined;

    const updated = await prisma.vendorWebhook.update({
      where: { id },
      data: {
        url: typeof url === "string" ? url : undefined,
        events:
          filteredEvents !== undefined && filteredEvents.length > 0
            ? filteredEvents
            : undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    console.error("[v1/webhooks/:id PATCH]", err);
    return apiError(
      "SERVER_ERROR",
      err instanceof Error ? err.message : "Erreur serveur",
      500,
    );
  }
}

/**
 * DELETE /api/v1/webhooks/:id
 *
 * Supprime un webhook.
 *
 * Scope requis : admin
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "admin" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const existing = await prisma.vendorWebhook.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
      select: { id: true },
    });
    if (!existing) return apiError("NOT_FOUND", "Webhook introuvable", 404);

    await prisma.vendorWebhook.delete({ where: { id } });
    return apiSuccess({ id, deleted: true });
  } catch (err) {
    console.error("[v1/webhooks/:id DELETE]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}
