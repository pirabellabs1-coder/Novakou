import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { orderStore, transactionStore } from "@/lib/dev/data-store";
import { createNotification } from "@/lib/notifications/service";

// GET /api/admin/orders/[id] — Get full order details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const order = orderStore.getById(id);
      if (!order) {
        return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    // Production: Prisma
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        service: { select: { title: true, slug: true, categoryId: true, category: { select: { name: true } } } },
        client: { select: { id: true, name: true, email: true, image: true, country: true } },
        freelance: { select: { id: true, name: true, email: true, image: true, country: true } },
        payments: true,
        reviews: true,
        revisions: true,
        escrow: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        ...order,
        status: order.status.toLowerCase(),
        escrowStatus: order.escrowStatus?.toLowerCase() || null,
        serviceTitle: order.service?.title || order.title || "",
        category: order.service?.category?.name || "",
        clientName: order.client?.name || "",
        clientCountry: order.client?.country || "",
        freelanceName: order.freelance?.name || "",
        freelanceId: order.freelanceId,
        commission: order.commission || order.platformFee || 0,
      },
    });
  } catch (error) {
    console.error("[API /admin/orders/[id] GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation de la commande" }, { status: 500 });
  }
}

// PATCH /api/admin/orders/[id] — Admin actions on orders
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, status: newStatus } = body;

    // ── Dev mode ──
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const order = orderStore.getById(id);
      if (!order) {
        return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      }

      const now = new Date().toISOString();

      switch (action) {
        case "force_delivery": {
          const updated = orderStore.update(id, {
            status: "livre", progress: 100, deliveredAt: now,
            timeline: [...order.timeline, { id: `t${Date.now()}`, type: "delivered", title: "Livraison forcee par l'admin", description: "L'administration a force la livraison.", timestamp: now }],
          });
          createNotification({ userId: order.clientId, title: "Commande livree", message: `La commande "${order.serviceTitle}" a ete marquee comme livree par l'administration.`, type: "order", link: `/client/commandes/${id}` });
          createNotification({ userId: order.freelanceId, title: "Livraison forcee", message: `Votre commande "${order.serviceTitle}" a ete marquee comme livree par l'administration.`, type: "order", link: `/dashboard/commandes/${id}` });
          return NextResponse.json({ success: true, message: `Commande ${id} marquee comme livree`, order: updated });
        }
        case "force_cancel": {
          const updated = orderStore.update(id, {
            status: "annule", progress: 0,
            timeline: [...order.timeline, { id: `t${Date.now()}`, type: "cancelled", title: "Annulation forcee par l'admin", description: "L'administration a annule cette commande.", timestamp: now }],
          });
          createNotification({ userId: order.clientId, title: "Commande annulee", message: `La commande "${order.serviceTitle}" a ete annulee par l'administration.`, type: "order", link: `/client/commandes/${id}` });
          createNotification({ userId: order.freelanceId, title: "Commande annulee", message: `La commande "${order.serviceTitle}" a ete annulee par l'administration.`, type: "order", link: `/dashboard/commandes/${id}` });
          return NextResponse.json({ success: true, message: `Commande ${id} annulee`, order: updated });
        }
        case "release_escrow": {
          const updated = orderStore.update(id, {
            status: "termine", completedAt: now,
            timeline: [...order.timeline, { id: `t${Date.now()}`, type: "completed", title: "Fonds liberes par l'admin", description: "L'administration a libere les fonds escrow.", timestamp: now }],
          });
          transactionStore.add({ userId: order.freelanceId, type: "vente", description: `Paiement commande ${id} - ${order.serviceTitle}`, amount: order.amount - order.commission, status: "complete", date: now.slice(0, 10), orderId: id });
          transactionStore.add({ userId: order.freelanceId, type: "commission", description: `Commission plateforme - Commande ${id}`, amount: -order.commission, status: "complete", date: now.slice(0, 10), orderId: id });
          createNotification({ userId: order.freelanceId, title: "Fonds liberes", message: `Les fonds de la commande "${order.serviceTitle}" (${order.amount - order.commission} EUR) ont ete liberes.`, type: "payment", link: "/dashboard/finances" });
          createNotification({ userId: order.clientId, title: "Commande terminee", message: `La commande "${order.serviceTitle}" est terminee. Les fonds ont ete liberes.`, type: "order", link: `/client/commandes/${id}` });
          return NextResponse.json({ success: true, message: `Fonds escrow liberes pour la commande ${id}`, order: updated });
        }
        case "refund": {
          const updated = orderStore.update(id, {
            status: "annule",
            timeline: [...order.timeline, { id: `t${Date.now()}`, type: "cancelled", title: "Remboursement effectue par l'admin", description: "L'administration a rembourse le client.", timestamp: now }],
          });
          transactionStore.add({ userId: order.clientId, type: "remboursement", description: `Remboursement commande ${id} - ${order.serviceTitle}`, amount: order.amount, status: "complete", date: now.slice(0, 10), orderId: id });
          createNotification({ userId: order.clientId, title: "Remboursement effectue", message: `Vous avez ete rembourse de ${order.amount} EUR pour la commande "${order.serviceTitle}".`, type: "payment", link: `/client/commandes/${id}` });
          createNotification({ userId: order.freelanceId, title: "Commande remboursee", message: `La commande "${order.serviceTitle}" a ete remboursee au client par l'administration.`, type: "order", link: `/dashboard/commandes/${id}` });
          return NextResponse.json({ success: true, message: `Commande ${id} remboursee`, order: updated });
        }
        case "update_status": {
          if (!newStatus) return NextResponse.json({ error: "Le champ 'status' est requis" }, { status: 400 });
          const validStatuses = ["en_attente", "en_cours", "livre", "revision", "termine", "annule", "litige"];
          if (!validStatuses.includes(newStatus)) return NextResponse.json({ error: `Statut invalide: ${newStatus}` }, { status: 400 });
          const updated = orderStore.update(id, {
            status: newStatus,
            timeline: [...order.timeline, { id: `t${Date.now()}`, type: "message", title: "Statut modifie par l'admin", description: `Statut: ${order.status} → ${newStatus}`, timestamp: now }],
          });
          createNotification({ userId: order.clientId, title: "Statut de commande modifie", message: `Le statut de votre commande "${order.serviceTitle}" a ete modifie: ${order.status} → ${newStatus}`, type: "order", link: `/client/commandes/${id}` });
          createNotification({ userId: order.freelanceId, title: "Statut de commande modifie", message: `Le statut de la commande "${order.serviceTitle}" a ete modifie: ${order.status} → ${newStatus}`, type: "order", link: `/dashboard/commandes/${id}` });
          return NextResponse.json({ success: true, message: `Statut mis a jour: ${newStatus}`, order: updated });
        }
        default:
          return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
      }
    }

    // ── Production: Prisma ──
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        service: { select: { title: true } },
        escrow: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const serviceTitle = order.service?.title || order.title || "Commande";

    switch (action) {
      case "force_delivery": {
        const updated = await prisma.order.update({
          where: { id },
          data: { status: "LIVRE", deliveredAt: new Date(), progress: 100 },
        });

        await prisma.notification.createMany({
          data: [
            { userId: order.clientId, title: "Commande livree", message: `La commande "${serviceTitle}" a ete marquee comme livree par l'administration.`, type: "ORDER", link: `/client/commandes/${id}` },
            { userId: order.freelanceId, title: "Livraison forcee", message: `Votre commande "${serviceTitle}" a ete marquee comme livree par l'administration.`, type: "ORDER", link: `/dashboard/commandes/${id}` },
          ],
        });

        return NextResponse.json({ success: true, message: `Commande ${id} marquee comme livree`, order: { ...updated, status: updated.status.toLowerCase() } });
      }

      case "force_cancel": {
        const updated = await prisma.order.update({
          where: { id },
          data: { status: "ANNULE" },
        });

        await prisma.notification.createMany({
          data: [
            { userId: order.clientId, title: "Commande annulee", message: `La commande "${serviceTitle}" a ete annulee par l'administration.`, type: "ORDER", link: `/client/commandes/${id}` },
            { userId: order.freelanceId, title: "Commande annulee", message: `La commande "${serviceTitle}" a ete annulee par l'administration.`, type: "ORDER", link: `/dashboard/commandes/${id}` },
          ],
        });

        return NextResponse.json({ success: true, message: `Commande ${id} annulee`, order: { ...updated, status: updated.status.toLowerCase() } });
      }

      case "release_escrow": {
        const platformFee = order.platformFee || order.commission || 0;
        const netAmount = order.freelancerPayout || (order.amount - platformFee);

        const updated = await prisma.$transaction(async (tx) => {
          // Update order
          const updatedOrder = await tx.order.update({
            where: { id },
            data: { status: "TERMINE", escrowStatus: "RELEASED", completedAt: new Date() },
          });

          // Release escrow
          await tx.escrow.updateMany({
            where: { orderId: id, status: "HELD" },
            data: { status: "RELEASED", releasedAt: new Date() },
          });

          // Admin wallet: move fees held → released
          const adminWallet = await tx.adminWallet.findFirst();
          if (adminWallet && platformFee > 0) {
            await tx.adminWallet.update({
              where: { id: adminWallet.id },
              data: {
                totalFeesHeld: { decrement: platformFee },
                totalFeesReleased: { increment: platformFee },
              },
            });
            await tx.adminTransaction.updateMany({
              where: { orderId: id, status: "PENDING" },
              data: { status: "CONFIRMED" },
            });
          }

          // Credit freelancer wallet
          if (order.agencyId) {
            await tx.walletAgency.upsert({
              where: { agencyId: order.agencyId },
              create: { agencyId: order.agencyId, balance: netAmount, totalEarned: netAmount },
              update: { balance: { increment: netAmount }, totalEarned: { increment: netAmount } },
            });
          } else {
            await tx.wallet.upsert({
              where: { userId: order.freelanceId },
              create: { userId: order.freelanceId, balance: netAmount, totalEarned: netAmount },
              update: { balance: { increment: netAmount }, totalEarned: { increment: netAmount } },
            });
          }

          // Notifications
          await tx.notification.createMany({
            data: [
              { userId: order.freelanceId, title: "Fonds liberes", message: `Les fonds de la commande "${serviceTitle}" (${netAmount.toFixed(2)} EUR) ont ete liberes.`, type: "PAYMENT", link: "/dashboard/finances" },
              { userId: order.clientId, title: "Commande terminee", message: `La commande "${serviceTitle}" est terminee. Les fonds ont ete liberes.`, type: "ORDER", link: `/client/commandes/${id}` },
            ],
          });

          return updatedOrder;
        });

        return NextResponse.json({ success: true, message: `Fonds escrow liberes pour la commande ${id}`, order: { ...updated, status: updated.status.toLowerCase() } });
      }

      case "refund": {
        const platformFee = order.platformFee || order.commission || 0;

        const updated = await prisma.$transaction(async (tx) => {
          const updatedOrder = await tx.order.update({
            where: { id },
            data: { status: "ANNULE", escrowStatus: "REFUNDED" },
          });

          // Update escrow
          await tx.escrow.updateMany({
            where: { orderId: id, status: "HELD" },
            data: { status: "REFUNDED", releasedAt: new Date() },
          });

          // Reverse admin wallet fees
          const adminWallet = await tx.adminWallet.findFirst();
          if (adminWallet && platformFee > 0) {
            await tx.adminWallet.update({
              where: { id: adminWallet.id },
              data: { totalFeesHeld: { decrement: platformFee } },
            });
            // Create refund transaction
            await tx.adminTransaction.create({
              data: {
                adminWalletId: adminWallet.id,
                type: "REFUND",
                amount: -platformFee,
                currency: "EUR",
                description: `Remboursement commission - ${serviceTitle} (Commande #${id.slice(0, 8)})`,
                orderId: id,
                status: "CONFIRMED",
              },
            });
          }

          // Notifications
          await tx.notification.createMany({
            data: [
              { userId: order.clientId, title: "Remboursement effectue", message: `Vous avez ete rembourse de ${order.amount} EUR pour la commande "${serviceTitle}".`, type: "PAYMENT", link: `/client/commandes/${id}` },
              { userId: order.freelanceId, title: "Commande remboursee", message: `La commande "${serviceTitle}" a ete remboursee au client par l'administration.`, type: "ORDER", link: `/dashboard/commandes/${id}` },
            ],
          });

          return updatedOrder;
        });

        return NextResponse.json({ success: true, message: `Commande ${id} remboursee`, order: { ...updated, status: updated.status.toLowerCase() } });
      }

      case "mark_disputed": {
        const updated = await prisma.$transaction(async (tx) => {
          const updatedOrder = await tx.order.update({
            where: { id },
            data: { escrowStatus: "DISPUTED" },
          });

          await tx.escrow.updateMany({
            where: { orderId: id, status: "HELD" },
            data: { status: "DISPUTED" },
          });

          await tx.notification.createMany({
            data: [
              { userId: order.clientId, title: "Litige ouvert", message: `Un litige a ete ouvert sur la commande "${serviceTitle}".`, type: "ORDER", link: `/client/commandes/${id}` },
              { userId: order.freelanceId, title: "Litige ouvert", message: `Un litige a ete ouvert sur la commande "${serviceTitle}".`, type: "ORDER", link: `/dashboard/commandes/${id}` },
            ],
          });

          return updatedOrder;
        });

        return NextResponse.json({ success: true, message: `Commande ${id} marquee en litige`, order: { ...updated, status: updated.status.toLowerCase() } });
      }

      case "update_status": {
        if (!newStatus) return NextResponse.json({ error: "Le champ 'status' est requis" }, { status: 400 });
        const statusMap: Record<string, string> = {
          en_attente: "EN_ATTENTE", en_cours: "EN_COURS", livre: "LIVRE",
          revision: "REVISION", termine: "TERMINE", annule: "ANNULE", litige: "LITIGE",
        };
        const prismaStatus = statusMap[newStatus];
        if (!prismaStatus) return NextResponse.json({ error: `Statut invalide: ${newStatus}` }, { status: 400 });

        const updated = await prisma.order.update({
          where: { id },
          data: { status: prismaStatus },
        });

        await prisma.notification.createMany({
          data: [
            { userId: order.clientId, title: "Statut de commande modifie", message: `Le statut de votre commande "${serviceTitle}" a ete modifie par l'administration.`, type: "ORDER", link: `/client/commandes/${id}` },
            { userId: order.freelanceId, title: "Statut de commande modifie", message: `Le statut de la commande "${serviceTitle}" a ete modifie par l'administration.`, type: "ORDER", link: `/dashboard/commandes/${id}` },
          ],
        });

        return NextResponse.json({ success: true, message: `Statut mis a jour: ${newStatus}`, order: { ...updated, status: updated.status.toLowerCase() } });
      }

      default:
        return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[API /admin/orders/[id] PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de l'action admin sur la commande" }, { status: 500 });
  }
}
