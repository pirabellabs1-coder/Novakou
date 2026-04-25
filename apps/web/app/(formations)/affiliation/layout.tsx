import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programme d'affiliation · Gagnez en recommandant Novakou",
  description:
    "Partagez votre lien unique et recevez une commission sur chaque vente générée. Tableau de bord, suivi des clics et paiements automatiques.",
  openGraph: {
    title: "Affiliation · Novakou",
    description: "Gagnez des commissions en recommandant des formations et produits Novakou.",
    type: "website",
  },
};

export default function AffiliationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
