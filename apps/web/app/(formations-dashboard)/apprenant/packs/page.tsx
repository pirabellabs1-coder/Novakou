// Refonte design "Stitch" — apprenant packs — vert Novakou — 2026-06-13
"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  ST,
} from "@/components/stitch";
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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes packs"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${purchases.length} pack${purchases.length > 1 ? "s" : ""} acheté${purchases.length > 1 ? "s" : ""}`
          }
          actions={
            <StButton href="/explorer" icon={Search}>
              Explorer le catalogue
            </StButton>
          }
        />

        {isLoading ? (
          <div className="space-y-3.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 rounded-[18px] animate-pulse" style={{ background: "#f3f6f4" }} />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <Gift size={28} style={{ color: ST.green }} />
            </div>
            <h3 className="text-[16px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucun pack acheté</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Les packs regroupent plusieurs formations et produits à prix avantageux. Découvrez les offres bundle des créateurs.
            </p>
            <StButton href="/explorer" icon={Search}>Explorer le catalogue</StButton>
          </StCard>
        ) : (
          <div className="space-y-3.5">
            {purchases.map((p) => {
              const b = p.bundle;
              if (!b) return null;
              const formationCount = b.items.filter((i) => i.itemKind === "formation").length;
              const productCount = b.items.filter((i) => i.itemKind === "digital").length;
              const existingReview = b.reviews[0];

              return (
                <StCard key={p.id} noPadding className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-32 md:h-auto relative flex-shrink-0" style={{ background: ST.gradient }}>
                      {b.thumbnail || b.banner ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.thumbnail || b.banner || ""}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Gift size={48} className="text-white/70" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <StChip tone="amber">PACK · {b.items.length} articles</StChip>
                          <h3 className="text-[15px] md:text-[16px] font-extrabold mt-1.5 leading-tight" style={{ color: ST.text }}>
                            {b.title}
                          </h3>
                          {b.shop && (
                            <p className="text-[12px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>par {b.shop.name}</p>
                          )}
                        </div>
                        <p className="text-[14px] font-extrabold flex-shrink-0" style={{ color: ST.green }}>
                          {fmtFcfa(p.paidAmount)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3 text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                        {formationCount > 0 && (
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} />
                            {formationCount} formation{formationCount > 1 ? "s" : ""}
                          </span>
                        )}
                        {productCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Package size={14} />
                            {productCount} produit{productCount > 1 ? "s" : ""}
                          </span>
                        )}
                        <span style={{ color: ST.textFaint }}>·</span>
                        <span>Acheté le {new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {formationCount > 0 && (
                          <StButton variant="secondary" size="sm" href="/apprenant/mes-formations" icon={GraduationCap}>
                            Voir les formations
                          </StButton>
                        )}
                        {productCount > 0 && (
                          <StButton variant="secondary" size="sm" href="/apprenant/mes-produits" icon={Package}>
                            Voir les produits
                          </StButton>
                        )}
                        <Link
                          href={`/bundle/${b.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-extrabold transition-colors"
                          style={{ background: "#f1efe8", color: "#5f5e5a" }}
                        >
                          <ExternalLink size={14} />
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
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-extrabold transition-colors"
                          style={{ background: ST.amberSoft, color: ST.amberText }}
                        >
                          {existingReview ? (
                            <Star size={14} className="fill-current" />
                          ) : (
                            <Sparkles size={14} />
                          )}
                          {existingReview
                            ? `${existingReview.rating}/5 · Modifier mon avis`
                            : "Donner mon avis"}
                        </button>
                      </div>
                    </div>
                  </div>
                </StCard>
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
      </main>
    </div>
  );
}
