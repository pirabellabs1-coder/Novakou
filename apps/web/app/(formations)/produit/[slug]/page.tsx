import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProduitPageClient from "./ProduitPageClient";
import TrackPageView from "@/components/tracking/TrackPageView";

// Rendu DYNAMIQUE (SSR à chaque requête). Même contrainte que la page
// formation : le layout racine lit les en-têtes via next-intl, donc une
// régénération ISR plante en prod (DYNAMIC_SERVER_USAGE). force-dynamic =
// rendu correct + compteur de ventes/prix toujours à jour.
export const dynamic = "force-dynamic";

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
  const product = await prisma.digitalProduct.findFirst({
    where: { slug },
    select: { title: true, description: true, banner: true, thumbnail: true, price: true },
  }).catch(() => null);

  if (!product) {
    return { title: "Produit introuvable" };
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
  const product = await prisma.digitalProduct
    .findFirst({
      where: { slug },
      select: {
        id: true, title: true, description: true, banner: true, thumbnail: true, price: true,
        rating: true, reviewsCount: true, salesCount: true,
        instructeur: { select: { user: { select: { name: true } } } },
      },
    })
    .catch(() => null);

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
                ...(product.instructeur?.user?.name
                  ? {
                      brand: { "@type": "Brand", name: product.instructeur.user.name },
                      manufacturer: { "@type": "Person", name: product.instructeur.user.name },
                    }
                  : {}),
                category: "Digital Goods",
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
                  { "@type": "ListItem", position: 3, name: product.title },
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
