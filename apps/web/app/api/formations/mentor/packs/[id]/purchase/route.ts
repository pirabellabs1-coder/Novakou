/**
 * POST /api/formations/mentor/packs/[id]/purchase
 *
 * Acheter un pack de sessions (côté apprenant).
 * MVP : on crée directement la purchase (flow Moneroo/Stripe à brancher
 * quand le webhook paiement est prêt — pour l'instant, paiement marqué
 * comme payé en DEV pour faciliter le test end-to-end).
 *
 * Body : {}
 * Returns : { purchase, pack }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const pack = await prisma.mentorSessionPack.findFirst({
    where: { id, isActive: true },
  });
  if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });

  // Vérifier qu'aucun pack actif n'existe déjà pour ce mentor
  const existingActive = await prisma.mentorSessionPackPurchase.findFirst({
    where: {
      userId,
      packId: pack.id,
      refundedAt: null,
      expiresAt: { gt: new Date() },
      sessionsConsumed: { lt: pack.sessionsCount },
    },
  });
  if (existingActive) {
    return NextResponse.json(
      { error: "Vous avez déjà un pack actif pour ce mentor", existing: existingActive },
      { status: 409 },
    );
  }

  // Expiration
  const expiresAt = new Date(Date.now() + pack.validityDays * 24 * 3600 * 1000);

  const purchase = await prisma.mentorSessionPackPurchase.create({
    data: {
      packId: pack.id,
      userId,
      paidAmount: pack.priceXof,
      sessionsTotal: pack.sessionsCount,
      sessionsConsumed: 0,
      expiresAt,
    },
  });

  return NextResponse.json({ data: { purchase, pack } }, { status: 201 });
}
