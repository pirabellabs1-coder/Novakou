import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveOldSlug } from "@/lib/formations/slugs";
import BoutiqueView from "@/components/formations/BoutiqueView";
import TrackPageView from "@/components/tracking/TrackPageView";
import { shopFontHref } from "@/lib/formations/shop-fonts";
import { productImageSrc } from "@/lib/utils/image-url";

// ATTENTION — ce `revalidate` n'a AUCUN effet aujourd'hui : le layout racine
// lit le cookie de langue via next-intl (i18n/request.ts appelle `cookies()`),
// ce qui rend TOUTE route dynamique. Vérifié en prod : la réponse porte
// `Cache-Control: private, no-cache, no-store` et `X-Vercel-Cache: MISS` à
// chaque requête. On le garde car il redeviendra actif si un jour la locale
// passe par l'URL (next-intl `localePrefix: "as-needed"`) au lieu du cookie.
export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Réutilise `resolve()` (mémorisé par requête) : avant, generateMetadata et
  // le composant de page interrogeaient la boutique chacun de leur côté.
  const shop = (await resolve(slug))?.shop ?? null;

  if (!shop) {
    // Ne pas laisser Google indexer une page vide (une boutique renommée est
    // de toute façon redirigée en permanent par le composant de page).
    return { title: "Boutique introuvable", robots: { index: false, follow: false } };
  }

  const title = `${shop.name} · Boutique Novakou`;
  const description = shop.description?.slice(0, 160) || `Découvrez la boutique de ${shop.name} sur Novakou.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  // Fallback OG image générée par /api/og si la boutique n'a ni cover
  // ni logo personnalisé. Garantit un visuel sur les partages sociaux.
  const image = shop.coverUrl || shop.logoUrl ||
    `${baseUrl}/api/og?type=boutique&title=${encodeURIComponent(shop.name)}&subtitle=${encodeURIComponent(description.slice(0, 100))}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/boutique/${slug}`,
      languages: {
        "fr-FR": `/boutique/${slug}`,
        "x-default": `/boutique/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: shop.name }],
      type: "website",
      url: `${baseUrl}/boutique/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Mémorisé pour la durée de la requête (React `cache`) : `generateMetadata`
 *  et le composant de page l'appellent tous les deux, sans doubler les requêtes. */
const resolve = cache(async (slugParam: string) => {
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
        font: true,
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
        where: { shopId: shop.id, status: "ACTIF", isPaymentLink: false },
        select: {
          id: true, slug: true, title: true, thumbnail: true, banner: true,
          price: true, isFree: true, rating: true, salesCount: true, reviewsCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      // BUG FIX : avant on ne récupérait QUE formations + products → un
      // vendeur qui créait un bundle ou un plan d'abonnement le voyait
      // disparaître de sa boutique (BoutiqueView affichait "0 bundles"
      // et "0 abonnements", et les clics dans l'onglet correspondant
      // tombaient sur du vide).
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

    return { shop, formations, products, bundles, subscriptionPlans };
  } catch (err) {
    console.error("[boutique/slug] lookup failed:", err);
    return null;
  }
});

export default async function BoutiqueBySlugPage({ params }: Props) {
  const { slug } = await params;
  const data = await resolve(slug);
  if (!data) {
    // La boutique a peut-être simplement été renommée : on redirige en permanent
    // vers son slug actuel plutôt que de renvoyer un 404 qui perdrait le
    // référencement acquis par l'ancienne URL.
    const current = await resolveOldSlug("shop", slug);
    if (current) permanentRedirect(`/boutique/${current}`);
    notFound();
  }

  const { shop, formations, products, bundles, subscriptionPlans } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  const fontHref = shopFontHref(shop.font);
  return (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <TrackPageView
        type="shop_view"
        entityType="shop"
        entityId={shop.id}
        metadata={{ name: shop.name, slug: shop.slug }}
      />
      {/* JSON-LD Store + BreadcrumbList — éligibilité rich results Google
          "Local Business" / "Online Store" + fil d'Ariane visuel. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: shop.name,
            description: shop.description || `Boutique de ${shop.name} sur Novakou`,
            url: `${baseUrl}/boutique/${shop.slug}`,
            ...(shop.logoUrl ? { logo: shop.logoUrl } : {}),
            ...(shop.coverUrl ? { image: shop.coverUrl } : {}),
            parentOrganization: { "@type": "Organization", name: "Novakou", url: baseUrl },
            ...(shop.instructeur?.user?.name
              ? { founder: { "@type": "Person", name: shop.instructeur.user.name } }
              : {}),
            numberOfItems: formations.length + products.length + bundles.length,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
              { "@type": "ListItem", position: 2, name: "Boutiques", item: `${baseUrl}/explorer?type=boutique` },
              { "@type": "ListItem", position: 3, name: shop.name },
            ],
          }),
        }}
      />
      <BoutiqueView
      instructeurId={shop.instructeur?.id}
      shopSlug={shop.slug}
      font={shop.font}
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
        id: f.id, slug: f.slug, title: f.title, image: productImageSrc(f.thumbnail, 800),
        price: f.price, isFree: f.isFree, rating: f.rating,
        count: f.studentsCount, reviewsCount: f.reviewsCount,
      }))}
      products={products.map((p) => ({
        kind: "product" as const,
        id: p.id, slug: p.slug, title: p.title, image: productImageSrc(p.thumbnail ?? p.banner, 800),
        price: p.price, isFree: p.isFree, rating: p.rating,
        count: p.salesCount, reviewsCount: p.reviewsCount,
      }))}
      bundles={bundles.map((b) => ({
        kind: "bundle" as const,
        id: b.id, slug: b.slug, title: b.title,
        // Carte = vignette si dispo, sinon bannière
        image: productImageSrc(b.thumbnail ?? b.banner, 800),
        price: b.priceXof, isFree: false,
        rating: b.rating,
        count: 0, // pas de "salesCount" sur ProductBundle, OK pour la card
        reviewsCount: b.reviewsCount,
      }))}
      subscriptionPlans={subscriptionPlans.map((s) => ({
        // SubscriptionPlan n'a pas de slug → BoutiqueView linke sur
        // /abonnement/{id} (cf. ligne 311 du composant), donc on passe
        // l'id comme slug pour fallback éventuel.
        kind: "subscription" as const,
        id: s.id, slug: s.id, title: s.name, image: productImageSrc(s.imageUrl ?? s.bannerUrl, 800),
        price: s.price, isFree: false,
        rating: s.rating,
        count: s.activeCount,
        reviewsCount: s.reviewsCount,
      }))}
    />
    </>
  );
}
