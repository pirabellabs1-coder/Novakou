// Refonte style KAZA — apprenant packs — 2026-06-07
"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  KazaHero,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  Gift,
  Search,
  GraduationCap,
  Package,
  ExternalLink,
  Star,
  Sparkles,
} from "lucide-react";

type BundlePurchase = {
  id: string;
  paidAmount: number;
  createdAt: string;
  bundle?: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    banner: string | null;
    priceXof: number;
    rating: number;
    reviewsCount: number;
    items: Array<{ itemKind: string }>;
    instructeur: { user: { name: string | null; image: string | null } | null } | null;
    shop: { slug: string; name: string } | null;
    reviews: Array<{ id: string; rating: number; comment: string }>;
  } | null;
};

const fmtFcfa = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

export default function MesPacksPage() {
  const qc = useQueryClient();
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    title: string;
    existing?: { rating: number; comment: string };
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-bundles"],
    queryFn: () => fetch("/api/formations/apprenant/bundles").then((r) => r.json()),
    staleTime: 30_000,
  });

  const purchases: BundlePurchase[] = data?.data ?? [];

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Gift}
        title="Mes packs"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${purchases.length} pack${purchases.length > 1 ? "s" : ""} acheté${purchases.length > 1 ? "s" : ""}`
        }
        actions={
          <KazaButton variant="primary" href="/explorer" icon={Search}>
            Explorer le catalogue
          </KazaButton>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <KazaEmpty
          icon={Gift}
          title="Aucun pack acheté"
          description="Les packs regroupent plusieurs formations et produits à prix avantageux. Découvrez les offres bundle des créateurs."
          action={{ label: "Explorer le catalogue", href: "/explorer" }}
        />
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => {
            const b = p.bundle;
            if (!b) return null;
            const formationCount = b.items.filter((i) => i.itemKind === "formation").length;
            const productCount = b.items.filter((i) => i.itemKind === "digital").length;
            const existingReview = b.reviews[0];

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-32 md:h-auto relative bg-gradient-to-br from-amber-400 to-rose-500 flex-shrink-0">
                    {b.thumbnail || b.banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.thumbnail || b.banner || ""}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Gift className="w-12 h-12 text-white/70" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <KazaBadge variant="orange" size="sm">
                          PACK · {b.items.length} articles
                        </KazaBadge>
                        <h3 className="text-base md:text-lg font-extrabold text-[#0b2540] mt-1.5 leading-tight">
                          {b.title}
                        </h3>
                        {b.shop && (
                          <p className="text-xs text-slate-500 mt-0.5">par {b.shop.name}</p>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-emerald-600 flex-shrink-0">
                        {fmtFcfa(p.paidAmount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-slate-500">
                      {formationCount > 0 && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {formationCount} formation{formationCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {productCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {productCount} produit{productCount > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-slate-300">·</span>
                      <span>Acheté le {new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formationCount > 0 && (
                        <KazaButton variant="ghost" size="sm" href="/apprenant/mes-formations" icon={GraduationCap}>
                          Voir les formations
                        </KazaButton>
                      )}
                      {productCount > 0 && (
                        <KazaButton variant="ghost" size="sm" href="/apprenant/mes-produits" icon={Package}>
                          Voir les produits
                        </KazaButton>
                      )}
                      <Link
                        href={`/bundle/${b.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Page publique
                      </Link>
                      <button
                        onClick={() =>
                          setReviewTarget({
                            id: b.id,
                            title: b.title,
                            existing: existingReview
                              ? { rating: existingReview.rating, comment: existingReview.comment }
                              : undefined,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        {existingReview ? (
                          <Star className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {existingReview
                          ? `${existingReview.rating}/5 · Modifier mon avis`
                          : "Donner mon avis"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["apprenant-bundles"] })}
          kind="bundle"
          itemId={reviewTarget.id}
          itemTitle={reviewTarget.title}
          initialRating={reviewTarget.existing?.rating}
          initialComment={reviewTarget.existing?.comment}
        />
      )}
    </div>
  );
}
