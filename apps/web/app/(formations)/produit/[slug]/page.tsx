import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProduitPageClient from "./ProduitPageClient";
import TrackPageView from "@/components/tracking/TrackPageView";

// ISR : 5min cache for public product pages
export const revalidate = 300;

/** Pre-render the top 50 products at build time for fast LCP. */
export async function generateStaticParams() {
  try {
    const products = await prisma.digitalProduct.findMany({
      where: { status: "ACTIF", hiddenFromMarketplace: false },
      select: { slug: true },
      orderBy: { salesCount: "desc" },
      take: 50,
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

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
  const image = product.banner || product.thumbnail || undefined;

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
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
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
        averageRating: true, reviewCount: true,
      },
    })
    .catch(() => null);

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
                ...((product as Record<string, unknown>).reviewCount && (product as Record<string, unknown>).reviewCount > 0
                  ? {
                      aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: (product as Record<string, unknown>).averageRating ?? 5,
                        reviewCount: (product as Record<string, unknown>).reviewCount,
                        bestRating: 5,
                        worstRating: 1,
                      },
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
