import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

/**
 * POST /api/formations/apprenant/subscriptions/[id]/cancel
 * Annule un abonnement : l'acces reste jusqu'a currentPeriodEnd,
 * pas de renouvellement a la prochaine echeance.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
    if (sub.status === "cancelled" || sub.status === "expired") {
      return NextResponse.json({ error: "Déjà annulé" }, { status: 400 });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      data: updated,
      note: "Annulation programmée. Vous gardez l'accès jusqu'au " +
        new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR"),
    });
  } catch (err) {
    console.error("[apprenant/subscriptions/cancel]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
