"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

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

function kindColors(kind: string): string {
  switch (kind) {
    case "formation": return "bg-blue-100 text-blue-700";
    case "EBOOK":
    case "PDF": return "bg-amber-100 text-amber-700";
    case "BUNDLE": return "bg-purple-100 text-purple-700";
    case "TEMPLATE": return "bg-teal-100 text-teal-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function kindIcon(kind: string): string {
  switch (kind) {
    case "formation": return "play_circle";
    case "EBOOK":
    case "PDF": return "menu_book";
    case "BUNDLE": return "inventory_2";
    case "TEMPLATE": return "widgets";
    case "AUDIO": return "headphones";
    case "SOFTWARE": return "code";
    default: return "description";
  }
}

const GRADIENTS = [
  "from-[#006e2f] to-[#22c55e]",
  "from-amber-500 to-orange-600",
  "from-purple-600 to-indigo-700",
  "from-blue-600 to-cyan-500",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-emerald-600",
];

const statusStyles: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  ACTIF: { dot: "bg-[#006e2f]", label: "Actif", bg: "bg-[#006e2f]/10", text: "text-[#006e2f]" },
  BROUILLON: { dot: "bg-gray-400", label: "Brouillon", bg: "bg-gray-100", text: "text-gray-500" },
  EN_ATTENTE: { dot: "bg-amber-400", label: "En attente", bg: "bg-amber-50", text: "text-amber-700" },
  ARCHIVE: { dot: "bg-red-400", label: "Archivé", bg: "bg-red-50", text: "text-red-600" },
  ACTIF_PRODUCT: { dot: "bg-[#006e2f]", label: "Actif", bg: "bg-[#006e2f]/10", text: "text-[#006e2f]" },
  BROUILLON_PRODUCT: { dot: "bg-gray-400", label: "Brouillon", bg: "bg-gray-100", text: "text-gray-500" },
};

function getStatus(product: Product) {
  const s = product.status.toUpperCase();
  return statusStyles[s] ?? { dot: "bg-gray-400", label: product.status, bg: "bg-gray-100", text: "text-gray-500" };
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
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 rounded w-36" />
          <div className="h-2 bg-gray-100 rounded w-20" />
        </div>
      </div>
      <div className="h-5 bg-gray-100 rounded-full w-20" />
      <div className="h-3 bg-gray-100 rounded w-16" />
      <div className="h-3 bg-gray-100 rounded w-12" />
      <div className="h-5 bg-gray-100 rounded-full w-16" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => <div key={i} className="w-8 h-8 rounded-lg bg-gray-100" />)}
      </div>
    </div>
  );
}

export default function ProduitsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const { data: response, isLoading } = useQuery<{ data: FormationsData | null }>({
    queryKey: ["vendeur-formations"],
    queryFn: () => fetch("/api/formations/vendeur/formations").then((r) => r.json()),
    staleTime: 30_000,
  });

  const d = response?.data;
  const totals = d?.totals;
  const allItems: Product[] = useMemo(() => [
    ...(d?.formations ?? []),
    ...(d?.digitalProducts ?? []),
  ], [d]);

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

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes produits</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {isLoading ? "Chargement…" : `${totals?.products ?? 0} produit${(totals?.products ?? 0) !== 1 ? "s" : ""} · ${totals?.activeFormations ?? 0} actif${(totals?.activeFormations ?? 0) !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] bg-white hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[18px] text-[#5c647a]">download</span>
            Exporter
          </button>
          <Link
            href="/vendeur/produits/creer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Ajouter un produit
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: "inventory_2",
            iconBg: "bg-[#006e2f]/10",
            iconColor: "text-[#006e2f]",
            label: "Total produits",
            value: isLoading ? "…" : String(totals?.products ?? 0),
            sub: isLoading ? "" : `${totals?.activeFormations ?? 0} actif${(totals?.activeFormations ?? 0) !== 1 ? "s" : ""}`,
          },
          {
            icon: "shopping_cart",
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            label: "Volume des ventes",
            value: isLoading ? "…" : String(totals?.sales ?? 0),
            sub: "Ventes cumulées",
          },
          {
            icon: "star",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
            label: "Note moyenne",
            value: isLoading ? "…" : (() => {
              if (!allItems.length) return "—";
              const rated = allItems.filter((p) => p.reviewsCount > 0);
              if (!rated.length) return "—";
              const total = rated.reduce((s, p) => s + p.rating * p.reviewsCount, 0);
              const count = rated.reduce((s, p) => s + p.reviewsCount, 0);
              return count > 0 ? (total / count).toFixed(2) : "—";
            })(),
            sub: isLoading ? "" : `${allItems.reduce((s, p) => s + p.reviewsCount, 0)} avis`,
          },
          {
            icon: "payments",
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            label: "Revenus totaux",
            value: isLoading ? "…" : `${formatFCFA(totals?.revenue ?? 0)}`,
            unit: "FCFA",
            sub: isLoading ? "" : `≈ ${Math.round((totals?.revenue ?? 0) / 655.957).toLocaleString("fr-FR")} €`,
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
              <span className={`material-symbols-outlined text-[22px] ${card.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {card.icon}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#5c647a] uppercase tracking-wide">{card.label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-[#191c1e]">{card.value}</span>
              {"unit" in card && card.unit && (
                <span className="text-[10px] text-[#5c647a] font-semibold">{card.unit}</span>
              )}
            </div>
            <p className="text-[10px] text-[#5c647a] mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.value
                ? "text-white shadow-sm"
                : "bg-white border border-gray-200 text-[#5c647a] hover:border-[#006e2f]/30 hover:text-[#006e2f]"
            }`}
            style={activeTab === tab.value ? { background: "linear-gradient(to right, #006e2f, #22c55e)" } : {}}
          >
            {tab.label}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-[#5c647a]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100">
          {["Produit", "Type", "Prix (FCFA)", "Ventes", "Statut", "Actions"].map((h) => (
            <span key={h} className="text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[40px] text-gray-300 block mb-3">storefront</span>
            <p className="font-semibold text-[#191c1e]">
              {allItems.length === 0 ? "Aucun produit créé" : "Aucun produit dans cette catégorie"}
            </p>
            {allItems.length === 0 && (
              <Link
                href="/vendeur/produits/creer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Créer votre premier produit
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((product, idx) => {
              const status = getStatus(product);
              const icon = kindIcon(product.productKind);
              const gradient = GRADIENTS[idx % GRADIENTS.length];
              return (
                <div
                  key={product.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center"
                >
                  {/* Product */}
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
                        <span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {icon}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#191c1e] line-clamp-1">{product.title}</p>
                      {product.reviewsCount > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-amber-400 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-[10px] text-[#5c647a]">{product.rating.toFixed(1)} ({product.reviewsCount} avis)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${kindColors(product.productKind)}`}>
                      {kindLabel(product.productKind)}
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">{formatFCFA(product.price)}</p>
                    <p className="text-[10px] text-[#5c647a]">≈ {Math.round(product.price / 655.957)} €</p>
                  </div>

                  {/* Sales */}
                  <div>
                    <p className="text-sm font-semibold text-[#191c1e]">{product.sales.toLocaleString("fr-FR")}</p>
                    <p className="text-[10px] text-[#5c647a]">ventes</p>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={
                        product.productKind === "formation"
                          ? `/vendeur/cours/${product.id}/editer`
                          : `/vendeur/produits/${product.id}/editer`
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a] hover:text-[#191c1e] transition-colors"
                      title="Modifier"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Link>
                    <Link
                      href={`/vendeur/statistiques`}
                      className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a] hover:text-[#191c1e] transition-colors"
                      title="Statistiques"
                    >
                      <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                    </Link>
                    <button className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500 transition-colors" title="Archiver">
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-[#5c647a]">
              Affichage de <span className="font-semibold text-[#191c1e]">1–{filtered.length}</span> sur{" "}
              <span className="font-semibold text-[#191c1e]">{allItems.length}</span> produits
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
