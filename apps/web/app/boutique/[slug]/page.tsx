import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoutiqueView from "@/components/formations/BoutiqueView";
import TrackPageView from "@/components/tracking/TrackPageView";

// ISR : 10min cache for public shop pages — vendors update infrequently
export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.vendorShop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: { name: true, description: true, logoUrl: true, coverUrl: true },
  }).catch(() => null);

  if (!shop) {
    return { title: "Boutique introuvable" };
  }

  const title = `${shop.name} · Boutique Novakou`;
  const description = shop.description?.slice(0, 160) || `Découvrez la boutique de ${shop.name} sur Novakou.`;
  const image = shop.coverUrl || shop.logoUrl || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `https://novakou.com/boutique/${slug}`,
      languages: {
        "fr-FR": `https://novakou.com/boutique/${slug}`,
        "x-default": `https://novakou.com/boutique/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function resolve(slugParam: string) {
  const slug = slugParam.toLowerCase();
  try {
    const shop = await prisma.vendorShop.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        themeColor: true,
        customDomain: true,
        customDomainVerified: true,
        instructeur: {
          select: {
            id: true,
            bioFr: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
      },
    });
    if (!shop) return null;

    const [formations, products, bundles, subscriptionPlans] = await Promise.all([
      prisma.formation.findMany({
        // Multi-shop : seulement les produits liés à CETTE boutique
        where: { shopId: shop.id, status: "ACTIF" },
        select: {
          id: true, slug: true, title: true, thumbnail: true,
          price: true, isFree: true, rating: true, studentsCount: true, reviewsCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.digitalProduct.findMany({
        where: { shopId: shop.id, status: "ACTIF" },
        select: {
          id: true, slug: true, title: true, banner: true,
          price: true, isFree: true, rating: true, salesCount: true, reviewsCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      // Bundles : les "packs" du vendeur (plusieurs items à prix groupé)
      prisma.productBundle.findMany({
        where: { shopId: shop.id, isActive: true },
        select: {
          id: true, slug: true, title: true, thumbnail: true,
          priceXof: true, originalPriceXof: true,
          _count: { select: { items: true, purchases: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      // Abonnements / memberships : accès récurrent à du contenu groupé
      prisma.subscriptionPlan.findMany({
        where: { shopId: shop.id, isActive: true },
        select: {
          id: true, name: true, description: true, imageUrl: true,
          price: true, currency: true, interval: true,
          activeCount: true, trialDays: true,
        },
        orderBy: { price: "asc" },
        take: 12,
      }),
    ]);

    return { shop, formations, products, bundles, subscriptionPlans };
  } catch (err) {
    console.error("[boutique/slug] lookup failed:", err);
    return null;
  }
}

export default async function BoutiqueBySlugPage({ params }: Props) {
  const { slug } = await params;
  const data = await resolve(slug);
  if (!data) notFound();

  const { shop, formations, products, bundles, subscriptionPlans } = data;
  return (
    <>
      <TrackPageView
        type="shop_view"
        entityType="shop"
        entityId={shop.id}
        metadata={{ name: shop.name, slug: shop.slug }}
      />
      <BoutiqueView
      instructeurId={shop.instructeur?.id}
      shopSlug={shop.slug}
      owner={{
        name: shop.name || shop.instructeur.user?.name || "Créateur",
        email: shop.instructeur.user?.email ?? null,
        image: shop.logoUrl ?? shop.instructeur.user?.image ?? null,
        coverUrl: shop.coverUrl ?? null,
        bio: shop.description ?? shop.instructeur.bioFr,
        kind: "vendor",
        domain: shop.customDomain && shop.customDomainVerified ? shop.customDomain : null,
        themeColor: shop.themeColor ?? null,
      }}
      formations={formations.map((f) => ({
        kind: "formation" as const,
        id: f.id, slug: f.slug, title: f.title, image: f.thumbnail,
        price: f.price, isFree: f.isFree, rating: f.rating,
        count: f.studentsCount, reviewsCount: f.reviewsCount,
      }))}
      products={products.map((p) => ({
        kind: "product" as const,
        id: p.id, slug: p.slug, title: p.title, image: p.banner,
        price: p.price, isFree: p.isFree, rating: p.rating,
        count: p.salesCount, reviewsCount: p.reviewsCount,
      }))}
      bundles={bundles.map((b) => ({
        kind: "bundle" as const,
        id: b.id, slug: b.slug, title: b.title, image: b.thumbnail,
        price: b.priceXof, isFree: b.priceXof === 0, rating: 0,
        originalPrice: b.originalPriceXof,
        count: b._count.purchases, reviewsCount: 0,
        itemsCount: b._count.items,
      }))}
      subscriptionPlans={subscriptionPlans.map((p) => ({
        kind: "subscription" as const,
        id: p.id, slug: p.id, title: p.name, image: p.imageUrl,
        price: p.price, isFree: false, rating: 0,
        count: p.activeCount, reviewsCount: 0,
        interval: p.interval as "monthly" | "yearly",
        trialDays: p.trialDays,
        description: p.description,
      }))}
    />
    </>
  );
}
