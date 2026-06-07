// Refonte style KAZA — apprenant mes-produits — 2026-06-07
"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  KazaHero,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
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
const typeBadgeVariant: Record<string, "orange" | "blue" | "violet"> = {
  EBOOK: "orange",
  TEMPLATE: "violet",
  AUDIO: "blue",
};
const typeIcons: Record<string, typeof BookOpen> = {
  EBOOK: BookOpen,
  TEMPLATE: FileText,
  AUDIO: Headphones,
};
const typeGradients: Record<string, [string, string]> = {
  EBOOK:    ["#1b4332", "#081c15"],
  TEMPLATE: ["#92400e", "#451a03"],
  AUDIO:    ["#0f3460", "#16213e"],
};

type FilterType = "tous" | "EBOOK" | "TEMPLATE" | "AUDIO";

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
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
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Package}
        title="Mes produits numériques"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${purchases.length} produit${purchases.length > 1 ? "s" : ""} acheté${purchases.length > 1 ? "s" : ""} · Accès à vie`
        }
        actions={
          <KazaButton variant="primary" href="/explorer" icon={Search}>
            Explorer le catalogue
          </KazaButton>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KazaKpiCard
          label="Total produits"
          value={isLoading ? "…" : purchases.length}
          icon={Package}
          iconColor="orange"
        />
        <KazaKpiCard
          label="Téléchargés"
          value={isLoading ? "…" : downloadedCount}
          icon={CheckCircle2}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="À télécharger"
          value={isLoading ? "…" : Math.max(0, purchases.length - downloadedCount)}
          icon={DownloadCloud}
          iconColor="sky"
        />
      </section>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["tous", "EBOOK", "TEMPLATE", "AUDIO"] as FilterType[]).map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#0b2540] text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#0b2540]/30 hover:text-[#0b2540]"
              }`}
            >
              {f === "tous" ? "Tous" : typeLabels[f]}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">{[0,1,2].map((i) => <SkeletonRow key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <KazaEmpty
          icon={Package}
          title="Aucun produit"
          description={
            filter === "tous"
              ? "Vous n'avez pas encore acheté de produit numérique. Explorez le catalogue pour découvrir e-books, templates et audios."
              : "Aucun produit dans cette catégorie."
          }
          action={{ label: "Explorer le catalogue", href: "/explorer" }}
        />
      ) : (
        <div className="space-y-4">
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
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                  >
                    <TypeIcon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                      <KazaBadge variant={typeBadgeVariant[type] ?? "slate"} size="sm">
                        {typeLabels[type] ?? type}
                      </KazaBadge>
                      {isDown && (
                        <KazaBadge variant="green" size="sm" icon={CheckCircle2}>
                          Téléchargé
                        </KazaBadge>
                      )}
                      {fileCount > 1 && (
                        <KazaBadge variant="blue" size="sm">
                          {fileCount} fichiers
                        </KazaBadge>
                      )}
                    </div>
                    <h3 className="font-bold text-[#0b2540] text-sm leading-snug mb-1">{p.product?.title ?? "Produit"}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
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
                    <p className="text-xs font-bold text-emerald-600">{formatFcfa(p.paidAmount)}</p>
                    <KazaButton
                      onClick={() => handleDownload(p)}
                      variant={isDown ? "ghost" : "primary"}
                      size="sm"
                      icon={isDown ? CheckCircle2 : Download}
                    >
                      {isDown ? "Re-télécharger" : "Télécharger"}
                    </KazaButton>
                    <button
                      onClick={() => setReviewTarget({
                        id: p.product?.id ?? "",
                        title: p.product?.title ?? "",
                        existing: existingReview ? { rating: existingReview.rating, comment: existingReview.comment } : undefined,
                      })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
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
                  <ul className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                    {productFiles.map((f, fIdx) => {
                      const Icon = getFileIcon(f);
                      return (
                        <li key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="flex-1 text-xs text-[#0b2540] truncate">{f.name}</span>
                          {f.size != null && f.size > 0 && (
                            <span className="text-[10px] text-slate-500 tabular-nums flex-shrink-0">
                              {f.size > 1_000_000 ? `${(f.size / 1_000_000).toFixed(1)} Mo` : `${Math.round(f.size / 1000)} Ko`}
                            </span>
                          )}
                          <a
                            href={proxyHref(p.id, fIdx)}
                            download={f.name || true}
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:underline flex-shrink-0"
                          >
                            Télécharger
                          </a>
                        </li>
                      );
                    })}
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
