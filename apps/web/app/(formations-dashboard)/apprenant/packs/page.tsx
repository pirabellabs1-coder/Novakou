"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";

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
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes packs</h1>
        <p className="text-sm text-[#5c647a] mt-1">
          {isLoading ? "Chargement…" : `${purchases.length} pack${purchases.length > 1 ? "s" : ""} acheté${purchases.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#5c647a]">redeem</span>
          </div>
          <h3 className="font-bold text-[#191c1e] mb-1">Aucun pack acheté</h3>
          <p className="text-sm text-[#5c647a] mb-4">
            Les packs regroupent plusieurs formations et produits à prix avantageux.
          </p>
          <Link
            href="/explorer"
            className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => {
            const b = p.bundle;
            if (!b) return null;
            const formationCount = b.items.filter((i) => i.itemKind === "formation").length;
            const productCount = b.items.filter((i) => i.itemKind === "digital").length;
            const existingReview = b.reviews[0];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                        <span className="material-symbols-outlined text-white/60 text-[48px]">redeem</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          PACK · {b.items.length} articles
                        </span>
                        <h3 className="text-base md:text-lg font-extrabold text-[#191c1e] mt-1.5 leading-tight">
                          {b.title}
                        </h3>
                        {b.shop && (
                          <p className="text-xs text-[#5c647a] mt-0.5">par {b.shop.name}</p>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-[#006e2f] flex-shrink-0">
                        {fmtFcfa(p.paidAmount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-[#5c647a]">
                      {formationCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">school</span>
                          {formationCount} formation{formationCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {productCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                          {productCount} produit{productCount > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-zinc-300">·</span>
                      <span>Acheté le {new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formationCount > 0 && (
                        <Link
                          href="/apprenant/mes-formations"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#006e2f]/10 text-[#006e2f] hover:bg-[#006e2f]/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">school</span>
                          Voir les formations
                        </Link>
                      )}
                      {productCount > 0 && (
                        <Link
                          href="/apprenant/mes-produits"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                          Voir les produits
                        </Link>
                      )}
                      <Link
                        href={`/bundle/${b.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-[#5c647a] hover:bg-gray-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{
                            fontVariationSettings: existingReview ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          {existingReview ? "star" : "rate_review"}
                        </span>
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
