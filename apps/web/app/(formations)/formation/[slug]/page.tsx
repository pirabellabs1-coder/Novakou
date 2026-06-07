import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FormationPageClient from "./FormationPageClient";
import TrackPageView from "@/components/tracking/TrackPageView";

// ISR : revalidate every 5 minutes — public formation pages shouldn't hit
// the DB on every visit. Trade-off : up to 5min stale data on price/title
// changes. Mutations (vendor edits) can call revalidatePath() to bust.
export const revalidate = 300;

/** Pre-render the top 50 formations at build time for fast LCP. */
export async function generateStaticParams() {
  try {
    const formations = await prisma.formation.findMany({
      where: { status: "ACTIF", hiddenFromMarketplace: false },
      select: { slug: true },
      orderBy: { studentsCount: "desc" },
      take: 50,
    });
    return formations.map((f) => ({ slug: f.slug }));
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  // Fallback OG image générée par /api/og si la formation n'a pas de
  // thumbnail. Sinon les partages sur WhatsApp/X seraient vides.
  const image = formation.thumbnail ||
    `${baseUrl}/api/og?type=formation&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description.slice(0, 110))}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/formation/${slug}`,
      languages: {
        "fr-FR": `/formation/${slug}`,
        "x-default": `/formation/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "website",
      url: `${baseUrl}/formation/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Course",
                name: formation.title,
                description: ldDescription,
                url: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/formation/${slug}`,
                inLanguage: "fr",
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
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Accueil", item: process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com" },
                  { "@type": "ListItem", position: 2, name: "Explorer", item: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/explorer` },
                  { "@type": "ListItem", position: 3, name: formation.title },
                ],
              }),
            }}
          />
        </>
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
