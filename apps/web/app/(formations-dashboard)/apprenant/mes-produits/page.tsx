// Refonte design "Stitch" — apprenant mes-produits — vert Novakou — 2026-06-13
"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StKpiCompact,
  StTabs,
  ST,
} from "@/components/stitch";
import {
  Package,
  Download,
  DownloadCloud,
  CheckCircle2,
  BookOpen,
  FileText,
  Headphones,
  Calendar,
  Folder,
  FileAudio,
  FileVideo,
  FileText as FilePdf,
  FileArchive,
  File,
  Star,
  Sparkles,
  Search,
} from "lucide-react";

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
const typeBadgeTone: Record<string, "amber" | "blue" | "green"> = {
  EBOOK: "amber",
  TEMPLATE: "green",
  AUDIO: "blue",
};
const typeIcons: Record<string, typeof BookOpen> = {
  EBOOK: BookOpen,
  TEMPLATE: FileText,
  AUDIO: Headphones,
};
const typeGradients: Record<string, [string, string]> = {
  EBOOK:    ["#006e2f", "#22c55e"],
  TEMPLATE: ["#0b3b20", "#34b06a"],
  AUDIO:    ["#0f3460", "#16213e"],
};

type FilterType = "tous" | "EBOOK" | "TEMPLATE" | "AUDIO";

function SkeletonRow() {
  return (
    <div className="rounded-[18px] bg-white p-5 flex gap-4 animate-pulse" style={{ border: `1px solid ${ST.cardBorder}` }}>
      <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ background: "#f3f6f4" }} />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded w-3/4" style={{ background: "#f3f6f4" }} />
        <div className="h-3 rounded w-1/2" style={{ background: "#f3f6f4" }} />
        <div className="h-3 rounded w-2/3" style={{ background: "#f3f6f4" }} />
      </div>
    </div>
  );
}

function getFileIcon(f: ProductFileLite) {
  if (f.mimeType?.startsWith("audio/")) return FileAudio;
  if (f.mimeType?.startsWith("video/")) return FileVideo;
  if (f.mimeType === "application/pdf" || /\.pdf$/i.test(f.name)) return FilePdf;
  if (/\.(zip|rar|7z)$/i.test(f.name)) return FileArchive;
  return File;
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

  // Déclenche le download via notre route proxy `/file/[idx]`. Le proxy
  // génère une signed URL Supabase FRAÎCHE à chaque clic + force
  // Content-Disposition: attachment → le navigateur télécharge direct,
  // jamais d'erreur InvalidJWT même si la page est ouverte depuis des
  // heures (le cache React Query peut être stale, on s'en fiche).
  const proxyHref = (purchaseId: string, idx: number) =>
    `/api/formations/apprenant/products/${purchaseId}/file/${idx}`;

  const triggerProxyDownload = (purchaseId: string, idx: number, filename?: string) => {
    const a = document.createElement("a");
    a.href = proxyHref(purchaseId, idx);
    if (filename) a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async (p: Purchase) => {
    const files = p.product?.files ?? [];
    const hasFile = files.length > 0 || !!p.product?.fileUrl;

    if (!hasFile) {
      useToastStore.getState().addToast("error", "Fichier non disponible pour ce produit. Contactez le vendeur.");
      return;
    }

    setDownloaded((prev) => new Set([...prev, p.id]));

    // Combien de fichiers ? Si plusieurs, on en télécharge plusieurs en
    // cascade ; sinon un seul (fileUrl legacy ou files[0]).
    const count = files.length > 0 ? files.length : 1;

    for (let i = 0; i < count; i++) {
      const name = files[i]?.name;
      triggerProxyDownload(p.id, i, name);
      // Petit délai entre chaque pour que Safari/Firefox ne bloquent pas
      // les clicks consécutifs comme un pop-up spam.
      if (i < count - 1) await new Promise((r) => setTimeout(r, 350));
    }

    // Refresh la liste pour mettre à jour downloadCount affiché.
    setTimeout(() => qc.invalidateQueries({ queryKey: ["apprenant-products"] }), 1500);
  };

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes produits numériques"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${purchases.length} produit${purchases.length > 1 ? "s" : ""} acheté${purchases.length > 1 ? "s" : ""} · Accès à vie`
          }
          actions={
            <StButton href="/explorer" icon={Search}>
              Explorer le catalogue
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact label="Total produits" value={isLoading ? "…" : purchases.length} icon={Package} tone="amber" />
          <StKpiCompact label="Téléchargés" value={isLoading ? "…" : downloadedCount} icon={CheckCircle2} tone="green" />
          <StKpiCompact label="À télécharger" value={isLoading ? "…" : Math.max(0, purchases.length - downloadedCount)} icon={DownloadCloud} tone="blue" />
        </div>

        {/* Filter tabs */}
        <div className="mb-4">
          <StTabs
            tabs={[
              { key: "tous", label: "Tous" },
              { key: "EBOOK", label: typeLabels.EBOOK },
              { key: "TEMPLATE", label: typeLabels.TEMPLATE },
              { key: "AUDIO", label: typeLabels.AUDIO },
            ]}
            active={filter}
            onChange={(k) => setFilter(k as FilterType)}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3.5">{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <Package size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucun produit</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              {filter === "tous"
                ? "Vous n'avez pas encore acheté de produit numérique. Explorez le catalogue pour découvrir e-books, templates et audios."
                : "Aucun produit dans cette catégorie."}
            </p>
            <StButton href="/explorer" icon={Search}>Explorer le catalogue</StButton>
          </StCard>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((p) => {
              const type = (p.product?.productType ?? "EBOOK").toUpperCase();
              const isDown = p.downloadCount > 0 || downloaded.has(p.id);
              const [gFrom, gTo] = typeGradients[type] ?? ["#006e2f", "#22c55e"];
              const TypeIcon = typeIcons[type] ?? Package;
              const purchaseDate = new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

              const productFiles = p.product?.files ?? [];
              const fileCount = productFiles.length;
              const existingReview = p.product?.reviews?.[0];

              return (
                <StCard key={p.id}>
                  <div className="flex gap-4">
                    <div
                      className="w-16 h-16 rounded-[13px] flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                    >
                      <TypeIcon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                        <StChip tone={typeBadgeTone[type] ?? "neutral"}>{typeLabels[type] ?? type}</StChip>
                        {isDown && (
                          <StChip tone="green" icon={CheckCircle2}>Téléchargé</StChip>
                        )}
                        {fileCount > 1 && (
                          <StChip tone="blue">{fileCount} fichiers</StChip>
                        )}
                      </div>
                      <h3 className="font-extrabold text-[13.5px] leading-snug mb-1" style={{ color: ST.text }}>{p.product?.title ?? "Produit"}</h3>
                      <div className="flex items-center gap-3 text-[10px] font-semibold flex-wrap" style={{ color: ST.textMuted }}>
                        {p.product?.fileSize != null && fileCount <= 1 && (
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {p.product.fileSize > 1_000_000
                              ? `${(p.product.fileSize / 1_000_000).toFixed(1)} Mo`
                              : `${Math.round(p.product.fileSize / 1000)} Ko`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Acheté le {purchaseDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-[12px] font-extrabold" style={{ color: ST.green }}>{formatFcfa(p.paidAmount)}</p>
                      <StButton
                        onClick={() => handleDownload(p)}
                        variant={isDown ? "secondary" : "primary"}
                        size="sm"
                        icon={isDown ? CheckCircle2 : Download}
                      >
                        {isDown ? "Re-télécharger" : "Télécharger"}
                      </StButton>
                      <button
                        onClick={() => setReviewTarget({
                          id: p.product?.id ?? "",
                          title: p.product?.title ?? "",
                          existing: existingReview ? { rating: existingReview.rating, comment: existingReview.comment } : undefined,
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-extrabold transition-colors hover:opacity-90"
                        style={{ background: ST.amberSoft, color: ST.amberText }}
                      >
                        {existingReview ? (
                          <Star className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {existingReview ? `${existingReview.rating}/5 · Modifier` : "Donner mon avis"}
                      </button>
                    </div>
                  </div>
                  {fileCount > 1 && (
                    <ul className="mt-4 pt-4 space-y-1.5" style={{ borderTop: `1px solid ${ST.divider}` }}>
                      {productFiles.map((f, fIdx) => {
                        const Icon = getFileIcon(f);
                        return (
                          <li key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f7faf8] transition-colors">
                            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: ST.green }} />
                            <span className="flex-1 text-[12px] truncate" style={{ color: ST.text }}>{f.name}</span>
                            {f.size != null && f.size > 0 && (
                              <span className="text-[10px] font-semibold tabular-nums flex-shrink-0" style={{ color: ST.textMuted }}>
                                {f.size > 1_000_000 ? `${(f.size / 1_000_000).toFixed(1)} Mo` : `${Math.round(f.size / 1000)} Ko`}
                              </span>
                            )}
                            <a
                              href={proxyHref(p.id, fIdx)}
                              download={f.name || true}
                              rel="noopener noreferrer"
                              className="text-[10px] font-extrabold uppercase tracking-widest hover:underline flex-shrink-0"
                              style={{ color: ST.green }}
                            >
                              Télécharger
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </StCard>
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
      </main>
    </div>
  );
}
