import type { Metadata } from "next";
import { cache } from "react";
import { permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveOldSlug } from "@/lib/formations/slugs";
import ProduitPageClient from "./ProduitPageClient";
import TrackPageView from "@/components/tracking/TrackPageView";

// Rendu DYNAMIQUE (SSR à chaque requête). Même contrainte que la page
// formation : le layout racine lit les en-têtes via next-intl, donc une
// régénération ISR plante en prod (DYNAMIC_SERVER_USAGE). force-dynamic =
// rendu correct + compteur de ventes/prix toujours à jour.
export const dynamic = "force-dynamic";

/**
 * Une seule requête produit par requête HTTP.
 *
 * `generateMetadata` et le composant de page demandaient séparément la MÊME
 * ligne : 2 allers-retours base de données à chaque visite, donc à chaque
 * passage de Googlebot. `cache()` (React) mémorise le résultat pour la durée
 * de la requête — les deux appels ne coûtent plus qu'une requête.
 */
const getProduct = cache(async (slug: string) =>
  prisma.digitalProduct
    .findFirst({
      where: { slug },
      select: {
        id: true, title: true, description: true, banner: true, thumbnail: true, price: true,
        rating: true, reviewsCount: true, salesCount: true,
        // Catégorie réelle : sert le SEO (JSON-LD + fil d'Ariane) au lieu du
        // « Digital Goods » générique. Le slug pointe vers /explorer filtré.
        category: { select: { name: true, slug: true } },
        // Anonymat : identite = BOUTIQUE, jamais le nom perso du vendeur.
        shop: { select: { name: true } },
      },
    })
    .catch(() => null),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Schema fields: `description` + `banner` + (now) `thumbnail`. The original
  // version selected `shortDescription` and `thumbnail` (alias for what the
  // model used to call them) — those names never existed on DigitalProduct
  // and the .catch(() => null) silently swallowed every metadata fetch.
  const product = await getProduct(slug);

  if (!product) {
    // Une page introuvable ne doit pas être indexée : sans ça, Google garde en
    // catalogue des URLs vides qui diluent la qualité perçue du site.
    return { title: "Produit introuvable", robots: { index: false, follow: false } };
  }

  const title = product.title;
  const taglineSource = product.description ?? "";
  const description = taglineSource
    ? taglineSource.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
    : `Découvrez "${title}" sur Novakou.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  // Fallback OG image via /api/og pour les produits sans banner ni thumbnail.
  const image = product.banner || product.thumbnail ||
    `${baseUrl}/api/og?type=produit&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description.slice(0, 110))}`;

  return {
    title,
    description,
    // Catégorie réelle en mot-clé : renforce la pertinence thématique de la fiche.
    keywords: [product.category?.name, "Novakou", "produit numérique"].filter(Boolean) as string[],
    alternates: {
      canonical: `/produit/${slug}`,
      languages: {
        "fr-FR": `/produit/${slug}`,
        "x-default": `/produit/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "website",
      url: `${baseUrl}/produit/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProduitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  // Produit renommé : redirection permanente vers son slug actuel, pour ne pas
  // perdre le référencement de l'ancienne URL. (Hors try/catch : `permanentRedirect`
  // fonctionne en levant une exception que Next intercepte.)
  if (!product) {
    const current = await resolveOldSlug("product", slug);
    if (current) permanentRedirect(`/produit/${current}`);
  }

  const topProductReviews = product
    ? await prisma.digitalProductReview
        .findMany({
          where: { productId: product.id, comment: { not: "" } },
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true } },
          },
          orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
          take: 3,
        })
        .catch(() => [])
    : [];

  const productImage = product?.banner ?? product?.thumbnail ?? null;
  const productDescription = (product?.description ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 300);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

  return (
    <>
      {product && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: product.title,
                description: productDescription,
                url: `${baseUrl}/produit/${slug}`,
                brand: {
                  "@type": "Organization",
                  name: "Novakou",
                },
                ...(productImage ? { image: productImage } : {}),
                offers: {
                  "@type": "Offer",
                  price: product.price,
                  priceCurrency: "XOF",
                  availability: "https://schema.org/InStock",
                  url: `${baseUrl}/produit/${slug}`,
                },
                ...(product.shop?.name
                  ? { brand: { "@type": "Brand", name: product.shop.name } }
                  : {}),
                // Catégorie RÉELLE du produit (repli générique si absente).
                category: product.category?.name || "Produit numérique",
                ...(product.reviewsCount > 0
                  ? {
                      aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: product.rating ? Number(product.rating.toFixed(2)) : 5,
                        reviewCount: product.reviewsCount,
                        bestRating: 5,
                        worstRating: 1,
                      },
                    }
                  : {}),
                ...(topProductReviews.length > 0
                  ? {
                      review: topProductReviews.map((r) => ({
                        "@type": "Review",
                        reviewRating: {
                          "@type": "Rating",
                          ratingValue: r.rating,
                          bestRating: 5,
                          worstRating: 1,
                        },
                        author: {
                          "@type": "Person",
                          name: r.user?.name || "Acheteur Novakou",
                        },
                        datePublished: r.createdAt.toISOString().split("T")[0],
                        reviewBody: r.comment.slice(0, 280),
                      })),
                    }
                  : {}),
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
                  { "@type": "ListItem", position: 2, name: "Explorer", item: `${baseUrl}/explorer` },
                  // Niveau catégorie cliquable → /explorer filtré. Aide Google à
                  // situer la fiche dans la taxonomie du site (rich breadcrumb).
                  ...(product.category
                    ? [{
                        "@type": "ListItem",
                        position: 3,
                        name: product.category.name,
                        item: `${baseUrl}/explorer?categorie=${product.category.slug}`,
                      }]
                    : []),
                  { "@type": "ListItem", position: product.category ? 4 : 3, name: product.title },
                ],
              }),
            }}
          />
        </>
      )}
      {product && (
        <TrackPageView
          type="product_view"
          entityType="product"
          entityId={product.id}
          metadata={{ title: product.title, price: product.price }}
        />
      )}
      <ProduitPageClient slug={slug} />
    </>
  );
}
