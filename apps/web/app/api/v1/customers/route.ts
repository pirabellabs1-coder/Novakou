import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";

/**
 * GET /api/v1/customers
 * Requires: scope `read:customers`
 * Returns: unique list of customers who purchased from this vendor.
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:customers" });
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  // Collect unique userIds from enrollments + product purchases
  const [enrollmentUsers, purchaseUsers] = await Promise.all([
    prisma.enrollment.findMany({
      where: { formation: { instructeurId: ctx.instructeurId } },
      select: { userId: true, paidAmount: true, createdAt: true },
    }),
    prisma.digitalProductPurchase.findMany({
      where: { product: { instructeurId: ctx.instructeurId } },
      select: { userId: true, paidAmount: true, createdAt: true },
    }),
  ]);

  const byUser = new Map<string, { totalSpent: number; ordersCount: number; firstPurchaseAt: Date }>();
  for (const e of [...enrollmentUsers, ...purchaseUsers]) {
    const cur = byUser.get(e.userId) ?? { totalSpent: 0, ordersCount: 0, firstPurchaseAt: e.createdAt };
    cur.totalSpent += e.paidAmount;
    cur.ordersCount += 1;
    if (e.createdAt < cur.firstPurchaseAt) cur.firstPurchaseAt = e.createdAt;
    byUser.set(e.userId, cur);
  }

  const userIds = Array.from(byUser.keys());
  const total = userIds.length;
  const pagedIds = userIds.slice(skip, skip + limit);

  const users = await prisma.user.findMany({
    where: { id: { in: pagedIds } },
    select: { id: true, email: true, name: true, image: true, country: true, createdAt: true },
  });

  const customers = users.map((u) => ({
    ...u,
    ...byUser.get(u.id)!,
    currency: "XOF",
  }));

  return NextResponse.json({
    data: customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
