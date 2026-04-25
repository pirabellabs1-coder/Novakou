"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";

type Purchase = {
  id: string;
  paidAmount: number;
  createdAt: string;
  downloadCount: number;
  product?: {
    id: string;
    slug?: string | null;
    title: string;
    productType: string;
    banner: string | null;
    fileSize: number | null;
    fileUrl: string | null;
    instructeurId: string | null;
    reviews?: { id: string; rating: number; comment: string }[];
  };
};

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }

const typeLabels: Record<string, string> = { EBOOK: "E-book", TEMPLATE: "Template", AUDIO: "Audio" };
const typeColors: Record<string, string> = {
  EBOOK: "bg-amber-100 text-amber-700",
  TEMPLATE: "bg-orange-100 text-orange-700",
  AUDIO: "bg-blue-100 text-blue-700",
};
const typeIcons: Record<string, string> = { EBOOK: "menu_book", TEMPLATE: "description", AUDIO: "headphones" };
const typeGradients: Record<string, [string, string]> = {
  EBOOK:    ["#1b4332", "#081c15"],
  TEMPLATE: ["#92400e", "#451a03"],
  AUDIO:    ["#0f3460", "#16213e"],
};

type FilterType = "tous" | "EBOOK" | "TEMPLATE" | "AUDIO";

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function ProduitsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("tous");
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string; existing?: { rating: number; comment: string } } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-products"],
    queryFn: () => fetch("/api/formations/apprenant/products").then((r) => r.json()),
    staleTime: 30_000,
  });

  const purchases: Purchase[] = data?.data ?? [];
  const filtered = filter === "tous" ? purchases : purchases.filter((p) => p.product?.productType === filter);

  const downloadedCount = purchases.filter((p) => p.downloadCount > 0 || downloaded.has(p.id)).length;

  const handleDownload = (p: Purchase) => {
    if (p.product?.fileUrl) {
      window.open(p.product.fileUrl, "_blank");
      setDownloaded((prev) => new Set([...prev, p.id]));
    } else {
      useToastStore.getState().addToast("error", "Fichier non disponible pour ce produit. Contactez le vendeur.");
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#191c1e]">Mes produits numériques</h1>
          <p className="text-sm text-[#5c647a] mt-0.5">
            {isLoading ? "Chargement…" : `${purchases.length} produit${purchases.length > 1 ? "s" : ""} acheté${purchases.length > 1 ? "s" : ""} · Accès à vie`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: "inventory_2",    bg: "bg-amber-50",        color: "text-amber-600",    label: "Total produits",  value: isLoading ? "…" : String(purchases.length) },
          { icon: "download_done",  bg: "bg-green-50",        color: "text-[#006e2f]",    label: "Téléchargés",     value: isLoading ? "…" : String(downloadedCount) },
          { icon: "download",       bg: "bg-blue-50",         color: "text-blue-600",     label: "À télécharger",   value: isLoading ? "…" : String(purchases.length - downloadedCount) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}>
              <span className={`material-symbols-outlined text-[18px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <p className="text-xl font-extrabold text-[#191c1e]">{s.value}</p>
            <p className="text-[10px] text-[#5c647a]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(["tous", "EBOOK", "TEMPLATE", "AUDIO"] as FilterType[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f ? "bg-[#006e2f] text-white" : "bg-white border border-gray-200 text-[#5c647a] hover:text-[#191c1e]"
            }`}>
            {f === "tous" ? "Tous" : typeLabels[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">{[0,1,2].map((i) => <SkeletonRow key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#5c647a]">inventory_2</span>
          </div>
          <p className="font-bold text-[#191c1e] mb-1">Aucun produit</p>
          <p className="text-sm text-[#5c647a]">
            {filter === "tous" ? "Vous n'avez pas encore acheté de produit numérique." : "Aucun produit dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const type = (p.product?.productType ?? "EBOOK").toUpperCase();
            const isDown = p.downloadCount > 0 || downloaded.has(p.id);
            const [gFrom, gTo] = typeGradients[type] ?? ["#006e2f", "#22c55e"];
            const icon = typeIcons[type] ?? "inventory_2";
            const purchaseDate = new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}>
                  <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${typeColors[type] ?? "bg-gray-100 text-gray-700"}`}>
                      {typeLabels[type] ?? type}
                    </span>
                    {isDown && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">Téléchargé</span>
                    )}
                  </div>
                  <h3 className="font-bold text-[#191c1e] text-sm leading-snug mb-1">{p.product?.title ?? "Produit"}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-[#5c647a] flex-wrap">
                    {p.product?.fileSize != null && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px]">folder</span>
                        {p.product.fileSize > 1_000_000
                          ? `${(p.product.fileSize / 1_000_000).toFixed(1)} Mo`
                          : `${Math.round(p.product.fileSize / 1000)} Ko`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                      Acheté le {purchaseDate}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-xs font-bold text-[#006e2f]">{formatFcfa(p.paidAmount)}</p>
                  <button onClick={() => handleDownload(p)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isDown ? "bg-green-50 text-green-700 hover:bg-green-100" : "text-white hover:opacity-90"
                    }`}
                    style={!isDown ? { background: "linear-gradient(to right, #006e2f, #22c55e)" } : {}}>
                    <span className="material-symbols-outlined text-[14px]">{isDown ? "download_done" : "download"}</span>
                    {isDown ? "Re-télécharger" : "Télécharger"}
                  </button>
                  {(() => {
                    const existingReview = p.product?.reviews?.[0];
                    return (
                      <button
                        onClick={() => setReviewTarget({
                          id: p.product?.id ?? "",
                          title: p.product?.title ?? "",
                          existing: existingReview ? { rating: existingReview.rating, comment: existingReview.comment } : undefined,
                        })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: existingReview ? "'FILL' 1" : "'FILL' 0" }}>
                          {existingReview ? "star" : "rate_review"}
                        </span>
                        {existingReview ? `${existingReview.rating}/5 · Modifier` : "Donner mon avis"}
                      </button>
                    );
                  })()}
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
          onSuccess={() => qc.invalidateQueries({ queryKey: ["apprenant-products"] })}
          kind="product"
          itemId={reviewTarget.id}
          itemTitle={reviewTarget.title}
          initialRating={reviewTarget.existing?.rating}
          initialComment={reviewTarget.existing?.comment}
        />
      )}
    </div>
  );
}
