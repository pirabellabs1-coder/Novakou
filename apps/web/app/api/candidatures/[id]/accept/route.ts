import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { candidatureStore, orderStore, projectStore } from "@/lib/dev/data-store";
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

    const { id: candidatureId } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const candidature = candidatureStore.getById(candidatureId);
      if (!candidature) {
        return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
      }
      candidatureStore.updateStatus(candidatureId, "acceptee");
      if (candidature.projectId) {
        projectStore.updateStatus(candidature.projectId, "pourvu");
      }

      const order = orderStore.create({
        serviceId: "",
        serviceTitle: candidature.projectTitle || "Projet",
        category: "",
        clientId: session.user.id,
        clientName: session.user.name || "Client",
        clientAvatar: "",
        clientCountry: "",
        freelanceId: candidature.freelanceId,
        status: "en_attente",
        amount: candidature.proposedPrice || 0,
        commission: (candidature.proposedPrice || 0) * 0.2,
        packageType: "custom",
        deadline: new Date(Date.now() + (candidature.deliveryDays || 14) * 86400000).toISOString().slice(0, 10),
        deliveredAt: null,
        completedAt: null,
        progress: 0,
        revisionsLeft: 2,
        messages: [],
        timeline: [{
          id: `t${Date.now()}`,
          type: "created" as const,
          title: "Commande creee",
          description: `Candidature acceptee — ${candidature.projectTitle}`,
          timestamp: new Date().toISOString(),
        }],
        files: [],
      });

      return NextResponse.json({ ok: true, order });
    }

    // Prisma
    const bid = await prisma.projectBid.findUnique({
      where: { id: candidatureId },
      include: {
        project: { select: { clientId: true, title: true, id: true } },
        freelance: { select: { id: true, name: true, plan: true } },
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
    }

    if (bid.project.clientId !== session.user.id) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (bid.status !== "en_attente") {
      return NextResponse.json({ error: "Candidature deja traitee" }, { status: 400 });
    }

    const amount = bid.amount;
    const freelancePlan = normalizePlanName(bid.freelance.plan);
    const commission = calculateCommissionEur(freelancePlan, amount);
    const deadlineDate = new Date(Date.now() + (bid.deliveryDays || 14) * 86400000);

    const result = await prisma.$transaction(async (tx) => {
      // Update bid status
      await tx.projectBid.update({
        where: { id: candidatureId },
        data: { status: "acceptee" },
      });

      // Update project status
      await tx.project.update({
        where: { id: bid.projectId },
        data: { status: "pourvu" },
      });

      // Create order
      const order = await tx.order.create({
        data: {
          clientId: session.user.id,
          freelanceId: bid.freelanceId,
          status: "EN_ATTENTE",
          escrowStatus: "HELD",
          amount,
          commission,
          packageType: "custom",
          deadline: deadlineDate,
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          payerId: session.user.id,
          payeeId: bid.freelanceId,
          amount: amount - commission,
          currency: "EUR",
          status: "EN_ATTENTE",
          type: "paiement",
          description: `Projet accepte — ${bid.project.title}`,
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
              { userId: bid.freelanceId },
            ],
          },
        },
      });

      return order;
    });

    return NextResponse.json({ ok: true, order: result });
  } catch (error) {
    console.error("[API /candidatures/[id]/accept POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de la candidature" },
      { status: 500 }
    );
  }
}
