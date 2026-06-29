import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FormationPageClient from "./FormationPageClient";
import TrackPageView from "@/components/tracking/TrackPageView";

// Rendu DYNAMIQUE (SSR à chaque requête). Cette page NE PEUT PAS être
// statique/ISR : le layout racine lit les en-têtes de la requête via next-intl
// (getLocale/getMessages), donc toute régénération ISR plante en production
// avec DYNAMIC_SERVER_USAGE. force-dynamic = rendu toujours correct + données
// fraîches (titre, prix, nb d'élèves à jour à chaque visite).
export const dynamic = "force-dynamic";

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
      select: {
        id: true,
        title: true,
        shortDesc: true,
        description: true,
        thumbnail: true,
        price: true,
        rating: true,
        reviewsCount: true,
        studentsCount: true,
        instructeur: { select: { user: { select: { name: true } } } },
      },
    })
    .catch(() => null);

  // Top 3 reviews avec rating + texte pour enrichir le Schema.org Course.
  // Google les affiche dans les rich results "Course" → boost CTR.
  const topReviews = formation
    ? await prisma.formationReview
        .findMany({
          where: { formationId: formation.id, comment: { not: "" } },
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
                ...(formation.instructeur?.user?.name
                  ? {
                      author: {
                        "@type": "Person",
                        name: formation.instructeur.user.name,
                      },
                    }
                  : {}),
                ...(formation.thumbnail ? { image: formation.thumbnail } : {}),
                // hasCourseInstance requis par Google pour valider Course
                // rich results — sans ça, le snippet étoiles n'apparaît pas.
                hasCourseInstance: {
                  "@type": "CourseInstance",
                  courseMode: "Online",
                  courseWorkload: "P10H",
                },
                offers: {
                  "@type": "Offer",
                  price: formation.price,
                  priceCurrency: "XOF",
                  availability: "https://schema.org/InStock",
                  category: "Paid",
                },
                // AggregateRating : déclenche les ⭐ dans Google SERP.
                // N'apparaît que si reviewsCount ≥ 1 (sinon Google rejette).
                ...(formation.rating && formation.reviewsCount && formation.reviewsCount > 0
                  ? {
                      aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: Number(formation.rating.toFixed(2)),
                        reviewCount: formation.reviewsCount,
                        bestRating: 5,
                        worstRating: 1,
                      },
                    }
                  : {}),
                // Top 3 reviews avec auteur + texte → boost crédibilité SERP.
                ...(topReviews.length > 0
                  ? {
                      review: topReviews.map((r) => ({
                        "@type": "Review",
                        reviewRating: {
                          "@type": "Rating",
                          ratingValue: r.rating,
                          bestRating: 5,
                          worstRating: 1,
                        },
                        author: {
                          "@type": "Person",
                          name: r.user?.name || "Apprenant Novakou",
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
