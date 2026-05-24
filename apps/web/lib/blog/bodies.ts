// Mapping slug → composant React du corps de l'article.
//
// Stratégie : chaque article est un composant React server-side dans
// /app/(formations)/blog/[slug]/_bodies/*.tsx. On les importe ici (pas
// de dynamic import : on veut SSG, tout est statique).
//
// Ajouter un nouvel article :
//   1. Créer le fichier dans _bodies/<slug>.tsx avec un default export
//      qui est un ComposantServer renvoyant le markup HTML/JSX.
//   2. Ajouter une entrée dans BLOG_ARTICLES (lib/blog/articles.ts).
//   3. Ajouter l'import + entry ici dans BODIES.

import type { FC } from "react";

import VendreFormationAfrique from "@/app/(formations)/blog/[slug]/_bodies/vendre-formation-en-ligne-afrique-2026";
import MobileMoneyPaiement from "@/app/(formations)/blog/[slug]/_bodies/mobile-money-orange-wave-mtn-guide-paiement";
import IdeesProduits from "@/app/(formations)/blog/[slug]/_bodies/trouver-idee-produit-digital-rentable";
import PubliciteFacebook from "@/app/(formations)/blog/[slug]/_bodies/publicite-facebook-instagram-afrique-budget-bas";
import TunnelVente from "@/app/(formations)/blog/[slug]/_bodies/tunnel-vente-novakou-augmenter-conversions";
import CasPratiqueAicha from "@/app/(formations)/blog/[slug]/_bodies/premier-1000-euros-formation-digitale-cas-pratique";

const BODIES: Record<string, FC> = {
  "vendre-formation-en-ligne-afrique-2026": VendreFormationAfrique,
  "mobile-money-orange-wave-mtn-guide-paiement": MobileMoneyPaiement,
  "trouver-idee-produit-digital-rentable": IdeesProduits,
  "publicite-facebook-instagram-afrique-budget-bas": PubliciteFacebook,
  "tunnel-vente-novakou-augmenter-conversions": TunnelVente,
  "premier-1000-euros-formation-digitale-cas-pratique": CasPratiqueAicha,
};

export function getArticleBody(slug: string): FC | null {
  return BODIES[slug] ?? null;
}
