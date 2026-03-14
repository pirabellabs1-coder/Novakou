import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore, transactionStore, notificationStore } from "@/lib/dev/data-store";

// GET /api/admin/disputes — All orders with status "litige"
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const orders = orderStore.getAll();
    const disputes = orders
      .filter((o) => o.status === "litige")
      .map((o) => ({
        id: o.id,
        orderId: o.id,
        serviceTitle: o.serviceTitle,
        category: o.category,
        clientId: o.clientId,
        clientName: o.clientName,
        clientCountry: o.clientCountry,
        freelanceId: o.freelanceId,
        amount: o.amount,
        commission: o.commission,
        packageType: o.packageType,
        deadline: o.deadline,
        deliveredAt: o.deliveredAt,
        progress: o.progress,
        messages: o.messages,
        timeline: o.timeline,
        files: o.files,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        // Duration since dispute opened (from the last timeline entry with litige-related info)
        disputeOpenedAt:
          o.timeline.find(
            (t) =>
              t.title.toLowerCase().includes("litige") ||
              t.description.toLowerCase().includes("litige")
          )?.timestamp ?? o.updatedAt,
      }))
      .sort(
        (a, b) =>
          new Date(a.disputeOpenedAt).getTime() -
          new Date(b.disputeOpenedAt).getTime()
      ); // Oldest first (most urgent)

    // Summary stats
    const allOrders = orders;
    const totalDisputes = disputes.length;
    const totalResolved = allOrders.filter(
      (o) =>
        o.status !== "litige" &&
        o.timeline.some(
          (t) =>
            t.title.toLowerCase().includes("litige") ||
            t.description.toLowerCase().includes("verdict")
        )
    ).length;
    const totalAmount = disputes.reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      disputes,
      summary: {
        total: totalDisputes,
        resolved: totalResolved,
        totalAmountInDispute: Math.round(totalAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error("[API /admin/disputes GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des litiges" },
      { status: 500 }
    );
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
    const { action, orderId, verdict, resolution } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId est requis" },
        { status: 400 }
      );
    }

    const order = orderStore.getById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    switch (action) {
      case "examine": {
        // Mark dispute as being examined — add timeline entry
        orderStore.update(orderId, {
          timeline: [
            ...order.timeline,
            {
              id: `t${Date.now()}`,
              type: "message",
              title: "Litige en cours d'examen",
              description:
                resolution ??
                "L'administration examine ce litige. Les deux parties seront contactees.",
              timestamp: now,
            },
          ],
        });

        notificationStore.add({
          userId: order.clientId,
          title: "Litige en cours d'examen",
          message: `Votre litige concernant "${order.serviceTitle}" est en cours d'examen par l'administration.`,
          type: "order",
          read: false,
          link: `/client/commandes/${orderId}`,
        });

        notificationStore.add({
          userId: order.freelanceId,
          title: "Litige en cours d'examen",
          message: `Le litige concernant "${order.serviceTitle}" est en cours d'examen par l'administration.`,
          type: "order",
          read: false,
          link: `/dashboard/commandes/${orderId}`,
        });

        return NextResponse.json({
          success: true,
          message: `Litige ${orderId} marque comme en cours d'examen`,
        });
      }

      case "resolve": {
        if (!verdict) {
          return NextResponse.json(
            { error: "verdict est requis (freelance | client | partiel)" },
            { status: 400 }
          );
        }

        const validVerdicts = ["freelance", "client", "partiel"];
        if (!validVerdicts.includes(verdict)) {
          return NextResponse.json(
            { error: `Verdict invalide: ${verdict}. Valeurs acceptees: ${validVerdicts.join(", ")}` },
            { status: 400 }
          );
        }

        let newStatus: "termine" | "annule" = "termine";
        let verdictDescription = "";

        if (verdict === "freelance") {
          // In favor of freelance — release funds
          newStatus = "termine";
          verdictDescription = `Verdict en faveur du freelance. ${resolution ?? "Les fonds seront liberes."}`;

          // Release escrow to freelance
          transactionStore.add({
            userId: order.freelanceId,
            type: "vente",
            description: `Paiement apres litige - ${order.serviceTitle}`,
            amount: order.amount - order.commission,
            status: "complete",
            date: now.slice(0, 10),
            orderId,
          });

          transactionStore.add({
            userId: order.freelanceId,
            type: "commission",
            description: `Commission plateforme - Commande ${orderId}`,
            amount: -order.commission,
            status: "complete",
            date: now.slice(0, 10),
            orderId,
          });

          notificationStore.add({
            userId: order.freelanceId,
            title: "Litige resolu en votre faveur",
            message: `Le litige concernant "${order.serviceTitle}" a ete resolu en votre faveur. Les fonds (${order.amount - order.commission} EUR) ont ete liberes.`,
            type: "payment",
            read: false,
            link: "/dashboard/finances",
          });

          notificationStore.add({
            userId: order.clientId,
            title: "Litige resolu",
            message: `Le litige concernant "${order.serviceTitle}" a ete resolu en faveur du freelance. ${resolution ?? ""}`,
            type: "order",
            read: false,
            link: `/client/commandes/${orderId}`,
          });
        } else if (verdict === "client") {
          // In favor of client — refund
          newStatus = "annule";
          verdictDescription = `Verdict en faveur du client. ${resolution ?? "Remboursement effectue."}`;

          transactionStore.add({
            userId: order.clientId,
            type: "remboursement",
            description: `Remboursement apres litige - ${order.serviceTitle}`,
            amount: order.amount,
            status: "complete",
            date: now.slice(0, 10),
            orderId,
          });

          notificationStore.add({
            userId: order.clientId,
            title: "Litige resolu en votre faveur",
            message: `Le litige concernant "${order.serviceTitle}" a ete resolu en votre faveur. Remboursement de ${order.amount} EUR effectue.`,
            type: "payment",
            read: false,
            link: `/client/commandes/${orderId}`,
          });

          notificationStore.add({
            userId: order.freelanceId,
            title: "Litige resolu",
            message: `Le litige concernant "${order.serviceTitle}" a ete resolu en faveur du client. ${resolution ?? ""}`,
            type: "order",
            read: false,
            link: `/dashboard/commandes/${orderId}`,
          });
        } else if (verdict === "partiel") {
          // Partial refund — split 50/50 by default
          newStatus = "termine";
          const refundAmount = Math.round(order.amount * 0.5 * 100) / 100;
          const freelanceAmount = Math.round((order.amount - refundAmount - order.commission * 0.5) * 100) / 100;
          verdictDescription = `Remboursement partiel. ${resolution ?? `${refundAmount} EUR rembourses au client, ${freelanceAmount} EUR liberes au freelance.`}`;

          // Partial refund to client
          transactionStore.add({
            userId: order.clientId,
            type: "remboursement",
            description: `Remboursement partiel apres litige - ${order.serviceTitle}`,
            amount: refundAmount,
            status: "complete",
            date: now.slice(0, 10),
            orderId,
          });

          // Partial payment to freelance
          transactionStore.add({
            userId: order.freelanceId,
            type: "vente",
            description: `Paiement partiel apres litige - ${order.serviceTitle}`,
            amount: freelanceAmount,
            status: "complete",
            date: now.slice(0, 10),
            orderId,
          });

          notificationStore.add({
            userId: order.clientId,
            title: "Litige resolu - Remboursement partiel",
            message: `Le litige concernant "${order.serviceTitle}" a ete resolu avec un remboursement partiel de ${refundAmount} EUR.`,
            type: "payment",
            read: false,
            link: `/client/commandes/${orderId}`,
          });

          notificationStore.add({
            userId: order.freelanceId,
            title: "Litige resolu - Paiement partiel",
            message: `Le litige concernant "${order.serviceTitle}" a ete resolu. Vous recevez ${freelanceAmount} EUR.`,
            type: "payment",
            read: false,
            link: "/dashboard/finances",
          });
        }

        // Update order status and timeline
        orderStore.update(orderId, {
          status: newStatus,
          completedAt: newStatus === "termine" ? now : null,
          timeline: [
            ...order.timeline,
            {
              id: `t${Date.now()}`,
              type: "completed",
              title: "Litige resolu",
              description: verdictDescription,
              timestamp: now,
            },
          ],
        });

        return NextResponse.json({
          success: true,
          message: `Litige ${orderId} resolu: verdict ${verdict}`,
          verdict,
          resolution: verdictDescription,
        });
      }

      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API /admin/disputes POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action sur le litige" },
      { status: 500 }
    );
  }
}
