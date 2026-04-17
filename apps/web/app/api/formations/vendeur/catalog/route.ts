import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

/**
 * GET /api/vendeur/catalog
 * Returns a flat list of the vendor's purchasable items (formations + digital products)
 * for use in the funnel product picker. Filtered by ACTIVE SHOP.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: [] });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    const shopFilter = activeShopId ? { shopId: activeShopId } : {};

    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { instructeurId: ctx.instructeurId, ...shopFilter },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          price: true,
          isFree: true,
          rating: true,
          studentsCount: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.digitalProduct.findMany({
        where: { instructeurId: ctx.instructeurId, ...shopFilter },
        select: {
          id: true,
          title: true,
          slug: true,
          banner: true,
          price: true,
          isFree: true,
          rating: true,
          salesCount: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const items = [
      ...formations.map((f) => ({
        kind: "formation" as const,
        id: f.id,
        slug: f.slug,
        title: f.title,
        image: f.thumbnail,
        price: f.price,
        isFree: f.isFree,
        rating: f.rating,
        count: f.studentsCount,
        status: f.status,
      })),
      ...products.map((p) => ({
        kind: "product" as const,
        id: p.id,
        slug: p.slug,
        title: p.title,
        image: p.banner,
        price: p.price,
        isFree: p.isFree,
        rating: p.rating,
        count: p.salesCount,
        status: p.status,
      })),
    ];

    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("[vendeur/catalog GET]", err);
    return NextResponse.json(
      { data: [], error: err instanceof Error ? err.message : String(err) },
      { status: 200 } // return empty data instead of 500 — UI handles gracefully
    );
  }
}
