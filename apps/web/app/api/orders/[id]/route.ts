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

      // Verify the user is the client, the freelance, or the agency owner on this order
      const userId = session!.user.id;
      let hasAccess = order.clientId === userId || order.freelanceId === userId;
      if (!hasAccess && order.agencyId) {
        const isAgencyOwner = await prisma.agencyProfile.findFirst({
          where: { id: order.agencyId, userId },
        });
        if (isAgencyOwner) hasAccess = true;
      }
      if (!hasAccess) {
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
      // Production: Prisma — session required
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
      }
      const userId = session.user.id;

      const order = await prisma.order.findUnique({
        where: { id },
        include: { service: true, client: true, freelance: true, escrow: true },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }

      // Verify the user is the client, the freelance, or the agency owner on this order
      const isAgencyOwner = order.agencyId
        ? await prisma.agencyProfile.findFirst({ where: { id: order.agencyId, userId } }).then((a) => !!a)
        : false;
      if (order.clientId !== userId && order.freelanceId !== userId && !isAgencyOwner) {
        return NextResponse.json(
          { error: "Acces non autorise" },
          { status: 403 }
        );
      }

      // ─── Status transition validation ────────────────────────────────────
      // Determine the target status (delivery path uses LIVRE implicitly)
      const isDeliveryAction = deliveryMessage !== undefined && deliveryFiles !== undefined;
      const targetStatus = isDeliveryAction ? "LIVRE" : (status ? (STATUS_MAP[status] || status.toUpperCase()) : undefined);
      const currentStatus = order.status as string;

      const VALID_TRANSITIONS: Record<string, string[]> = {
        EN_ATTENTE: ["EN_COURS", "ANNULE"],
        EN_COURS:   ["LIVRE", "ANNULE", "LITIGE"],
        LIVRE:      ["TERMINE", "REVISION", "LITIGE"],
        REVISION:   ["EN_COURS", "ANNULE", "LITIGE"],
        LITIGE:     [],   // Only admin can resolve from LITIGE
        TERMINE:    [],   // Terminal state
        ANNULE:     [],   // Terminal state
      };

      if (targetStatus) {
        const allowed = VALID_TRANSITIONS[currentStatus];
        if (allowed === undefined) {
          return NextResponse.json(
            { error: "Statut actuel de la commande inconnu" },
            { status: 400 }
          );
        }
        if (!allowed.includes(targetStatus)) {
          return NextResponse.json(
            {
              error: `Transition invalide : ${currentStatus.toLowerCase()} → ${targetStatus.toLowerCase()}`,
            },
            { status: 400 }
          );
        }

        // ─── Per-transition authorization ────────────────────────────────
        // Only freelance (or agency) can accept (EN_COURS) and deliver (LIVRE)
        const isFreelanceSide = userId === order.freelanceId || isAgencyOwner;
        const isClientSide = userId === order.clientId;

        if (targetStatus === "EN_COURS" && !isFreelanceSide) {
          return NextResponse.json(
            { error: "Seul le freelance peut accepter la commande" },
            { status: 403 }
          );
        }
        if (targetStatus === "LIVRE" && !isFreelanceSide) {
          return NextResponse.json(
            { error: "Seul le freelance peut livrer la commande" },
            { status: 403 }
          );
        }
        if (targetStatus === "TERMINE" && !isClientSide) {
          return NextResponse.json(
            { error: "Seul le client peut valider la livraison" },
            { status: 403 }
          );
        }
        if (targetStatus === "REVISION" && !isClientSide) {
          return NextResponse.json(
            { error: "Seul le client peut demander une revision" },
            { status: 403 }
          );
        }
        if (targetStatus === "LITIGE" && !isClientSide) {
          return NextResponse.json(
            { error: "Seul le client peut ouvrir un litige" },
            { status: 403 }
          );
        }
        // ANNULE: both parties can cancel (no extra restriction needed here)
      }
      // ─────────────────────────────────────────────────────────────────────

      let updatedOrder;

      // Handle delivery (status change to "LIVRE" with message and files)
      const serviceTitle = order.service?.title || "votre commande";
      if (isDeliveryAction) {
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
                senderId: userId,
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
                    senderId: userId,
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
              message: `La commande ${serviceTitle} a ete livree`,
              type: "ORDER",
              read: false,
              link: `/client/commandes/${id}`,
            },
          });

          return updated;
        });

        // Emit delivery event outside transaction
        if (updatedOrder) {
          emitEvent("order.delivered", {
            orderId: id, serviceTitle, amount: order.amount,
            freelanceId: order.freelanceId, freelanceName: order.freelance?.name || "Freelance", freelanceEmail: order.freelance?.email || "",
            clientId: order.clientId, clientName: order.client?.name || "Client", clientEmail: order.client?.email || "",
          }).catch(() => {});
        }
      }
      // Handle accepting an order (EN_ATTENTE → EN_COURS) or resuming after revision (REVISION → EN_COURS)
      else if (status === "en_cours") {
        const isRework = currentStatus === "REVISION";
        updatedOrder = await prisma.$transaction(async (tx) => {
          const updateData: Record<string, unknown> = {
            status: "EN_COURS",
            progress: 10,
          };
          // Only stamp acceptedAt/startedAt on first acceptance, not on re-work
          if (!isRework) {
            updateData.acceptedAt = new Date();
            updateData.startedAt = new Date();
          }

          const updated = await tx.order.update({
            where: { id },
            data: updateData,
            include: { service: true, client: true, freelance: true },
          });

          // Notify the client
          await tx.notification.create({
            data: {
              userId: order.clientId,
              title: isRework ? "Revision en cours" : "Commande acceptee",
              message: isRework
                ? `Le freelance a repris le travail sur ${serviceTitle}`
                : `Votre commande ${serviceTitle} a ete acceptee`,
              type: "ORDER",
              read: false,
              link: `/client/commandes/${id}`,
            },
          });

          return updated;
        });

        // Emit accepted event outside transaction
        if (updatedOrder) {
          emitEvent("order.accepted", {
            orderId: id, serviceTitle, amount: order.amount,
            freelanceId: order.freelanceId, freelanceName: order.freelance?.name || "Freelance", freelanceEmail: order.freelance?.email || "",
            clientId: order.clientId, clientName: order.client?.name || "Client", clientEmail: order.client?.email || "",
          }).catch(() => {});
        }
      }
      // Handle other status changes
      else {
        const prismaStatus = status ? (STATUS_MAP[status] || status.toUpperCase()) : undefined;

        // Only the client can mark as completed (validates delivery)
        if (prismaStatus === "TERMINE" && userId !== order.clientId) {
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

            // Update escrow record to disputed
            await tx.escrow.updateMany({
              where: { orderId: order.id, status: "HELD" },
              data: { status: "DISPUTED" },
            });

            // Create a Dispute record so admin can see and resolve it
            await tx.dispute.create({
              data: {
                orderId: order.id,
                clientId: order.clientId,
                freelanceId: order.freelanceId,
                reason: body.reason || "Litige ouvert par le client",
                clientArgument: body.description || "",
                status: "OUVERT",
              },
            });

            // Notify all admins about the new dispute
            const admins = await tx.user.findMany({
              where: { role: "ADMIN" },
              select: { id: true },
            });
            if (admins.length > 0) {
              await tx.notification.createMany({
                data: admins.map((a) => ({
                  userId: a.id,
                  title: "Nouveau litige",
                  message: `Litige ouvert sur la commande ${serviceTitle}`,
                  type: "ORDER" as const,
                  read: false,
                  link: `/admin/litiges`,
                })),
              });
            }
          }

          if (prismaStatus === "ANNULE") {
            updateData.escrowStatus = "REFUNDED";

            // Refund escrow record
            await tx.escrow.updateMany({
              where: { orderId: order.id, status: "HELD" },
              data: { status: "REFUNDED", releasedAt: new Date() },
            });

            // Mark payments as refunded
            await tx.payment.updateMany({
              where: { orderId: order.id, status: "EN_ATTENTE" },
              data: { status: "REMBOURSE" },
            });

            // Reverse admin wallet held fees
            const cancelFee = order.platformFee || order.commission;
            if (cancelFee > 0) {
              const adminWallet = await tx.adminWallet.findFirst();
              if (adminWallet) {
                await tx.adminWallet.update({
                  where: { id: adminWallet.id },
                  data: { totalFeesHeld: { decrement: cancelFee } },
                });
                await tx.adminTransaction.updateMany({
                  where: { orderId: order.id, status: "PENDING" },
                  data: { status: "CONFIRMED" },
                });
              }
            }
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
              userId === order.clientId
                ? order.freelanceId
                : order.clientId;

            if (statusLabels[prismaStatus]) {
              let notifMessage = `${statusLabels[prismaStatus]} pour ${serviceTitle}`;
              let notifLink = `/dashboard/commandes/${id}`;
              if (prismaStatus === "REVISION" && revisionComment) {
                notifMessage = `Revision demandee : ${revisionComment}`;
              } else if (prismaStatus === "LITIGE") {
                const disputeReason = body.reason || "";
                notifMessage = disputeReason
                  ? `Litige ouvert pour ${serviceTitle} — Motif : ${disputeReason}`
                  : `Litige ouvert pour ${serviceTitle}`;
                notifLink = userId === order.clientId
                  ? `/dashboard/commandes/${id}`
                  : `/client/commandes/${id}`;
              }

              await tx.notification.create({
                data: {
                  userId: notifyUserId,
                  title: statusLabels[prismaStatus],
                  message: notifMessage,
                  type: "ORDER",
                  read: false,
                  link: notifLink,
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
                    senderId: userId,
                    content: `Revision demandee : ${revisionComment}`,
                    type: "SYSTEM",
                  },
                });
              }
            }

            // When order is completed, create payment records and update service stats
            if (prismaStatus === "TERMINE") {
              const feeAmount = order.platformFee || order.commission;
              const netAmount = order.amount - feeAmount;

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

              // Release escrow record
              await tx.escrow.updateMany({
                where: { orderId: order.id, status: "HELD" },
                data: { status: "RELEASED", releasedAt: new Date() },
              });

              // Release admin commission (held -> released)
              if (feeAmount > 0) {
                const adminWallet = await tx.adminWallet.findFirst();
                if (adminWallet) {
                  await tx.adminWallet.update({
                    where: { id: adminWallet.id },
                    data: {
                      totalFeesHeld: { decrement: feeAmount },
                      totalFeesReleased: { increment: feeAmount },
                    },
                  });
                  await tx.adminTransaction.updateMany({
                    where: { orderId: order.id, status: "PENDING" },
                    data: { status: "CONFIRMED" },
                  });
                }
              }

              // Update service totalRevenue (orderCount already incremented at POST creation)
              if (order.serviceId) {
                await tx.service.update({
                  where: { id: order.serviceId },
                  data: { totalRevenue: { increment: netAmount } },
                }).catch(() => {}); // ignore if service doesn't exist
              }
            }
          }

          return updated;
        });

        // Emit order.completed event OUTSIDE the transaction (fire-and-forget)
        if (prismaStatus === "TERMINE" && updatedOrder && !("error" in updatedOrder)) {
          const feeAmount = order.platformFee || order.commission;
          const completedNet = order.amount - feeAmount;
          emitEvent("order.completed", {
            orderId: order.id, serviceTitle, amount: completedNet,
            freelanceId: order.freelanceId, freelanceName: order.freelance?.name || "Freelance", freelanceEmail: order.freelance?.email || "",
            clientId: order.clientId, clientName: order.client?.name || "Client", clientEmail: order.client?.email || "",
          }).catch(() => {});

          // ── Wallet credit (separate from main transaction) ──────────────
          // Runs in its own try-catch so wallet table issues (missing migration,
          // schema mismatch) do NOT crash order completion. The /api/wallet and
          // /api/finances/summary routes have fallback logic that aggregates
          // from Order data, so earnings are still visible even if this fails.
          try {
            const payoutAmount = order.freelancerPayout ?? completedNet;
            await prisma.$transaction(async (wx) => {
              // Idempotency: skip if this order was already paid out
              const existingPayout = await wx.walletTransaction.findFirst({
                where: { orderId: order.id, type: "ORDER_PAYOUT" },
              });
              if (existingPayout) return;

              // Credit freelancer or agency wallet
              if (order.agencyId) {
                const w = await wx.walletAgency.upsert({
                  where: { agencyId: order.agencyId },
                  create: { agencyId: order.agencyId, balance: payoutAmount, totalEarned: payoutAmount },
                  update: { balance: { increment: payoutAmount }, totalEarned: { increment: payoutAmount } },
                });
                await wx.walletTransaction.create({
                  data: {
                    agencyWalletId: w.id,
                    type: "ORDER_PAYOUT",
                    amount: payoutAmount,
                    description: `Paiement commande #${order.id.slice(0, 8)} - ${serviceTitle}`,
                    status: "WALLET_COMPLETED",
                    orderId: order.id,
                  },
                });
              } else {
                const w = await wx.walletFreelance.upsert({
                  where: { userId: order.freelanceId },
                  create: { userId: order.freelanceId, balance: payoutAmount, totalEarned: payoutAmount },
                  update: { balance: { increment: payoutAmount }, totalEarned: { increment: payoutAmount } },
                });
                await wx.walletTransaction.create({
                  data: {
                    freelanceWalletId: w.id,
                    type: "ORDER_PAYOUT",
                    amount: payoutAmount,
                    description: `Paiement commande #${order.id.slice(0, 8)} - ${serviceTitle}`,
                    status: "WALLET_COMPLETED",
                    orderId: order.id,
                  },
                });
              }
            });
          } catch (walletError) {
            // Non-fatal: wallet credit failed but order completion succeeded.
            // Fallback aggregation in /api/wallet and /api/finances/summary
            // ensures the user still sees correct earnings from Order data.
            console.error("[API /orders/[id] PATCH] Wallet credit failed (non-fatal):", walletError);
          }
        }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uo = updatedOrder as any;
      const normalizedOrder = {
        ...uo,
        status: typeof uo.status === "string" ? uo.status.toLowerCase() : uo.status,
        escrowStatus: typeof uo.escrowStatus === "string" ? uo.escrowStatus.toLowerCase() : uo.escrowStatus,
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
