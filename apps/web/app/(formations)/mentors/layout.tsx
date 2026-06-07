import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export const metadata: Metadata = {
  title: "Mentors · Réservez un appel avec un expert",
  description:
    "Trouvez un mentor spécialisé en business, marketing, design ou tech. Réservez une session de mentorat individuel et progressez plus vite.",
  alternates: { canonical: "/mentors" },
  openGraph: {
    title: "Mentors · Novakou",
    description: "Sessions de mentorat individuelles avec des experts africains et internationaux.",
    type: "website",
    url: `${BASE_URL}/mentors`,
    images: [
      {
        url: `${BASE_URL}/api/og?type=mentor&title=${encodeURIComponent("Réservez votre mentor expert")}&subtitle=${encodeURIComponent("Business, marketing, design, tech. Experts africains et internationaux.")}`,
        width: 1200,
        height: 630,
        alt: "Mentors Novakou",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentors · Novakou",
    description: "Sessions de mentorat individuelles avec des experts.",
  },
};

export default function MentorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
              { "@type": "ListItem", position: 2, name: "Mentors", item: `${BASE_URL}/mentors` },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
