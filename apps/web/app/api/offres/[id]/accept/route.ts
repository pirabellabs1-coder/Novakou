import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { offreStore, orderStore } from "@/lib/dev/data-store";
import { calculateCommissionEur, normalizePlanName } from "@/lib/plans";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: offreId } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const offre = offreStore.getById(offreId);
      if (!offre) {
        return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
      }
      offreStore.updateStatus(offreId, "acceptee");

      const order = orderStore.create({
        serviceId: "",
        serviceTitle: offre.title || "Offre personnalisee",
        category: "",
        clientId: session.user.id,
        clientName: session.user.name || "Client",
        clientAvatar: "",
        clientCountry: "",
        freelanceId: offre.freelanceId,
        status: "en_attente",
        amount: offre.amount || 0,
        commission: (offre.amount || 0) * 0.2,
        packageType: "custom",
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        deliveredAt: null,
        completedAt: null,
        progress: 0,
        revisionsLeft: offre.revisions || 2,
        messages: [],
        timeline: [{
          id: `t${Date.now()}`,
          type: "created" as const,
          title: "Commande creee",
          description: `Offre acceptee — ${offre.title}`,
          timestamp: new Date().toISOString(),
        }],
        files: [],
      });

      return NextResponse.json({ ok: true, order });
    }

    // Prisma
    const offre = await prisma.offer.findUnique({
      where: { id: offreId },
      include: {
        freelance: { select: { id: true, name: true, plan: true } },
      },
    });

    if (!offre) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    // Check client is the recipient
    if (offre.clientId !== session.user.id && offre.clientEmail !== session.user.email) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (offre.status !== "EN_ATTENTE") {
      return NextResponse.json({ error: "Offre deja traitee" }, { status: 400 });
    }

    if (offre.expiresAt && offre.expiresAt < new Date()) {
      return NextResponse.json({ error: "Offre expiree" }, { status: 400 });
    }

    const amount = offre.amount;
    const freelancePlan = normalizePlanName(offre.freelance.plan);
    const commission = calculateCommissionEur(freelancePlan, amount);

    const result = await prisma.$transaction(async (tx) => {
      // Update offer status
      await tx.offer.update({
        where: { id: offreId },
        data: { status: "ACCEPTE" },
      });

      // Create order
      const order = await tx.order.create({
        data: {
          clientId: session.user.id,
          freelanceId: offre.freelanceId,
          status: "EN_ATTENTE",
          escrowStatus: "HELD",
          amount,
          commission,
          packageType: "custom",
          deadline: new Date(Date.now() + 14 * 86400000),
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          payerId: session.user.id,
          payeeId: offre.freelanceId,
          amount: amount - commission,
          currency: "EUR",
          status: "EN_ATTENTE",
          type: "paiement",
          description: `Offre acceptee — ${offre.title}`,
        },
      });

      // Create conversation
      await tx.conversation.create({
        data: {
          type: "ORDER",
          orderId: order.id,
          users: {
            create: [
              { userId: session.user.id },
              { userId: offre.freelanceId },
            ],
          },
        },
      });

      return order;
    });

    return NextResponse.json({ ok: true, order: result });
  } catch (error) {
    console.error("[API /offres/[id]/accept POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de l'offre" },
      { status: 500 }
    );
  }
}
