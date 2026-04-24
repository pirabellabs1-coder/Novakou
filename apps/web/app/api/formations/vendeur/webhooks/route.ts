import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import crypto from "crypto";

/**
 * GET /api/formations/vendeur/webhooks
 * Liste les webhooks sortants du vendeur (scopés au shop actif).
 *
 * POST /api/formations/vendeur/webhooks
 * Body: { url, events[], secret? (sinon auto-généré) }
 *
 * Events supportés :
 *   - order.paid           — achat confirmé (enrollments + purchases créés)
 *   - order.refunded       — remboursement approuvé par admin
 *   - review.created       — nouvel avis sur un produit/formation du vendeur
 *   - withdrawal.processed — retrait traité (TRAITE ou REFUSE)
 *   - subscription.created — (V2) nouvel abonnement
 *   - subscription.renewed — (V2) renouvellement réussi
 *   - subscription.cancelled — (V2) annulation
 */
export const SUPPORTED_EVENTS = [
  "order.paid",
  "order.refunded",
  "review.created",
  "withdrawal.processed",
  "subscription.created",
  "subscription.renewed",
  "subscription.cancelled",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: [] });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const webhooks = await prisma.vendorWebhook.findMany({
      where: {
        instructeurId: ctx.instructeurId,
        ...(activeShopId ? { shopId: activeShopId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: webhooks, supportedEvents: SUPPORTED_EVENTS });
  } catch (err) {
    console.error("[vendeur/webhooks GET]", err);
    return NextResponse.json(
      { data: [], error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const body = await request.json();
    const url: string = (body.url ?? "").trim();
    const events: string[] = Array.isArray(body.events) ? body.events : [];
    const providedSecret: string | undefined = body.secret;

    // Validation URL
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "URL invalide (doit commencer par http:// ou https://)" }, { status: 400 });
    }

    // Validation events
    const filteredEvents = events.filter((e) => SUPPORTED_EVENTS.includes(e));
    if (filteredEvents.length === 0) {
      return NextResponse.json(
        { error: `Au moins un événement requis. Supportés : ${SUPPORTED_EVENTS.join(", ")}` },
        { status: 400 },
      );
    }

    // Secret auto-généré si non fourni
    const secret = providedSecret && providedSecret.length >= 16
      ? providedSecret
      : `wh_${crypto.randomBytes(32).toString("hex")}`;

    const webhook = await prisma.vendorWebhook.create({
      data: {
        instructeurId: ctx.instructeurId,
        shopId: activeShopId,
        url,
        events: filteredEvents,
        secret,
        isActive: true,
      },
    });

    return NextResponse.json({ data: webhook }, { status: 201 });
  } catch (err) {
    console.error("[vendeur/webhooks POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
