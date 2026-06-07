import type { Metadata } from "next";
import { ARTICLES } from "@/lib/help/articles";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export const metadata: Metadata = {
  title: "Centre d'aide — Novakou",
  description:
    "Trouvez des réponses à vos questions sur Novakou : paiements, formations, produits digitaux, compte vendeur et plus encore.",
  alternates: { canonical: "/aide" },
  openGraph: {
    title: "Centre d'aide — Novakou",
    description: "Trouvez des réponses à toutes vos questions sur Novakou.",
    url: `${BASE_URL}/aide`,
    images: [
      {
        url: `${BASE_URL}/api/og?type=guide&title=${encodeURIComponent("Centre d'aide Novakou")}&subtitle=${encodeURIComponent(`${ARTICLES.length} articles pour tout maîtriser sur Novakou`)}`,
        width: 1200,
        height: 630,
        alt: "Centre d'aide Novakou",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Centre d'aide — Novakou",
    description: "Trouvez des réponses à toutes vos questions sur Novakou.",
  },
};

// On prend les 12 articles les plus représentatifs (un par catégorie + top
// articles "démarrer/vendre/payer") pour générer un FAQPage JSON-LD qui sera
// crawlé par Google et affiché en accordéon directement dans la SERP. Boost
// majeur de visibilité — un seul résultat occupe alors plusieurs lignes.
const FAQ_ARTICLE_SLUGS = [
  "creer-un-compte",
  "verification-kyc",
  "creer-formation",
  "creer-produit-digital",
  "methodes-paiement",
  "retirer-mes-gains",
  "acheter-formation",
  "reserver-mentor",
  "devenir-mentor",
  "activer-2fa",
  "paiement-echoue",
  "contacter-support",
];

export default function AideLayout({ children }: { children: React.ReactNode }) {
  const faqEntries = FAQ_ARTICLE_SLUGS
    .map((slug) => ARTICLES.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .slice(0, 12);

  return (
    <>
      {faqEntries.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqEntries.map((a) => ({
                "@type": "Question",
                name: a.title,
                acceptedAnswer: {
                  "@type": "Answer",
                  // Google demande une réponse longue (≥40 mots) pour valider
                  // FAQPage. On combine excerpt + premières lignes du body.
                  text: `${a.excerpt} ${a.body.replace(/[#*_`>\-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 500)}`.slice(0, 700),
                },
              })),
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
              { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
              { "@type": "ListItem", position: 2, name: "Centre d'aide", item: `${BASE_URL}/aide` },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
