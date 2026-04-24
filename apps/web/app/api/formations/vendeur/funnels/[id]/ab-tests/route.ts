import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * GET /api/formations/vendeur/funnels/[id]/ab-tests
 *   Liste les A/B tests d'un funnel + stats agregees.
 *
 * POST /api/formations/vendeur/funnels/[id]/ab-tests
 *   Body: { name, variantA, variantB, blocksA, blocksB }
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id: funnelId } = await params;

    // Verif ownership
    const funnel = await prisma.salesFunnel.findFirst({
      where: { id: funnelId, instructeurId: ctx.instructeurId },
      select: { id: true },
    });
    if (!funnel) return NextResponse.json({ error: "Funnel introuvable" }, { status: 404 });

    const tests = await prisma.funnelABTest.findMany({
      where: { funnelId },
      orderBy: { createdAt: "desc" },
    });

    // Agrege events par test
    const results = await Promise.all(
      tests.map(async (t) => {
        const events = await prisma.funnelABTestEvent.groupBy({
          by: ["variant", "eventType"],
          where: { testId: t.id },
          _count: true,
          _sum: { orderValue: true },
        });
        const viewsA = events.find((e) => e.variant === "A" && e.eventType === "view")?._count ?? 0;
        const viewsB = events.find((e) => e.variant === "B" && e.eventType === "view")?._count ?? 0;
        const convA = events.find((e) => e.variant === "A" && e.eventType === "conversion")?._count ?? 0;
        const convB = events.find((e) => e.variant === "B" && e.eventType === "conversion")?._count ?? 0;
        const revA = events.find((e) => e.variant === "A" && e.eventType === "conversion")?._sum.orderValue ?? 0;
        const revB = events.find((e) => e.variant === "B" && e.eventType === "conversion")?._sum.orderValue ?? 0;
        return {
          ...t,
          stats: {
            A: { views: viewsA, conversions: convA, conversionRate: viewsA > 0 ? (convA / viewsA) * 100 : 0, revenue: revA },
            B: { views: viewsB, conversions: convB, conversionRate: viewsB > 0 ? (convB / viewsB) * 100 : 0, revenue: revB },
          },
        };
      }),
    );

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("[funnels/ab-tests GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id: funnelId } = await params;
    const funnel = await prisma.salesFunnel.findFirst({
      where: { id: funnelId, instructeurId: ctx.instructeurId },
      include: { steps: { where: { stepType: "LANDING" }, orderBy: { stepOrder: "asc" }, take: 1 } },
    });
    if (!funnel) return NextResponse.json({ error: "Funnel introuvable" }, { status: 404 });

    const body = await req.json();
    const { name, variantA, variantB, blocksA, blocksB } = body;

    if (!name || !variantA || !variantB) {
      return NextResponse.json({ error: "name, variantA, variantB requis" }, { status: 400 });
    }
    if (!blocksA || !blocksB) {
      return NextResponse.json({ error: "blocksA et blocksB requis (snapshots JSON de la landing)" }, { status: 400 });
    }

    const test = await prisma.funnelABTest.create({
      data: {
        funnelId,
        name: String(name).trim(),
        variantA: String(variantA).trim(),
        variantB: String(variantB).trim(),
        blocksA,
        blocksB,
        isActive: true,
      },
    });

    return NextResponse.json({ data: test }, { status: 201 });
  } catch (err) {
    console.error("[funnels/ab-tests POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
