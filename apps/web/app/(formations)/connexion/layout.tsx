import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion · Novakou",
  description:
    "Connectez-vous à votre espace Novakou pour accéder à vos formations, produits et outils de vente.",
  openGraph: {
    title: "Connexion · Novakou",
    description:
      "Connectez-vous à votre espace Novakou pour accéder à vos formations, produits et outils de vente.",
    type: "website",
  },
};

export default function ConnexionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
