import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/formations/public/ab-tests/track
 * Body: { testId, variant: "A"|"B", eventType: "view"|"conversion",
 *         visitorId, orderValue? }
 *
 * Endpoint public (pas d'auth) : n'importe quel visiteur peut enregistrer
 * sa view d'une variante (pour tracking). Pour les conversions, le fulfillment
 * cote serveur est la source de verite (plus reliable).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, variant, eventType, visitorId, orderValue } = body;

    if (!testId || !["A", "B"].includes(variant) || !["view", "conversion"].includes(eventType) || !visitorId) {
      return NextResponse.json({ error: "testId, variant (A|B), eventType (view|conversion), visitorId requis" }, { status: 400 });
    }

    // Anti-spam : 1 view par visitor par test par jour max
    if (eventType === "view") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const existing = await prisma.funnelABTestEvent.findFirst({
        where: {
          testId, variant, eventType: "view", visitorId,
          createdAt: { gte: todayStart },
        },
      });
      if (existing) return NextResponse.json({ data: { ok: true, deduped: true } });
    }

    await prisma.funnelABTestEvent.create({
      data: {
        testId,
        variant,
        eventType,
        visitorId: String(visitorId).slice(0, 100),
        orderValue: eventType === "conversion" && orderValue ? Number(orderValue) : null,
      },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error("[public/ab-tests/track]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

/**
 * GET /api/formations/public/ab-tests?funnelId=X
 * Retourne le premier A/B test actif pour ce funnel, avec les 2 variantes.
 * Le client decide qui voit quoi selon hash(visitorId) % 2.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get("funnelId");
    if (!funnelId) return NextResponse.json({ data: null });

    const test = await prisma.funnelABTest.findFirst({
      where: { funnelId, isActive: true, winner: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, variantA: true, variantB: true, blocksA: true, blocksB: true,
      },
    });

    return NextResponse.json({ data: test });
  } catch (err) {
    console.error("[public/ab-tests GET]", err);
    return NextResponse.json({ data: null });
  }
}
