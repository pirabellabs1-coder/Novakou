import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { orderStore, transactionStore, serviceStore, invoiceStore } from "@/lib/dev/data-store";
import { emitEvent } from "@/lib/events/dispatcher";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const order = orderStore.getById(id);

      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }

      // In dev mode, skip strict ownership check
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

      // Normalize Prisma UPPERCASE enum values to lowercase for frontend compatibility
      const normalizedOrder = {
        ...order,
        status: order.status.toLowerCase(),
        escrowStatus: order.escrowStatus?.toLowerCase() ?? order.escrowStatus,
      };

      return NextResponse.json({ order: normalizedOrder });
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
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, progress, deliveryMessage, deliveryFiles, revisionComment } = body;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const order = orderStore.getById(id);

      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }

      // In dev mode, skip strict ownership checks — allow all actions

      let updatedOrder;

      // Handle delivery (status change to "livre" with message and files)
      if (deliveryMessage !== undefined && deliveryFiles !== undefined) {
        updatedOrder = orderStore.deliver(id, deliveryMessage, deliveryFiles || []);
        if (updatedOrder) {
          emitEvent("order.delivered", {
            orderId: id, serviceTitle: order.serviceTitle, amount: order.amount,
            freelanceId: order.freelanceId, freelanceName: "", freelanceEmail: "",
            clientId: order.clientId, clientName: order.clientName, clientEmail: "",
          }).catch(() => {});
        }
      }
      // Handle accepting an order (status changes to "en_cours")
      else if (status === "en_cours") {
        updatedOrder = orderStore.accept(id);
        if (updatedOrder) {
          emitEvent("order.accepted", {
            orderId: id, serviceTitle: order.serviceTitle, amount: order.amount,
            freelanceId: order.freelanceId, freelanceName: "", freelanceEmail: "",
            clientId: order.clientId, clientName: order.clientName, clientEmail: "",
          }).catch(() => {});
        }
      }
      // Handle progress update only (no status change)
      else if (progress !== undefined && status === undefined) {
        const clampedProgress = Math.min(100, Math.max(0, Number(progress)));
        updatedOrder = orderStore.update(id, { progress: clampedProgress });
      }
      // Handle other status changes
      else {
        // In dev mode, skip permission checks for termine/revision
        // Check revision limits
        if (status === "revision" && order.revisionsLeft !== undefined && order.revisionsLeft <= 0) {
          return NextResponse.json(
            { error: "Nombre de revisions epuise" },
            { status: 400 }
          );
        }

        const updates: Record<string, unknown> = {};
        if (status !== undefined) updates.status = status;
        if (progress !== undefined) updates.progress = progress;
        if (status === "termine") {
          updates.completedAt = new Date().toISOString();
          updates.progress = 100;
        }
        // Decrement revision count when a revision is requested
        if (status === "revision" && order.revisionsLeft !== undefined) {
          updates.revisionsLeft = order.revisionsLeft - 1;
        }

        updatedOrder = orderStore.update(id, updates);

        // Add revision comment as order message + timeline event
        if (status === "revision" && revisionComment && updatedOrder) {
          orderStore.addMessage(id, {
            sender: "client",
            senderName: order.clientName || "Client",
            content: `Revision demandee : ${revisionComment}`,
            timestamp: new Date().toISOString(),
            type: "system",
          });
          const currentOrder = orderStore.getById(id);
          if (currentOrder) {
            orderStore.update(id, {
              timeline: [...currentOrder.timeline, {
                id: `t${Date.now()}`,
                type: "revision" as const,
                title: "Revision demandee par le client",
                description: revisionComment,
                timestamp: new Date().toISOString(),
              }],
            });
          }
        }

        if (updatedOrder && status) {
          const statusLabels: Record<string, string> = {
            revision: "Revision demandee",
            termine: "Commande terminee",
            annule: "Commande annulee",
            litige: "Litige ouvert",
          };

          const notifyUserId =
            (session?.user?.id || "dev-user") === order.clientId
              ? order.freelanceId
              : order.clientId;

          // Emit appropriate event for status change
          if (status === "revision") {
            emitEvent("order.revision_requested", {
              orderId: id, serviceTitle: order.serviceTitle, amount: order.amount,
              freelanceId: order.freelanceId, freelanceName: "", freelanceEmail: "",
              clientId: order.clientId, clientName: order.clientName, clientEmail: "",
            }).catch(() => {});
          } else if (status === "annule") {
            emitEvent("order.cancelled", {
              orderId: id, serviceTitle: order.serviceTitle, amount: order.amount,
              freelanceId: order.freelanceId, freelanceName: "", freelanceEmail: "",
              clientId: order.clientId, clientName: order.clientName, clientEmail: "",
            }).catch(() => {});
          } else if (statusLabels[status]) {
            const { createNotification } = await import("@/lib/notifications/service");
            await createNotification({
              userId: notifyUserId,
              title: statusLabels[status],
              message: `${statusLabels[status]} pour ${order.serviceTitle}`,
              type: "order",
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

            // Emit order.completed event (notifications + email)
            emitEvent("order.completed", {
              orderId: id, serviceTitle: order.serviceTitle, amount: netAmount,
              freelanceId: order.freelanceId, freelanceName: order.freelanceName || "Freelance", freelanceEmail: "",
              clientId: order.clientId, clientName: order.clientName, clientEmail: "",
            }).catch(() => {});
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
              message: `La commande ${order.service!.title} a ete livree`,
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
              message: `Votre commande ${order.service!.title} a ete acceptee`,
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
            // Verify a payment record exists (any status — it will be completed in the same tx)
            const payment = await tx.payment.findFirst({
              where: { orderId: id, type: "paiement" },
            });
            if (!payment) {
              return { error: "no_payment" };
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
              const notifMessage = prismaStatus === "REVISION" && revisionComment
                ? `Revision demandee : ${revisionComment}`
                : `${statusLabels[prismaStatus]} pour ${order.service!.title}`;

              await tx.notification.create({
                data: {
                  userId: notifyUserId,
                  title: statusLabels[prismaStatus],
                  message: notifMessage,
                  type: "ORDER",
                  read: false,
                  link: `/dashboard/commandes/${id}`,
                },
              });
            }

            // Add revision comment as a message in the order conversation
            if (prismaStatus === "REVISION" && revisionComment) {
              const conversation = await tx.conversation.findUnique({
                where: { orderId: id },
              });
              if (conversation) {
                await tx.message.create({
                  data: {
                    conversationId: conversation.id,
                    senderId: session.user.id,
                    content: `Revision demandee : ${revisionComment}`,
                    type: "SYSTEM",
                  },
                });
              }
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

              // Increment service orderCount
              if (order.serviceId) {
                await tx.service.update({
                  where: { id: order.serviceId },
                  data: { orderCount: { increment: 1 } },
                }).catch(() => {}); // ignore if service doesn't exist
              }

              // Emit order.completed event (notification + email — outside tx)
              emitEvent("order.completed", {
                orderId: order.id, serviceTitle: order.service!.title, amount: netAmount,
                freelanceId: order.freelanceId, freelanceName: order.freelance!.name, freelanceEmail: order.freelance!.email,
                clientId: order.clientId, clientName: order.client!.name, clientEmail: order.client!.email,
              }).catch(() => {});
            }
          }

          return updated;
        });
      }

      // Handle error returned from transaction (can't return NextResponse inside $transaction)
      if (updatedOrder && typeof updatedOrder === "object" && "error" in updatedOrder) {
        const errMsg = (updatedOrder as { error: string }).error;
        if (errMsg === "no_payment") {
          return NextResponse.json(
            { error: "Impossible de terminer : aucun paiement enregistre pour cette commande" },
            { status: 400 }
          );
        }
      }

      if (!updatedOrder) {
        return NextResponse.json(
          { error: "Impossible de mettre a jour la commande" },
          { status: 400 }
        );
      }

      // Normalize Prisma UPPERCASE enum values to lowercase for frontend compatibility
      const normalizedOrder = {
        ...updatedOrder,
        status: typeof updatedOrder.status === "string" ? updatedOrder.status.toLowerCase() : updatedOrder.status,
        escrowStatus: typeof updatedOrder.escrowStatus === "string" ? updatedOrder.escrowStatus.toLowerCase() : updatedOrder.escrowStatus,
      };

      return NextResponse.json({ order: normalizedOrder });
    }
  } catch (error) {
    console.error("[API /orders/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de la commande" },
      { status: 500 }
    );
  }
}
