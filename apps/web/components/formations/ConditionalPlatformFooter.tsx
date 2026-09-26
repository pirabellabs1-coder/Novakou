"use client";

import { usePathname } from "next/navigation";
import { FormationsFooter } from "@/components/formations/FormationsFooter";
import { hidesPlatformChrome } from "@/components/formations/ConditionalPlatformNavbar";
import { isAuthPath } from "@/components/formations/nav/auth-paths";

/**
 * Pied de page plateforme (Novakou), masqué là où il n'a rien à faire :
 *  - fiches produit/formation → c'est le pied de page de la BOUTIQUE du
 *    vendeur qui s'affiche (rendu par Produit/FormationPageClient) ;
 *  - parcours de paiement → aucun décor, aucune sortie ;
 *  - pages d'authentification (connexion, inscription, 2FA…) → le menu reste,
 *    le pied de page non : rien ne doit détourner du formulaire.
 *
 * La règle vit dans `hidesPlatformChrome` : elle était dupliquée ici, et les
 * deux copies avaient déjà divergé.
 */
export function ConditionalPlatformFooter() {
  const pathname = usePathname() || "";
  if (hidesPlatformChrome(pathname) || isAuthPath(pathname)) return null;
  return <FormationsFooter />;
}
