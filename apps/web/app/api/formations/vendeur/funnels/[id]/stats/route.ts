import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/formations/vendeur/funnels/[id]/stats
 * Statistiques d'un tunnel : vues, leads, ventes, revenu, détail par étape,
 * et vues des 14 derniers jours (pour le mini-graphique).
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const inst = await getOrCreateInstructeur(userId);
    if (!inst) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 401 });

    const funnel = await prisma.salesFunnel.findFirst({
      where: { id, instructeurId: inst.id },
      select: {
        id: true,
        totalViews: true,
        totalConversions: true,
        totalRevenue: true,
        salesCount: true,
        createdAt: true,
        steps: {
          orderBy: { stepOrder: "asc" },
          select: { id: true, title: true, stepType: true, views: true, conversions: true },
        },
      },
    });
    if (!funnel) return NextResponse.json({ error: "Tunnel introuvable" }, { status: 404 });

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [leadsCount, dailyRaw, clicksCount] = await Promise.all([
      prisma.funnelLead.count({ where: { funnelId: id } }),
      prisma.$queryRaw<Array<{ day: Date; views: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
        FROM "FunnelEvent"
        WHERE "funnelId" = ${id} AND "eventType" = 'view' AND "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1 ASC
      `,
      prisma.funnelEvent.count({ where: { funnelId: id, eventType: "click" } }),
    ]);

    // Série continue sur 14 jours (jours sans vue = 0)
    const byDay = new Map(dailyRaw.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.views)]));
    const daily: Array<{ day: string; views: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      daily.push({ day: d, views: byDay.get(d) ?? 0 });
    }

    return NextResponse.json({
      data: {
        totalViews: funnel.totalViews,
        salesCount: funnel.salesCount,
        totalConversions: funnel.totalConversions,
        totalRevenue: funnel.totalRevenue,
        leadsCount,
        clicksCount,
        conversionRate: funnel.totalViews > 0 ? Math.round((funnel.salesCount / funnel.totalViews) * 1000) / 10 : 0,
        leadRate: funnel.totalViews > 0 ? Math.round((leadsCount / funnel.totalViews) * 1000) / 10 : 0,
        steps: funnel.steps,
        daily,
        createdAt: funnel.createdAt,
      },
    });
  } catch (err) {
    console.error("[vendeur/funnels/stats GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
