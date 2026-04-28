import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProduitPageClient from "./ProduitPageClient";
import TrackPageView from "@/components/tracking/TrackPageView";

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
      canonical: `https://novakou.com/produit/${slug}`,
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
      select: { id: true, title: true, description: true, banner: true, thumbnail: true, price: true },
    })
    .catch(() => null);

  const productImage = product?.banner ?? product?.thumbnail ?? null;
  const productDescription = (product?.description ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 300);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.title,
              description: productDescription,
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
              },
            }),
          }}
        />
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
