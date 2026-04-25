import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FormationPageClient from "./FormationPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const formation = await prisma.formation.findUnique({
    where: { slug },
    select: { title: true, shortDescription: true, thumbnail: true, price: true },
  }).catch(() => null);

  if (!formation) {
    return { title: "Formation introuvable" };
  }

  const title = formation.title;
  const description = formation.shortDescription || `Découvrez la formation "${title}" sur Novakou.`;
  const image = formation.thumbnail || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `https://novakou.com/formation/${slug}`,
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

export default async function FormationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const formation = await prisma.formation
    .findUnique({
      where: { slug },
      select: { title: true, shortDescription: true, thumbnail: true, price: true },
    })
    .catch(() => null);

  return (
    <>
      {formation && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: formation.title,
              description: formation.shortDescription || "",
              provider: {
                "@type": "Organization",
                name: "Novakou",
                url: "https://novakou.com",
              },
              ...(formation.thumbnail ? { image: formation.thumbnail } : {}),
              offers: {
                "@type": "Offer",
                price: formation.price,
                priceCurrency: "XOF",
                availability: "https://schema.org/InStock",
              },
            }),
          }}
        />
      )}
      <FormationPageClient slug={slug} />
    </>
  );
}
