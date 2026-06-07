"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  Package,
  Download,
  Plus,
  ShoppingCart,
  Star,
  Wallet,
  Edit,
  BarChart3,
  Archive,
  Store,
  PlayCircle,
  BookOpen,
  Layers,
  LayoutGrid,
  Headphones,
  Code,
  FileText,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

type Product = {
  id: string;
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
    case "formation": return "Cours vidéo";
    case "EBOOK": return "E-book";
    case "PDF": return "PDF";
    case "TEMPLATE": return "Template";
    case "AUDIO": return "Audio";
    case "SOFTWARE": return "Logiciel";
    case "BUNDLE": return "Pack";
    default: return kind;
  }
}

function kindColors(kind: string): "blue" | "orange" | "violet" | "green" | "slate" {
  switch (kind) {
    case "formation": return "blue";
    case "EBOOK":
    case "PDF": return "orange";
    case "BUNDLE": return "violet";
    case "TEMPLATE": return "green";
    default: return "slate";
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

const GRADIENTS = [
  "from-emerald-600 to-emerald-400",
  "from-amber-500 to-orange-600",
  "from-purple-600 to-indigo-700",
  "from-blue-600 to-cyan-500",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-emerald-600",
];

function statusBadge(s: string): { variant: "green" | "slate" | "orange" | "rose"; label: string } {
  switch (s.toUpperCase()) {
    case "ACTIF":
    case "ACTIF_PRODUCT": return { variant: "green", label: "Actif" };
    case "BROUILLON":
    case "BROUILLON_PRODUCT": return { variant: "slate", label: "Brouillon" };
    case "EN_ATTENTE": return { variant: "orange", label: "En attente" };
    case "ARCHIVE":
    case "ARCHIVED": return { variant: "rose", label: "Archivé" };
    default: return { variant: "slate", label: s };
  }
}

function isActive(p: Product) {
  return p.status === "ACTIF" || p.status === "ACTIF_PRODUCT";
}
function isDraft(p: Product) {
  return p.status === "BROUILLON" || p.status === "BROUILLON_PRODUCT";
}
function isArchived(p: Product) {
  return p.status === "ARCHIVE" || p.status === "ARCHIVED";
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 animate-pulse items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-36" />
          <div className="h-2 bg-slate-100 rounded w-20" />
        </div>
      </div>
      <div className="h-5 bg-slate-100 rounded-full w-20" />
      <div className="h-3 bg-slate-100 rounded w-16" />
      <div className="h-3 bg-slate-100 rounded w-12" />
      <div className="h-5 bg-slate-100 rounded-full w-16" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => <div key={i} className="w-8 h-8 rounded-lg bg-slate-100" />)}
      </div>
    </div>
  );
}

export default function ProduitsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [toast, setToast] = useState<string | null>(null);

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

  const tabs: { label: string; value: Tab; count: number }[] = [
    { label: "Tous", value: "all", count: allItems.length },
    { label: "Actifs", value: "actif", count: allItems.filter(isActive).length },
    { label: "Brouillons", value: "brouillon", count: allItems.filter(isDraft).length },
    { label: "Archivés", value: "archive", count: allItems.filter(isArchived).length },
  ];

  const filtered = useMemo(() => {
    if (activeTab === "all") return allItems;
    if (activeTab === "actif") return allItems.filter(isActive);
    if (activeTab === "brouillon") return allItems.filter(isDraft);
    return allItems.filter(isArchived);
  }, [allItems, activeTab]);

  const ratingAvg = useMemo(() => {
    const rated = allItems.filter((p) => p.reviewsCount > 0);
    if (!rated.length) return null;
    const total = rated.reduce((s, p) => s + p.rating * p.reviewsCount, 0);
    const count = rated.reduce((s, p) => s + p.reviewsCount, 0);
    return count > 0 ? (total / count).toFixed(2) : null;
  }, [allItems]);

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#0b2540] text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl rounded-xl">
          {toast}
        </div>
      )}

      <KazaHero
        badge="Pro"
        badgeColor="orange"
        title="Mes produits"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${totals?.products ?? 0} produit${(totals?.products ?? 0) !== 1 ? "s" : ""} · ${totals?.activeFormations ?? 0} actif${(totals?.activeFormations ?? 0) !== 1 ? "s" : ""}`
        }
        icon={Package}
        actions={
          <>
            <KazaButton variant="secondary" onClick={exportCSV} disabled={allItems.length === 0} icon={Download}>
              Exporter
            </KazaButton>
            <KazaButton variant="primary" href="/vendeur/produits/creer" icon={Plus}>
              Ajouter
            </KazaButton>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KazaKpiCard
          label="Total produits"
          value={isLoading ? "…" : String(totals?.products ?? 0)}
          delta={isLoading ? undefined : `${totals?.activeFormations ?? 0} actif${(totals?.activeFormations ?? 0) !== 1 ? "s" : ""}`}
          icon={Package}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Volume des ventes"
          value={isLoading ? "…" : String(totals?.sales ?? 0)}
          icon={ShoppingCart}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Note moyenne"
          value={isLoading ? "…" : (ratingAvg ?? "—")}
          delta={isLoading ? undefined : `${allItems.reduce((s, p) => s + p.reviewsCount, 0)} avis`}
          icon={Star}
          iconColor="orange"
        />
        <KazaKpiCard
          label="Revenus totaux"
          value={isLoading ? "…" : `${formatFCFA(totals?.revenue ?? 0)} FCFA`}
          delta={isLoading ? undefined : `≈ ${Math.round((totals?.revenue ?? 0) / 655.957).toLocaleString("fr-FR")} €`}
          icon={Wallet}
          iconColor="violet"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab.value
                ? "bg-[#0b2540] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-600"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <KazaCard noPadding>
          <div className="divide-y divide-slate-50">
            {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </div>
        </KazaCard>
      ) : filtered.length === 0 ? (
        allItems.length === 0 ? (
          <KazaEmpty
            icon={Store}
            title="Aucun produit créé"
            description="Publiez votre premier produit pour commencer à vendre. Formation vidéo, ebook, template ou pack."
            action={{ label: "Créer votre premier produit", href: "/vendeur/produits/creer" }}
          />
        ) : (
          <KazaEmpty
            icon={Store}
            title="Aucun produit dans cette catégorie"
            description="Essayez un autre onglet pour voir vos produits."
          />
        )
      ) : (
        <KazaCard noPadding>
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-slate-50 border-b border-slate-100">
            {["Produit", "Type", "Prix (FCFA)", "Ventes", "Statut", "Actions"].map((h) => (
              <span key={h} className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-slate-50">
            {filtered.map((product, idx) => {
              const status = statusBadge(product.status);
              const Icon = kindIcon(product.productKind);
              const gradient = GRADIENTS[idx % GRADIENTS.length];
              return (
                <div
                  key={product.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors items-center"
                >
                  <div className="flex items-center gap-3">
                    {product.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${gradient}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{product.title}</p>
                      {product.reviewsCount > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-slate-500">{product.rating.toFixed(1)} ({product.reviewsCount} avis)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <KazaBadge variant={kindColors(product.productKind)}>{kindLabel(product.productKind)}</KazaBadge>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatFCFA(product.price)}</p>
                    <p className="text-[10px] text-slate-500">≈ {Math.round(product.price / 655.957)} €</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">{product.sales.toLocaleString("fr-FR")}</p>
                    <p className="text-[10px] text-slate-500">ventes</p>
                  </div>

                  <div>
                    <KazaBadge variant={status.variant}>{status.label}</KazaBadge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={
                        product.productKind === "formation"
                          ? `/vendeur/cours/${product.id}/editer`
                          : `/vendeur/produits/${product.id}/editer`
                      }
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </Link>
                    <Link
                      href="/vendeur/statistiques"
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                      title="Statistiques"
                    >
                      <BarChart3 size={16} />
                    </Link>
                    <button
                      onClick={() => handleArchive(product)}
                      disabled={archiveMut.isPending || isArchived(product)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isArchived(product) ? "Déjà archivé" : "Archiver"}
                    >
                      <Archive size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Affichage de <span className="font-semibold text-slate-900">1–{filtered.length}</span> sur{" "}
                <span className="font-semibold text-slate-900">{allItems.length}</span> produits
              </p>
            </div>
          )}
        </KazaCard>
      )}
    </div>
  );
}
