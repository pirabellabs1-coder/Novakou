import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { SUPPORTED_EVENTS } from "../route";
import { fireVendorWebhook } from "@/lib/formations/vendor-webhooks";

/**
 * PATCH /api/formations/vendeur/webhooks/[id]
 *   Body: { url?, events?, isActive? }
 *
 * DELETE /api/formations/vendeur/webhooks/[id]
 *
 * POST /api/formations/vendeur/webhooks/[id] (action=test)
 *   Envoie un event de test au webhook pour verifier qu'il repond.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.vendorWebhook.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
    });
    if (!existing) return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });

    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof body.url === "string" && /^https?:\/\//i.test(body.url.trim())) update.url = body.url.trim();
    if (Array.isArray(body.events)) {
      const filtered = body.events.filter((e: string) => SUPPORTED_EVENTS.includes(e));
      if (filtered.length > 0) update.events = filtered;
    }
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    if (typeof body.isActive === "boolean" && body.isActive === true) update.failureCount = 0;

    const updated = await prisma.vendorWebhook.update({ where: { id }, data: update });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[vendeur/webhooks PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.vendorWebhook.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
    });
    if (!existing) return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });

    await prisma.vendorWebhook.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[vendeur/webhooks DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const webhook = await prisma.vendorWebhook.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
    });
    if (!webhook) return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    if (body.action !== "test") {
      return NextResponse.json({ error: "action='test' required" }, { status: 400 });
    }

    const result = await fireVendorWebhook(webhook, "webhook.test", {
      message: "Ceci est un événement de test déclenché par le vendeur",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[vendeur/webhooks POST test]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
