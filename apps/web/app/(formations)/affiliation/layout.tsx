import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export const metadata: Metadata = {
  // Title raccourci sous 60 char (avant: "Programme d'affiliation · Gagnez
  // en recommandant Novakou" = 71c, dépassait la limite Google + ajout du
  // suffix automatique "| Novakou").
  title: "Affiliation Novakou · Gagnez par recommandation",
  description:
    "Partagez votre lien unique et recevez une commission sur chaque vente générée. Tableau de bord, suivi des clics et paiements automatiques.",
  alternates: { canonical: "/affiliation" },
  openGraph: {
    title: "Affiliation · Novakou",
    description: "Gagnez des commissions en recommandant des formations et produits Novakou.",
    type: "website",
    url: `${BASE_URL}/affiliation`,
    images: [
      {
        url: `${BASE_URL}/api/og?type=default&title=${encodeURIComponent("Programme d'affiliation Novakou")}&subtitle=${encodeURIComponent("Gagnez des commissions en recommandant les formations et produits.")}`,
        width: 1200,
        height: 630,
        alt: "Affiliation Novakou",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Affiliation · Novakou",
    description: "Gagnez des commissions en recommandant Novakou.",
  },
};

export default function AffiliationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
