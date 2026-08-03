import { isReservedSlug } from "@/lib/reserved-slugs";

/**
 * Où le décor de la plateforme (menu général, pied de page) doit disparaître.
 *
 * Ce sont des règles, pas de l'interface : elles vivaient dans un composant, ce
 * qui les rendait intestables — le fichier porte du JSX, un test ne peut pas
 * l'importer. Elles sont donc ici, et le composant les consomme.
 */

/**
 * Univers d'un VENDEUR : boutique, fiche produit, fiche formation.
 *
 * Un acheteur arrivé depuis la boutique d'un vendeur doit y rester. Lui
 * afficher le menu général (Explorer, Marketplace, Tarifs…) l'invite à repartir
 * vers d'autres vendeurs depuis la page même où il allait acheter.
 */
export function isShopScopedPath(pathname: string): boolean {
  // Anciennes adresses, encore atteintes en interne avant redirection.
  if (
    pathname.startsWith("/produit/") ||
    pathname.startsWith("/formation/") ||
    pathname.startsWith("/boutique/")
  ) {
    return true;
  }

  // ADRESSES COURTES. Boutiques, produits et formations vivent à la racine :
  // « /50-cv-et-lettres » ou « /fidel-yao ». Le test par préfixe ne
  // reconnaissait plus rien — le menu plateforme est réapparu sur toutes les
  // pages vendeur du jour au lendemain.
  //
  // On ne peut pas interroger la base depuis un composant client : on applique
  // exactement la règle du middleware. Un segment racine qui n'appartient pas à
  // la plateforme désigne forcément l'univers d'un vendeur.
  const racine = pathname.match(/^\/([^/.]+)(\/[^/.]+)?$/);
  return Boolean(racine && !isReservedSlug(racine[1]));
}

/**
 * Parcours de paiement : ni menu, ni pied de page.
 *
 * Une page où l'acheteur sort sa carte ou son téléphone ne doit rien proposer
 * d'autre. Le menu affichait « Créer ma boutique », un panier et un burger —
 * autant de sorties au moment précis où l'on demande de payer.
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
