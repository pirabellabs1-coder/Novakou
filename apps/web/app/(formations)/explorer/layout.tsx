import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorer les formations et produits",
  description:
    "Parcourez le catalogue Novakou : formations vidéo, ebooks, templates, coaching. Paiement Mobile Money accepté. Trouvez le produit qui vous correspond.",
  openGraph: {
    title: "Explorer · Novakou",
    description: "Formations, ebooks, templates et coaching pour réussir en Afrique francophone.",
    type: "website",
  },
};

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
