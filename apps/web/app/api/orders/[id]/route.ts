import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore, notificationStore, transactionStore, serviceStore } from "@/lib/dev/data-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const order = orderStore.getById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    // Verify the user is either the client or the freelance on this order
    if (order.clientId !== session.user.id && order.freelanceId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[API /orders/[id] GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la commande" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const order = orderStore.getById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    // Verify the user is either the client or the freelance on this order
    if (order.clientId !== session.user.id && order.freelanceId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, progress, deliveryMessage, deliveryFiles } = body;

    let updatedOrder;

    // Handle delivery (status change to "livre" with message and files)
    if (deliveryMessage !== undefined && deliveryFiles !== undefined) {
      updatedOrder = orderStore.deliver(id, deliveryMessage, deliveryFiles || []);
      if (updatedOrder) {
        notificationStore.add({
          userId: order.clientId,
          title: "Livraison effectuee",
          message: `La commande ${order.serviceTitle} a ete livree`,
          type: "order",
          read: false,
          link: `/client/commandes/${id}`,
        });
      }
    }
    // Handle accepting an order (status changes to "en_cours")
    else if (status === "en_cours") {
      updatedOrder = orderStore.accept(id);
      if (updatedOrder) {
        notificationStore.add({
          userId: order.clientId,
          title: "Commande acceptee",
          message: `Votre commande ${order.serviceTitle} a ete acceptee`,
          type: "order",
          read: false,
          link: `/client/commandes/${id}`,
        });
      }
    }
    // Handle other status changes
    else {
      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (progress !== undefined) updates.progress = progress;
      if (status === "termine") {
        updates.completedAt = new Date().toISOString();
        updates.progress = 100;
      }

      updatedOrder = orderStore.update(id, updates);

      if (updatedOrder && status) {
        const statusLabels: Record<string, string> = {
          revision: "Revision demandee",
          termine: "Commande terminee",
          annule: "Commande annulee",
          litige: "Litige ouvert",
        };

        const notifyUserId =
          session.user.id === order.clientId
            ? order.freelanceId
            : order.clientId;

        if (statusLabels[status]) {
          notificationStore.add({
            userId: notifyUserId,
            title: statusLabels[status],
            message: `${statusLabels[status]} pour ${order.serviceTitle}`,
            type: "order",
            read: false,
            link: `/dashboard/commandes/${id}`,
          });
        }

        // When order is completed, create transaction and update service stats
        if (status === "termine") {
          const now = new Date().toISOString().slice(0, 10);
          const netAmount = order.amount - order.commission;

          // Create sale transaction for freelance
          transactionStore.add({
            userId: order.freelanceId,
            type: "vente",
            description: `Commande ${order.id} - ${order.serviceTitle}`,
            amount: netAmount,
            status: "complete",
            date: now,
            orderId: order.id,
          });

          // Create commission transaction
          transactionStore.add({
            userId: order.freelanceId,
            type: "commission",
            description: `Commission FreelanceHigh - ${order.id}`,
            amount: -order.commission,
            status: "complete",
            date: now,
          });

          // Update service revenue
          const service = serviceStore.getById(order.serviceId);
          if (service) {
            serviceStore.update(service.id, {
              revenue: service.revenue + netAmount,
            });
          }

          // Notify freelance about payment
          notificationStore.add({
            userId: order.freelanceId,
            title: "Paiement recu",
            message: `€${netAmount} recu pour ${order.serviceTitle}`,
            type: "payment",
            read: false,
            link: "/dashboard/finances",
          });
        }
      }
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Impossible de mettre a jour la commande" },
        { status: 400 }
      );
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("[API /orders/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de la commande" },
      { status: 500 }
    );
  }
}
