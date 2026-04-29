import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FormationPageClient from "./FormationPageClient";
import TrackPageView from "@/components/tracking/TrackPageView";

// ISR : revalidate every 5 minutes — public formation pages shouldn't hit
// the DB on every visit. Trade-off : up to 5min stale data on price/title
// changes. Mutations (vendor edits) can call revalidatePath() to bust.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // The schema field is `shortDesc`, not `shortDescription`. The previous
  // version selected the non-existent name and the .catch(() => null)
  // silently swallowed every metadata fetch — pages had no Open Graph.
  const formation = await prisma.formation.findUnique({
    where: { slug },
    select: { title: true, shortDesc: true, description: true, thumbnail: true, price: true },
  }).catch(() => null);

  if (!formation) {
    return { title: "Formation introuvable" };
  }

  const title = formation.title;
  const longSource = (formation.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const description = formation.shortDesc?.trim() || longSource.slice(0, 160) || `Découvrez la formation "${title}" sur Novakou.`;
  const image = formation.thumbnail || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `https://novakou.com/formation/${slug}`,
      languages: {
        "fr-FR": `https://novakou.com/formation/${slug}`,
        "x-default": `https://novakou.com/formation/${slug}`,
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

export default async function FormationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const formation = await prisma.formation
    .findUnique({
      where: { slug },
      select: { id: true, title: true, shortDesc: true, description: true, thumbnail: true, price: true },
    })
    .catch(() => null);

  const ldDescription =
    formation?.shortDesc?.trim() ||
    (formation?.description ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 300);

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
              description: ldDescription,
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
      {formation && (
        <TrackPageView
          type="formation_view"
          entityType="formation"
          entityId={formation.id}
          metadata={{ title: formation.title, price: formation.price }}
        />
      )}
      <FormationPageClient slug={slug} />
    </>
  );
}
