"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

/**
 * Panier dans l'île de la boutique. Même source que le badge de la plateforme
 * (`/api/formations/apprenant/cart`, invités compris), rafraîchi au retour sur
 * l'onglet et quand une carte ajoute un article (`nk:cart-change`) — sans
 * interrogation périodique : rien ne change dans le panier sans action ici.
 */
export function ShopCartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let actif = true;
    const charger = () => {
      fetch("/api/formations/apprenant/cart")
        .then((r) => r.json())
        .then((j) => {
          if (actif) setCount(Number(j?.count ?? 0));
        })
        .catch(() => {
          // Panier indisponible : le lien reste utilisable, sans compteur.
        });
    };
    charger();
    window.addEventListener("focus", charger);
    window.addEventListener("nk:cart-change", charger);
    return () => {
      actif = false;
      window.removeEventListener("focus", charger);
      window.removeEventListener("nk:cart-change", charger);
    };
  }, []);

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
