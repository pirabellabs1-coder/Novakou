import { redirect } from "next/navigation";

/**
 * Alias /vendeur/services → /vendeur/produits
 *
 * "Services" était l'ancien nom marketplace. La page actuelle des produits
 * vendeur (formations + produits digitaux + bundles + memberships) est
 * /vendeur/produits.
 */
export default function VendeurServicesAlias() {
  redirect("/vendeur/produits");
}
