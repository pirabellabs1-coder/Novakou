"use client";
// Page Mes produits — design "Stitch" (maquette stich/novakou_mes_produits.html
// validée par Lissanon) : grille de cards 3 colonnes, KPI compacts, tabs
// vert sombre, ghost card création. 2026-06-10.

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  Package,
  Download,
  Plus,
  ShoppingBag,
  Star,
  Wallet,
  Edit,
  Copy,
  Check,
  Share2,
  X,
  BarChart3,
  Archive,
  Trash2,
  Store,
  PlayCircle,
  BookOpen,
  Layers,
  LayoutGrid,
  Headphones,
  Code,
  FileText,
  Search,
} from "lucide-react";
import {
  StCard,
  StPageHeader,
  StButton,
  StKpiCompact,
  StStatusPill,
  StTabs,
  StGhostCard,
  ST,
} from "@/components/stitch";

type Product = {
  id: string;
  slug?: string | null;
  title: string;
  thumbnail: string | null;
  customCategory: string | null;
  status: string;
  price: number;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  publishedAt: string | null;
  createdAt: string;
  refuseReason: string | null;
  productKind: string;
  revenue: number;
  sales: number;
};

type FormationsData = {
  formations: Product[];
  digitalProducts: Product[];
  totals: { revenue: number; sales: number; products: number; activeFormations: number };
};

type Tab = "all" | "actif" | "brouillon" | "archive";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function kindLabel(kind: string): string {
  switch (kind) {
    case "formation": return "Formation";
    case "EBOOK": return "E-book";
    case "PDF": return "PDF";
    case "TEMPLATE": return "Template";
    case "AUDIO": return "Audio";
    case "SOFTWARE": return "Logiciel";
    case "BUNDLE": return "Pack";
    default: return kind;
  }
}

/** Couleurs des badges type — exactement la maquette :
 *  Formation vert, Ebook/PDF bleu, Template ambre, Coaching/Audio rose. */
function kindPill(kind: string): { background: string; color: string } {
  switch (kind) {
    case "formation": return { background: ST.greenSoft, color: ST.green };
    case "EBOOK":
    case "PDF": return { background: ST.blueSoft, color: ST.blueText };
    case "TEMPLATE": return { background: ST.amberSoft, color: ST.amberText };
    case "AUDIO": return { background: ST.roseSoft, color: ST.roseText };
    case "BUNDLE": return { background: ST.roseSoft, color: ST.roseText };
    default: return { background: "#f1efe8", color: "#5f5e5a" };
  }
}

function kindIcon(kind: string) {
  switch (kind) {
    case "formation": return PlayCircle;
    case "EBOOK":
    case "PDF": return BookOpen;
    case "BUNDLE": return Layers;
    case "TEMPLATE": return LayoutGrid;
    case "AUDIO": return Headphones;
    case "SOFTWARE": return Code;
    default: return FileText;
  }
}

/** Gradients verts variés pour les covers sans thumbnail (maquette). */
const COVER_GRADIENTS = [
  "linear-gradient(135deg,#006e2f,#22c55e)",
  "linear-gradient(135deg,#0b3b20,#1d9e75)",
  "linear-gradient(135deg,#14532d,#65d68d)",
  "linear-gradient(135deg,#064e3b,#34d399)",
  "linear-gradient(135deg,#1f2937,#4b6358)",
];
const DRAFT_GRADIENT = "linear-gradient(135deg,#9caea3,#cfdcd4)";

function isActive(p: Product) {
  return p.status === "ACTIF" || p.status === "ACTIF_PRODUCT";
}
function isDraft(p: Product) {
  return p.status === "BROUILLON" || p.status === "BROUILLON_PRODUCT";
}
function isArchived(p: Product) {
  return p.status === "ARCHIVE" || p.status === "ARCHIVED";
}

function statusKey(s: string): string {
  if (s === "ACTIF_PRODUCT") return "ACTIF";
  if (s === "BROUILLON_PRODUCT") return "BROUILLON";
  if (s === "ARCHIVED") return "ARCHIVE";
  return s;
}

function SkeletonCard() {
  return (
    <StCard noPadding className="overflow-hidden animate-pulse">
      <div className="h-[108px]" style={{ background: "#f3f6f4" }} />
      <div className="p-4 space-y-3">
        <div className="h-3.5 rounded w-3/4" style={{ background: "#f3f6f4" }} />
        <div className="h-4 rounded w-24" style={{ background: "#f3f6f4" }} />
        <div className="h-3 rounded w-full" style={{ background: "#f3f6f4" }} />
      </div>
    </StCard>
  );
}

export default function ProduitsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [linksFor, setLinksFor] = useState<Product | null>(null);

  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "https://novakou.com";
  const productUrl = (p: Product) => `${shareOrigin}${p.productKind === "formation" ? "/formation/" : "/produit/"}${p.slug}`;
  // Lien de PAIEMENT DIRECT : va droit au checkout (saute la page produit) —
  // idéal pour une pub Meta/TikTok ou un envoi direct à l'acheteur.
  const checkoutUrl = (p: Product) => `${shareOrigin}/checkout?${p.productKind === "formation" ? "fids" : "pids"}=${p.id}`;

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedKey(key);
        setToast("Lien copié ✓");
        setTimeout(() => { setCopiedKey(null); setToast(null); }, 2000);
      })
      .catch(() => setToast("Copie impossible"));
  }

  const { data: response, isLoading } = useQuery<{ data: FormationsData | null }>({
    queryKey: ["vendeur-formations"],
    queryFn: () => fetch("/api/formations/vendeur/formations").then((r) => r.json()),
    staleTime: 30_000,
  });

  const archiveMut = useMutation({
    mutationFn: async (p: Product) => {
      const isFormation = p.productKind === "formation";
      const url = isFormation
        ? `/api/formations/vendeur/formations/${p.id}`
        : `/api/formations/vendeur/products/${p.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVE" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Produit archivé");
      qc.invalidateQueries({ queryKey: ["vendeur-formations"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleArchive(p: Product) {
    const ok = await confirmAction({
      title: "Archiver ce produit ?",
      message: "Il ne sera plus visible dans la marketplace ni dans la recherche. Vous pourrez le réactiver plus tard.",
      confirmLabel: "Archiver",
      confirmVariant: "warning",
      icon: "archive",
    });
    if (ok) archiveMut.mutate(p);
  }

  const deleteMut = useMutation({
    mutationFn: async (p: Product) => {
      const url = p.productKind === "formation"
        ? `/api/formations/vendeur/formations/${p.id}`
        : `/api/formations/vendeur/products/${p.id}`;
      const res = await fetch(url, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j.data ?? j;
    },
    onSuccess: (data) => {
      // Si des ventes existent, l'API archive au lieu de supprimer définitivement.
      setToast(data?.archived ? "Produit archivé (des ventes existent, suppression impossible)" : "Produit supprimé");
      qc.invalidateQueries({ queryKey: ["vendeur-formations"] });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleDelete(p: Product) {
    const ok = await confirmAction({
      title: `Supprimer « ${p.title} » ?`,
      message: "Cette action est définitive et irréversible. Si le produit a déjà des ventes, il sera archivé (masqué) au lieu d'être supprimé, pour préserver l'historique des acheteurs.",
      confirmLabel: "Supprimer",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (ok) deleteMut.mutate(p);
  }

  const d = response?.data;
  const totals = d?.totals;
  const allItems: Product[] = useMemo(() => [
    ...(d?.formations ?? []),
    ...(d?.digitalProducts ?? []),
  ], [d]);

  function exportCSV() {
    if (allItems.length === 0) return;
    const headers = ["Titre", "Type", "Statut", "Prix", "Ventes", "Revenus", "Note", "Avis", "Créé le"];
    const rows = allItems.map((p) => [
      `"${p.title.replace(/"/g, '""')}"`,
      kindLabel(p.productKind),
      p.status,
      Math.round(p.price),
      p.sales,
      Math.round(p.revenue),
      p.rating.toFixed(1),
      p.reviewsCount,
      new Date(p.createdAt).toISOString().slice(0, 10),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `novakou-produits-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { key: "all", label: "Tous", count: allItems.length },
    { key: "actif", label: "Actifs", count: allItems.filter(isActive).length },
    { key: "brouillon", label: "Brouillons", count: allItems.filter(isDraft).length },
    { key: "archive", label: "Archivés", count: allItems.filter(isArchived).length },
  ];

  const filtered = useMemo(() => {
    let items = allItems;
    if (activeTab === "actif") items = items.filter(isActive);
    else if (activeTab === "brouillon") items = items.filter(isDraft);
    else if (activeTab === "archive") items = items.filter(isArchived);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      items = items.filter((p) => p.title.toLowerCase().includes(q));
    }
    return items;
  }, [allItems, activeTab, searchQ]);

  const ratingAvg = useMemo(() => {
    const rated = allItems.filter((p) => p.reviewsCount > 0);
    if (!rated.length) return null;
    const total = rated.reduce((s, p) => s + p.rating * p.reviewsCount, 0);
    const count = rated.reduce((s, p) => s + p.reviewsCount, 0);
    return count > 0 ? (total / count).toFixed(1) : null;
  }, [allItems]);

  const totalRevenue = totals?.revenue ?? 0;
  const revenueDisplay =
    totalRevenue >= 1_000_000
      ? `${(totalRevenue / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M`
      : formatFCFA(totalRevenue);

  return (
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        {toast && (
          <div
            className="fixed top-20 right-6 z-50 text-white px-5 py-3 text-xs font-extrabold shadow-2xl rounded-xl"
            style={{ background: ST.greenDark }}
          >
            {toast}
          </div>
        )}

        <StPageHeader
          title="Mes produits"
          subtitle="Gérez votre catalogue et suivez les performances de chaque produit."
          actions={
            <>
              <StButton variant="secondary" onClick={exportCSV} disabled={allItems.length === 0} icon={Download}>
                Exporter
              </StButton>
              <StButton href="/vendeur/produits/creer" icon={Plus}>
                Nouveau produit
              </StButton>
            </>
          }
        />

        {/* ── 4 KPI compacts (maquette) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-[18px]">
          <StKpiCompact
            label="Produits au total"
            value={isLoading ? "…" : String(totals?.products ?? 0)}
            icon={Package}
            tone="green"
          />
          <StKpiCompact
            label="Ventes cumulées"
            value={isLoading ? "…" : (totals?.sales ?? 0).toLocaleString("fr-FR")}
            icon={ShoppingBag}
            tone="green"
          />
          <StKpiCompact
            label="Note moyenne"
            value={isLoading ? "…" : ratingAvg ?? "—"}
            unit={ratingAvg ? "/ 5" : undefined}
            icon={Star}
            tone="amber"
          />
          <StKpiCompact
            label="Revenus totaux"
            value={isLoading ? "…" : revenueDisplay}
            unit="FCFA"
            icon={Wallet}
            tone="green"
          />
        </div>

        {/* ── Tabs + recherche (maquette) ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <StTabs tabs={tabs} active={activeTab} onChange={(k) => setActiveTab(k as Tab)} />
          <div
            className="flex items-center gap-2 bg-white rounded-[12px] px-3.5 py-2.5 w-full md:w-[280px]"
            style={{ border: `1px solid ${ST.cardBorder}` }}
          >
            <Search size={15} style={{ color: ST.textMuted }} />
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Filtrer par nom…"
              className="flex-1 bg-transparent text-[12.5px] font-semibold focus:outline-none"
              style={{ color: ST.text }}
            />
          </div>
        </div>

        {/* ── Grille 3 colonnes de cards (maquette) ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 && allItems.length > 0 ? (
          <StCard className="text-center py-12">
            <Store size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
            <p className="text-[13.5px] font-extrabold mt-3" style={{ color: ST.text }}>
              Aucun produit dans cette catégorie
            </p>
            <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textMuted }}>
              Essayez un autre onglet ou modifiez votre recherche.
            </p>
          </StCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filtered.map((product, idx) => {
              const Icon = kindIcon(product.productKind);
              const pill = kindPill(product.productKind);
              const cover = isDraft(product)
                ? DRAFT_GRADIENT
                : COVER_GRADIENTS[idx % COVER_GRADIENTS.length];
              const editHref =
                product.productKind === "formation"
                  ? `/vendeur/cours/${product.id}/editer`
                  : `/vendeur/produits/${product.id}/editer`;
              return (
                <StCard key={product.id} noPadding className="overflow-hidden">
                  {/* Cover */}
                  <div
                    className="h-[108px] flex items-center justify-center relative"
                    style={
                      product.thumbnail
                        ? undefined
                        : { background: cover }
                    }
                  >
                    {product.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={34} style={{ color: "rgba(255,255,255,.9)" }} />
                    )}
                    <span
                      className="absolute top-2.5 left-2.5 text-[10px] font-extrabold px-[9px] py-[3px] rounded-full"
                      style={pill}
                    >
                      {kindLabel(product.productKind)}
                    </span>
                  </div>
                  {/* Body */}
                  <div className="px-4 pt-3 pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-[13.5px] font-extrabold leading-snug line-clamp-2" style={{ color: ST.text }}>
                        {product.title}
                      </div>
                      <StStatusPill status={statusKey(product.status)} />
                    </div>
                    <div className="text-[16px] font-extrabold my-2 tabular-nums" style={{ color: ST.green }}>
                      {formatFCFA(product.price)}{" "}
                      <span className="text-[11px]" style={{ color: ST.textMuted }}>FCFA</span>
                    </div>

                    {/* Motif de retrait par la modération (produit remis en brouillon) */}
                    {product.refuseReason && statusKey(product.status) === "BROUILLON" && (
                      <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-rose-700">
                          Retiré par la modération
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-rose-900">{product.refuseReason}</p>
                        <p className="mt-1 text-[10px] text-rose-700/80">Corrigez puis resoumettez à la validation.</p>
                      </div>
                    )}
                    <div
                      className="flex items-center justify-between pt-[11px]"
                      style={{ borderTop: `1px solid ${ST.divider}` }}
                    >
                      <div className="flex gap-3 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag size={12} />
                          {product.sales.toLocaleString("fr-FR")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star size={12} style={{ color: "#ba7517" }} className="fill-[#ba7517]" />
                          {product.reviewsCount > 0 ? product.rating.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {product.slug && !isDraft(product) && (
                          <button
                            onClick={() => setLinksFor(product)}
                            title="Liens de partage (page produit + paiement direct)"
                            className="w-[30px] h-[30px] rounded-[9px] bg-white flex items-center justify-center transition-colors hover:bg-emerald-50"
                            style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
                          >
                            <Share2 size={14} />
                          </button>
                        )}
                        <Link
                          href={editHref}
                          title="Modifier"
                          className="w-[30px] h-[30px] rounded-[9px] bg-white flex items-center justify-center transition-colors hover:bg-slate-50"
                          style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
                        >
                          <Edit size={14} />
                        </Link>
                        <Link
                          href="/vendeur/statistiques"
                          title="Statistiques"
                          className="w-[30px] h-[30px] rounded-[9px] bg-white flex items-center justify-center transition-colors hover:bg-slate-50"
                          style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
                        >
                          <BarChart3 size={14} />
                        </Link>
                        <button
                          onClick={() => handleArchive(product)}
                          disabled={archiveMut.isPending || isArchived(product)}
                          title={isArchived(product) ? "Déjà archivé" : "Archiver"}
                          className="w-[30px] h-[30px] rounded-[9px] bg-white flex items-center justify-center transition-colors hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={deleteMut.isPending}
                          title="Supprimer"
                          className="w-[30px] h-[30px] rounded-[9px] bg-white flex items-center justify-center transition-colors hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ border: `1px solid ${ST.cardBorder}`, color: "#e11d48" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </StCard>
              );
            })}

            {/* Ghost card création (maquette) */}
            <StGhostCard
              icon={Plus}
              title="Créer un produit"
              subtitle="Formation, ebook, template ou coaching — en 5 étapes"
              href="/vendeur/produits/creer"
              minHeight={230}
            />
          </div>
        )}

        {/* Modale : liens de partage (page produit + paiement direct) */}
        {linksFor && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setLinksFor(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-extrabold text-[15px] flex items-center gap-2" style={{ color: ST.text }}>
                  <Share2 size={18} /> Liens de partage
                </h3>
                <button onClick={() => setLinksFor(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
              </div>
              <p className="text-[12.5px] mb-4" style={{ color: ST.textSecondary }}>{linksFor.title}</p>

              {[
                { key: "produit", label: "Page produit", desc: "La fiche complète avec description et bouton d'achat.", url: productUrl(linksFor) },
                { key: "checkout", label: "Paiement direct", desc: "Va droit au paiement (idéal pour une pub Meta/TikTok ou un envoi à un acheteur).", url: checkoutUrl(linksFor) },
              ].map((row) => {
                const ck = `${linksFor.id}-${row.key}`;
                return (
                  <div key={row.key} className="rounded-xl border border-gray-100 bg-slate-50/60 p-3 mb-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-extrabold" style={{ color: ST.text }}>{row.label}</span>
                      <button
                        onClick={() => copyText(row.url, ck)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#006e2f]/10 text-[#006e2f] text-[11px] font-bold hover:bg-[#006e2f]/15 transition-colors"
                      >
                        {copiedKey === ck ? <Check size={12} /> : <Copy size={12} />}{copiedKey === ck ? "Copié" : "Copier"}
                      </button>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: ST.textMuted }}>{row.desc}</p>
                    <code className="block mt-1.5 text-[11px] text-slate-500 bg-white border border-gray-100 rounded-lg px-2 py-1 truncate">{row.url}</code>
                  </div>
                );
              })}

              <p className="text-[11px] mt-2 flex items-start gap-1.5" style={{ color: ST.textMuted }}>
                <Check size={13} className="text-[#006e2f] flex-shrink-0 mt-0.5" />
                Vos pixels (Facebook, TikTok, Google) se déclenchent automatiquement sur ces pages — vos campagnes publicitaires sont suivies.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
