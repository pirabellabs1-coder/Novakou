// Refonte style KAZA — apprenant panier — 2026-06-07
"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KazaHero, KazaCard, KazaButton, KazaBadge, KazaEmpty } from "@/components/kaza";
import {
  ShoppingCart,
  Search,
  Play,
  Trash2,
  Loader2,
  Lock,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

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

function formatFcfa(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}
function toEur(n: number) {
  return Math.round(n / 655.957);
}

function SkeletonItem() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
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
      <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
        <div className="h-32 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {[0, 1].map((i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
          <div className="lg:w-80 h-64 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
        <KazaHero
          badge="Apprenant"
          badgeColor="blue"
          icon={ShoppingCart}
          title="Votre panier est vide"
          subtitle="Explorez notre catalogue et ajoutez des formations ou produits."
          actions={
            <KazaButton variant="primary" href="/explorer" icon={Search}>
              Explorer le catalogue
            </KazaButton>
          }
        />
        <KazaEmpty
          icon={ShoppingCart}
          title="Aucun article dans votre panier"
          description="Ajoutez des formations à votre panier pour les acheter en une seule fois."
          action={{ label: "Explorer le catalogue", href: "/explorer" }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={ShoppingCart}
        title="Mon panier"
        subtitle={`${items.length} article${items.length > 1 ? "s" : ""} prêt${items.length > 1 ? "s" : ""} à être commandé${items.length > 1 ? "s" : ""}`}
        actions={
          <KazaButton variant="secondary" href="/explorer" icon={Search}>
            Continuer mes achats
          </KazaButton>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => {
            const title = item.formation?.title ?? "Formation";
            const price = item.formation?.price ?? 0;
            const isRemoving =
              removeMutation.isPending && removeMutation.variables === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 text-white overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
                >
                  {item.formation?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.formation.thumbnail}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play className="w-8 h-8" fill="currentColor" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <KazaBadge variant="blue" size="sm">
                          Formation vidéo
                        </KazaBadge>
                        {item.formation?.level && (
                          <KazaBadge variant="violet" size="sm">
                            {item.formation.level}
                          </KazaBadge>
                        )}
                      </div>
                      <h3 className="font-bold text-[#0b2540] text-sm leading-snug mb-1">
                        {title}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      disabled={isRemoving}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors flex-shrink-0"
                      title="Retirer du panier"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-extrabold text-emerald-600 text-base tabular-nums">
                        {formatFcfa(price)}
                      </p>
                      <p className="text-[10px] text-slate-500">≈ {toEur(price)} €</p>
                    </div>
                    <Link
                      href={`/formation/${item.formationId}`}
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      Voir le produit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            href="/explorer"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0b2540] font-medium transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuer mes achats
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:w-80 flex-shrink-0">
          <KazaCard title="Récapitulatif" className="sticky top-24">
            <div className="space-y-3 mb-5">
              {items.map((item) => {
                const title = item.formation?.title ?? "Formation";
                const price = item.formation?.price ?? 0;
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-500 truncate flex-1 mr-2">
                      {title.slice(0, 30)}
                      {title.length > 30 ? "…" : ""}
                    </span>
                    <span className="font-semibold text-[#0b2540] flex-shrink-0 tabular-nums">
                      {formatFcfa(price)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-100 pt-4 mb-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-500">Sous-total</span>
                <span className="text-sm font-semibold text-[#0b2540] tabular-nums">
                  {formatFcfa(total)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-500">Frais</span>
                <span className="text-sm font-semibold text-emerald-600">Gratuit</span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <span className="font-bold text-[#0b2540]">Total</span>
                <div className="text-right">
                  <p className="font-extrabold text-emerald-600 text-lg tabular-nums">
                    {formatFcfa(total)}
                  </p>
                  <p className="text-xs text-slate-500">≈ {toEur(total)} €</p>
                </div>
              </div>
            </div>
            <KazaButton variant="primary" href="/checkout" icon={Lock} className="w-full">
              Passer la commande
            </KazaButton>
            <p className="text-center text-[10px] text-slate-500 my-3">Paiements sécurisés</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {["Orange Money", "Wave", "MTN", "Carte"].map((m) => (
                <span
                  key={m}
                  className="text-[9px] font-semibold px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-100"
                >
                  {m}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-emerald-50">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-[10px] text-emerald-700 font-semibold leading-snug">
                Satisfait ou remboursé 30 jours
              </p>
            </div>
          </KazaCard>
        </div>
      </div>
    </div>
  );
}
