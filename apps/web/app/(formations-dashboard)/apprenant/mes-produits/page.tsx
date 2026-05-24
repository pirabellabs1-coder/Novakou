"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";

type ProductFileLite = {
  id: string;
  name: string;
  url: string;
  size: number | null;
  mimeType: string | null;
};

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
    files?: ProductFileLite[];
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

  // Force le download au lieu d'ouvrir le fichier (PDF inline, audio dans
  // l'onglet, etc.). On crée un `<a download>` invisible et on le click via
  // JS — combiné au header Content-Disposition: attachment ajouté côté
  // serveur (cf. /api/formations/apprenant/products/[id]/download/route.ts
  // qui passe `download: file.name` à Supabase), le navigateur déclenche
  // la sauvegarde immédiate au lieu d'une navigation.
  const triggerDownload = (url: string, filename?: string) => {
    const a = document.createElement("a");
    a.href = url;
    if (filename) a.download = filename;
    // `target=_blank` reste utile si l'URL pointe vers un domaine qui
    // ignore Content-Disposition — l'utilisateur garde au moins une preview
    // au lieu d'un écran blanc. rel=noopener pour éviter la fuite window.opener.
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async (p: Purchase) => {
    const files = p.product?.files ?? [];
    const single = files[0]?.url ?? p.product?.fileUrl;

    if (files.length === 0 && !single) {
      useToastStore.getState().addToast("error", "Fichier non disponible pour ce produit. Contactez le vendeur.");
      return;
    }

    setDownloaded((prev) => new Set([...prev, p.id]));

    try {
      const res = await fetch(`/api/formations/apprenant/products/${p.id}/download`, { method: "POST" });
      const data = await res.json().catch(() => null);
      const freshFiles: ProductFileLite[] = Array.isArray(data?.files) ? data.files : [];

      // Source de vérité : la réponse du POST (signed URL fraîche + nom).
      // Fallback sur les URLs en cache local si l'appel a échoué.
      const items: Array<{ url: string; name?: string }> =
        freshFiles.length > 0
          ? freshFiles.filter((f) => !!f.url).map((f) => ({ url: f.url, name: f.name }))
          : files.length > 1
            ? files.map((f) => ({ url: f.url, name: f.name }))
            : single
              ? [{ url: single, name: files[0]?.name }]
              : [];

      // Déclenche les downloads en série, avec un mini-délai entre chacun
      // pour éviter que certains navigateurs (Safari surtout) n'ignorent
      // les clicks consécutifs trop rapprochés.
      for (let i = 0; i < items.length; i++) {
        triggerDownload(items[i].url, items[i].name);
        if (i < items.length - 1) await new Promise((r) => setTimeout(r, 250));
      }
      qc.invalidateQueries({ queryKey: ["apprenant-products"] });
    } catch {
      // Fallback offline : tente quand même les URLs en cache (peuvent être
      // expirées, mais c'est mieux que rien — l'erreur s'affichera dans le
      // navigateur plutôt que dans un toast silencieux).
      const items = files.length > 1
        ? files.map((f) => ({ url: f.url, name: f.name }))
        : single
          ? [{ url: single, name: files[0]?.name }]
          : [];
      for (let i = 0; i < items.length; i++) {
        triggerDownload(items[i].url, items[i].name);
        if (i < items.length - 1) await new Promise((r) => setTimeout(r, 250));
      }
      useToastStore.getState().addToast("error", "Erreur réseau — si le téléchargement ne démarre pas, réessayez.");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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

            const productFiles = p.product?.files ?? [];
            const fileCount = productFiles.length;

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex gap-4">
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
                    {fileCount > 1 && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                        {fileCount} fichiers
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[#191c1e] text-sm leading-snug mb-1">{p.product?.title ?? "Produit"}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-[#5c647a] flex-wrap">
                    {p.product?.fileSize != null && fileCount <= 1 && (
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
                {fileCount > 1 && (
                  <ul className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                    {productFiles.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[16px] text-[#006e2f] flex-shrink-0">
                          {f.mimeType?.startsWith("audio/") ? "audio_file"
                            : f.mimeType?.startsWith("video/") ? "video_file"
                            : f.mimeType === "application/pdf" || /\.pdf$/i.test(f.name) ? "picture_as_pdf"
                            : /\.(zip|rar|7z)$/i.test(f.name) ? "folder_zip"
                            : "draft"}
                        </span>
                        <span className="flex-1 text-xs text-[#191c1e] truncate">{f.name}</span>
                        {f.size != null && f.size > 0 && (
                          <span className="text-[10px] text-[#5c647a] tabular-nums flex-shrink-0">
                            {f.size > 1_000_000 ? `${(f.size / 1_000_000).toFixed(1)} Mo` : `${Math.round(f.size / 1000)} Ko`}
                          </span>
                        )}
                        <a
                          href={f.url}
                          download={f.name || true}
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] hover:underline flex-shrink-0"
                        >
                          Télécharger →
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
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
