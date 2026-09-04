import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * GET /api/formations/vendeur/subscribers
 *
 * Liste les abonnés de TOUS les plans du vendeur (résiliés compris — l'historique
 * reste visible). Sert l'écran « Mes abonnés » où le vendeur peut résilier.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: [] });

    const subs = await prisma.subscription.findMany({
      where: { plan: { instructeurId: ctx.instructeurId } },
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
