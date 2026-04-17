import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";

/**
 * GET /api/v1/orders
 * Requires: scope `read:orders`
 * Query: ?page=1&limit=20&status=paid
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:orders" });
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  // Orders = formation enrollments + digital product purchases attached to this vendor
  const [enrollments, purchases] = await Promise.all([
    prisma.enrollment.findMany({
      where: { formation: { instructeurId: ctx.instructeurId } },
      include: {
        formation: { select: { title: true, slug: true, price: true } },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.digitalProductPurchase.findMany({
      where: { product: { instructeurId: ctx.instructeurId } },
      include: {
        product: { select: { title: true, slug: true, price: true } },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
  ]);

  const orders = [
    ...enrollments.map((e) => ({
      id: e.id,
      type: "formation" as const,
      amount: e.paidAmount,
      currency: "XOF",
      status: "paid",
      customer: e.user,
      item: e.formation,
      createdAt: e.createdAt,
    })),
    ...purchases.map((p) => ({
      id: p.id,
      type: "product" as const,
      amount: p.paidAmount,
      currency: "XOF",
      status: "paid",
      customer: p.user,
      item: p.product,
      createdAt: p.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);

  return NextResponse.json({
    data: orders,
    pagination: { page, limit, count: orders.length },
  });
}
