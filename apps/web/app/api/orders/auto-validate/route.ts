import { NextResponse } from "next/server";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { orderStore, transactionStore, invoiceStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST() {
  try {
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const validated = orderStore.autoValidateStale();
      // Release escrow: create transactions for each validated order
      for (const orderId of validated) {
        const order = orderStore.getById(orderId);
        if (order) {
          const netAmount = order.amount - order.commission;
          const now = new Date().toISOString().slice(0, 10);
          transactionStore.add({
            userId: order.freelanceId,
            type: "vente",
            description: `Commande ${order.id} - ${order.serviceTitle} (auto-validee)`,
            amount: netAmount,
            status: "complete",
            date: now,
            orderId: order.id,
          });
          transactionStore.add({
            userId: order.freelanceId,
            type: "commission",
            description: `Commission FreelanceHigh - ${order.id}`,
            amount: -order.commission,
            status: "complete",
            date: now,
          });
          invoiceStore.createFromOrder({
            id: order.id,
            serviceTitle: order.serviceTitle,
            amount: order.amount,
            commission: order.commission,
            clientId: order.clientId,
            clientName: order.clientName,
            freelanceId: order.freelanceId,
            freelanceName: "",
          });
        }
      }
      return NextResponse.json({ validated, count: validated.length });
    }

    // Prisma: find and validate stale delivered orders
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
    const staleOrders = await prisma.order.findMany({
      where: {
        status: "LIVRE",
        deliveredAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (staleOrders.length === 0) {
      return NextResponse.json({ validated: [], count: 0 });
    }

    const ids = staleOrders.map((o) => o.id);
    const now = new Date();

    await prisma.$transaction([
      prisma.order.updateMany({
        where: { id: { in: ids } },
        data: { status: "TERMINE", completedAt: now, progress: 100, updatedAt: now },
      }),
      // Release escrow for all validated orders
      prisma.payment.updateMany({
        where: { orderId: { in: ids }, type: "paiement", status: "EN_ATTENTE" },
        data: { status: "COMPLETE" },
      }),
    ]);

    return NextResponse.json({ validated: ids, count: ids.length });
  } catch (error) {
    console.error("[API /orders/auto-validate]", error);
    return NextResponse.json({ error: "Erreur auto-validate" }, { status: 500 });
  }
}
