import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoutiqueView from "@/components/formations/BoutiqueView";
import { shopFontHref } from "@/lib/formations/shop-fonts";

interface Props {
  params: Promise<{ host: string }>;
}

async function resolve(hostParam: string) {
  const normalized = decodeURIComponent(hostParam).toLowerCase().replace(/^www\./, "");
  try {
    const shop = await prisma.vendorShop.findFirst({
      where: { customDomain: normalized },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        themeColor: true,
        font: true,
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
        // Multi-shop : seulement les produits de CETTE boutique
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
      // Idem que /boutique/[slug] — sans ça, bundles + abonnements
      // invisibles sur les boutiques avec custom domain.
      prisma.productBundle.findMany({
        where: { shopId: shop.id, isActive: true },
        select: {
          id: true, slug: true, title: true, thumbnail: true, banner: true,
          priceXof: true, rating: true, reviewsCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.subscriptionPlan.findMany({
        where: { shopId: shop.id, isActive: true },
        select: {
          id: true, name: true, description: true, imageUrl: true, bannerUrl: true,
          price: true, interval: true, rating: true, reviewsCount: true, activeCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
    ]);

    return { shop, formations, products, bundles, subscriptionPlans, normalized };
  } catch (err) {
    console.error("[boutique/by-domain] lookup failed:", err);
    return null;
  }
}

export default async function BoutiqueByDomainPage({ params }: Props) {
  const { host } = await params;
  const data = await resolve(host);
  if (!data) notFound();

  const { shop, formations, products, bundles, subscriptionPlans, normalized } = data;
  const fontHref = shopFontHref(shop.font);
  return (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
    <BoutiqueView
      font={shop.font}
      owner={{
        name: shop.name || shop.instructeur.user?.name || "Créateur",
        email: shop.instructeur.user?.email ?? null,
        image: shop.logoUrl ?? shop.instructeur.user?.image ?? null,
        coverUrl: shop.coverUrl ?? null,
        bio: shop.description ?? shop.instructeur.bioFr,
        kind: "vendor",
        domain: normalized,
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
        id: b.id, slug: b.slug, title: b.title,
        image: b.thumbnail ?? b.banner,
        price: b.priceXof, isFree: false,
        rating: b.rating,
        count: 0,
        reviewsCount: b.reviewsCount,
      }))}
      subscriptionPlans={subscriptionPlans.map((s) => ({
        kind: "subscription" as const,
        id: s.id, slug: s.id, title: s.name, image: s.imageUrl ?? s.bannerUrl,
        price: s.price, isFree: false,
        rating: s.rating,
        count: s.activeCount,
        reviewsCount: s.reviewsCount,
      }))}
    />
    </>
  );
}
