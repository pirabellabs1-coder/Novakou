import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";

/**
 * GET /api/v1/analytics
 * Requires: scope `read:analytics`
 * Returns: sales overview for the authenticated vendor.
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:analytics" });
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "30d") as "7d" | "30d" | "90d" | "all";
  const since: Date | undefined =
    period === "all"
      ? undefined
      : new Date(Date.now() - ({ "7d": 7, "30d": 30, "90d": 90 }[period] ?? 30) * 24 * 60 * 60 * 1000);

  const whereEnroll = {
    formation: { instructeurId: ctx.instructeurId },
    ...(since ? { createdAt: { gte: since } } : {}),
  };
  const whereBuy = {
    product: { instructeurId: ctx.instructeurId },
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  const [enrollAgg, buyAgg, uniqueEnrollCustomers, uniqueBuyCustomers] = await Promise.all([
    prisma.enrollment.aggregate({
      where: whereEnroll,
      _sum: { paidAmount: true },
      _count: true,
    }),
    prisma.digitalProductPurchase.aggregate({
      where: whereBuy,
      _sum: { paidAmount: true },
      _count: true,
    }),
    prisma.enrollment.findMany({
      where: whereEnroll,
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.digitalProductPurchase.findMany({
      where: whereBuy,
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const customerSet = new Set<string>();
  uniqueEnrollCustomers.forEach((e) => customerSet.add(e.userId));
  uniqueBuyCustomers.forEach((e) => customerSet.add(e.userId));

  const totalRevenue = (enrollAgg._sum.paidAmount ?? 0) + (buyAgg._sum.paidAmount ?? 0);
  const totalOrders = enrollAgg._count + buyAgg._count;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return NextResponse.json({
    data: {
      period,
      since: since?.toISOString() ?? null,
      revenue: {
        total: totalRevenue,
        fromFormations: enrollAgg._sum.paidAmount ?? 0,
        fromProducts: buyAgg._sum.paidAmount ?? 0,
        currency: "XOF",
      },
      orders: {
        total: totalOrders,
        formations: enrollAgg._count,
        products: buyAgg._count,
      },
      customers: {
        unique: customerSet.size,
      },
      avgOrderValue,
    },
  });
}
