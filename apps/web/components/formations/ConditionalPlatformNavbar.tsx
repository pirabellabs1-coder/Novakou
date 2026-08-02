"use client";

import { usePathname } from "next/navigation";
import { FormationsNavbar } from "@/components/formations/FormationsNavbar";

/**
 * Menu plateforme (Novakou), MASQUÉ sur les fiches produit/formation.
 *
 * POURQUOI : un acheteur arrivé depuis la boutique d'un vendeur doit rester
 * dans l'univers de cette boutique. Lui afficher le menu général (Explorer,
 * Marketplace, Tarifs…) l'invitait à repartir vers d'autres vendeurs depuis la
 * page même où il était sur le point d'acheter.
 *
 * Ces pages rendent l'en-tête de la BOUTIQUE à la place (ShopHeader dans
 * ProduitPageClient / FormationPageClient) ; si le produit n'appartient à
 * aucune boutique, elles retombent sur le menu plateforme. Même logique que
 * ConditionalPlatformFooter, qui fait déjà ça pour le pied de page.
 */
export function isShopScopedPath(pathname: string): boolean {
  return pathname.startsWith("/produit/") || pathname.startsWith("/formation/");
}

export function ConditionalPlatformNavbar() {
  const pathname = usePathname() || "";
  if (isShopScopedPath(pathname)) return null;
  return <FormationsNavbar />;
}

/**
 * Décalage haut du contenu : le menu plateforme est en `fixed` (il faut
 * compenser sa hauteur), celui de la boutique est en `sticky` (il occupe déjà
 * sa place dans le flux). Sans ça, la fiche produit gardait un vide de 4rem.
 */
export function MainWithChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const pad = isShopScopedPath(pathname) ? "" : "pt-16";
  return <main className={`flex-1 ${pad} overflow-x-hidden`}>{children}</main>;
}
