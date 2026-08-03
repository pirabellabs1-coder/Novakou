"use client";

import { usePathname } from "next/navigation";
import { FormationsNavbar } from "@/components/formations/FormationsNavbar";
import { hidesPlatformChrome } from "@/lib/chrome-scope";

/**
 * Menu plateforme (Novakou), masqué dans l'univers d'un vendeur et pendant le
 * paiement.
 *
 * Un acheteur arrivé depuis la boutique d'un vendeur doit y rester : lui
 * afficher le menu général (Explorer, Marketplace, Tarifs…) l'invite à repartir
 * vers d'autres vendeurs depuis la page même où il allait acheter. Ces pages
 * rendent l'en-tête de la BOUTIQUE à la place.
 *
 * Les règles vivent dans `lib/chrome-scope.ts` : tant qu'elles étaient dans ce
 * fichier, aucun test ne pouvait les importer — il porte du JSX. Elles sont
 * réexportées ici pour ne pas casser les appelants existants.
 */
export { isShopScopedPath, isCheckoutPath, hidesPlatformChrome } from "@/lib/chrome-scope";

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
