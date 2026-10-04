"use client";

import { useEffect, useState } from "react";

const RELECTURE_MIN_MS = 2 * 60_000;

function aUnPanierInvite(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith("nk_guest_cart="));
}

/**
 * Nombre d'articles du panier, pour les badges (barre de la plateforme et
 * barre des boutiques).
 *
 * N'appelle le serveur QUE s'il peut y avoir quelque chose dans le panier :
 * visiteur connecté, ou porteur du cookie de panier invité (lisible côté
 * navigateur). Avant, chaque badge appelait l'API à chaque page vue et à
 * chaque retour d'onglet, pour TOUS les visiteurs — dont l'immense majorité
 * n'a jamais rien ajouté : une exécution de fonction par page, pour rien.
 *
 * Ajout ou retrait d'un article (`nk:cart-change`) : relecture immédiate.
 * Retour sur l'onglet : au plus une relecture toutes les 2 min.
 */
export function useCompteurPanier(connecte: boolean) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let actif = true;
    let dernier = Date.now();
    const peutAvoirDesArticles = () => connecte || aUnPanierInvite();

    const charger = () => {
      dernier = Date.now();
      fetch("/api/formations/apprenant/cart")
        .then((r) => r.json())
        .then((j) => {
          if (actif) setCount(Number(j?.count ?? 0));
        })
        .catch(() => {
          /* panier indisponible : le lien reste utilisable, sans compteur */
        })
        .finally(() => {
          if (actif) setLoading(false);
        });
    };

    if (peutAvoirDesArticles()) {
      charger();
    } else {
      setCount(0);
      setLoading(false);
    }

    const auFocus = () => {
      if (peutAvoirDesArticles() && Date.now() - dernier >= RELECTURE_MIN_MS) charger();
    };
    window.addEventListener("focus", auFocus);
    window.addEventListener("nk:cart-change", charger);
    return () => {
      actif = false;
      window.removeEventListener("focus", auFocus);
      window.removeEventListener("nk:cart-change", charger);
    };
  }, [connecte]);

  return { count, loading };
}
