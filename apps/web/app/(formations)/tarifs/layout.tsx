import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs · 10% de commission, zéro abonnement",
  description:
    "Novakou prélève uniquement 10% sur vos ventes. Aucun abonnement mensuel, aucun frais caché. Comparez avec Gumroad, Hotmart et Systeme.io.",
  openGraph: {
    title: "Tarifs · Novakou",
    description: "10% de commission par vente. Pas d'abonnement. Toutes les fonctionnalités incluses.",
    type: "website",
  },
};

export default function TarifsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
