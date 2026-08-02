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

/**
 * Parcours de paiement : ni menu plateforme, ni pied de page.
 *
 * Une page où l'acheteur sort sa carte ou son téléphone ne doit rien proposer
 * d'autre. Le menu affichait « Créer ma boutique », un panier et un burger —
 * autant de sorties au moment précis où l'on demande de payer — et le pied de
 * page ajoutait des dizaines de liens sous le bouton.
 */
export function isCheckoutPath(pathname: string): boolean {
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/payment/") ||
    pathname.startsWith("/payer/")
  );
}

/** Vrai si le décor de la plateforme doit disparaître complètement. */
export function hidesPlatformChrome(pathname: string): boolean {
  return isShopScopedPath(pathname) || isCheckoutPath(pathname);
}

export function ConditionalPlatformNavbar() {
  const pathname = usePathname() || "";
  if (hidesPlatformChrome(pathname)) return null;
  return <FormationsNavbar />;
}

/**
 * Décalage haut du contenu : le menu plateforme est en `fixed` (il faut
 * compenser sa hauteur), celui de la boutique est en `sticky` (il occupe déjà
 * sa place dans le flux). Sans ça, la fiche produit gardait un vide de 4rem.
 */
export function MainWithChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const pad = hidesPlatformChrome(pathname) ? "" : "pt-16";
  return <main className={`flex-1 ${pad} overflow-x-hidden`}>{children}</main>;
}
