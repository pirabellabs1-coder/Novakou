"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Star, ShoppingBag, Eye, Package } from "lucide-react";
import { StockCounter } from "@/components/formations/StockCounter";

// ── Types ──

interface Product {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  banner: string | null;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  productType: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  viewsCount: number;
  previewEnabled: boolean;
  maxBuyers: number | null;
  currentBuyers: number;
  tags: string[];
  category: { nameFr: string; nameEn: string; slug: string } | null;
  instructeur: { user: { name: string; avatar: string | null; image: string | null } };
}

const PRODUCT_TYPES = [
  { value: "EBOOK", icon: "menu_book", label: "E-book" },
  { value: "PDF", icon: "picture_as_pdf", label: "PDF" },
  { value: "TEMPLATE", icon: "dashboard_customize", label: "Template" },
  { value: "LICENCE", icon: "vpn_key", label: "Licence" },
  { value: "AUDIO", icon: "headphones", label: "Audio" },
  { value: "VIDEO", icon: "videocam", label: "Vidéo" },
  { value: "AUTRE", icon: "inventory_2", label: "Autre" },
];

const SORT_OPTIONS = [
  { value: "populaire", label: "Populaires" },
  { value: "recent", label: "Récents" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
  { value: "note", label: "Mieux notés" },
];

// ── Page ──

export default function ProduitsMarketplacePage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "populaire");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");

    try {
      const res = await fetch(`/api/produits?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, type, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const t = (key: string) => {
    const labels: Record<string, string> = {
      title: locale === "fr" ? "Produits numériques" : "Digital Products",
      subtitle: locale === "fr" ? "E-books, templates, licences et plus encore" : "E-books, templates, licenses and more",
      search_placeholder: locale === "fr" ? "Rechercher un produit..." : "Search products...",
      no_results: locale === "fr" ? "Aucun produit trouvé" : "No products found",
      free: locale === "fr" ? "Gratuit" : "Free",
      preview: locale === "fr" ? "Aperçu" : "Preview",
      sold: locale === "fr" ? "vendus" : "sold",
      results: locale === "fr" ? "résultat(s)" : "result(s)",
      filters: locale === "fr" ? "Filtres" : "Filters",
      type_filter: locale === "fr" ? "Type de produit" : "Product type",
      all_types: locale === "fr" ? "Tous les types" : "All types",
    };
    return labels[key] || key;
  };

  function getTypeBadge(productType: string) {
    const found = PRODUCT_TYPES.find((pt) => pt.value === productType);
    return found || { icon: "inventory_2", label: productType };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
      </div>

      {/* Search + Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("search_placeholder")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t("filters")}
        </button>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">{t("type_filter")}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setType(""); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!type ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"}`}
            >
              {t("all_types")}
            </button>
            {PRODUCT_TYPES.map((pt) => (
              <button
                key={pt.value}
                onClick={() => { setType(type === pt.value ? "" : pt.value); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${type === pt.value ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"}`}
              >
                <span className="material-symbols-outlined text-sm">{pt.icon}</span>
                {pt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-slate-500 mb-4">
        {total} {t("results")}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">{t("no_results")}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const title = locale === "fr" ? product.titleFr : product.titleEn;
            const catName = product.category
              ? (locale === "fr" ? product.category.nameFr : product.category.nameEn)
              : "";
            const badge = getTypeBadge(product.productType);
            const instructor = product.instructeur?.user;

            return (
              <Link
                key={product.id}
                href={`/formations/produits/${product.slug}`}
                className="group bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
              >
                {/* Banner */}
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-blue-500/10">
                  {product.banner ? (
                    <img src={product.banner} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-primary/30">{badge.icon}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold">
                      <span className="material-symbols-outlined text-xs">{badge.icon}</span>
                      {badge.label}
                    </span>
                    {product.previewEnabled && (
                      <span className="inline-flex items-center gap-1 bg-blue-500/90 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        <Eye className="w-3 h-3" />{t("preview")}
                      </span>
                    )}
                  </div>

                  {/* Stock limité badge */}
                  {product.maxBuyers && product.currentBuyers >= product.maxBuyers * 0.8 && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                        Stock limité
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {catName && (
                    <span className="text-xs font-semibold text-primary">{catName}</span>
                  )}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>

                  {/* Instructor */}
                  {instructor && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {instructor.avatar || instructor.image ? (
                          <img src={instructor.avatar || instructor.image || ""} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-primary">{instructor.name?.[0]}</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 truncate">{instructor.name}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    {product.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {product.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <ShoppingBag className="w-3 h-3" />
                      {product.salesCount} {t("sold")}
                    </span>
                  </div>

                  {/* Stock counter */}
                  {product.maxBuyers && (
                    <div className="mt-2">
                      <StockCounter current={product.currentBuyers} max={product.maxBuyers} />
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-3">
                    {product.isFree ? (
                      <span className="text-lg font-bold text-green-600">{t("free")}</span>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {product.price.toFixed(0)}€
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-slate-400 line-through">
                            {product.originalPrice.toFixed(0)}€
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                p === page
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
