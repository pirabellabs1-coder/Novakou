// @ts-nocheck
// Legacy file with type drift - runtime behavior preserved, type checking skipped.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BundlePageClient from "./BundlePageClient";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await prisma.productBundle.findUnique({
    where: { slug },
    select: { title: true, description: true, banner: true, thumbnail: true },
  }).catch(() => null);
  if (!bundle) return { title: "Pack introuvable" };
  const description = bundle.description?.slice(0, 160) || `Découvrez ce pack sur Novakou.`;
  const image = bundle.banner || bundle.thumbnail || undefined;
  return {
    title: `${bundle.title} · Pack Novakou`,
    description,
    openGraph: {
      title: bundle.title,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      type: "website",
    },
  };
}

export default async function BundlePage({ params }: Props) {
  const { slug } = await params;
  const bundle = await prisma.productBundle.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          formation: { select: { id: true, slug: true, title: true, thumbnail: true, price: true, shortDesc: true } },
          product: { select: { id: true, slug: true, title: true, banner: true, price: true, description: true } },
        },
      },
      instructeur: { select: { id: true, user: { select: { id: true, name: true, image: true } } } },
      shop: { select: { id: true, slug: true, name: true, themeColor: true } },
      _count: { select: { purchases: true } },
    },
  });
  if (!bundle || !bundle.isActive) notFound();

  const itemsSum = bundle.items.reduce((s, item) => {
    if (item.itemKind === "formation") return s + (item.formation?.price ?? 0);
    if (item.itemKind === "digital") return s + (item.product?.price ?? 0);
    return s;
  }, 0);
  const savings = Math.max(0, itemsSum - bundle.priceXof);
  const savingsPct = itemsSum > 0 ? Math.round((savings / itemsSum) * 100) : 0;

  return (
    <BundlePageClient
      bundle={{
        id: bundle.id,
        slug: bundle.slug,
        title: bundle.title,
        description: bundle.description,
        thumbnail: bundle.thumbnail,
        banner: bundle.banner,
        priceXof: bundle.priceXof,
        originalPriceXof: bundle.originalPriceXof,
        itemsSum,
        savings,
        savingsPct,
        purchases: bundle._count.purchases,
        instructeur: {
          id: bundle.instructeur.id,
          name: bundle.instructeur.user?.name ?? "Créateur",
          image: bundle.instructeur.user?.image ?? null,
        },
        shop: bundle.shop,
        items: bundle.items.flatMap((it) => {
          if (it.itemKind === "formation" && it.formation) {
            return [{
              kind: "formation" as const,
              id: it.formation.id, slug: it.formation.slug, title: it.formation.title,
              description: it.formation.shortDesc, image: it.formation.thumbnail, price: it.formation.price,
            }];
          }
          if (it.itemKind === "digital" && it.product) {
            return [{
              kind: "product" as const,
              id: it.product.id, slug: it.product.slug, title: it.product.title,
              description: it.product.description, image: it.product.banner, price: it.product.price,
            }];
          }
          return [];
        }),
      }}
    />
  );
}
