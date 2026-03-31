import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { orderStore, boostStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";

function getPeriodDates(period: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = endDate ? new Date(endDate) : now;
  let start: Date;

  switch (period) {
    case "1m": start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    case "3m": start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
    case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
    case "1y": start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
    case "5y": start = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()); break;
    case "custom": start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    default: start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  return { start, end };
}

interface AccountingOperation {
  id: string;
  date: string;
  type: "achat" | "abonnement" | "boost" | "remboursement" | "commission";
  reference: string;
  payer: string;
  amount: number;
  commission: number;
  status: string;
}

// GET /api/admin/comptabilite
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    const check = requireAdminPermission(session, "comptabilite.view");
    if (!check.allowed) return check.errorResponse;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1m";
    const customStart = searchParams.get("startDate") || undefined;
    const customEnd = searchParams.get("endDate") || undefined;
    const { start, end } = getPeriodDates(period, customStart, customEnd);

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      return NextResponse.json(buildDevResponse(start, end, period));
    }

    return NextResponse.json(await buildPrismaResponse(start, end, period));
  } catch (error) {
    console.error("[API /admin/comptabilite]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function buildDevResponse(start: Date, end: Date, period: string) {
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const orders = orderStore.getAll().filter((o) => {
    const d = ((o as unknown as Record<string, unknown>).createdAt as string) || "";
    return d >= startISO && d <= endISO;
  });

  const boosts = boostStore.getAll().filter((b) => {
    const d = ((b as unknown as Record<string, unknown>).startedAt as string) || "";
    return d >= startISO && d <= endISO;
  });

  const operations: AccountingOperation[] = [];
  let revenueServices = 0;
  let revenueBoosts = 0;
  let revenueAbonnements = 0;
  let totalRefunds = 0;
  let totalCommissions = 0;

  // Orders → achats
  for (const o of orders) {
    const order = o as unknown as Record<string, unknown>;
    const amount = Number(order.amount) || 0;
    const commission = Number(order.platformFee) || Math.round(amount * 0.12 * 100) / 100;
    const status = ((order.status as string) || "").toLowerCase();

    if (status === "remboursee" || status === "refunded") {
      totalRefunds += amount;
      operations.push({
        id: order.id as string,
        date: (order.createdAt as string) || "",
        type: "remboursement",
        reference: `FH-${(order.id as string).slice(-8).toUpperCase()}`,
        payer: (order.clientName as string) || "Client",
        amount,
        commission: 0,
        status: "rembourse",
      });
    } else {
      revenueServices += amount;
      totalCommissions += commission;
      operations.push({
        id: order.id as string,
        date: (order.createdAt as string) || "",
        type: "achat",
        reference: `FH-${(order.id as string).slice(-8).toUpperCase()}`,
        payer: (order.clientName as string) || "Client",
        amount,
        commission,
        status: status === "termine" || status === "livre" ? "paye" : "en_attente",
      });
    }
  }

  // Boosts
  for (const b of boosts) {
    const boost = b as unknown as Record<string, unknown>;
    const price = Number(boost.price) || 0;
    revenueBoosts += price;
    operations.push({
      id: boost.id as string,
      date: (boost.startedAt as string) || "",
      type: "boost",
      reference: `BST-${(boost.id as string).slice(-6).toUpperCase()}`,
      payer: (boost.userId as string) || "Freelance",
      amount: price,
      commission: price, // 100% revenue for platform
      status: "paye",
    });
  }

  const netResult = totalCommissions + revenueBoosts + revenueAbonnements - totalRefunds;

  return {
    kpis: {
      revenueServices,
      totalCommissions,
      revenueBoosts,
      revenueAbonnements,
      totalRefunds,
      netResult,
      operationsCount: operations.length,
    },
    operations: operations.sort((a, b) => b.date.localeCompare(a.date)),
    period,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

async function buildPrismaResponse(start: Date, end: Date, period: string) {
  const dateFilter = { gte: start, lte: end };

  const [ordersAgg, commissionsAgg, refundsAgg, boostsAgg, abonnementsAgg, orders, boosts, abonnements] = await Promise.all([
    // Total order revenue (all non-cancelled)
    prisma.order.aggregate({
      where: { createdAt: dateFilter, status: { notIn: ["ANNULE"] } },
      _sum: { amount: true },
      _count: true,
    }),
    // Commissions from completed orders (TERMINE + LIVRE)
    prisma.order.aggregate({
      where: { createdAt: dateFilter, status: { in: ["TERMINE", "LIVRE"] } },
      _sum: { platformFee: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: dateFilter, escrowStatus: "REFUNDED" },
      _sum: { amount: true },
    }),
    // Boost revenue (paid boosts only)
    prisma.boost.aggregate({
      where: { paidAt: dateFilter },
      _sum: { totalCost: true },
      _count: true,
    }),
    // Subscription revenue
    prisma.payment.aggregate({
      where: { type: "abonnement", status: "COMPLETE", createdAt: dateFilter },
      _sum: { amount: true },
    }),
    // Individual orders for operations table
    prisma.order.findMany({
      where: { createdAt: dateFilter },
      select: {
        id: true, createdAt: true, amount: true, platformFee: true, status: true, escrowStatus: true,
        client: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    // Individual boosts for operations table
    prisma.boost.findMany({
      where: { paidAt: dateFilter },
      select: {
        id: true, paidAt: true, startedAt: true, totalCost: true, type: true,
        user: { select: { name: true } },
      },
      orderBy: { paidAt: "desc" },
      take: 200,
    }),
    // Individual subscription payments for operations table
    prisma.payment.findMany({
      where: { type: "abonnement", status: "COMPLETE", createdAt: dateFilter },
      select: {
        id: true, createdAt: true, amount: true, description: true,
        payer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const revenueServices = Math.round((ordersAgg._sum.amount ?? 0) * 100) / 100;
  const totalCommissions = Math.round((commissionsAgg._sum.platformFee ?? 0) * 100) / 100;
  const revenueBoosts = Math.round((boostsAgg._sum.totalCost ?? 0) * 100) / 100;
  const revenueAbonnements = Math.round((abonnementsAgg._sum.amount ?? 0) * 100) / 100;
  const totalRefunds = Math.round((refundsAgg._sum.amount ?? 0) * 100) / 100;

  const operations: AccountingOperation[] = [
    ...orders.map((o) => ({
      id: o.id,
      date: o.createdAt.toISOString(),
      type: o.escrowStatus === "REFUNDED" ? "remboursement" as const : "achat" as const,
      reference: `FH-${o.id.slice(-8).toUpperCase()}`,
      payer: o.client?.name || "Client",
      amount: o.amount || 0,
      commission: o.platformFee || 0,
      status: o.status === "TERMINE" || o.status === "LIVRE" ? "paye" : o.escrowStatus === "REFUNDED" ? "rembourse" : "en_attente",
    })),
    ...boosts.map((b) => ({
      id: b.id,
      date: b.paidAt ? b.paidAt.toISOString() : b.startedAt ? b.startedAt.toISOString() : new Date().toISOString(),
      type: "boost" as const,
      reference: `BST-${b.id.slice(-6).toUpperCase()}`,
      payer: b.user?.name || "Freelance",
      amount: b.totalCost || 0,
      commission: b.totalCost || 0,
      status: "paye",
    })),
    ...abonnements.map((p) => ({
      id: p.id,
      date: p.createdAt.toISOString(),
      type: "abonnement" as const,
      reference: `ABO-${p.id.slice(-6).toUpperCase()}`,
      payer: p.payer?.name || "Utilisateur",
      amount: p.amount || 0,
      commission: p.amount || 0,
      status: "paye",
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    kpis: {
      revenueServices,
      totalCommissions,
      revenueBoosts,
      revenueAbonnements,
      totalRefunds,
      netResult: totalCommissions + revenueBoosts + revenueAbonnements - totalRefunds,
      operationsCount: operations.length,
    },
    operations,
    period,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}
