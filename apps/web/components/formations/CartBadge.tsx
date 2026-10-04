"use client";

/**
 * Badge panier de la barre de navigation publique (invités et connectés).
 *
 * N'appelle le serveur QUE s'il peut y avoir quelque chose dans le panier :
 * visiteur connecté, ou visiteur porteur du cookie de panier invité. Avant,
 * chaque page vue appelait l'API — puis toutes les 30 s — pour TOUS les
 * visiteurs des pubs, dont l'immense majorité n'a jamais rien ajouté : c'était
 * la première source d'exécutions de fonctions par visite.
 *
 * La mise à jour reste immédiate à l'ajout (événement `nk:cart-change`) ; au
 * retour sur l'onglet, on relit au plus une fois toutes les 2 min.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

const RELECTURE_MIN_MS = 2 * 60_000;

function aUnPanierInvite(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith("nk_guest_cart="));
}

export default function CartBadge({ connecte = false }: { connecte?: boolean }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/formations/apprenant/cart");
      const j = await res.json();
      setCount(Number(j?.count ?? 0));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const peutAvoirDesArticles = () => connecte || aUnPanierInvite();
    let dernier = Date.now();

    if (peutAvoirDesArticles()) {
      load();
    } else {
      setCount(0);
      setLoading(false);
    }

    const onFocus = () => {
      if (!peutAvoirDesArticles() || Date.now() - dernier < RELECTURE_MIN_MS) return;
      dernier = Date.now();
      load();
    };
    // Ajout ou retrait d'un article : relecture immédiate (le cookie invité
    // vient peut-être d'être créé).
    const onCustom = () => {
      dernier = Date.now();
      load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("nk:cart-change", onCustom);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("nk:cart-change", onCustom);
    };
  }, [connecte]);

  return (
    <Link
      href="/panier"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
      aria-label={`Panier (${count})`}
      title="Mon panier"
    >
      <span className="material-symbols-outlined text-[22px] text-slate-700">
        shopping_cart
      </span>
      {!loading && count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white"
          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
