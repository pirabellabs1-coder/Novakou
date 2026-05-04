/**
 * GET /api/formations/public/bundles/[slug]
 * Public detail endpoint for a vendor product bundle. Used by the public
 * `/bundle/[slug]` page that lets buyers see what's inside a pack and
 * launch the buy flow.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const bundle = await prisma.productBundle.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          formation: {
            select: { id: true, slug: true, title: true, thumbnail: true, price: true, shortDesc: true },
          },
          product: {
            select: { id: true, slug: true, title: true, banner: true, price: true, description: true },
          },
        },
      },
      instructeur: {
        select: {
          id: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
      shop: {
        select: { id: true, slug: true, name: true, themeColor: true, logoUrl: true },
      },
      _count: { select: { purchases: true } },
    },
  });

  if (!bundle || !bundle.isActive) {
    return NextResponse.json({ error: "Bundle introuvable" }, { status: 404 });
  }

  // Sum of items full prices — used to display "économie" badge
  const itemsSum = bundle.items.reduce((s, item) => {
    if (item.itemKind === "formation") return s + (item.formation?.price ?? 0);
    if (item.itemKind === "digital") return s + (item.product?.price ?? 0);
    return s;
  }, 0);
  const savings = Math.max(0, itemsSum - bundle.priceXof);
  const savingsPct = itemsSum > 0 ? Math.round((savings / itemsSum) * 100) : 0;

  return NextResponse.json({
    data: {
      id: bundle.id,
      slug: bundle.slug,
      title: bundle.title,
      description: bundle.description,
      thumbnail: bundle.thumbnail,
      priceXof: bundle.priceXof,
      originalPriceXof: bundle.originalPriceXof,
      itemsSumXof: itemsSum,
      savingsXof: savings,
      savingsPct,
      purchasesCount: bundle._count.purchases,
      items: bundle.items.map((item) => {
        if (item.itemKind === "formation" && item.formation) {
          return {
            kind: "formation" as const,
            id: item.formation.id,
            slug: item.formation.slug,
            title: item.formation.title,
            description: item.formation.shortDesc,
            image: item.formation.thumbnail,
            price: item.formation.price,
          };
        }
        if (item.itemKind === "digital" && item.product) {
          return {
            kind: "product" as const,
            id: item.product.id,
            slug: item.product.slug,
            title: item.product.title,
            description: item.product.description,
            image: item.product.banner,
            price: item.product.price,
          };
        }
        return null;
      }).filter(Boolean),
      instructeur: {
        id: bundle.instructeur.id,
        userId: bundle.instructeur.user?.id,
        name: bundle.instructeur.user?.name,
        image: bundle.instructeur.user?.image,
      },
      shop: bundle.shop,
    },
  });
}
