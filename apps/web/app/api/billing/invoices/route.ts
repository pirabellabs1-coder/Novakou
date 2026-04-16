import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || (IS_DEV ? "dev-user" : null);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Dev mode: no invoice table in dev stores — return empty list
      return NextResponse.json({ invoices: [] });
    }

    // Prisma: build invoices from Orders + Boosts + Subscription Payments
    try {
      const { prisma } = await import("@/lib/prisma");

      // 1. Completed orders
      const orders = await prisma.order.findMany({
        where: {
          OR: [{ clientId: userId }, { freelanceId: userId }],
          status: { in: ["TERMINE", "LIVRE"] },
        },
        include: {
          service: { select: { title: true } },
          client: { select: { name: true } },
          freelance: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // 2. Paid boosts (for freelances/agencies)
      const boosts = await prisma.boost.findMany({
        where: { userId, paidAt: { not: null } },
        include: { service: { select: { title: true } } },
        orderBy: { paidAt: "desc" },
        take: 50,
      });

      // 3. Subscription payments
      const subscriptions = await prisma.payment.findMany({
        where: { payerId: userId, type: "abonnement", status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const invoices = [
        ...orders.map((o) => ({
          id: `INV-${o.id.slice(0, 8).toUpperCase()}`,
          orderId: o.id,
          type: "commande" as const,
          label: o.service?.title || o.title || "Commande",
          amount: o.amount,
          commission: o.platformFee || 0,
          currency: o.currency || "EUR",
          status: "paye",
          issuedAt: o.completedAt?.toISOString() || o.updatedAt.toISOString(),
          clientName: o.client?.name || "",
          freelanceName: o.freelance?.name || "",
        })),
        ...boosts.map((b) => ({
          id: `BST-${b.id.slice(0, 8).toUpperCase()}`,
          orderId: null,
          type: "boost" as const,
          label: `Boost ${b.type} - ${b.service?.title || "Service"}`,
          amount: b.totalCost,
          commission: b.totalCost,
          currency: "EUR",
          status: "paye",
          issuedAt: b.paidAt?.toISOString() || b.createdAt.toISOString(),
          clientName: "",
          freelanceName: "",
        })),
        ...subscriptions.map((p) => ({
          id: `ABO-${p.id.slice(0, 8).toUpperCase()}`,
          orderId: null,
          type: "abonnement" as const,
          label: p.description || "Abonnement FreelanceHigh",
          amount: p.amount,
          commission: 0,
          currency: p.currency || "EUR",
          status: "paye",
          issuedAt: p.createdAt.toISOString(),
          clientName: "",
          freelanceName: "",
        })),
      ].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

      return NextResponse.json({ invoices });
    } catch (prismaError) {
      console.warn("[API /billing/invoices GET] Prisma query failed:", prismaError);
      return NextResponse.json({ invoices: [] });
    }
  } catch (error) {
    console.error("[API /billing/invoices GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des factures" },
      { status: 500 }
    );
  }
}
