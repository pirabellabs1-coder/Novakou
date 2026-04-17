import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";

/**
 * GET /api/v1/products
 * Requires: scope `read:products`
 * Query: ?page=1&limit=20&status=PUBLISHED
 * Returns: paginated list of products for the authenticated vendor.
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:products" });
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    prisma.digitalProduct.findMany({
      where: { instructeurId: ctx.instructeurId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        price: true,
        currency: true,
        productType: true,
        createdAt: true,
      },
    }),
    prisma.digitalProduct.count({ where: { instructeurId: ctx.instructeurId } }),
  ]);

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
