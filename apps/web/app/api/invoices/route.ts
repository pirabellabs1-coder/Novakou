import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { invoiceStore } from "@/lib/dev/data-store";

// GET /api/invoices — Fetch user's invoices (both as buyer and seller)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const invoices = invoiceStore.getByUser(session.user.id);

      // Separate by role in the transaction
      const asBuyer = invoices.filter((inv) => inv.buyerId === session.user.id);
      const asSeller = invoices.filter((inv) => inv.sellerId === session.user.id);

      // Compute summary
      const totalPaid = asBuyer.reduce((sum, inv) => sum + inv.totalPaid, 0);
      const totalEarned = asSeller.reduce((sum, inv) => sum + inv.netAmount, 0);
      const totalCommissions = asSeller.reduce((sum, inv) => sum + inv.commission, 0);

      return NextResponse.json({
        invoices,
        asBuyer,
        asSeller,
        summary: {
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalEarned: Math.round(totalEarned * 100) / 100,
          totalCommissions: Math.round(totalCommissions * 100) / 100,
          count: invoices.length,
        },
      });
    }

    // Production: Prisma — use Order table (no Invoice model in schema)
    const { prisma } = await import("@/lib/prisma");

    try {
      const userId = session.user.id;

      const [buyerOrders, sellerOrders] = await Promise.all([
        prisma.order.findMany({
          where: { clientId: userId },
          orderBy: { createdAt: "desc" },
          include: { service: { select: { title: true } } },
        }),
        prisma.order.findMany({
          where: { freelanceId: userId },
          orderBy: { createdAt: "desc" },
          include: { service: { select: { title: true } } },
        }),
      ]);

      // Shape orders as invoice-like objects to match dev-store response
      const toInvoice = (order: (typeof buyerOrders)[number], role: "buyer" | "seller") => ({
        id: order.id,
        invoiceNumber: `FH-${order.id.slice(-8).toUpperCase()}`,
        orderId: order.id,
        buyerId: order.clientId,
        sellerId: order.freelanceId,
        buyerName: null,
        buyerEmail: null,
        amount: order.amount,
        commission: order.commission,
        netAmount: order.freelancerPayout,
        totalPaid: order.amount,
        currency: order.currency,
        description: order.service?.title ?? order.title ?? "Commande Novakou",
        status: order.status === "TERMINE" ? "payee" : "en_attente",
        createdAt: order.createdAt.toISOString(),
        role,
      });

      const asBuyer = buyerOrders.map((o) => toInvoice(o, "buyer"));
      const asSeller = sellerOrders.map((o) => toInvoice(o, "seller"));

      // Merge and deduplicate (an order where user is both client and freelance is very unlikely but guard anyway)
      const seen = new Set<string>();
      const invoices: ReturnType<typeof toInvoice>[] = [];
      for (const inv of [...asBuyer, ...asSeller]) {
        if (!seen.has(inv.id)) {
          seen.add(inv.id);
          invoices.push(inv);
        }
      }

      const totalPaid = asBuyer.reduce((sum, inv) => sum + inv.totalPaid, 0);
      const totalEarned = asSeller.reduce((sum, inv) => sum + inv.netAmount, 0);
      const totalCommissions = asSeller.reduce((sum, inv) => sum + inv.commission, 0);

      return NextResponse.json({
        invoices,
        asBuyer,
        asSeller,
        summary: {
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalEarned: Math.round(totalEarned * 100) / 100,
          totalCommissions: Math.round(totalCommissions * 100) / 100,
          count: invoices.length,
        },
      });
    } catch (dbError) {
      console.error("[API /invoices GET] Prisma error", dbError);
      return NextResponse.json({
        invoices: [],
        asBuyer: [],
        asSeller: [],
        summary: { totalPaid: 0, totalEarned: 0, totalCommissions: 0, count: 0 },
      });
    }
  } catch (error) {
    console.error("[API /invoices GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
