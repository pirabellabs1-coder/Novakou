import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { orderStore, notificationStore, transactionStore, serviceStore, invoiceStore } from "@/lib/dev/data-store";
import { sendPaymentReceivedEmail } from "@/lib/email";

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

    if (IS_DEV) {
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
    } else {
      // Production: Prisma
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          service: true,
          client: true,
          freelance: true,
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      });

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
    }
  } catch (error) {
    console.error("[API /orders/[id] GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la commande" },
      { status: 500 }
    );
  }
}

// Map lowercase dev status to Prisma uppercase enum
const STATUS_MAP: Record<string, string> = {
  en_attente: "EN_ATTENTE",
  en_cours: "EN_COURS",
  livre: "LIVRE",
  revision: "REVISION",
  termine: "TERMINE",
  annule: "ANNULE",
  litige: "LITIGE",
};

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
    const body = await request.json();
    const { status, progress, deliveryMessage, deliveryFiles } = body;

    if (IS_DEV) {
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
        // Only client can mark as completed
        if (status === "termine" && session.user.id !== order.clientId) {
          return NextResponse.json(
            { error: "Seul le client peut valider la livraison" },
            { status: 403 }
          );
        }

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

            // Auto-generer la facture
            invoiceStore.createFromOrder({
              id: order.id,
              serviceTitle: order.serviceTitle,
              amount: order.amount,
              commission: order.commission,
              clientId: order.clientId,
              clientName: order.clientName,
              freelanceId: order.freelanceId,
              freelanceName: order.freelanceName || "Freelance",
            });

            // Send payment email to freelance (non-blocking)
            sendPaymentReceivedEmail(
              "",
              "Freelance",
              { amount: netAmount, serviceTitle: order.serviceTitle, orderId: order.id }
            ).catch(() => { /* email best-effort */ });
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
    } else {
      // Production: Prisma
      const order = await prisma.order.findUnique({
        where: { id },
        include: { service: true, client: true, freelance: true },
      });

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

      let updatedOrder;

      // Handle delivery (status change to "LIVRE" with message and files)
      if (deliveryMessage !== undefined && deliveryFiles !== undefined) {
        updatedOrder = await prisma.$transaction(async (tx) => {
          const updated = await tx.order.update({
            where: { id },
            data: {
              status: "LIVRE",
              deliveredAt: new Date(),
              progress: 90,
            },
            include: { service: true, client: true, freelance: true },
          });

          // Add delivery message to the order conversation
          const conversation = await tx.conversation.findUnique({
            where: { orderId: id },
          });
          if (conversation) {
            await tx.message.create({
              data: {
                conversationId: conversation.id,
                senderId: session.user.id,
                content: deliveryMessage,
                type: "TEXT",
              },
            });
            // Add file messages if any
            if (deliveryFiles && Array.isArray(deliveryFiles)) {
              for (const file of deliveryFiles) {
                await tx.message.create({
                  data: {
                    conversationId: conversation.id,
                    senderId: session.user.id,
                    content: file.name || "Fichier joint",
                    type: "FILE",
                    fileName: file.name,
                    fileUrl: file.url,
                  },
                });
              }
            }
          }

          // Notify the client
          await tx.notification.create({
            data: {
              userId: order.clientId,
              title: "Livraison effectuee",
              message: `La commande ${order.service.title} a ete livree`,
              type: "ORDER",
              read: false,
              link: `/client/commandes/${id}`,
            },
          });

          return updated;
        });
      }
      // Handle accepting an order (status changes to "EN_COURS")
      else if (status === "en_cours") {
        updatedOrder = await prisma.$transaction(async (tx) => {
          const updated = await tx.order.update({
            where: { id },
            data: {
              status: "EN_COURS",
              progress: 10,
            },
            include: { service: true, client: true, freelance: true },
          });

          // Notify the client
          await tx.notification.create({
            data: {
              userId: order.clientId,
              title: "Commande acceptee",
              message: `Votre commande ${order.service.title} a ete acceptee`,
              type: "ORDER",
              read: false,
              link: `/client/commandes/${id}`,
            },
          });

          return updated;
        });
      }
      // Handle other status changes
      else {
        const prismaStatus = status ? (STATUS_MAP[status] || status.toUpperCase()) : undefined;

        // Only the client can mark as completed (validates delivery)
        if (prismaStatus === "TERMINE" && session.user.id !== order.clientId) {
          return NextResponse.json(
            { error: "Seul le client peut valider la livraison" },
            { status: 403 }
          );
        }

        updatedOrder = await prisma.$transaction(async (tx) => {
          const updateData: Record<string, unknown> = {};
          if (prismaStatus) updateData.status = prismaStatus;
          if (progress !== undefined) updateData.progress = progress;

          if (prismaStatus === "TERMINE") {
            // SECURITY: Verify payment was actually received before releasing escrow
            const payment = await tx.payment.findFirst({
              where: { orderId: id, type: "paiement", status: "COMPLETE" },
            });
            if (!payment) {
              return NextResponse.json(
                { error: "Impossible de terminer : le paiement n'a pas ete confirme" },
                { status: 400 }
              );
            }
            updateData.completedAt = new Date();
            updateData.progress = 100;
            updateData.escrowStatus = "RELEASED";
          }

          if (prismaStatus === "LITIGE") {
            updateData.escrowStatus = "DISPUTED";
          }

          if (prismaStatus === "ANNULE") {
            updateData.escrowStatus = "REFUNDED";
          }

          const updated = await tx.order.update({
            where: { id },
            data: updateData,
            include: { service: true, client: true, freelance: true },
          });

          // Send notifications for status changes
          if (prismaStatus) {
            const statusLabels: Record<string, string> = {
              REVISION: "Revision demandee",
              TERMINE: "Commande terminee",
              ANNULE: "Commande annulee",
              LITIGE: "Litige ouvert",
            };

            const notifyUserId =
              session.user.id === order.clientId
                ? order.freelanceId
                : order.clientId;

            if (statusLabels[prismaStatus]) {
              await tx.notification.create({
                data: {
                  userId: notifyUserId,
                  title: statusLabels[prismaStatus],
                  message: `${statusLabels[prismaStatus]} pour ${order.service.title}`,
                  type: "ORDER",
                  read: false,
                  link: `/dashboard/commandes/${id}`,
                },
              });
            }

            // When order is completed, create payment records and update service stats
            if (prismaStatus === "TERMINE") {
              const netAmount = order.amount - order.commission;

              // Update escrow payment to completed
              await tx.payment.updateMany({
                where: { orderId: order.id, type: "paiement" },
                data: { status: "COMPLETE" },
              });

              // Update commission payment to completed
              await tx.payment.updateMany({
                where: { orderId: order.id, type: "commission" },
                data: { status: "COMPLETE" },
              });

              // Notify freelance about payment
              await tx.notification.create({
                data: {
                  userId: order.freelanceId,
                  title: "Paiement recu",
                  message: `€${netAmount} recu pour ${order.service.title}`,
                  type: "PAYMENT",
                  read: false,
                  link: "/dashboard/finances",
                },
              });

              // Send payment email to freelance (non-blocking, outside transaction)
              if (order.freelance.email) {
                sendPaymentReceivedEmail(
                  order.freelance.email,
                  order.freelance.name,
                  { amount: netAmount, serviceTitle: order.service.title, orderId: order.id }
                ).catch(() => { /* email best-effort */ });
              }
            }
          }

          return updated;
        });
      }

      if (!updatedOrder) {
        return NextResponse.json(
          { error: "Impossible de mettre a jour la commande" },
          { status: 400 }
        );
      }

      return NextResponse.json({ order: updatedOrder });
    }
  } catch (error) {
    console.error("[API /orders/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de la commande" },
      { status: 500 }
    );
  }
}
