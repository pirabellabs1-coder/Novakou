import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const mentor = await prisma.mentorProfile.findUnique({
    where: { id },
    select: {
      specialty: true,
      bio: true,
      domain: true,
      user: { select: { name: true, image: true } },
    },
  }).catch(() => null);

  if (!mentor) {
    return { title: "Mentor introuvable" };
  }

  const name = mentor.user?.name ?? "Mentor";
  const specialty = mentor.specialty || mentor.domain || "Mentor";
  const title = `${name} — ${specialty} | Novakou`;
  const description = mentor.bio
    ? mentor.bio.slice(0, 160)
    : `Réservez une session de mentorat avec ${name} sur Novakou.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  // Si pas de photo de profil → on génère une OG image Novakou-branded via
  // /api/og avec le nom + la spécialité. Sinon les partages sociaux
  // n'auraient aucun visuel.
  const ogImage = mentor.user?.image
    ? mentor.user.image
    : `${baseUrl}/api/og?type=mentor&title=${encodeURIComponent(name)}&subtitle=${encodeURIComponent(specialty)}`;

  return {
    title,
    description,
    alternates: { canonical: `/mentors/${id}` },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${baseUrl}/mentors/${id}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function MentorLayout({ params, children }: Props) {
  const { id } = await params;
  // JSON-LD Person schema injecté côté server pour que Google le voit
  // dès le premier crawl (le page.tsx est client-side, il n'aurait
  // été indexé qu'au runtime). Améliore les chances d'apparaître dans
  // les rich results "personne" + Knowledge Graph.
  const mentor = await prisma.mentorProfile
    .findUnique({
      where: { id },
      select: {
        specialty: true,
        bio: true,
        domain: true,
        sessionPrice: true,
        rating: true,
        reviewsCount: true,
        user: { select: { name: true, image: true } },
      },
    })
    .catch(() => null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

  return (
    <>
      {mentor && mentor.user?.name && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: mentor.user.name,
              jobTitle: mentor.specialty || mentor.domain || "Mentor",
              description: (mentor.bio || "").slice(0, 500),
              url: `${baseUrl}/mentors/${id}`,
              ...(mentor.user.image ? { image: mentor.user.image } : {}),
              ...(mentor.rating && mentor.reviewsCount
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: mentor.rating,
                      reviewCount: mentor.reviewsCount,
                      bestRating: 5,
                      worstRating: 1,
                    },
                  }
                : {}),
              worksFor: { "@type": "Organization", name: "Novakou", url: baseUrl },
              ...(mentor.sessionPrice
                ? {
                    offers: {
                      "@type": "Offer",
                      price: mentor.sessionPrice,
                      priceCurrency: "XOF",
                      description: "Session de mentorat individuelle",
                    },
                  }
                : {}),
            }),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
              { "@type": "ListItem", position: 2, name: "Mentors", item: `${baseUrl}/mentors` },
              { "@type": "ListItem", position: 3, name: mentor?.user?.name || "Mentor" },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
