"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type CartItem = {
  id: string;
  formationId: string;
  formation?: {
    id: string;
    title: string;
    thumbnail: string | null;
    level: string | null;
    price: number;
  } | null;
};

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

function SkeletonItem() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function PanierPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-cart"],
    queryFn: () => fetch("/api/formations/apprenant/cart").then((r) => r.json()),
    staleTime: 15_000,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) =>
      fetch(`/api/formations/apprenant/cart?id=${itemId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apprenant-cart"] });
      qc.invalidateQueries({ queryKey: ["apprenant-cart-count"] });
    },
  });

  const items: CartItem[] = data?.data ?? [];
  const total = items.reduce((s, item) => s + (item.formation?.price ?? 0), 0);

  if (isLoading) {
    return (
      <div className="p-5 md:p-8 max-w-5xl mx-auto">
        <div className="h-8 bg-gray-100 rounded w-40 mb-6 animate-pulse" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">{[0,1].map((i) => <SkeletonItem key={i} />)}</div>
          <div className="lg:w-80 h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-5 md:p-8 max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-[40px] text-[#5c647a]">shopping_cart</span>
        </div>
        <h1 className="text-xl font-extrabold text-[#191c1e] mb-2">Votre panier est vide</h1>
        <p className="text-sm text-[#5c647a] mb-6">Explorez notre catalogue et ajoutez des formations ou produits.</p>
        <Link href="/explorer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
          <span className="material-symbols-outlined text-[18px]">explore</span>
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-[#191c1e]">Mon panier</h1>
        <span className="bg-[#006e2f]/10 text-[#006e2f] text-xs font-bold px-2.5 py-1 rounded-full">
          {items.length} article{items.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => {
            const title = item.formation?.title ?? "Formation";
            const price = item.formation?.price ?? 0;
            const isRemoving = removeMutation.isPending && removeMutation.variables === item.id;

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
                  <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_circle
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Formation vidéo
                        </span>
                        {item.formation?.level && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {item.formation.level}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#191c1e] text-sm leading-snug mb-1">{title}</h3>
                    </div>
                    <button onClick={() => removeMutation.mutate(item.id)} disabled={isRemoving}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500 transition-colors flex-shrink-0"
                      title="Retirer du panier">
                      <span className="material-symbols-outlined text-[18px]">{isRemoving ? "hourglass_empty" : "delete"}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-extrabold text-[#006e2f] text-base">{formatFcfa(price)}</p>
                      <p className="text-[10px] text-[#5c647a]">≈ {toEur(price)} €</p>
                    </div>
                    <Link href={`/formation/${item.formationId}`}
                      className="text-xs text-[#006e2f] font-semibold hover:underline">
                      Voir le produit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          <Link href="/explorer"
            className="flex items-center gap-2 text-sm text-[#5c647a] hover:text-[#006e2f] font-medium transition-colors w-fit">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Continuer mes achats
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="font-bold text-[#191c1e] mb-5">Récapitulatif</h2>
            <div className="space-y-3 mb-5">
              {items.map((item) => {
                const title = item.formation?.title ?? "Formation";
                const price = item.formation?.price ?? 0;
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#5c647a] truncate flex-1 mr-2">{title.slice(0, 30)}{title.length > 30 ? "…" : ""}</span>
                    <span className="font-semibold text-[#191c1e] flex-shrink-0">{formatFcfa(price)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-[#5c647a]">Sous-total</span>
                <span className="text-sm font-semibold text-[#191c1e]">{formatFcfa(total)}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-[#5c647a]">Frais</span>
                <span className="text-sm font-semibold text-[#006e2f]">Gratuit</span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span className="font-bold text-[#191c1e]">Total</span>
                <div className="text-right">
                  <p className="font-extrabold text-[#006e2f] text-lg">{formatFcfa(total)}</p>
                  <p className="text-xs text-[#5c647a]">≈ {toEur(total)} €</p>
                </div>
              </div>
            </div>
            <Link href="/checkout"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 mb-3"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
              <span className="material-symbols-outlined text-[18px]">lock</span>
              Passer la commande
            </Link>
            <p className="text-center text-[10px] text-[#5c647a] mb-3">Paiements sécurisés</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {["Orange Money", "Wave", "MTN", "Carte"].map((m) => (
                <span key={m} className="text-[9px] font-semibold px-2 py-1 rounded bg-gray-50 text-[#5c647a] border border-gray-100">{m}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-green-50">
              <span className="material-symbols-outlined text-[#006e2f] text-[18px]">verified_user</span>
              <p className="text-[10px] text-[#006e2f] font-semibold leading-snug">Satisfait ou remboursé 30 jours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
