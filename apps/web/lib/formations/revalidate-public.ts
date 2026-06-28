import { revalidatePath } from "next/cache";

/**
 * Rafraîchit IMMÉDIATEMENT les pages publiques en cache (ISR) qui affichent
 * des compteurs de ventes / le catalogue, pour qu'une vente fraîche soit
 * visible tout de suite — au lieu d'attendre l'expiration ISR (revalidate=300)
 * qui, sur trafic faible, peut laisser un compteur figé bien plus longtemps.
 *
 * Best-effort : ne JAMAIS casser le fulfillment si la revalidation échoue.
 * À appeler uniquement depuis un contexte requête (route handler / server action).
 */
export function revalidatePublicCatalog() {
  try {
    revalidatePath("/");                          // home : best-sellers + catalogue
    revalidatePath("/explorer");                  // marketplace (si rendu serveur)
    revalidatePath("/produit/[slug]", "page");    // toutes les fiches produit
    revalidatePath("/formation/[slug]", "page");  // toutes les fiches formation
  } catch (e) {
    console.error("[revalidatePublicCatalog]", (e as Error)?.message ?? e);
  }
}
