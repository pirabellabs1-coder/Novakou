import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { boostStore, serviceStore, BOOST_TIERS } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";

// GET /api/admin/boosts — List all boosts with stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

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
        serviceName: service?.title ?? "Service supprime",
        userName: user?.name ?? "Utilisateur inconnu",
        userEmail: user?.email ?? "",
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

    return NextResponse.json({
      boosts: enrichedBoosts.slice(0, 100),
      stats: {
        total: allBoosts.length,
        active: activeBoosts.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalViews,
        cleaned,
      },
      tiers: BOOST_TIERS,
    });
  } catch (error) {
    console.error("[API /admin/boosts GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/boosts — Cancel an active boost (admin override)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { boostId, serviceId } = body;

    if (!boostId && !serviceId) {
      return NextResponse.json({ error: "boostId ou serviceId requis" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("[API /admin/boosts DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
