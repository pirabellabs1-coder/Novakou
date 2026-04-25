import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProduitPageClient from "./ProduitPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.digitalProduct.findFirst({
    where: { slug },
    select: { title: true, shortDescription: true, thumbnail: true, price: true },
  }).catch(() => null);

  if (!product) {
    return { title: "Produit introuvable" };
  }

  const title = product.title;
  const description = product.shortDescription || `Découvrez "${title}" sur Novakou.`;
  const image = product.thumbnail || undefined;

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
      select: { title: true, shortDescription: true, thumbnail: true, price: true },
    })
    .catch(() => null);

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
              description: product.shortDescription || "",
              brand: {
                "@type": "Organization",
                name: "Novakou",
              },
              ...(product.thumbnail ? { image: product.thumbnail } : {}),
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
      <ProduitPageClient slug={slug} />
    </>
  );
}
