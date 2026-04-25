import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Fonctionnalités Novakou : boutique, tunnels, paiements Mobile Money, IA | 2026",
  description:
    "Découvrez toutes les fonctionnalités Novakou : boutique en ligne, tunnels de vente, paiements Orange Money / Wave / MTN, assistant IA, hébergement vidéo, certificats automatiques, programme d'affiliation. Tout inclus, zéro abonnement fixe.",
  keywords: [
    "fonctionnalités Novakou",
    "vendre formations en ligne Afrique",
    "paiement Mobile Money formation",
    "tunnel de vente créateur contenu africain",
    "plateforme e-learning Afrique francophone",
    "héberger formation en ligne Afrique",
    "Orange Money Wave MTN formation",
    "créer boutique en ligne Sénégal",
    "affiliation formation en ligne",
  ],
  openGraph: {
    title:
      "Fonctionnalités Novakou : tout ce qu'il faut pour vendre en Afrique francophone",
    description:
      "Boutique, tunnels de vente, paiements Mobile Money, assistant IA, hébergement vidéo, automatisations, affiliation. Novakou est la seule plateforme conçue pour les créateurs africains.",
    type: "website",
  },
};

export default function FonctionnalitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
