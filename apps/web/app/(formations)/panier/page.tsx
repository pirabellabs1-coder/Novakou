import type { Metadata } from "next";
import PanierClient from "./PanierClient";

// Le contenu est un composant client (état du panier, stockage local) : un
// composant client ne peut pas exporter de métadonnées, la page tombait donc
// sur le titre générique du site. D'où cette enveloppe serveur.
export const metadata: Metadata = {
  title: "Votre panier · Novakou",
  description: "Vos formations et produits sélectionnés, prêts à être commandés.",
  // Un panier est propre à chaque visiteur : rien à indexer, et une page de
  // panier dans les résultats de recherche n'apporte que de la confusion.
  robots: { index: false, follow: true },
};

export default function PanierPage() {
  return <PanierClient />;
}
