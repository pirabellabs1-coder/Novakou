import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ROOT_DOMAIN } from "@/lib/formations/shop-subdomain";
import BoutiqueView from "@/components/formations/BoutiqueView";
import { shopFontHref } from "@/lib/formations/shop-fonts";
import { productImageSrc } from "@/lib/utils/image-url";

interface Props {
  params: Promise<{ host: string }>;
}

/** Mémorisé pour la durée de la requête (React `cache`) : `generateMetadata`
 *  et le composant de page l'appellent tous les deux — sans ça, les cinq
 *  requêtes Prisma de la vitrine partaient en double à chaque affichage. */
const resolve = cache(async (hostParam: string) => {
  const normalized = decodeURIComponent(hostParam).toLowerCase().replace(/^www\./, "");
  // Sous-domaine gratuit <slug>.novakou.com → résolution par SLUG.
  // Domaine personnalisé (autre host) → résolution par customDomain.
  const where = normalized.endsWith(`.${ROOT_DOMAIN}`)
    ? { slug: normalized.slice(0, -(`.${ROOT_DOMAIN}`.length)) }
    : { customDomain: normalized };
  try {
    const shop = await prisma.vendorShop.findFirst({
      where,
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
            // Anonymat : on ne charge PAS l'identite perso (nom/email/avatar).
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
        where: { shopId: shop.id, status: "ACTIF", isPaymentLink: false },
        select: {
          id: true, slug: true, title: true, thumbnail: true, banner: true,
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
});

/**
 * Sans ça, une boutique servie sur son domaine (ou sur <slug>.novakou.com)
 * héritait du titre du layout racine — donc TOUTES affichaient le même
 * intitulé de plateforme dans l'onglet et dans les partages.
 *
 * Canonique : l'adresse courte novakou.com/<slug> reste la principale pour un
 * sous-domaine gratuit (même page à trois adresses, sinon contenu dupliqué) ;
 * un domaine personnalisé est en revanche canonique de lui-même — c'est LUI
 * que le vendeur veut voir indexé.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params;
  const data = await resolve(host);
  if (!data) {
    return { title: "Boutique introuvable", robots: { index: false, follow: false } };
  }
  const { shop, normalized } = data;

  const title = `${shop.name} · Boutique Novakou`;
  const description =
    shop.description?.slice(0, 160) || `Découvrez la boutique de ${shop.name} sur Novakou.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${ROOT_DOMAIN}`;
  const canonical = normalized.endsWith(`.${ROOT_DOMAIN}`)
    ? `${baseUrl}/${shop.slug}`
    : `https://${normalized}/`;
  const image =
    shop.coverUrl ||
    shop.logoUrl ||
    `${baseUrl}/api/og?type=boutique&title=${encodeURIComponent(shop.name)}&subtitle=${encodeURIComponent(description.slice(0, 100))}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: shop.name }],
      type: "website",
      url: canonical,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
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
        // Anonymat : identite = boutique uniquement (jamais nom/email/avatar perso).
        name: shop.name || "Boutique",
        email: null,
        image: shop.logoUrl ?? null,
        coverUrl: shop.coverUrl ?? null,
        bio: shop.description ?? shop.instructeur.bioFr,
        kind: "vendor",
        domain: normalized,
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
        image: productImageSrc(b.thumbnail ?? b.banner, 800),
        price: b.priceXof, isFree: false,
        rating: b.rating,
        count: 0,
        reviewsCount: b.reviewsCount,
      }))}
      subscriptionPlans={subscriptionPlans.map((s) => ({
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
