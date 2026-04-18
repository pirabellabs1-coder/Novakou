/**
 * JSON-LD Person + Service structured data for mentor profile pages.
 * Helps Google show mentor cards in search results.
 */

interface MentorJsonLdProps {
  mentor: {
    id: string;
    name: string;
    bio: string;
    specialty: string;
    domain?: string | null;
    sessionPrice: number;
    currency?: string;
    rating?: number;
    reviewsCount?: number;
    coverImage?: string | null;
    languages?: string[];
  };
}

export default function MentorJsonLd({ mentor }: MentorJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  const url = `${baseUrl}/mentors/${mentor.id}`;
  const currency = mentor.currency || "XOF";

  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${mentor.name} — Coaching ${mentor.specialty}`,
    description: mentor.bio,
    url,
    image: mentor.coverImage || undefined,
    provider: {
      "@type": "Person",
      name: mentor.name,
      jobTitle: mentor.specialty,
      knowsAbout: mentor.domain ? [mentor.domain] : undefined,
      knowsLanguage: mentor.languages,
      worksFor: {
        "@type": "Organization",
        name: "Novakou",
      },
    },
    areaServed: "worldwide",
    offers: {
      "@type": "Offer",
      price: String(mentor.sessionPrice),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    },
    ...(mentor.rating && mentor.reviewsCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: mentor.rating.toFixed(1),
            reviewCount: mentor.reviewsCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
