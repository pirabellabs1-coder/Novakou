// Refonte design "Stitch" — apprenant panier — vert Novakou — 2026-06-13
"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StCard, StPageHeader, StButton, StChip, StSectionTitle, ST } from "@/components/stitch";
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
    <div className="rounded-[18px] bg-white p-5 flex gap-4 animate-pulse" style={{ border: `1px solid ${ST.cardBorder}` }}>
      <div className="w-20 h-20 rounded-xl flex-shrink-0" style={{ background: "#f3f6f4" }} />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded w-3/4" style={{ background: "#f3f6f4" }} />
        <div className="h-3 rounded w-1/2" style={{ background: "#f3f6f4" }} />
        <div className="h-3 rounded w-1/3" style={{ background: "#f3f6f4" }} />
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
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-4">
          <div className="h-20 rounded-[18px] animate-pulse" style={{ background: "#f3f6f4" }} />
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {[0, 1].map((i) => (
                <SkeletonItem key={i} />
              ))}
            </div>
            <div className="lg:w-80 h-64 rounded-[18px] animate-pulse" style={{ background: "#f3f6f4" }} />
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
          <StPageHeader
            title="Votre panier est vide"
            subtitle="Explorez notre catalogue et ajoutez des formations ou produits."
            actions={
              <StButton href="/explorer" icon={Search}>
                Explorer le catalogue
              </StButton>
            }
          />
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <ShoppingCart size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucun article dans votre panier</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Ajoutez des formations à votre panier pour les acheter en une seule fois.
            </p>
            <StButton href="/explorer" icon={Search}>Explorer le catalogue</StButton>
          </StCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mon panier"
          subtitle={`${items.length} article${items.length > 1 ? "s" : ""} prêt${items.length > 1 ? "s" : ""} à être commandé${items.length > 1 ? "s" : ""}`}
          actions={
            <StButton variant="secondary" href="/explorer" icon={Search}>
              Continuer mes achats
            </StButton>
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
                <StCard key={item.id} className="flex gap-4">
                  <div
                    className="w-20 h-20 rounded-[13px] flex items-center justify-center flex-shrink-0 text-white overflow-hidden"
                    style={{ background: ST.gradient }}
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
                          <StChip tone="blue">Formation vidéo</StChip>
                          {item.formation?.level && (
                            <StChip tone="amber">{item.formation.level}</StChip>
                          )}
                        </div>
                        <h3 className="font-extrabold text-[13.5px] leading-snug mb-1" style={{ color: ST.text }}>
                          {title}
                        </h3>
                      </div>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={isRemoving}
                        className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0"
                        style={{ color: ST.textSecondary }}
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
                        <p className="font-extrabold text-[15px] tabular-nums" style={{ color: ST.green }}>
                          {formatFcfa(price)}
                        </p>
                        <p className="text-[10px] font-semibold" style={{ color: ST.textMuted }}>≈ {toEur(price)} €</p>
                      </div>
                      <Link
                        href={`/formation/${item.formationId}`}
                        className="text-[12px] font-extrabold hover:underline"
                        style={{ color: ST.green }}
                      >
                        Voir le produit
                      </Link>
                    </div>
                  </div>
                </StCard>
              );
            })}

            <Link
              href="/explorer"
              className="flex items-center gap-2 text-[13px] font-bold transition-colors w-fit hover:opacity-80"
              style={{ color: ST.textSecondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              Continuer mes achats
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:w-80 flex-shrink-0">
            <StCard className="sticky top-24">
              <StSectionTitle>Récapitulatif</StSectionTitle>
              <div className="space-y-3 mb-5">
                {items.map((item) => {
                  const title = item.formation?.title ?? "Formation";
                  const price = item.formation?.price ?? 0;
                  return (
                    <div key={item.id} className="flex justify-between text-[13px]">
                      <span className="truncate flex-1 mr-2" style={{ color: ST.textSecondary }}>
                        {title.slice(0, 30)}
                        {title.length > 30 ? "…" : ""}
                      </span>
                      <span className="font-extrabold flex-shrink-0 tabular-nums" style={{ color: ST.text }}>
                        {formatFcfa(price)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 mb-5" style={{ borderTop: `1px solid ${ST.divider}` }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px]" style={{ color: ST.textSecondary }}>Sous-total</span>
                  <span className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                    {formatFcfa(total)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px]" style={{ color: ST.textSecondary }}>Frais</span>
                  <span className="text-[13px] font-extrabold" style={{ color: ST.green }}>Gratuit</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <span className="font-extrabold" style={{ color: ST.text }}>Total</span>
                  <div className="text-right">
                    <p className="font-extrabold text-[18px] tabular-nums" style={{ color: ST.green }}>
                      {formatFcfa(total)}
                    </p>
                    <p className="text-[12px] font-semibold" style={{ color: ST.textMuted }}>≈ {toEur(total)} €</p>
                  </div>
                </div>
              </div>
              <StButton href="/checkout" icon={Lock} className="w-full">
                Passer la commande
              </StButton>
              <p className="text-center text-[10px] font-semibold my-3" style={{ color: ST.textMuted }}>Paiements sécurisés</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {["Orange Money", "Wave", "MTN", "Carte"].map((m) => (
                  <span
                    key={m}
                    className="text-[9px] font-extrabold px-2 py-1 rounded"
                    style={{ background: "#f7faf8", color: ST.textSecondary, border: `1px solid ${ST.divider}` }}
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 p-3 rounded-[12px]" style={{ background: ST.greenSoft }}>
                <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: ST.green }} />
                <p className="text-[10px] font-extrabold leading-snug" style={{ color: ST.green }}>
                  Satisfait ou remboursé 30 jours
                </p>
              </div>
            </StCard>
          </div>
        </div>
      </main>
    </div>
  );
}
