import { redirect } from "next/navigation";

/**
 * Alias /vendeur/commandes → /vendeur/transactions
 *
 * Migration legacy : les anciennes notifications + emails utilisaient
 * /dashboard/commandes. La page de référence des ventes vendeur est
 * /vendeur/transactions. On conserve cet alias pour compatibilité.
 */
export default function VendeurCommandesAlias() {
  redirect("/vendeur/transactions");
}
