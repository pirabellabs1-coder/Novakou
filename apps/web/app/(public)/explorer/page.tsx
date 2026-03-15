"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCurrencyStore } from "@/store/currency";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface MarketplaceService {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId: string;
  basePrice: number;
  deliveryDays: number;
  rating: number;
  ratingCount: number;
  orderCount: number;
  image: string;
  images: string[];
  vendorName: string;
  vendorAvatar: string;
  vendorUsername: string;
  vendorCountry: string;
  vendorBadges: string[];
  isBoosted: boolean;
  tags: string[];
  favorited?: boolean;
}

interface ApiResponse {
  services: Omit<MarketplaceService, "favorited">[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================================
// Constants
// ============================================================

const CATEGORIES = [
  { slug: "developpement-web", icon: "code" },
  { slug: "design-ui-ux", icon: "palette" },
  { slug: "marketing-digital", icon: "campaign" },
  { slug: "redaction", icon: "edit_note" },
  { slug: "traduction", icon: "translate" },
  { slug: "video-animation", icon: "videocam" },
  { slug: "ia-data", icon: "smart_toy" },
  { slug: "mobile", icon: "smartphone" },
  { slug: "seo", icon: "travel_explore" },
  { slug: "cybersecurite", icon: "security" },
] as const;

const DELIVERY_VALUES = ["all", "1-3", "3-7", "7-14", "14-30"] as const;

const RATING_OPTIONS = [4, 3, 2] as const;

const SELLER_LEVEL_KEYS = ["nouveau", "confirme", "top_rated", "elite"] as const;

const COUNTRY_KEYS = [
  "tous",
  "senegal",
  "cote_divoire",
  "cameroun",
  "france",
  "maroc",
  "belgique",
  "canada",
  "mali",
  "burkina_faso",
] as const;

const SORT_VALUES = ["pertinence", "prix_asc", "prix_desc", "note", "recent", "populaire"] as const;

const ITEMS_PER_PAGE = 12;

const CATEGORY_GRADIENTS: Record<string, string> = {
  "developpement-web": "from-emerald-600/80 to-teal-800/80",
  "design-ui-ux": "from-purple-600/80 to-pink-700/80",
  "marketing-digital": "from-orange-500/80 to-red-600/80",
  "redaction": "from-blue-500/80 to-indigo-700/80",
  "traduction": "from-cyan-500/80 to-blue-600/80",
  "video-animation": "from-rose-500/80 to-purple-600/80",
  "ia-data": "from-violet-600/80 to-indigo-800/80",
  "mobile": "from-sky-500/80 to-blue-700/80",
  "seo": "from-lime-500/80 to-green-700/80",
  "cybersecurite": "from-slate-600/80 to-zinc-800/80",
};

// ============================================================
// Category slug lookup for gradient/icon mapping
// ============================================================

function getCategorySlug(categoryName: string): string {
  // Try direct slug map first
  const normalized = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (CATEGORY_GRADIENTS[normalized]) return normalized;
  // Try matching from CATEGORIES
  const match = CATEGORIES.find((c) => c.slug === normalized);
  return match?.slug ?? normalized;
}

function getBadgeLevel(badges: string[]): string {
  if (badges.includes("Elite")) return "Elite";
  if (badges.includes("Top Rated")) return "Top Rated";
  if (badges.includes("Confirme") || badges.includes("Pro")) return "Confirme";
  return "Nouveau";
}

// ============================================================
// Loading Skeleton
// ============================================================

function ServiceCardSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-3 animate-pulse">
        <div className="w-full sm:w-56 h-40 sm:h-36 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-1" />
        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="border-t border-slate-100 dark:border-border-dark pt-3 flex items-center justify-between">
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn(
            "material-symbols-outlined",
            iconSize,
            star <= Math.floor(rating) ? "text-accent" : star - 0.5 <= rating ? "text-accent" : "text-slate-300 dark:text-slate-600"
          )}
          style={star <= Math.floor(rating) ? { fontVariationSettings: "'FILL' 1" } : star - 0.5 <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {star <= Math.floor(rating) ? "star" : star - 0.5 <= rating ? "star_half" : "star"}
        </span>
      ))}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    "Nouveau": { bg: "bg-slate-500/15 dark:bg-slate-500/20", text: "text-slate-600 dark:text-slate-400" },
    "Confirme": { bg: "bg-blue-500/15 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
    "Top Rated": { bg: "bg-primary/15 dark:bg-primary/20", text: "text-primary" },
    "Elite": { bg: "bg-accent/15 dark:bg-accent/20", text: "text-amber-600 dark:text-accent" },
  };
  const c = config[level] ?? config["Nouveau"];
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", c.bg, c.text)}>
      {level}
    </span>
  );
}

function ServiceCard({
  service,
  view,
  format,
  onToggleFavorite,
  t,
}: {
  service: MarketplaceService;
  view: "grid" | "list";
  format: (n: number) => string;
  onToggleFavorite: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const categorySlug = getCategorySlug(service.category);
  const catIcon = CATEGORIES.find((c) => c.slug === categorySlug)?.icon ?? "category";
  const gradient = CATEGORY_GRADIENTS[categorySlug] ?? "from-primary/80 to-teal-800/80";
  const vendorLevel = getBadgeLevel(service.vendorBadges || []);

  if (view === "list") {
    return (
      <Link
        href={`/services/${service.slug}`}
        className="group flex flex-col sm:flex-row gap-4 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-lg transition-all p-3"
      >
        {/* Image */}
        <div className="relative w-full sm:w-56 h-40 sm:h-36 rounded-lg overflow-hidden flex-shrink-0">
          <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center", gradient)}>
            <span className="material-symbols-outlined text-white/80 text-5xl">{catIcon}</span>
          </div>
          {service.isBoosted && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-xs">bolt</span>
              Sponsorise
            </span>
          )}
          <div className={cn("absolute top-2 left-2", service.isBoosted && "top-9")}>
            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
              {service.category}
            </span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(service.id); }}
            className={cn(
              "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
              service.favorited
                ? "bg-red-500 text-white"
                : "bg-black/30 backdrop-blur-sm text-white hover:bg-red-500"
            )}
          >
            <span className="material-symbols-outlined text-sm" style={service.favorited ? { fontVariationSettings: "'FILL' 1" } : {}}>
              favorite
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {service.vendorAvatar ? service.vendorAvatar.slice(0, 2).toUpperCase() : "??"}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{service.vendorName}</span>
              <LevelBadge level={vendorLevel} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {service.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={service.rating} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{service.rating}</span>
              <span className="text-xs text-slate-500">({service.ratingCount})</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {service.deliveryDays}{t("days_short")}
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t("from")} {format(service.basePrice)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex flex-col bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center group-hover:scale-105 transition-transform duration-300", gradient)}>
          <span className="material-symbols-outlined text-white/80 text-6xl">{catIcon}</span>
        </div>
        {service.isBoosted && (
          <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm">
            <span className="material-symbols-outlined text-xs">bolt</span>
            Sponsorise
          </span>
        )}
        <div className={cn("absolute top-2.5 left-2.5", service.isBoosted && "top-9")}>
          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
            {service.category}
          </span>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(service.id); }}
          className={cn(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all",
            service.favorited
              ? "bg-red-500 text-white"
              : "bg-black/30 backdrop-blur-sm text-white hover:bg-red-500"
          )}
        >
          <span className="material-symbols-outlined text-sm" style={service.favorited ? { fontVariationSettings: "'FILL' 1" } : {}}>
            favorite
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Freelancer */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {service.vendorAvatar ? service.vendorAvatar.slice(0, 2).toUpperCase() : "??"}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{service.vendorName}</span>
          <LevelBadge level={vendorLevel} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-3 flex-1">
          {service.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={service.rating} />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{service.rating}</span>
          <span className="text-xs text-slate-500">({service.ratingCount})</span>
        </div>

        {/* Divider + Price */}
        <div className="border-t border-slate-100 dark:border-border-dark pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {service.deliveryDays}{t("days_short")}
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t("from")} {format(service.basePrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Filter Sidebar (Desktop + Mobile Drawer)
// ============================================================

interface FilterState {
  categories: string[];
  priceMin: string;
  priceMax: string;
  delivery: string;
  minRating: number;
  sellerLevels: string[];
  country: string;
  search: string;
}

const defaultFilters: FilterState = {
  categories: [],
  priceMin: "",
  priceMax: "",
  delivery: "all",
  minRating: 0,
  sellerLevels: [],
  country: "Tous",
  search: "",
};

function FilterSidebar({
  filters,
  onChange,
  onReset,
  className,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
  className?: string;
}) {
  const t = useTranslations("explorer");

  const toggleCategory = (slug: string) => {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((c) => c !== slug)
      : [...filters.categories, slug];
    onChange({ ...filters, categories: next });
  };

  const toggleSellerLevel = (level: string) => {
    const next = filters.sellerLevels.includes(level)
      ? filters.sellerLevels.filter((l) => l !== level)
      : [...filters.sellerLevels, level];
    onChange({ ...filters, sellerLevels: next });
  };

  const hasFilters =
    filters.categories.length > 0 ||
    filters.priceMin !== "" ||
    filters.priceMax !== "" ||
    filters.delivery !== "all" ||
    filters.minRating > 0 ||
    filters.sellerLevels.length > 0 ||
    filters.country !== "Tous";

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Categories */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t("filter_categories")}</h4>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/30 accent-primary"
              />
              <span className="material-symbols-outlined text-sm text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">{cat.icon}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{t(`cat.${cat.slug}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t("filter_price_range")}</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={t("filter_min")}
            value={filters.priceMin}
            onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
            className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            placeholder={t("filter_max")}
            value={filters.priceMax}
            onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
            className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Delivery Time */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t("filter_delivery")}</h4>
        <select
          value={filters.delivery}
          onChange={(e) => onChange({ ...filters, delivery: e.target.value })}
          className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          {DELIVERY_VALUES.map((val) => (
            <option key={val} value={val}>{t(`delivery.${val}`)}</option>
          ))}
        </select>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t("filter_min_rating")}</h4>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === 0}
              onChange={() => onChange({ ...filters, minRating: 0 })}
              className="w-4 h-4 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/30 accent-primary"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">{t("filter_all_ratings")}</span>
          </label>
          {RATING_OPTIONS.map((value) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === value}
                onChange={() => onChange({ ...filters, minRating: value })}
                className="w-4 h-4 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/30 accent-primary"
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: value }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
                <span className="text-sm text-slate-700 dark:text-slate-300 ml-1">{t("filter_and_more")}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Seller Level */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t("filter_seller_level")}</h4>
        <div className="space-y-1.5">
          {SELLER_LEVEL_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.sellerLevels.includes(t(`level.${key}`))}
                onChange={() => toggleSellerLevel(t(`level.${key}`))}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/30 accent-primary"
              />
              <LevelBadge level={t(`level.${key}`)} />
            </label>
          ))}
        </div>
      </div>

      {/* Country */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t("filter_country")}</h4>
        <select
          value={filters.country}
          onChange={(e) => onChange({ ...filters, country: e.target.value })}
          className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          {COUNTRY_KEYS.map((key) => (
            <option key={key} value={t(`country.${key}`)}>{t(`country.${key}`)}</option>
          ))}
        </select>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-slate-200 dark:border-border-dark text-sm font-semibold text-slate-600 dark:text-slate-400 hover:border-red-400 hover:text-red-500 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          {t("reset_filters")}
        </button>
      )}
    </div>
  );
}

// ============================================================
// Pagination
// ============================================================

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const pages: (number | "ellipsis")[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("ellipsis");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("ellipsis");
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-border-dark text-slate-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      {pages.map((page, idx) =>
        page === "ellipsis" ? (
          <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={cn(
              "w-9 h-9 rounded-lg text-sm font-bold transition-colors",
              page === current
                ? "bg-primary text-white"
                : "border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary"
            )}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-border-dark text-slate-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

export default function ExplorerPage() {
  const { format } = useCurrencyStore();
  const t = useTranslations("explorer");

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState("pertinence");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // API data state
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Debounce timer for search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the search value independently for the input, debouncing API calls
  const [searchInput, setSearchInput] = useState("");

  // ---- Fetch services from API ----
  const fetchServices = useCallback(async (
    currentFilters: FilterState,
    currentSort: string,
    currentPage: number,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Search query
      if (currentFilters.search.trim()) {
        params.set("q", currentFilters.search.trim());
      }

      // Category filter — the API accepts category name
      if (currentFilters.categories.length === 1) {
        const catSlug = currentFilters.categories[0];
        const cat = CATEGORIES.find((c) => c.slug === catSlug);
        if (cat) params.set("category", t(`cat.${cat.slug}`));
      }

      // Price range
      if (currentFilters.priceMin !== "") {
        params.set("minPrice", currentFilters.priceMin);
      }
      if (currentFilters.priceMax !== "") {
        params.set("maxPrice", currentFilters.priceMax);
      }

      // Sort
      params.set("sort", currentSort === "recent" ? "nouveau" : currentSort);

      // Pagination
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await fetch(`/api/public/services?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data: ApiResponse = await res.json();

      // Apply client-side filters that the API does not support
      let filtered = data.services.map((s) => ({
        ...s,
        favorited: favoriteIds.has(s.id),
      }));

      // Multi-category filter (API only supports single category)
      if (currentFilters.categories.length > 1) {
        filtered = filtered.filter((s) => {
          const slug = getCategorySlug(s.category);
          return currentFilters.categories.includes(slug);
        });
      }

      // Delivery time filter (client-side)
      if (currentFilters.delivery !== "all") {
        const [minStr, maxStr] = currentFilters.delivery.split("-");
        const min = Number(minStr);
        const max = Number(maxStr);
        filtered = filtered.filter((s) => s.deliveryDays >= min && s.deliveryDays <= max);
      }

      // Rating filter (client-side)
      if (currentFilters.minRating > 0) {
        filtered = filtered.filter((s) => s.rating >= currentFilters.minRating);
      }

      // Seller level filter (client-side)
      if (currentFilters.sellerLevels.length > 0) {
        filtered = filtered.filter((s) => {
          const level = getBadgeLevel(s.vendorBadges || []);
          return currentFilters.sellerLevels.includes(level);
        });
      }

      // Country filter (client-side)
      if (currentFilters.country !== "Tous") {
        filtered = filtered.filter((s) => s.vendorCountry === currentFilters.country);
      }

      setServices(filtered);
      setTotalResults(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("[Explorer] Fetch error:", err);
      setError("Impossible de charger les services. Veuillez reessayer.");
      setServices([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [favoriteIds, t]);

  // ---- Fetch on mount and when filters/sort/page change ----
  useEffect(() => {
    fetchServices(filters, sort, page);
  }, [filters, sort, page, fetchServices]);

  // ---- Toggle favorite (local state only) ----
  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorited: !s.favorited } : s))
    );
  }, []);

  // Reset page when filters change (with debounce for search)
  const updateFilters = useCallback((f: FilterState) => {
    // If only search changed, debounce the API call
    if (f.search !== filters.search) {
      setSearchInput(f.search);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters(f);
        setPage(1);
      }, 400);
      return;
    }
    setFilters(f);
    setPage(1);
  }, [filters.search]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, []);

  const activeFilterCount =
    filters.categories.length +
    (filters.priceMin !== "" ? 1 : 0) +
    (filters.priceMax !== "" ? 1 : 0) +
    (filters.delivery !== "all" ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    filters.sellerLevels.length +
    (filters.country !== "Tous" ? 1 : 0);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* ---- Header ---- */}
      <div className="border-b border-slate-200 dark:border-border-dark bg-white dark:bg-neutral-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            {t("title")}
          </h1>
          {/* Search bar */}
          <div className="relative max-w-2xl">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchInput}
              onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); updateFilters({ ...filters, search: "" }); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---- Main content ---- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* ---- Filter Sidebar (Desktop) ---- */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">filter_list</span>
                {t("filters")}
                {activeFilterCount > 0 && (
                  <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </h3>
              <FilterSidebar
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* ---- Results area ---- */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-border-dark text-sm font-semibold hover:border-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  {t("filters")}
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-white">{loading ? "..." : totalResults}</span> {t("services_found")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-white dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  {SORT_VALUES.map((val) => (
                    <option key={val} value={val}>{t(`sort.${val}`)}</option>
                  ))}
                </select>

                {/* View toggle */}
                <div className="hidden sm:flex items-center border border-slate-200 dark:border-border-dark rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      view === "grid" ? "bg-primary text-white" : "text-slate-500 hover:text-primary"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">grid_view</span>
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={cn(
                      "p-2 transition-colors",
                      view === "list" ? "bg-primary text-white" : "text-slate-500 hover:text-primary"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">view_list</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Service grid / list */}
            {loading ? (
              <div
                className={cn(
                  view === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5"
                    : "flex flex-col gap-4"
                )}
              >
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <ServiceCardSkeleton key={`skeleton-${i}`} view={view} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t("error_title")}</h3>
                <p className="text-sm text-slate-500 max-w-md mb-5">{t("error_description")}</p>
                <button
                  onClick={() => fetchServices(filters, sort, page)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  {t("retry")}
                </button>
              </div>
            ) : services.length > 0 ? (
              <div
                className={cn(
                  view === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5"
                    : "flex flex-col gap-4"
                )}
              >
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    view={view}
                    format={format}
                    onToggleFavorite={toggleFavorite}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-border-dark flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-slate-400">search_off</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t("empty_title")}</h3>
                <p className="text-sm text-slate-500 max-w-md mb-5">
                  {t("empty_description")}
                </p>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  {t("reset_filters")}
                </button>
              </div>
            )}

            {/* Pagination */}
            {!loading && <Pagination current={page} total={totalPages} onChange={setPage} />}
          </div>
        </div>
      </div>

      {/* ---- Mobile Filter Drawer ---- */}
      {mobileFiltersOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-neutral-dark border-r border-slate-200 dark:border-border-dark shadow-2xl lg:hidden animate-slide-in overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-border-dark">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-base">filter_list</span>
                {t("filters")}
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-border-dark transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
              />
            </div>
            <div className="sticky bottom-0 p-5 bg-white dark:bg-neutral-dark border-t border-slate-200 dark:border-border-dark">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                {t("see_results", { count: totalResults })}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
