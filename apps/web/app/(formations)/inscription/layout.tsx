import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte · Novakou",
  description:
    "Inscrivez-vous gratuitement sur Novakou pour vendre vos formations, acheter des produits digitaux ou devenir mentor.",
  openGraph: {
    title: "Créer un compte · Novakou",
    description:
      "Inscrivez-vous gratuitement sur Novakou pour vendre vos formations, acheter des produits digitaux ou devenir mentor.",
    type: "website",
  },
};

export default function InscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
