"use client";

/**
 * Badge panier de la barre de navigation publique (invités et connectés).
 * La logique d'appel économe est partagée avec le bouton panier des
 * boutiques : voir `useCompteurPanier`.
 */

import Link from "next/link";
import { useCompteurPanier } from "@/lib/hooks/use-compteur-panier";

export default function CartBadge({ connecte = false }: { connecte?: boolean }) {
  const { count, loading } = useCompteurPanier(connecte);

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
