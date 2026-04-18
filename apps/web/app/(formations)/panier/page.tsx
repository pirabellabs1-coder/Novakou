"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

interface CartItem {
  id: string;
  formationId: string;
  formation: {
    id: string;
    slug: string;
    title: string;
    price: number;
    thumbnail: string | null;
    level?: string;
  };
}

interface CartResponse {
  data: CartItem[];
  total: number;
  count: number;
  guest: boolean;
}

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function PanierPage() {
  const toast = useToastStore.getState().addToast;
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/apprenant/cart");
      const j = await res.json();
      setCart(j);
    } catch {
      toast("error", "Impossible de charger votre panier");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function remove(item: CartItem) {
    setRemoving(item.id);
    try {
      const isGuest = cart?.guest;
      const url = isGuest
        ? `/api/formations/apprenant/cart?formationId=${encodeURIComponent(item.formationId)}`
        : `/api/formations/apprenant/cart?id=${encodeURIComponent(item.id)}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast("error", j.error || "Erreur");
        return;
      }
      window.dispatchEvent(new CustomEvent("nk:cart-change"));
      load();
    } finally { setRemoving(null); }
  }

  const isEmpty = !loading && (cart?.count ?? 0) === 0;
  const items = cart?.data ?? [];

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <div className="mb-8">
          <Link
            href="/explorer"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Continuer mes achats
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Mon panier
          </h1>
          {!loading && cart && (
            <p className="text-sm text-slate-500 mt-1">
              <strong className="text-slate-700 tabular-nums">{cart.count}</strong> article{cart.count > 1 ? "s" : ""}
              {cart.guest && <span className="ml-2 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Panier invité</span>}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-3">
              {[0, 1].map((i) => <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}
            </div>
            <div className="h-48 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          </div>
        ) : isEmpty ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-14 text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #006e2f15, #22c55e15)" }}
            >
              <span className="material-symbols-outlined text-4xl text-emerald-700">shopping_cart</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Votre panier est vide</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Parcourez notre catalogue pour ajouter des formations et produits qui vous inspirent.
            </p>
            <Link
              href="/explorer"
              className="inline-block mt-6 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              Explorer le catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 relative">
                    {item.formation.thumbnail ? (
                      <Image
                        src={item.formation.thumbnail}
                        alt={item.formation.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-slate-400">school</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/formation/${item.formation.slug}`}
                      className="text-sm font-bold text-slate-900 hover:text-emerald-700 line-clamp-2"
                    >
                      {item.formation.title}
                    </Link>
                    {item.formation.level && (
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">
                        {item.formation.level}
                      </p>
                    )}
                    <p className="text-base font-extrabold text-emerald-700 tabular-nums mt-1">
                      {fmtFCFA(item.formation.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(item)}
                    disabled={removing === item.id}
                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 disabled:opacity-50"
                    title="Retirer"
                    aria-label="Retirer du panier"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-24 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Résumé de la commande</h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Sous-total</span>
                  <span className="tabular-nums font-bold text-slate-900">{fmtFCFA(cart?.total ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Frais de plateforme</span>
                  <span className="tabular-nums">Inclus</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-xl font-extrabold text-emerald-700 tabular-nums">{fmtFCFA(cart?.total ?? 0)}</span>
              </div>
              <Link
                href={items.length === 1 ? `/checkout?formationId=${items[0].formationId}` : "/checkout?cart=1"}
                className="block w-full text-center px-5 py-3.5 rounded-xl text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                <span className="material-symbols-outlined align-middle text-[18px] mr-1.5">lock</span>
                Passer au paiement
              </Link>
              {cart?.guest && (
                <p className="text-[11px] text-slate-500 text-center">
                  Vous pouvez acheter en tant qu&apos;invité ou <Link href="/connexion?callbackUrl=/panier" className="underline font-bold text-emerald-700">vous connecter</Link> pour sauvegarder votre panier.
                </p>
              )}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                <div className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">shield</span>
                  Paiement sécurisé (SSL)
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">refresh</span>
                  Garantie 14 jours satisfait ou remboursé
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
