import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * GET /api/formations/vendeur/shops/overview
 *
 * Statistiques PAR BOUTIQUE (revenus, ventes, clients, produits) pour la vue
 * globale « Toutes les boutiques » du tableau de bord. Une carte par boutique,
 * plus un bucket « Sans boutique » si des fiches ne sont rattachées à aucune.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: [] });
    const instructeurId = ctx.instructeurId;

    const [shops, purchases, enrollments, products, formations] = await Promise.all([
      prisma.vendorShop.findMany({
        where: { instructeurId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        select: { id: true, name: true, slug: true, logoUrl: true, themeColor: true, isPrimary: true },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { product: { instructeurId } },
        select: { paidAmount: true, userId: true, product: { select: { shopId: true } } },
      }),
      prisma.enrollment.findMany({
        where: { formation: { instructeurId }, refundedAt: null },
        select: { paidAmount: true, userId: true, formation: { select: { shopId: true } } },
      }),
      prisma.digitalProduct.findMany({
        where: { instructeurId, isPaymentLink: false },
        select: { shopId: true },
      }),
      prisma.formation.findMany({
        where: { instructeurId },
        select: { shopId: true },
      }),
    ]);

    // Agrégat par shopId (null = "Sans boutique").
    type Agg = { revenue: number; sales: number; clients: Set<string>; products: number };
    const byShop = new Map<string, Agg>();
    const bucket = (shopId: string | null): Agg => {
      const key = shopId ?? "__none__";
      let a = byShop.get(key);
      if (!a) { a = { revenue: 0, sales: 0, clients: new Set(), products: 0 }; byShop.set(key, a); }
      return a;
    };
    for (const p of purchases) {
      const a = bucket(p.product?.shopId ?? null);
      a.revenue += p.paidAmount; a.sales += 1; if (p.userId) a.clients.add(p.userId);
    }
    for (const e of enrollments) {
      const a = bucket(e.formation?.shopId ?? null);
      a.revenue += e.paidAmount; a.sales += 1; if (e.userId) a.clients.add(e.userId);
    }
    for (const p of products) bucket(p.shopId ?? null).products += 1;
    for (const f of formations) bucket(f.shopId ?? null).products += 1;

    const card = (id: string, key: string, extra: Record<string, unknown>) => {
      const a = byShop.get(key);
      return {
        id,
        revenue: Math.round(a?.revenue ?? 0),
        sales: a?.sales ?? 0,
        clients: a?.clients.size ?? 0,
        products: a?.products ?? 0,
        ...extra,
      };
    };

    const data = shops.map((s) =>
      card(s.id, s.id, { name: s.name, slug: s.slug, logoUrl: s.logoUrl, themeColor: s.themeColor, isPrimary: s.isPrimary }),
    );

    // Bucket "Sans boutique" seulement s'il porte quelque chose.
    const none = byShop.get("__none__");
    if (none && (none.products > 0 || none.sales > 0)) {
      data.push(card("__none__", "__none__", { name: "Sans boutique", slug: null, logoUrl: null, themeColor: null, isPrimary: false }));
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[vendeur/shops/overview GET]", err);
    return NextResponse.json({ data: [] });
  }
}
