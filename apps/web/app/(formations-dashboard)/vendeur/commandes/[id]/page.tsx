import { redirect } from "next/navigation";

/**
 * Alias /vendeur/commandes/[id] → /vendeur/transactions
 *
 * Les anciennes notifications utilisaient /dashboard/commandes/${id}.
 * On redirige vers la page transactions du vendeur (où il voit ses ventes).
 */
export default async function VendeurCommandeDetailAlias() {
  redirect("/vendeur/transactions");
}
