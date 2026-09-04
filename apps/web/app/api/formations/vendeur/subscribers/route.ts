import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

/**
 * GET /api/formations/vendeur/subscribers
 *
 * Liste les abonnés des plans du vendeur (résiliés compris — l'historique reste
 * visible). Sert l'écran « Mes abonnés » où le vendeur peut résilier.
 * Isolé par boutique : un abonné suit la boutique de son plan.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: [] });

    // Filtre boutique via le plan (SubscriptionPlan porte le shopId). En vue
    // globale (null) → tous les plans. Repli shopId null pour les plans sans
    // boutique (anciens), visibles partout.
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    const shopWhere = activeShopId ? { OR: [{ shopId: activeShopId }, { shopId: null }] } : {};

    const subs = await prisma.subscription.findMany({
      where: { plan: { instructeurId: ctx.instructeurId, ...shopWhere } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        status: true,
        createdAt: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        cancelledAt: true,
        totalPaid: true,
        user: { select: { name: true, email: true } },
        plan: { select: { id: true, name: true, interval: true } },
      },
    });

    const data = subs.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      currentPeriodEnd: s.currentPeriodEnd,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      cancelledAt: s.cancelledAt,
      totalPaid: s.totalPaid,
      buyerName: s.user?.name ?? "Abonné",
      buyerEmail: s.user?.email ?? "",
      planId: s.plan?.id ?? "",
      planName: s.plan?.name ?? "Abonnement",
      interval: s.plan?.interval ?? "monthly",
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[vendeur/subscribers GET]", err);
    return NextResponse.json({ data: [] });
  }
}
