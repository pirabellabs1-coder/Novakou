import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import {
  apiError,
  apiSuccess,
  parsePagination,
} from "@/lib/api/v1-helpers";

/**
 * GET /api/v1/customers
 *
 * Liste les clients (acheteurs) du vendeur, agrégés depuis les Enrollments
 * et les DigitalProductPurchases. Un même utilisateur ayant acheté plusieurs
 * produits apparaît une seule fois avec ses totaux cumulés.
 *
 * Query params:
 *   - page    (int, défaut 1)
 *   - limit   (int, défaut 20, max 100)
 *   - search  (string, recherche par nom OU email — case insensitive)
 *
 * Scope requis : read:customers
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:customers" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const search = url.searchParams.get("search")?.trim().toLowerCase();

    // Get distinct buyer userIds from both Enrollment and DigitalProductPurchase
    // tables for products owned by this vendor.
    const [enrollmentUsers, purchaseUsers] = await Promise.all([
      prisma.enrollment.findMany({
        where: { formation: { instructeurId: ctx.instructeurId } },
        select: { userId: true, paidAmount: true, createdAt: true, refundedAt: true },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { product: { instructeurId: ctx.instructeurId } },
        select: { userId: true, paidAmount: true, createdAt: true },
      }),
    ]);

    // Aggregate per user
    type Agg = {
      userId: string;
      totalSpent: number;
      ordersCount: number;
      firstPurchaseAt: Date;
      lastPurchaseAt: Date;
    };
    const map = new Map<string, Agg>();

    const ingest = (
      rows: { userId: string; paidAmount: number; createdAt: Date; refundedAt?: Date | null }[],
    ) => {
      for (const r of rows) {
        // Une commande remboursée compte dans ordersCount mais PAS dans
        // totalSpent — cohérent avec le détail client (customers/[id]).
        const spent = r.refundedAt ? 0 : r.paidAmount;
        const existing = map.get(r.userId);
        if (!existing) {
          map.set(r.userId, {
            userId: r.userId,
            totalSpent: spent,
            ordersCount: 1,
            firstPurchaseAt: r.createdAt,
            lastPurchaseAt: r.createdAt,
          });
        } else {
          existing.totalSpent += spent;
          existing.ordersCount += 1;
          if (r.createdAt < existing.firstPurchaseAt)
            existing.firstPurchaseAt = r.createdAt;
          if (r.createdAt > existing.lastPurchaseAt)
            existing.lastPurchaseAt = r.createdAt;
        }
      }
    };
    ingest(enrollmentUsers);
    ingest(purchaseUsers);

    // Hydrate user info
    const userIds = [...map.keys()];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, image: true, createdAt: true },
        })
      : [];

    // Build full rows + apply search filter + sort
    let rows = users.map((u) => {
      const agg = map.get(u.id)!;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.image,
        totalSpent: agg.totalSpent,
        ordersCount: agg.ordersCount,
        firstPurchaseAt: agg.firstPurchaseAt,
        lastPurchaseAt: agg.lastPurchaseAt,
      };
    });

    if (search) {
      rows = rows.filter(
        (r) =>
          r.email.toLowerCase().includes(search) ||
          (r.name?.toLowerCase().includes(search) ?? false),
      );
    }

    rows.sort(
      (a, b) => b.lastPurchaseAt.getTime() - a.lastPurchaseAt.getTime(),
    );

    const total = rows.length;
    const slice = rows.slice(skip, skip + limit);

    return apiSuccess(slice, { page, limit, total });
  } catch (err) {
    console.error("[v1/customers GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}
