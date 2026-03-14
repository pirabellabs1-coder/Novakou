import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore, transactionStore, notificationStore } from "@/lib/dev/data-store";

// GET /api/admin/orders/[id] — Get full order details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const order = orderStore.getById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[API /admin/orders/[id] GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la commande" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/[id] — Admin actions on orders
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, status: newStatus } = body;

    const order = orderStore.getById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    switch (action) {
      case "force_delivery": {
        const updated = orderStore.update(id, {
          status: "livre",
          progress: 100,
          deliveredAt: now,
          timeline: [
            ...order.timeline,
            {
              id: `t${Date.now()}`,
              type: "delivered",
              title: "Livraison forcee par l'admin",
              description: "L'administration a force la livraison de cette commande.",
              timestamp: now,
            },
          ],
        });

        notificationStore.add({
          userId: order.clientId,
          title: "Commande livree",
          message: `La commande "${order.serviceTitle}" a ete marquee comme livree par l'administration.`,
          type: "order",
          read: false,
          link: `/client/commandes/${id}`,
        });

        notificationStore.add({
          userId: order.freelanceId,
          title: "Livraison forcee",
          message: `Votre commande "${order.serviceTitle}" a ete marquee comme livree par l'administration.`,
          type: "order",
          read: false,
          link: `/dashboard/commandes/${id}`,
        });

        return NextResponse.json({
          success: true,
          message: `Commande ${id} marquee comme livree`,
          order: updated,
        });
      }

      case "force_cancel": {
        const updated = orderStore.update(id, {
          status: "annule",
          progress: 0,
          timeline: [
            ...order.timeline,
            {
              id: `t${Date.now()}`,
              type: "cancelled",
              title: "Annulation forcee par l'admin",
              description: "L'administration a annule cette commande.",
              timestamp: now,
            },
          ],
        });

        notificationStore.add({
          userId: order.clientId,
          title: "Commande annulee",
          message: `La commande "${order.serviceTitle}" a ete annulee par l'administration.`,
          type: "order",
          read: false,
          link: `/client/commandes/${id}`,
        });

        notificationStore.add({
          userId: order.freelanceId,
          title: "Commande annulee",
          message: `La commande "${order.serviceTitle}" a ete annulee par l'administration.`,
          type: "order",
          read: false,
          link: `/dashboard/commandes/${id}`,
        });

        return NextResponse.json({
          success: true,
          message: `Commande ${id} annulee`,
          order: updated,
        });
      }

      case "release_escrow": {
        const updated = orderStore.update(id, {
          status: "termine",
          completedAt: now,
          timeline: [
            ...order.timeline,
            {
              id: `t${Date.now()}`,
              type: "completed",
              title: "Fonds liberes par l'admin",
              description: "L'administration a libere les fonds escrow.",
              timestamp: now,
            },
          ],
        });

        // Credit freelance
        transactionStore.add({
          userId: order.freelanceId,
          type: "vente",
          description: `Paiement commande ${id} - ${order.serviceTitle}`,
          amount: order.amount - order.commission,
          status: "complete",
          date: now.slice(0, 10),
          orderId: id,
        });

        // Platform commission
        transactionStore.add({
          userId: order.freelanceId,
          type: "commission",
          description: `Commission plateforme - Commande ${id}`,
          amount: -order.commission,
          status: "complete",
          date: now.slice(0, 10),
          orderId: id,
        });

        notificationStore.add({
          userId: order.freelanceId,
          title: "Fonds liberes",
          message: `Les fonds de la commande "${order.serviceTitle}" (${order.amount - order.commission} EUR) ont ete liberes.`,
          type: "payment",
          read: false,
          link: "/dashboard/finances",
        });

        notificationStore.add({
          userId: order.clientId,
          title: "Commande terminee",
          message: `La commande "${order.serviceTitle}" est terminee. Les fonds ont ete liberes.`,
          type: "order",
          read: false,
          link: `/client/commandes/${id}`,
        });

        return NextResponse.json({
          success: true,
          message: `Fonds escrow liberes pour la commande ${id}`,
          order: updated,
        });
      }

      case "refund": {
        const updated = orderStore.update(id, {
          status: "annule",
          timeline: [
            ...order.timeline,
            {
              id: `t${Date.now()}`,
              type: "cancelled",
              title: "Remboursement effectue par l'admin",
              description: "L'administration a rembourse le client.",
              timestamp: now,
            },
          ],
        });

        // Refund transaction
        transactionStore.add({
          userId: order.clientId,
          type: "remboursement",
          description: `Remboursement commande ${id} - ${order.serviceTitle}`,
          amount: order.amount,
          status: "complete",
          date: now.slice(0, 10),
          orderId: id,
        });

        notificationStore.add({
          userId: order.clientId,
          title: "Remboursement effectue",
          message: `Vous avez ete rembourse de ${order.amount} EUR pour la commande "${order.serviceTitle}".`,
          type: "payment",
          read: false,
          link: `/client/commandes/${id}`,
        });

        notificationStore.add({
          userId: order.freelanceId,
          title: "Commande remboursee",
          message: `La commande "${order.serviceTitle}" a ete remboursee au client par l'administration.`,
          type: "order",
          read: false,
          link: `/dashboard/commandes/${id}`,
        });

        return NextResponse.json({
          success: true,
          message: `Commande ${id} remboursee`,
          order: updated,
        });
      }

      case "update_status": {
        if (!newStatus) {
          return NextResponse.json(
            { error: "Le champ 'status' est requis pour l'action update_status" },
            { status: 400 }
          );
        }

        const validStatuses = [
          "en_attente", "en_cours", "livre", "revision",
          "termine", "annule", "litige",
        ];
        if (!validStatuses.includes(newStatus)) {
          return NextResponse.json(
            { error: `Statut invalide: ${newStatus}` },
            { status: 400 }
          );
        }

        const updated = orderStore.update(id, {
          status: newStatus,
          timeline: [
            ...order.timeline,
            {
              id: `t${Date.now()}`,
              type: newStatus === "cancelled" ? "cancelled" : "message",
              title: `Statut modifie par l'admin`,
              description: `Statut mis a jour: ${order.status} -> ${newStatus}`,
              timestamp: now,
            },
          ],
        });

        // Notify both parties
        notificationStore.add({
          userId: order.clientId,
          title: "Statut de commande modifie",
          message: `Le statut de votre commande "${order.serviceTitle}" a ete modifie par l'administration: ${order.status} → ${newStatus}`,
          type: "order",
          read: false,
          link: `/client/commandes/${id}`,
        });

        notificationStore.add({
          userId: order.freelanceId,
          title: "Statut de commande modifie",
          message: `Le statut de la commande "${order.serviceTitle}" a ete modifie par l'administration: ${order.status} → ${newStatus}`,
          type: "order",
          read: false,
          link: `/dashboard/commandes/${id}`,
        });

        return NextResponse.json({
          success: true,
          message: `Statut de la commande ${id} mis a jour: ${newStatus}`,
          order: updated,
        });
      }

      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API /admin/orders/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action admin sur la commande" },
      { status: 500 }
    );
  }
}
