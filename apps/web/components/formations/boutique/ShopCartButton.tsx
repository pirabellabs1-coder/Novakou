"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCompteurPanier } from "@/lib/hooks/use-compteur-panier";

/**
 * Panier dans l'île de la boutique. Même source et même logique économe que
 * le badge de la plateforme (`useCompteurPanier`) : le serveur n'est appelé
 * que pour un visiteur connecté ou porteur d'un panier invité. `useSession`
 * lit la session déjà chargée par le fournisseur — aucun appel en plus.
 */
export function ShopCartButton() {
  const { status } = useSession();
  const { count } = useCompteurPanier(status === "authenticated");

  const libelle = count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier";
  return (
    <Link href="/panier" className="nkb-disc" aria-label={libelle} title="Mon panier">
      <ShoppingCart strokeWidth={1.75} aria-hidden="true" />
      {count > 0 && (
        <span className="nkb-disc__n" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
