import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/apprenant/subscriptions
 * Liste les abonnements de l'utilisateur connecte (actifs + historiques).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          select: {
            id: true, name: true, description: true, imageUrl: true, price: true, currency: true,
            interval: true, linkedFormationIds: true, linkedProductIds: true,
            instructeur: { select: { user: { select: { id: true, name: true, image: true } } } },
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true, amount: true, status: true, periodStart: true, periodEnd: true,
            paidAt: true, createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ data: subscriptions });
  } catch (err) {
    console.error("[apprenant/subscriptions GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
