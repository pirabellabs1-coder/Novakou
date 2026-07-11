"use client";

import { usePathname } from "next/navigation";
import { FormationsFooter } from "@/components/formations/FormationsFooter";

/**
 * Footer plateforme (Novakou), MASQUÉ sur les pages produit/formation : celles-ci
 * affichent le pied de page de la BOUTIQUE du vendeur à la place (rendu par
 * ProduitPageClient/FormationPageClient). Ailleurs, footer plateforme normal.
 */
export function ConditionalPlatformFooter() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/produit/") || pathname.startsWith("/formation/")) return null;
  return <FormationsFooter />;
}
