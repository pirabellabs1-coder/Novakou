/**
 * JSON-LD Course structured data for formation pages.
 * Rendered server-side so Google/Bing can parse it without JS execution.
 *
 * Schema.org Course spec: https://schema.org/Course
 * Google docs: https://developers.google.com/search/docs/appearance/structured-data/course
 */

interface FormationJsonLdProps {
  formation: {
    title: string;
    description: string;
    slug: string;
    price: number;
    currency?: string;
    rating?: number;
    reviewsCount?: number;
    studentsCount?: number;
    thumbnail?: string | null;
    instructor?: { name: string; id?: string } | null;
    level?: string | null;
    duration?: number | null; // minutes
    language?: string;
    createdAt?: Date | string;
  };
}

export default function FormationJsonLd({ formation }: FormationJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  const url = `${baseUrl}/formation/${formation.slug}`;
  const currency = formation.currency || "XOF";

  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: formation.title,
    description: formation.description,
    url,
    image: formation.thumbnail || undefined,
    inLanguage: formation.language || "fr",
    provider: {
      "@type": "Organization",
      name: "Novakou",
      sameAs: baseUrl,
    },
    ...(formation.instructor && {
      instructor: {
        "@type": "Person",
        name: formation.instructor.name,
      },
    }),
    offers: {
      "@type": "Offer",
      url,
      price: String(formation.price || 0),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      category: "Paid",
    },
    ...(formation.rating && formation.reviewsCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: formation.rating.toFixed(1),
            reviewCount: formation.reviewsCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(formation.studentsCount && {
      audience: {
        "@type": "EducationalAudience",
        audienceType: "learners",
      },
    }),
    ...(formation.duration && {
      timeRequired: `PT${Math.round(formation.duration / 60)}H`, // ISO 8601 duration
    }),
    ...(formation.level && {
      educationalLevel: formation.level,
    }),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      inLanguage: formation.language || "fr",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
