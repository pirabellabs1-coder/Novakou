import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centre d'aide — Novakou",
  description:
    "Trouvez des réponses à vos questions sur Novakou : paiements, formations, produits digitaux, compte vendeur et plus encore.",
  openGraph: {
    title: "Centre d'aide — Novakou",
    description: "Trouvez des réponses à toutes vos questions sur Novakou.",
  },
};

export default function AideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
