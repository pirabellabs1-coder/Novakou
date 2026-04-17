import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { orderStore, transactionStore } from "@/lib/dev/data-store";
import { createNotification } from "@/lib/notifications/service";
import { createAuditLog } from "@/lib/admin/audit";

const DEV_ADMIN_SESSION = { user: { id: "dev-admin", role: "admin", name: "Admin Dev", email: "admin@novakou.com" } };

// GET /api/admin/disputes — All disputes
export async function GET() {
  try {
    let session = await getServerSession(authOptions);
    if (IS_DEV && !session) session = DEV_ADMIN_SESSION as unknown as typeof session;
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const orders = orderStore.getAll();
      // Include orders currently in litige AND orders that were resolved from a litige (have disputeStatus = "resolu")
      const disputeOrders = orders.filter((o) => o.status === "litige" || (o as unknown as Record<string, unknown>).disputeStatus === "resolu");
      const disputes = disputeOrders
        .map((o) => {
          const extra = o as unknown as Record<string, unknown>;
          return {
            id: o.id, orderId: o.id, serviceTitle: o.serviceTitle, category: o.category,
            clientId: o.clientId, clientName: o.clientName, clientCountry: o.clientCountry,
            freelanceId: o.freelanceId, freelanceName: o.freelanceName || "Freelance",
            amount: o.amount, commission: o.commission,
            reason: (extra.disputeReason as string) || "Litige ouvert par le client",
            status: (extra.disputeStatus as string) || "ouvert",
            verdict: (extra.disputeVerdict as string) || null,
            verdictNote: (extra.disputeVerdictNote as string) || null,
            partialPercent: (extra.disputePartialPercent as number) || null,
            resolvedAt: (extra.disputeResolvedAt as string) || null,
            packageType: o.packageType, deadline: o.deadline, deliveredAt: o.deliveredAt,
            progress: o.progress, messages: o.messages, timeline: o.timeline, files: o.files,
            createdAt: o.createdAt, updatedAt: o.updatedAt,
            disputeOpenedAt: o.timeline.find((t) => t.title.toLowerCase().includes("litige") || t.description.toLowerCase().includes("litige"))?.timestamp ?? o.updatedAt,
          };
        })
        .sort((a, b) => new Date(a.disputeOpenedAt).getTime() - new Date(b.disputeOpenedAt).getTime());

      const activeDisputes = disputes.filter((d) => d.status !== "resolu");
      const totalResolved = disputes.filter((d) => d.status === "resolu").length;
      const totalAmount = activeDisputes.reduce((sum, d) => sum + d.amount, 0);

      return NextResponse.json({
        disputes,
        summary: { total: activeDisputes.length, resolved: totalResolved, totalAmountInDispute: Math.round(totalAmount * 100) / 100 },
      });
    }

    // ── Production: Prisma ──
    const disputes = await prisma.dispute.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        order: {
          include: {
            service: { select: { title: true, slug: true } },
          },
        },
        client: { select: { id: true, name: true, email: true, country: true } },
        freelance: { select: { id: true, name: true, email: true } },
      },
    });

    const [resolvedCount, totalAmountResult] = await Promise.all([
      prisma.dispute.count({ where: { status: "RESOLU" } }),
      prisma.dispute.findMany({
        where: { status: { in: ["OUVERT", "EN_EXAMEN"] } },
        include: { order: { select: { amount: true } } },
      }),
    ]);

    const totalAmountInDispute = totalAmountResult.reduce((sum, d) => sum + (d.order?.amount ?? 0), 0);

    return NextResponse.json({
      disputes: disputes.map((d) => ({
        id: d.id,
        orderId: d.orderId,
        serviceTitle: d.order?.service?.title ?? "",
        clientId: d.clientId,
        clientName: d.client.name,
        clientCountry: d.client.country,
        freelanceId: d.freelanceId,
        freelanceName: d.freelance.name,
        amount: d.order?.amount ?? 0,
        reason: d.reason,
        clientArgument: d.clientArgument,
        freelanceArgument: d.freelanceArgument,
        status: d.status.toLowerCase(),
        verdict: d.verdict?.toLowerCase() ?? null,
        verdictNote: d.verdictNote,
        partialPercent: d.partialPercent,
        resolvedAt: d.resolvedAt,
        createdAt: d.createdAt,
      })),
      summary: {
        total: disputes.filter((d) => d.status !== "RESOLU").length,
        resolved: resolvedCount,
        totalAmountInDispute: Math.round(totalAmountInDispute * 100) / 100,
      },
    });
  } catch (error) {
    console.error("[API /admin/disputes GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation des litiges" }, { status: 500 });
  }
}

// POST /api/admin/disputes — Examine or resolve a dispute
export async function POST(request: NextRequest) {
  try {
    let session = await getServerSession(authOptions);
    if (IS_DEV && !session) session = DEV_ADMIN_SESSION as unknown as typeof session;
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { action, orderId, disputeId, verdict, resolution, partialPercent } = body;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Dev mode: orderId is the order ID (dispute id == order id in dev mode)
      const devOrderId = orderId || disputeId;
      if (!devOrderId) return NextResponse.json({ error: "orderId est requis" }, { status: 400 });
      const order = orderStore.getById(devOrderId);
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      const now = new Date().toISOString();

      if (action === "examine") {
        orderStore.update(devOrderId, {
          disputeStatus: "en_examen",
          timeline: [...order.timeline, { id: `t${Date.now()}`, type: "message" as const, title: "Litige en cours d'examen", description: resolution ?? "L'administration examine ce litige.", timestamp: now }],
        });
        createNotification({ userId: order.clientId, title: "Litige en cours d'examen", message: `Votre litige concernant "${order.serviceTitle}" est en cours d'examen.`, type: "order", link: `/client/commandes/${devOrderId}` });
        createNotification({ userId: order.freelanceId, title: "Litige en cours d'examen", message: `Le litige concernant "${order.serviceTitle}" est en cours d'examen.`, type: "order", link: `/dashboard/commandes/${devOrderId}` });
        return NextResponse.json({ success: true, message: `Litige ${devOrderId} marque comme en cours d'examen` });
      }

      if (action === "resolve") {
        if (!verdict) return NextResponse.json({ error: "verdict requis" }, { status: 400 });
        let newStatus: "termine" | "annule" = "termine";
        let verdictDescription = "";
        const pct = verdict === "partiel" ? (partialPercent ?? 50) : 0;

        if (verdict === "freelance") {
          newStatus = "termine";
          verdictDescription = `Verdict en faveur du freelance. ${resolution ?? "Les fonds seront liberes."}`;
          transactionStore.add({ userId: order.freelanceId, type: "vente", description: `Paiement apres litige - ${order.serviceTitle}`, amount: order.amount - order.commission, status: "complete", date: now.slice(0, 10), orderId: devOrderId });
          createNotification({ userId: order.freelanceId, title: "Litige resolu en votre faveur", message: `Fonds de ${order.amount - order.commission} EUR liberes.`, type: "payment", link: "/dashboard/finances" });
          createNotification({ userId: order.clientId, title: "Litige resolu", message: `Verdict en faveur du freelance.`, type: "order", link: `/client/commandes/${devOrderId}` });
        } else if (verdict === "client") {
          newStatus = "annule";
          verdictDescription = `Verdict en faveur du client. ${resolution ?? "Remboursement effectue."}`;
          transactionStore.add({ userId: order.clientId, type: "remboursement", description: `Remboursement - ${order.serviceTitle}`, amount: order.amount, status: "complete", date: now.slice(0, 10), orderId: devOrderId });
          createNotification({ userId: order.clientId, title: "Litige resolu en votre faveur", message: `Remboursement de ${order.amount} EUR.`, type: "payment", link: `/client/commandes/${devOrderId}` });
          createNotification({ userId: order.freelanceId, title: "Litige resolu", message: `Verdict en faveur du client.`, type: "order", link: `/dashboard/commandes/${devOrderId}` });
        } else if (verdict === "partiel") {
          newStatus = "termine";
          const refundAmount = Math.round(order.amount * (pct / 100) * 100) / 100;
          const freelanceAmount = Math.round((order.amount - refundAmount - order.commission * ((100 - pct) / 100)) * 100) / 100;
          verdictDescription = `Remboursement partiel (${pct}%). ${refundAmount} EUR rembourses, ${freelanceAmount} EUR liberes.`;
          transactionStore.add({ userId: order.clientId, type: "remboursement", description: `Remboursement partiel - ${order.serviceTitle}`, amount: refundAmount, status: "complete", date: now.slice(0, 10), orderId: devOrderId });
          transactionStore.add({ userId: order.freelanceId, type: "vente", description: `Paiement partiel - ${order.serviceTitle}`, amount: freelanceAmount, status: "complete", date: now.slice(0, 10), orderId: devOrderId });
          createNotification({ userId: order.clientId, title: "Remboursement partiel", message: `${refundAmount} EUR rembourses.`, type: "payment", link: `/client/commandes/${devOrderId}` });
          createNotification({ userId: order.freelanceId, title: "Paiement partiel", message: `${freelanceAmount} EUR liberes.`, type: "payment", link: "/dashboard/finances" });
        }

        orderStore.update(devOrderId, {
          status: newStatus,
          completedAt: newStatus === "termine" ? now : null,
          disputeStatus: "resolu",
          disputeVerdict: verdict,
          disputeVerdictNote: verdictDescription,
          disputePartialPercent: verdict === "partiel" ? pct : null,
          disputeResolvedAt: now,
          timeline: [...order.timeline, { id: `t${Date.now()}`, type: "completed" as const, title: "Litige resolu", description: verdictDescription, timestamp: now }],
        });
        return NextResponse.json({ success: true, message: `Litige ${devOrderId} resolu: verdict ${verdict}`, verdict, resolution: verdictDescription });
      }

      return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    // ── Production: Prisma ──
    const id = disputeId || orderId;
    if (!id) return NextResponse.json({ error: "disputeId ou orderId requis" }, { status: 400 });

    // Find dispute by ID or by orderId
    const dispute = disputeId
      ? await prisma.dispute.findUnique({ where: { id: disputeId }, include: { order: true, client: { select: { name: true, email: true } }, freelance: { select: { name: true, email: true } } } })
      : await prisma.dispute.findFirst({ where: { orderId }, include: { order: true, client: { select: { name: true, email: true } }, freelance: { select: { name: true, email: true } } } });

    if (!dispute) return NextResponse.json({ error: "Litige introuvable" }, { status: 404 });

    if (action === "examine") {
      await prisma.dispute.update({ where: { id: dispute.id }, data: { status: "EN_EXAMEN" } });

      await prisma.notification.createMany({
        data: [
          { userId: dispute.clientId, title: "Litige en cours d'examen", message: `Votre litige est en cours d'examen par l'administration.`, type: "ORDER" },
          { userId: dispute.freelanceId, title: "Litige en cours d'examen", message: `Le litige est en cours d'examen par l'administration.`, type: "ORDER" },
        ],
      });

      await createAuditLog({ actorId: session.user.id, action: "dispute.examine", targetType: "dispute", targetId: dispute.id, details: { orderId: dispute.orderId } });

      return NextResponse.json({ success: true, message: `Litige marque comme en cours d'examen` });
    }

    if (action === "resolve") {
      if (!verdict) return NextResponse.json({ error: "verdict requis (freelance | client | partiel)" }, { status: 400 });

      const verdictMap: Record<string, string> = { freelance: "FREELANCE", client: "CLIENT", partiel: "PARTIEL", annulation: "ANNULATION" };
      const prismaVerdict = verdictMap[verdict];
      if (!prismaVerdict) return NextResponse.json({ error: `Verdict invalide: ${verdict}` }, { status: 400 });

      const order = dispute.order;
      const orderAmount = order?.amount ?? 0;
      const orderCommission = order?.commission ?? order?.platformFee ?? 0;
      const pct = verdict === "partiel" ? (partialPercent ?? 50) : 0;

      await prisma.$transaction(async (tx) => {
        // 1. Update dispute
        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: "RESOLU",
            verdict: prismaVerdict as "FREELANCE" | "CLIENT" | "PARTIEL" | "ANNULATION",
            verdictNote: resolution,
            partialPercent: verdict === "partiel" ? pct : null,
            resolvedAt: new Date(),
          },
        });

        // 2. Update order status + escrow + adjust freelancerPayout based on verdict
        const orderStatus = verdict === "client" ? "ANNULE" : "TERMINE";
        const escrowStatus = verdict === "client" ? "REFUNDED" : "RELEASED";
        const orderUpdateData: Record<string, unknown> = {
          status: orderStatus as "ANNULE" | "TERMINE",
          escrowStatus,
          completedAt: orderStatus === "TERMINE" ? new Date() : null,
        };
        // Adjust freelancerPayout so wallet fallback aggregation shows correct amounts
        if (verdict === "client") {
          orderUpdateData.freelancerPayout = 0; // Full refund — freelance gets nothing
        } else if (verdict === "partiel") {
          const refundAmt = Math.round(orderAmount * (pct / 100) * 100) / 100;
          const freelanceAmt = Math.round((orderAmount - refundAmt - orderCommission * ((100 - pct) / 100)) * 100) / 100;
          orderUpdateData.freelancerPayout = Math.max(0, freelanceAmt);
        }
        // verdict === "freelance" → keep original freelancerPayout (full payout)
        await tx.order.update({
          where: { id: dispute.orderId },
          data: orderUpdateData,
        });

        // 3. Release/refund escrow record
        await tx.escrow.updateMany({
          where: { orderId: dispute.orderId, status: "HELD" },
          data: { status: escrowStatus, releasedAt: new Date() },
        });

        // 4. Handle financial flows based on verdict
        const adminWallet = await tx.adminWallet.findFirst();

        if (verdict === "freelance") {
          // Full release to freelance
          const netAmount = orderAmount - orderCommission;

          // Admin wallet: held → released
          if (adminWallet) {
            await tx.adminWallet.update({
              where: { id: adminWallet.id },
              data: { totalFeesHeld: { decrement: orderCommission }, totalFeesReleased: { increment: orderCommission } },
            });
            await tx.adminTransaction.updateMany({
              where: { orderId: dispute.orderId, status: "PENDING" },
              data: { status: "CONFIRMED" },
            });
          }

          // Credit freelance/agency wallet
          if (order?.agencyId) {
            const w = await tx.walletAgency.upsert({
              where: { agencyId: order.agencyId },
              create: { agencyId: order.agencyId, balance: netAmount, totalEarned: netAmount },
              update: { balance: { increment: netAmount }, totalEarned: { increment: netAmount } },
            });
            await tx.walletTransaction.create({
              data: { agencyWalletId: w.id, type: "ORDER_PAYOUT", amount: netAmount, description: `Paiement apres litige - commande #${dispute.orderId.slice(0, 8)}`, status: "WALLET_COMPLETED", orderId: dispute.orderId },
            });
          } else {
            const w = await tx.walletFreelance.upsert({
              where: { userId: dispute.freelanceId },
              create: { userId: dispute.freelanceId, balance: netAmount, totalEarned: netAmount },
              update: { balance: { increment: netAmount }, totalEarned: { increment: netAmount } },
            });
            await tx.walletTransaction.create({
              data: { freelanceWalletId: w.id, type: "ORDER_PAYOUT", amount: netAmount, description: `Paiement apres litige - commande #${dispute.orderId.slice(0, 8)}`, status: "WALLET_COMPLETED", orderId: dispute.orderId },
            });
          }

          // Update payments
          await tx.payment.updateMany({ where: { orderId: dispute.orderId }, data: { status: "COMPLETE" } });

        } else if (verdict === "client") {
          // Full refund to client — reverse admin fees
          if (adminWallet) {
            await tx.adminWallet.update({
              where: { id: adminWallet.id },
              data: { totalFeesHeld: { decrement: orderCommission } },
            });
            await tx.adminTransaction.updateMany({
              where: { orderId: dispute.orderId, status: "PENDING" },
              data: { status: "PAID_OUT" },
            });
          }
          await tx.payment.updateMany({ where: { orderId: dispute.orderId }, data: { status: "REMBOURSE" } });

        } else if (verdict === "partiel") {
          // Partial: pct% refund to client, rest to freelance
          const refundAmount = Math.round(orderAmount * (pct / 100) * 100) / 100;
          const freelanceAmount = Math.round((orderAmount - refundAmount - orderCommission * ((100 - pct) / 100)) * 100) / 100;
          const adminFee = Math.round(orderCommission * ((100 - pct) / 100) * 100) / 100;

          if (adminWallet) {
            await tx.adminWallet.update({
              where: { id: adminWallet.id },
              data: { totalFeesHeld: { decrement: orderCommission }, totalFeesReleased: { increment: adminFee } },
            });
            await tx.adminTransaction.updateMany({
              where: { orderId: dispute.orderId, status: "PENDING" },
              data: { status: "CONFIRMED" },
            });
          }

          // Credit freelance wallet with partial amount
          if (order?.agencyId) {
            const w = await tx.walletAgency.upsert({
              where: { agencyId: order.agencyId },
              create: { agencyId: order.agencyId, balance: freelanceAmount, totalEarned: freelanceAmount },
              update: { balance: { increment: freelanceAmount }, totalEarned: { increment: freelanceAmount } },
            });
            await tx.walletTransaction.create({
              data: { agencyWalletId: w.id, type: "ORDER_PAYOUT", amount: freelanceAmount, description: `Paiement partiel apres litige - commande #${dispute.orderId.slice(0, 8)}`, status: "WALLET_COMPLETED", orderId: dispute.orderId },
            });
          } else {
            const w = await tx.walletFreelance.upsert({
              where: { userId: dispute.freelanceId },
              create: { userId: dispute.freelanceId, balance: freelanceAmount, totalEarned: freelanceAmount },
              update: { balance: { increment: freelanceAmount }, totalEarned: { increment: freelanceAmount } },
            });
            await tx.walletTransaction.create({
              data: { freelanceWalletId: w.id, type: "ORDER_PAYOUT", amount: freelanceAmount, description: `Paiement partiel apres litige - commande #${dispute.orderId.slice(0, 8)}`, status: "WALLET_COMPLETED", orderId: dispute.orderId },
            });
          }
          await tx.payment.updateMany({ where: { orderId: dispute.orderId }, data: { status: "COMPLETE" } });
        }

        // 5. Notifications
        const notifData = [];
        if (verdict === "freelance") {
          const netAmount = orderAmount - orderCommission;
          notifData.push({ userId: dispute.freelanceId, title: "Litige resolu en votre faveur", message: `${netAmount.toFixed(2)} EUR liberes.`, type: "PAYMENT" as const, link: "/dashboard/finances" });
          notifData.push({ userId: dispute.clientId, title: "Litige resolu", message: `Verdict en faveur du freelance.`, type: "ORDER" as const, link: `/client/commandes/${dispute.orderId}` });
        } else if (verdict === "client") {
          notifData.push({ userId: dispute.clientId, title: "Litige resolu en votre faveur", message: `Remboursement de ${orderAmount.toFixed(2)} EUR.`, type: "PAYMENT" as const, link: `/client/commandes/${dispute.orderId}` });
          notifData.push({ userId: dispute.freelanceId, title: "Litige resolu", message: `Verdict en faveur du client.`, type: "ORDER" as const, link: `/dashboard/commandes/${dispute.orderId}` });
        } else {
          const refundAmount = Math.round(orderAmount * (pct / 100) * 100) / 100;
          notifData.push({ userId: dispute.clientId, title: "Remboursement partiel", message: `${refundAmount.toFixed(2)} EUR rembourses.`, type: "PAYMENT" as const, link: `/client/commandes/${dispute.orderId}` });
          notifData.push({ userId: dispute.freelanceId, title: "Paiement partiel", message: `Le litige a ete resolu avec un paiement partiel.`, type: "PAYMENT" as const, link: "/dashboard/finances" });
        }
        await tx.notification.createMany({ data: notifData });
      });

      await createAuditLog({
        actorId: session.user.id,
        action: "dispute.resolved",
        targetType: "dispute",
        targetId: dispute.id,
        details: { orderId: dispute.orderId, verdict, resolution, partialPercent: pct },
      });

      return NextResponse.json({ success: true, message: `Litige resolu: verdict ${verdict}`, verdict });
    }

    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("[API /admin/disputes POST]", error);
    return NextResponse.json({ error: "Erreur lors de l'action sur le litige" }, { status: 500 });
  }
}
