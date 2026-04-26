import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import {
  apiError,
  apiSuccess,
  parseDateRange,
  parsePagination,
} from "@/lib/api/v1-helpers";

/**
 * GET /api/v1/orders
 *
 * Liste les commandes du vendeur (formations + produits digitaux fusionnés).
 *
 * Query params:
 *   - page    (int, défaut 1)
 *   - limit   (int, défaut 20, max 100)
 *   - from    (ISO 8601, filtre createdAt ≥ from)
 *   - to      (ISO 8601, filtre createdAt ≤ to)
 *   - kind    ("formation" | "product")
 *   - status  ("PAID" | "REFUNDED")  — refunded = enrollment.refundedAt non null
 *
 * Scope requis : read:orders
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:orders" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const { from, to } = parseDateRange(url);
    const kindFilter = url.searchParams.get("kind");
    const statusFilter = url.searchParams.get("status"); // "PAID" | "REFUNDED"

    const wantsFormations = !kindFilter || kindFilter === "formation";
    const wantsProducts = !kindFilter || kindFilter === "product";

    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {};

    const refundedFilter =
      statusFilter === "REFUNDED" ? { not: null } : null;
    const paidOnlyFilter = statusFilter === "PAID" ? null : undefined;

    const fetchSize = skip + limit;

    const [enrollments, purchases, totalEnrollments, totalPurchases] =
      await Promise.all([
        wantsFormations
          ? prisma.enrollment.findMany({
              where: {
                formation: { instructeurId: ctx.instructeurId },
                ...(refundedFilter ? { refundedAt: refundedFilter } : {}),
                ...(paidOnlyFilter === null ? { refundedAt: null } : {}),
                ...dateFilter,
              },
              orderBy: { createdAt: "desc" },
              take: fetchSize,
              select: {
                id: true,
                userId: true,
                formationId: true,
                paidAmount: true,
                progress: true,
                completedAt: true,
                refundedAt: true,
                createdAt: true,
                user: {
                  select: { id: true, name: true, email: true },
                },
                formation: {
                  select: { id: true, slug: true, title: true },
                },
              },
            })
          : Promise.resolve([]),
        wantsProducts
          ? prisma.digitalProductPurchase.findMany({
              where: {
                product: { instructeurId: ctx.instructeurId },
                ...dateFilter,
              },
              orderBy: { createdAt: "desc" },
              take: fetchSize,
              select: {
                id: true,
                userId: true,
                productId: true,
                paidAmount: true,
                downloadCount: true,
                createdAt: true,
                user: {
                  select: { id: true, name: true, email: true },
                },
                product: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    productType: true,
                  },
                },
              },
            })
          : Promise.resolve([]),
        wantsFormations
          ? prisma.enrollment.count({
              where: {
                formation: { instructeurId: ctx.instructeurId },
                ...(refundedFilter ? { refundedAt: refundedFilter } : {}),
                ...(paidOnlyFilter === null ? { refundedAt: null } : {}),
                ...dateFilter,
              },
            })
          : Promise.resolve(0),
        wantsProducts
          ? prisma.digitalProductPurchase.count({
              where: {
                product: { instructeurId: ctx.instructeurId },
                ...dateFilter,
              },
            })
          : Promise.resolve(0),
      ]);

    const total = totalEnrollments + totalPurchases;

    const merged = [
      ...enrollments.map((e) => ({
        id: e.id,
        kind: "formation" as const,
        productId: e.formationId,
        productTitle: e.formation.title,
        productSlug: e.formation.slug,
        buyer: {
          id: e.user.id,
          name: e.user.name,
          email: e.user.email,
        },
        amount: e.paidAmount,
        currency: "XOF",
        status: e.refundedAt
          ? ("REFUNDED" as const)
          : ("PAID" as const),
        progress: e.progress,
        completedAt: e.completedAt,
        refundedAt: e.refundedAt,
        createdAt: e.createdAt,
      })),
      ...purchases.map((p) => ({
        id: p.id,
        kind: "product" as const,
        productId: p.productId,
        productTitle: p.product.title,
        productSlug: p.product.slug,
        productType: p.product.productType,
        buyer: {
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
        },
        amount: p.paidAmount,
        currency: "XOF",
        status: "PAID" as const,
        downloadCount: p.downloadCount,
        createdAt: p.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const slice = merged.slice(skip, skip + limit);

    return apiSuccess(slice, { page, limit, total });
  } catch (err) {
    console.error("[v1/orders GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}
