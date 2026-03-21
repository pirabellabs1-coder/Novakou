import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { orderStore, transactionStore, notificationStore } from "@/lib/dev/data-store";
import { createAuditLog } from "@/lib/admin/audit";

// GET /api/admin/disputes — All disputes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV) {
      const orders = orderStore.getAll();
      const disputes = orders
        .filter((o) => o.status === "litige")
        .map((o) => ({
          id: o.id, orderId: o.id, serviceTitle: o.serviceTitle, category: o.category,
          clientId: o.clientId, clientName: o.clientName, clientCountry: o.clientCountry,
          freelanceId: o.freelanceId, amount: o.amount, commission: o.commission,
          packageType: o.packageType, deadline: o.deadline, deliveredAt: o.deliveredAt,
          progress: o.progress, messages: o.messages, timeline: o.timeline, files: o.files,
          createdAt: o.createdAt, updatedAt: o.updatedAt,
          disputeOpenedAt: o.timeline.find((t) => t.title.toLowerCase().includes("litige") || t.description.toLowerCase().includes("litige"))?.timestamp ?? o.updatedAt,
        }))
        .sort((a, b) => new Date(a.disputeOpenedAt).getTime() - new Date(b.disputeOpenedAt).getTime());

      const totalDisputes = disputes.length;
      const totalResolved = orders.filter((o) => o.status !== "litige" && o.timeline.some((t) => t.title.toLowerCase().includes("litige") || t.description.toLowerCase().includes("verdict"))).length;
      const totalAmount = disputes.reduce((sum, d) => sum + d.amount, 0);

      return NextResponse.json({
        disputes,
        summary: { total: totalDisputes, resolved: totalResolved, totalAmountInDispute: Math.round(totalAmount * 100) / 100 },
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
        status: d.status,
        verdict: d.verdict,
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
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { action, orderId, disputeId, verdict, resolution, partialPercent } = body;

    if (IS_DEV) {
      // Keep full dev implementation
      if (!orderId) return NextResponse.json({ error: "orderId est requis" }, { status: 400 });
      const order = orderStore.getById(orderId);
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      const now = new Date().toISOString();

      if (action === "examine") {
        orderStore.update(orderId, { timeline: [...order.timeline, { id: `t${Date.now()}`, type: "message", title: "Litige en cours d'examen", description: resolution ?? "L'administration examine ce litige.", timestamp: now }] });
        notificationStore.add({ userId: order.clientId, title: "Litige en cours d'examen", message: `Votre litige concernant "${order.serviceTitle}" est en cours d'examen.`, type: "order", read: false, link: `/client/commandes/${orderId}` });
        notificationStore.add({ userId: order.freelanceId, title: "Litige en cours d'examen", message: `Le litige concernant "${order.serviceTitle}" est en cours d'examen.`, type: "order", read: false, link: `/dashboard/commandes/${orderId}` });
        return NextResponse.json({ success: true, message: `Litige ${orderId} marque comme en cours d'examen` });
      }

      if (action === "resolve") {
        if (!verdict) return NextResponse.json({ error: "verdict requis" }, { status: 400 });
        let newStatus: "termine" | "annule" = "termine";
        let verdictDescription = "";

        if (verdict === "freelance") {
          newStatus = "termine";
          verdictDescription = `Verdict en faveur du freelance. ${resolution ?? "Les fonds seront liberes."}`;
          transactionStore.add({ userId: order.freelanceId, type: "vente", description: `Paiement apres litige - ${order.serviceTitle}`, amount: order.amount - order.commission, status: "complete", date: now.slice(0, 10), orderId });
          notificationStore.add({ userId: order.freelanceId, title: "Litige resolu en votre faveur", message: `Fonds de ${order.amount - order.commission} EUR liberes.`, type: "payment", read: false, link: "/dashboard/finances" });
          notificationStore.add({ userId: order.clientId, title: "Litige resolu", message: `Verdict en faveur du freelance.`, type: "order", read: false, link: `/client/commandes/${orderId}` });
        } else if (verdict === "client") {
          newStatus = "annule";
          verdictDescription = `Verdict en faveur du client. ${resolution ?? "Remboursement effectue."}`;
          transactionStore.add({ userId: order.clientId, type: "remboursement", description: `Remboursement - ${order.serviceTitle}`, amount: order.amount, status: "complete", date: now.slice(0, 10), orderId });
          notificationStore.add({ userId: order.clientId, title: "Litige resolu en votre faveur", message: `Remboursement de ${order.amount} EUR.`, type: "payment", read: false, link: `/client/commandes/${orderId}` });
          notificationStore.add({ userId: order.freelanceId, title: "Litige resolu", message: `Verdict en faveur du client.`, type: "order", read: false, link: `/dashboard/commandes/${orderId}` });
        } else if (verdict === "partiel") {
          newStatus = "termine";
          const refundAmount = Math.round(order.amount * 0.5 * 100) / 100;
          const freelanceAmount = Math.round((order.amount - refundAmount - order.commission * 0.5) * 100) / 100;
          verdictDescription = `Remboursement partiel. ${refundAmount} EUR rembourses, ${freelanceAmount} EUR liberes.`;
          transactionStore.add({ userId: order.clientId, type: "remboursement", description: `Remboursement partiel - ${order.serviceTitle}`, amount: refundAmount, status: "complete", date: now.slice(0, 10), orderId });
          transactionStore.add({ userId: order.freelanceId, type: "vente", description: `Paiement partiel - ${order.serviceTitle}`, amount: freelanceAmount, status: "complete", date: now.slice(0, 10), orderId });
          notificationStore.add({ userId: order.clientId, title: "Remboursement partiel", message: `${refundAmount} EUR rembourses.`, type: "payment", read: false, link: `/client/commandes/${orderId}` });
          notificationStore.add({ userId: order.freelanceId, title: "Paiement partiel", message: `${freelanceAmount} EUR liberes.`, type: "payment", read: false, link: "/dashboard/finances" });
        }

        orderStore.update(orderId, { status: newStatus, completedAt: newStatus === "termine" ? now : null, timeline: [...order.timeline, { id: `t${Date.now()}`, type: "completed", title: "Litige resolu", description: verdictDescription, timestamp: now }] });
        return NextResponse.json({ success: true, message: `Litige ${orderId} resolu: verdict ${verdict}`, verdict, resolution: verdictDescription });
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

      const verdictMap: Record<string, string> = { freelance: "FREELANCE", client: "CLIENT", partiel: "PARTIEL" };
      const prismaVerdict = verdictMap[verdict];
      if (!prismaVerdict) return NextResponse.json({ error: `Verdict invalide: ${verdict}` }, { status: 400 });

      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "RESOLU",
          verdict: prismaVerdict as "FREELANCE" | "CLIENT" | "PARTIEL",
          verdictNote: resolution,
          partialPercent: verdict === "partiel" ? (partialPercent ?? 50) : null,
          resolvedAt: new Date(),
        },
      });

      // Update order status
      const orderStatus = verdict === "client" ? "ANNULE" : "TERMINE";
      await prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: orderStatus as "ANNULE" | "TERMINE", completedAt: orderStatus === "TERMINE" ? new Date() : null },
      });

      // Notifications
      const notifData = [];
      if (verdict === "freelance") {
        notifData.push({ userId: dispute.freelanceId, title: "Litige resolu en votre faveur", message: `Les fonds ont ete liberes.`, type: "PAYMENT" as const });
        notifData.push({ userId: dispute.clientId, title: "Litige resolu", message: `Verdict en faveur du freelance.`, type: "ORDER" as const });
      } else if (verdict === "client") {
        notifData.push({ userId: dispute.clientId, title: "Litige resolu en votre faveur", message: `Remboursement effectue.`, type: "PAYMENT" as const });
        notifData.push({ userId: dispute.freelanceId, title: "Litige resolu", message: `Verdict en faveur du client.`, type: "ORDER" as const });
      } else {
        notifData.push({ userId: dispute.clientId, title: "Remboursement partiel", message: `Le litige a ete resolu avec un remboursement partiel.`, type: "PAYMENT" as const });
        notifData.push({ userId: dispute.freelanceId, title: "Paiement partiel", message: `Le litige a ete resolu avec un paiement partiel.`, type: "PAYMENT" as const });
      }
      await prisma.notification.createMany({ data: notifData });

      await createAuditLog({
        actorId: session.user.id,
        action: "dispute.resolved",
        targetType: "dispute",
        targetId: dispute.id,
        details: { orderId: dispute.orderId, verdict, resolution, partialPercent },
      });

      return NextResponse.json({ success: true, message: `Litige resolu: verdict ${verdict}`, verdict });
    }

    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("[API /admin/disputes POST]", error);
    return NextResponse.json({ error: "Erreur lors de l'action sur le litige" }, { status: 500 });
  }
}
