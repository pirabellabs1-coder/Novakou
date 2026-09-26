"use client";

import { usePathname } from "next/navigation";
import { FormationsNavbar } from "@/components/formations/FormationsNavbar";
import { hidesPlatformChrome } from "@/lib/chrome-scope";
import { isAuthPath } from "@/components/formations/nav/auth-paths";

/**
 * Menu plateforme (Novakou), masqué dans l'univers d'un vendeur, pendant le
 * paiement et sur les pages d'authentification.
 *
 * Un acheteur arrivé depuis la boutique d'un vendeur doit y rester : lui
 * afficher le menu général (Explorer, Marketplace, Tarifs…) l'invite à repartir
 * vers d'autres vendeurs depuis la page même où il allait acheter. Ces pages
 * rendent l'en-tête de la BOUTIQUE à la place.
 *
 * Les pages d'authentification portent leur propre en-tête (marque + retour à
 * l'accueil) : l'île flottante en `fixed` passait par-dessus le panneau de
 * gauche et coupait son titre (capture du fondateur, 2026-09-26).
 *
 * Les règles vivent dans `lib/chrome-scope.ts` : tant qu'elles étaient dans ce
 * fichier, aucun test ne pouvait les importer — il porte du JSX. Elles sont
 * réexportées ici pour ne pas casser les appelants existants.
 */
export { isShopScopedPath, isCheckoutPath, hidesPlatformChrome } from "@/lib/chrome-scope";

/** Vrai quand la page ne montre ni l'île de navigation ni son décalage haut. */
function sansMenuPlateforme(pathname: string): boolean {
  return hidesPlatformChrome(pathname) || isAuthPath(pathname);
}

export function ConditionalPlatformNavbar() {
  const pathname = usePathname() || "";
  if (sansMenuPlateforme(pathname)) return null;
  return <FormationsNavbar />;
}

/**
 * Décalage haut du contenu : le menu plateforme est en `fixed` (il faut
 * compenser sa hauteur), celui de la boutique est en `sticky` (il occupe déjà
 * sa place dans le flux). Sans ça, la fiche produit gardait un vide de 4rem.
 *
 * Hauteur de l'île : 8 + 56 px en mobile, 16 + 60 px à partir de `lg`
 * (cf. FormationsNavbar) — les deux valeurs doivent bouger ensemble.
 */
export function MainWithChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const pad = sansMenuPlateforme(pathname) ? "" : "pt-16 lg:pt-[76px]";
  return <main className={`flex-1 ${pad} overflow-x-hidden`}>{children}</main>;
}
