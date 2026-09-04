import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * POST /api/formations/vendeur/subscribers/[id]/cancel
 *
 * Résiliation d'un abonné PAR LE VENDEUR. Deux modes :
 *   • immédiat (défaut) → statut `cancelled` tout de suite : l'accès aux contenus
 *     du plan est coupé aussitôt (cf. lib/formations/access.ts, subTagGrantsAccess
 *     refuse une sub `cancelled`/`expired`). L'HISTORIQUE reste (la ligne
 *     Subscription n'est pas supprimée).
 *   • fin de période (`atPeriodEnd: true`) → `cancelAtPeriodEnd` : l'abonné garde
 *     l'accès jusqu'à `currentPeriodEnd`, pas de renouvellement.
 *
 * Garde d'ownership : le plan de l'abonnement doit appartenir au vendeur courant.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const sub = await prisma.subscription.findFirst({
      where: { id, plan: { instructeurId: ctx.instructeurId } },
      select: { id: true, status: true, userId: true, currentPeriodEnd: true, plan: { select: { name: true } } },
    });
    if (!sub) return NextResponse.json({ error: "Abonné introuvable" }, { status: 404 });
    if (sub.status === "cancelled" || sub.status === "expired") {
      return NextResponse.json({ error: "Cet abonnement est déjà résilié." }, { status: 400 });
    }

    let atPeriodEnd = false;
    try {
      const body = await req.json();
      atPeriodEnd = body?.atPeriodEnd === true;
    } catch {
      // Pas de corps → mode immédiat par défaut.
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: atPeriodEnd
        ? { cancelAtPeriodEnd: true, cancelledAt: new Date() }
        : { status: "cancelled", cancelAtPeriodEnd: true, cancelledAt: new Date() },
    });

    // Prévenir l'abonné (best-effort) — l'accès change, il doit le savoir.
    await prisma.notification
      .create({
        data: {
          userId: sub.userId,
          type: "PAYMENT",
          title: "Abonnement résilié",
          message: atPeriodEnd
            ? `Votre abonnement « ${sub.plan?.name ?? ""} » ne sera pas renouvelé. Vous gardez l'accès jusqu'au ${new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR")}.`
            : `Votre abonnement « ${sub.plan?.name ?? ""} » a été résilié. L'accès aux contenus inclus est désormais fermé.`,
          link: "/apprenant/abonnements",
        },
      })
      .catch(() => null);

    return NextResponse.json({
      data: updated,
      note: atPeriodEnd
        ? "Résiliation programmée en fin de période."
        : "Abonnement résilié — accès coupé immédiatement.",
    });
  } catch (err) {
    console.error("[vendeur/subscribers/cancel]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
