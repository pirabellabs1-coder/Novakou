import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { boostStore, serviceStore, BOOST_TIERS } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

// GET /api/admin/boosts — List all boosts with stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Cleanup expired boosts first
      const cleaned = boostStore.cleanupExpired();

      const allBoosts = boostStore.getAll();
      const now = new Date();

      // Enrich with service and user info
      const enrichedBoosts = allBoosts.map((b) => {
        const service = serviceStore.getById(b.serviceId);
        const user = devStore.getAll().find((u) => u.id === b.userId);
        const isActive = new Date(b.expiresAt) > now;

        return {
          ...b,
          serviceTitle: service?.title ?? "Service supprime",
          serviceName: service?.title ?? "Service supprime",
          freelanceName: user?.name ?? "Utilisateur inconnu",
          userName: user?.name ?? "Utilisateur inconnu",
          userEmail: user?.email ?? "",
          totalCost: b.price ?? 0,
          clicksGenerated: b.clicksGenerated ?? 0,
          ordersGenerated: b.ordersGenerated ?? 0,
          isActive,
          tierConfig: BOOST_TIERS[b.tier as keyof typeof BOOST_TIERS],
        };
      });

      // Sort by most recent first
      enrichedBoosts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      // Stats
      const activeBoosts = enrichedBoosts.filter((b) => b.isActive);
      const totalRevenue = allBoosts.reduce((sum, b) => sum + b.price, 0);
      const totalViews = allBoosts.reduce((sum, b) => sum + b.viewsGenerated, 0);
      const totalClicks = allBoosts.reduce((sum, b) => sum + (b.clicksGenerated ?? 0), 0);
      const totalOrders = allBoosts.reduce((sum, b) => sum + (b.ordersGenerated ?? 0), 0);

      return NextResponse.json({
        boosts: enrichedBoosts.slice(0, 100),
        stats: {
          totalBoosts: allBoosts.length,
          activeBoosts: activeBoosts.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalViews,
          totalClicks,
          totalOrders,
          cleaned,
        },
        tiers: BOOST_TIERS,
      });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    try {
      const now = new Date();
      const allBoosts = await prisma.boost.findMany({
        include: {
          service: { select: { title: true, userId: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const enrichedBoosts = allBoosts.map((b) => {
        const isActive = b.endedAt ? b.endedAt > now : false;
        return {
          ...b,
          serviceTitle: b.service?.title ?? "Service supprime",
          serviceName: b.service?.title ?? "Service supprime",
          freelanceName: b.user?.name ?? b.user?.email ?? "Utilisateur inconnu",
          tier: b.type ?? "FEATURED",
          totalCost: b.totalCost ?? 0,
          viewsGenerated: b.actualImpressions ?? 0,
          clicksGenerated: b.actualClicks ?? 0,
          ordersGenerated: b.actualOrders ?? 0,
          isActive,
        };
      });

      const activeCount = enrichedBoosts.filter((b) => b.isActive).length;
      const totalRevenue = allBoosts.reduce((sum, b) => sum + (b.totalCost ?? 0), 0);
      const totalViews = allBoosts.reduce((sum, b) => sum + (b.actualImpressions ?? 0), 0);
      const totalClicks = allBoosts.reduce((sum, b) => sum + (b.actualClicks ?? 0), 0);
      const totalOrders = allBoosts.reduce((sum, b) => sum + (b.actualOrders ?? 0), 0);

      return NextResponse.json({
        boosts: enrichedBoosts,
        stats: {
          totalBoosts: allBoosts.length,
          activeBoosts: activeCount,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalViews,
          totalClicks,
          totalOrders,
        },
        tiers: BOOST_TIERS,
      });
    } catch (dbError) {
      console.error("[API /admin/boosts GET] Prisma error", dbError);
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /admin/boosts GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/boosts — Create a new boost (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, type, startDate, endDate, durationDays, costPerDay, totalCost, userId } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId requis" }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Dev store: no-op creation, just return success
      return NextResponse.json({
        success: true,
        message: "Boost cree (dev store)",
      });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    try {
      const boost = await prisma.boost.create({
        data: {
          serviceId,
          userId: userId ?? "",
          type: type ?? "FEATURED",
          durationDays: durationDays ?? 7,
          costPerDay: costPerDay ?? 0,
          totalCost: totalCost ?? 0,
          startedAt: startDate ? new Date(startDate) : new Date(),
          endedAt: endDate ? new Date(endDate) : null,
        },
      });
      return NextResponse.json({ success: true, boost });
    } catch (dbError) {
      console.error("[API /admin/boosts POST] Prisma error", dbError);
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /admin/boosts POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/boosts — Cancel an active boost (admin override)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { boostId, serviceId } = body;

    if (!boostId && !serviceId) {
      return NextResponse.json({ error: "boostId ou serviceId requis" }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Deactivate boost on the service
      const targetServiceId = serviceId || boostStore.getAll().find((b) => b.id === boostId)?.serviceId;
      if (targetServiceId) {
        serviceStore.update(targetServiceId, {
          isBoosted: false,
          boostTier: null,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Boost annule par l'administrateur",
      });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    try {
      if (boostId) {
        await prisma.boost.delete({ where: { id: boostId } });
      } else if (serviceId) {
        await prisma.boost.deleteMany({ where: { serviceId } });
      }
      return NextResponse.json({
        success: true,
        message: "Boost annule par l'administrateur",
      });
    } catch (dbError) {
      console.error("[API /admin/boosts DELETE] Prisma error", dbError);
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /admin/boosts DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
