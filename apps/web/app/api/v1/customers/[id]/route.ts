import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import { apiError, apiSuccess } from "@/lib/api/v1-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/customers/:id
 *
 * Détail d'un client : son profil + l'historique de ses achats auprès de ce
 * vendeur uniquement. Le vendeur ne voit jamais les achats du client chez
 * d'autres vendeurs.
 *
 * Scope requis : read:customers
 */
export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:customers" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
    if (!user) return apiError("NOT_FOUND", "Client introuvable", 404);

    const [enrollments, purchases] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          userId: id,
          formation: { instructeurId: ctx.instructeurId },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          formationId: true,
          paidAmount: true,
          progress: true,
          completedAt: true,
          refundedAt: true,
          createdAt: true,
          formation: {
            select: { id: true, slug: true, title: true },
          },
        },
      }),
      prisma.digitalProductPurchase.findMany({
        where: {
          userId: id,
          product: { instructeurId: ctx.instructeurId },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          productId: true,
          paidAmount: true,
          downloadCount: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              slug: true,
              title: true,
              productType: true,
            },
          },
        },
      }),
    ]);

    if (enrollments.length === 0 && purchases.length === 0) {
      // User exists but isn't a customer of this vendor — don't leak existence
      return apiError("NOT_FOUND", "Client introuvable", 404);
    }

    const orders = [
      ...enrollments.map((e) => ({
        id: e.id,
        kind: "formation" as const,
        productId: e.formationId,
        productSlug: e.formation.slug,
        productTitle: e.formation.title,
        amount: e.paidAmount,
        status: e.refundedAt ? ("REFUNDED" as const) : ("PAID" as const),
        progress: e.progress,
        completedAt: e.completedAt,
        createdAt: e.createdAt,
      })),
      ...purchases.map((p) => ({
        id: p.id,
        kind: "product" as const,
        productId: p.productId,
        productSlug: p.product.slug,
        productTitle: p.product.title,
        productType: p.product.productType,
        amount: p.paidAmount,
        status: "PAID" as const,
        downloadCount: p.downloadCount,
        createdAt: p.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalSpent = orders.reduce(
      (s, o) => (o.status === "REFUNDED" ? s : s + o.amount),
      0,
    );

    return apiSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.image,
      registeredAt: user.createdAt,
      totalSpent,
      ordersCount: orders.length,
      orders,
    });
  } catch (err) {
    console.error("[v1/customers/:id GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}
