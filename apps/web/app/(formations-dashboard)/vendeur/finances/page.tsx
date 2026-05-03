import { redirect } from "next/navigation";

/**
 * Alias /vendeur/finances → /vendeur/transactions
 *
 * Migration legacy : les anciennes notifications + emails utilisaient
 * /dashboard/finances. /vendeur/transactions affiche revenus + retraits.
 */
export default function VendeurFinancesAlias() {
  redirect("/vendeur/transactions");
}
