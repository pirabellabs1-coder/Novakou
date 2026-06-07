import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export const metadata: Metadata = {
  title: "Explorer les formations et produits",
  description:
    "Parcourez le catalogue Novakou : formations vidéo, ebooks, templates, coaching. Paiement Mobile Money accepté. Trouvez le produit qui vous correspond.",
  alternates: { canonical: "/explorer" },
  openGraph: {
    title: "Explorer · Novakou",
    description: "Formations, ebooks, templates et coaching pour réussir en Afrique francophone.",
    type: "website",
    url: `${BASE_URL}/explorer`,
    images: [
      {
        url: `${BASE_URL}/api/og?type=default&title=${encodeURIComponent("Explorer le catalogue Novakou")}&subtitle=${encodeURIComponent("Formations, ebooks, templates et coaching pour l'Afrique francophone")}`,
        width: 1200,
        height: 630,
        alt: "Explorer Novakou",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explorer · Novakou",
    description: "Formations, ebooks, templates et coaching pour réussir en Afrique francophone.",
  },
};

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
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
              { "@type": "ListItem", position: 2, name: "Explorer", item: `${BASE_URL}/explorer` },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
