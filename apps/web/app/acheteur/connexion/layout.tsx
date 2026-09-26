import type { Metadata } from "next";

// La page est un composant client : ses métadonnées vivent ici. Sans elles,
// l'onglet affichait le titre par défaut du site.
export const metadata: Metadata = {
  title: "Accéder à mes achats — Espace acheteur",
  description:
    "Connexion sans mot de passe par code sécurisé : retrouvez vos formations, produits numériques et téléchargements achetés sur Novakou.",
  robots: { index: false, follow: false },
};

export default function AcheteurConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
