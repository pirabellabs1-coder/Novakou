import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveRootSlug } from "@/lib/root-slug";

import BoutiquePage, { generateMetadata as boutiqueMetadata } from "@/app/boutique/[slug]/page";
import ProduitPage, { generateMetadata as produitMetadata } from "@/app/(formations)/produit/[slug]/page";
import FormationPage, { generateMetadata as formationMetadata } from "@/app/(formations)/formation/[slug]/page";

/**
 * Adresses courtes : `novakou.com/<slug>`.
 *
 * Une boutique, un produit ou une formation s'ouvre directement à la racine,
 * sans « /boutique/ » ni « /produit/ » devant. Les anciennes adresses sont
 * redirigées en permanent par le middleware, donc rien de ce qui a déjà été
 * partagé ne casse.
 *
 * Cette page ne réimplémente RIEN : elle identifie ce que désigne le slug,
 * puis délègue à la page existante en l'appelant comme une fonction — ce que
 * permettent les composants serveur. Dupliquer le rendu ici aurait garanti que
 * les deux versions divergent à la première correction faite d'un seul côté.
 *
 * Next.js sert toujours un segment statique avant un segment dynamique :
 * `/explorer` ou `/checkout` continuent d'être servis par leur propre page, ce
 * résolveur ne voit que ce qui n'appartient à aucune route connue.
 */

// Même contrainte que les pages déléguées : le layout racine lit la locale via
// next-intl, ce qui rend la route dynamique de toute façon.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ rootSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rootSlug } = await params;
  const kind = await resolveRootSlug(rootSlug);
  const p = Promise.resolve({ slug: rootSlug });

  if (kind === "shop") return boutiqueMetadata({ params: p });
  if (kind === "product") return produitMetadata({ params: p });
  if (kind === "formation") return formationMetadata({ params: p });

  // Ne pas laisser indexer une adresse qui ne mène nulle part.
  return { title: "Page introuvable", robots: { index: false, follow: false } };
}

export default async function RootSlugPage({ params }: Props) {
  const { rootSlug } = await params;
  const kind = await resolveRootSlug(rootSlug);
  const p = Promise.resolve({ slug: rootSlug });

  if (kind === "shop") return BoutiquePage({ params: p });
  if (kind === "product") return ProduitPage({ params: p });
  if (kind === "formation") return FormationPage({ params: p });

  notFound();
}
