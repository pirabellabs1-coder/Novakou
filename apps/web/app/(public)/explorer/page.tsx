"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatServiceTitle } from "@/lib/format-service-title";
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
  isVedette?: boolean;
  tags: string[];
  favorited?: boolean;
}

interface ApiResponse {
  services: Omit<MarketplaceService, "favorited">[];
  total: number;
  page: number;
  totalPages: number;
}

interface FilterState {
  search: string;
  category: string;
  priceMin: string;
  priceMax: string;
  delivery: string;
  minRating: number;
  country: string;
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
  { slug: "musique-audio", icon: "music_note" },
  { slug: "formation-coaching", icon: "school" },
  { slug: "photographie", icon: "photo_camera" },
  { slug: "architecture-ingenierie", icon: "architecture" },
  { slug: "secretariat-admin", icon: "support_agent" },
  { slug: "cybersecurite", icon: "security" },
  { slug: "finance-comptabilite", icon: "account_balance" },
  { slug: "lifestyle-bien-etre", icon: "spa" },
] as const;

const DELIVERY_VALUES = ["all", "1-3", "3-7", "7-14", "14-30"] as const;

const RATING_OPTIONS = [4, 3, 2] as const;

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
  "musique-audio": "from-amber-500/80 to-orange-700/80",
  "formation-coaching": "from-teal-500/80 to-emerald-700/80",
  "photographie": "from-fuchsia-500/80 to-pink-700/80",
  "architecture-ingenierie": "from-stone-500/80 to-stone-800/80",
  "secretariat-admin": "from-sky-400/80 to-cyan-700/80",
  "cybersecurite": "from-slate-600/80 to-zinc-800/80",
  "finance-comptabilite": "from-green-500/80 to-emerald-800/80",
  "lifestyle-bien-etre": "from-pink-400/80 to-rose-600/80",
};

const defaultFilters: FilterState = {
  search: "",
  category: "",
  priceMin: "",
  priceMax: "",
  delivery: "all",
  minRating: 0,
  country: "tous",
};

// ============================================================
// Utility functions
// ============================================================

function getCategorySlug(categoryName: string): string {
  if (!categoryName) return "";
  const normalized = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (CATEGORY_GRADIENTS[normalized]) return normalized;
  const match = CATEGORIES.find((c) => c.slug === normalized);
  return match?.slug ?? normalized;
}

function getBadgeLevel(badges: string[] | null | undefined): string {
  if (!Array.isArray(badges) || badges.length === 0) return "Nouveau";
  if (badges.includes("Elite")) return "Elite";
  if (badges.includes("Top Rated")) return "Top Rated";
  if (badges.includes("Confirme") || badges.includes("Pro") || badges.includes("Business")) return "Confirme";
  if (badges.includes("Verifie")) return "Verifie";
  if (badges.includes("Agence")) return "Agence";
  return "Nouveau";
}

function isAvatarUrl(avatar: string | null | undefined): boolean {
  if (!avatar) return false;
  return avatar.startsWith("http") || avatar.startsWith("/") || avatar.startsWith("data:");
}

// ============================================================
// Sub-components
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

function StarRating({ rating, size = "sm" }: { rating: number | null | undefined; size?: "sm" | "md" }) {
  const safeRating = Number(rating) || 0;
  const iconSize = size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn(
            "material-symbols-outlined",
            iconSize,
            star <= Math.floor(safeRating) ? "text-accent" : star - 0.5 <= safeRating ? "text-accent" : "text-slate-300 dark:text-slate-600"
          )}
          style={star <= Math.floor(safeRating) ? { fontVariationSettings: "'FILL' 1" } : star - 0.5 <= safeRating ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {star <= Math.floor(safeRating) ? "star" : star - 0.5 <= safeRating ? "star_half" : "star"}
        </span>
      ))}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    "Nouveau": { bg: "bg-slate-500/15 dark:bg-slate-500/20", text: "text-slate-600 dark:text-slate-400" },
    "Verifie": { bg: "bg-green-500/15 dark:bg-green-500/20", text: "text-green-600 dark:text-green-400" },
    "Confirme": { bg: "bg-blue-500/15 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
    "Agence": { bg: "bg-indigo-500/15 dark:bg-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400" },
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

function trackServiceClick(serviceId: string) {
  fetch(`/api/services/${serviceId}/track-click`, { method: "POST" }).catch(() => {});
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
  const categorySlug = getCategorySlug(service.category || "");
  const catIcon = CATEGORIES.find((c) => c.slug === categorySlug)?.icon ?? "category";
  const gradient = CATEGORY_GRADIENTS[categorySlug] ?? "from-primary/80 to-teal-800/80";
  const vendorLevel = getBadgeLevel(service.vendorBadges);
  const safeRating = Number(service.rating) || 0;
  const safeRatingCount = Number(service.ratingCount) || 0;
  const safeOrderCount = Number(service.orderCount) || 0;
  const safeDeliveryDays = Number(service.deliveryDays) || 0;
  const safeBasePrice = Number(service.basePrice) || 0;
  const safeVendorName = service.vendorName || "?";

  if (view === "list") {
    return (
      <Link
        href={`/services/${service.slug}`}
        onClick={() => trackServiceClick(service.id)}
        className="group flex flex-col sm:flex-row gap-4 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-lg transition-all p-3"
      >
        {/* Image */}
        <div className="relative w-full sm:w-56 h-40 sm:h-36 rounded-lg overflow-hidden flex-shrink-0">
          {service.image ? (
            <img src={service.image} alt={service.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center", gradient)}>
              <span className="material-symbols-outlined text-white/80 text-5xl">{catIcon}</span>
            </div>
          )}
          {service.isVedette && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/90 text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-xs">star</span>
              En vedette
            </span>
          )}
          {!service.isVedette && service.isBoosted && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-xs">bolt</span>
              Sponsorise
            </span>
          )}
          <div className={cn("absolute top-2 left-2", (service.isVedette || service.isBoosted) && "top-9")}>
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
              {service.vendorAvatar && isAvatarUrl(service.vendorAvatar) ? (
                <img src={service.vendorAvatar} alt={safeVendorName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" loading="lazy" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {safeVendorName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{safeVendorName}</span>
              <LevelBadge level={vendorLevel} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {formatServiceTitle(service.title || "")}
            </h3>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <StarRating rating={safeRating} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{safeRating.toFixed(1)}</span>
                <span className="text-xs text-slate-500">({safeRatingCount})</span>
              </div>
              {safeOrderCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-sm text-emerald-500">shopping_bag</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{safeOrderCount} {safeOrderCount > 1 ? "ventes" : "vente"}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {safeDeliveryDays}{t("days_short")}
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t("from")} {format(safeBasePrice)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/services/${service.slug}`}
      onClick={() => trackServiceClick(service.id)}
      className="group flex flex-col bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {service.image ? (
          <img src={service.image} alt={service.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center group-hover:scale-105 transition-transform duration-300", gradient)}>
            <span className="material-symbols-outlined text-white/80 text-6xl">{catIcon}</span>
          </div>
        )}
        {service.isVedette && (
          <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/90 text-white backdrop-blur-sm">
            <span className="material-symbols-outlined text-xs">star</span>
            En vedette
          </span>
        )}
        {!service.isVedette && service.isBoosted && (
          <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm">
            <span className="material-symbols-outlined text-xs">bolt</span>
            Sponsorise
          </span>
        )}
        <div className={cn("absolute top-2.5 left-2.5", (service.isVedette || service.isBoosted) && "top-9")}>
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
        <div className="flex items-center gap-2 mb-2">
          {service.vendorAvatar && isAvatarUrl(service.vendorAvatar) ? (
            <img src={service.vendorAvatar} alt={safeVendorName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" loading="lazy" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {safeVendorName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{safeVendorName}</span>
          <LevelBadge level={vendorLevel} />
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-3 flex-1">
          {formatServiceTitle(service.title || "")}
        </h3>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <StarRating rating={safeRating} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{safeRating.toFixed(1)}</span>
            <span className="text-xs text-slate-500">({safeRatingCount})</span>
          </div>
          {safeOrderCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-sm text-emerald-500">shopping_bag</span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">{safeOrderCount}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-border-dark pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {safeDeliveryDays}{t("days_short")}
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t("from")} {format(safeBasePrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const safeTotalPages = Math.max(0, Math.floor(total) || 0);
  if (safeTotalPages <= 1) return null;
  const safeCurrent = Math.max(1, Math.min(current, safeTotalPages));

  // Build page numbers for desktop (full) and mobile (simplified)
  const buildPages = (compact: boolean): (number | "ellipsis")[] => {
    const result: (number | "ellipsis")[] = [];
    const maxVisible = compact ? 5 : 7;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) result.push(i);
    } else if (compact) {
      // Mobile: show first, current, last only (with ellipsis)
      result.push(1);
      if (safeCurrent > 2) result.push("ellipsis");
      if (safeCurrent !== 1 && safeCurrent !== safeTotalPages) result.push(safeCurrent);
      if (safeCurrent < safeTotalPages - 1) result.push("ellipsis");
      result.push(safeTotalPages);
    } else {
      result.push(1);
      if (safeCurrent > 3) result.push("ellipsis");
      for (let i = Math.max(2, safeCurrent - 1); i <= Math.min(safeTotalPages - 1, safeCurrent + 1); i++) {
        result.push(i);
      }
      if (safeCurrent < safeTotalPages - 2) result.push("ellipsis");
      result.push(safeTotalPages);
    }
    return result;
  };

  const desktopPages = buildPages(false);
  const mobilePages = buildPages(true);

  const handleChange = (p: number) => {
    const clamped = Math.max(1, Math.min(p, safeTotalPages));
    onChange(clamped);
  };

  const renderPages = (pages: (number | "ellipsis")[]) =>
    pages.map((p, idx) =>
      p === "ellipsis" ? (
        <span key={`e-${idx}`} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 text-xs sm:text-sm">...</span>
      ) : (
        <button
          key={p}
          onClick={() => handleChange(p)}
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-bold transition-colors",
            p === safeCurrent
              ? "bg-primary text-white"
              : "border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary"
          )}
        >
          {p}
        </button>
      )
    );

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-8">
      <button
        onClick={() => handleChange(safeCurrent - 1)}
        disabled={safeCurrent === 1}
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-200 dark:border-border-dark text-slate-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      {/* Mobile: simplified pagination */}
      <div className="flex items-center gap-1 sm:hidden">
        {renderPages(mobilePages)}
      </div>
      {/* Desktop: full pagination */}
      <div className="hidden sm:flex items-center gap-1.5">
        {renderPages(desktopPages)}
      </div>
      <button
        onClick={() => handleChange(safeCurrent + 1)}
        disabled={safeCurrent === safeTotalPages}
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-200 dark:border-border-dark text-slate-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}

// ============================================================
// Inline filter dropdown component
// ============================================================

function FilterDropdown({
  label,
  icon,
  isActive,
  children,
}: {
  label: string;
  icon: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap",
          isActive
            ? "border-primary bg-primary/5 text-primary"
            : "border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 hover:border-primary/50"
        )}
      >
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
        <span className={cn("material-symbols-outlined text-sm transition-transform", open && "rotate-180")}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-40 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-xl p-4 min-w-[220px] max-w-[calc(100vw-2rem)]">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Mobile filters bottom sheet
// ============================================================

function MobileFiltersSheet({
  filters,
  sort,
  onChangeFilters,
  onChangeSort,
  onClose,
  totalResults,
  t,
}: {
  filters: FilterState;
  sort: string;
  onChangeFilters: (f: FilterState) => void;
  onChangeSort: (s: string) => void;
  onClose: () => void;
  totalResults: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [localSort, setLocalSort] = useState(sort);

  const handleApply = () => {
    onChangeFilters(localFilters);
    onChangeSort(localSort);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    setLocalSort("pertinence");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-white dark:bg-neutral-dark rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-border-dark">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">tune</span>
            {t("filters")}
          </h3>
          <button
            onClick={handleReset}
            className="text-sm text-primary font-semibold hover:underline"
          >
            {t("reset_filters")}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Sort */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              Tri
            </label>
            <select
              value={localSort}
              onChange={(e) => setLocalSort(e.target.value)}
              className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {SORT_VALUES.map((val) => (
                <option key={val} value={val}>{t(`sort.${val}`)}</option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              {t("filter_price_range")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={t("filter_min")}
                value={localFilters.priceMin}
                onChange={(e) => setLocalFilters({ ...localFilters, priceMin: e.target.value })}
                className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="text-slate-400 text-xs flex-shrink-0">-</span>
              <input
                type="number"
                placeholder={t("filter_max")}
                value={localFilters.priceMax}
                onChange={(e) => setLocalFilters({ ...localFilters, priceMax: e.target.value })}
                className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Delivery */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              {t("filter_delivery")}
            </label>
            <select
              value={localFilters.delivery}
              onChange={(e) => setLocalFilters({ ...localFilters, delivery: e.target.value })}
              className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {DELIVERY_VALUES.map((val) => (
                <option key={val} value={val}>{t(`delivery.${val}`)}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              {t("filter_min_rating")}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocalFilters({ ...localFilters, minRating: 0 })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  localFilters.minRating === 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400"
                )}
              >
                {t("filter_all_ratings")}
              </button>
              {RATING_OPTIONS.map((val) => (
                <button
                  key={val}
                  onClick={() => setLocalFilters({ ...localFilters, minRating: val })}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    localFilters.minRating === val
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400"
                  )}
                >
                  {val}
                  <span className="material-symbols-outlined text-sm text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {t("filter_and_more")}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              {t("filter_country")}
            </label>
            <select
              value={localFilters.country}
              onChange={(e) => setLocalFilters({ ...localFilters, country: e.target.value })}
              className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {COUNTRY_KEYS.map((key) => (
                <option key={key} value={key}>{t(`country.${key}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-border-dark">
          <button
            onClick={handleApply}
            className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            {t("see_results", { count: totalResults })}
          </button>
        </div>
      </div>
    </>
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

      if (currentFilters.search.trim()) {
        params.set("q", currentFilters.search.trim());
      }

      // Single category filter — send the slug so the API can look up by category.slug
      if (currentFilters.category) {
        params.set("category", currentFilters.category);
      }

      if (currentFilters.priceMin !== "") {
        params.set("minPrice", currentFilters.priceMin);
      }
      if (currentFilters.priceMax !== "") {
        params.set("maxPrice", currentFilters.priceMax);
      }

      params.set("sort", currentSort === "recent" ? "nouveau" : currentSort);
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await fetch(`/api/public/services?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data: ApiResponse = await res.json();

      let filtered = (data.services || []).map((s) => ({
        ...s,
        favorited: favoriteIds.has(s.id),
      }));

      // Delivery time filter (client-side)
      if (currentFilters.delivery !== "all") {
        const parts = currentFilters.delivery.split("-");
        const min = Number(parts[0]) || 0;
        const max = Number(parts[1]) || Infinity;
        filtered = filtered.filter((s) => {
          const days = Number(s.deliveryDays) || 0;
          return days >= min && days <= max;
        });
      }

      // Rating filter (client-side)
      if (currentFilters.minRating > 0) {
        filtered = filtered.filter((s) => (Number(s.rating) || 0) >= currentFilters.minRating);
      }

      // Country filter (client-side)
      if (currentFilters.country !== "tous") {
        const countryName = t(`country.${currentFilters.country}`);
        filtered = filtered.filter((s) => (s.vendorCountry || "") === countryName);
      }

      setServices(filtered);
      setTotalResults(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
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

  // ---- Debounced search ----
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
      setPage(1);
    }, 400);
  }, []);

  // ---- Category pill selection ----
  const handleCategoryChange = useCallback((slug: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === slug ? "" : slug,
    }));
    setPage(1);
  }, []);

  // ---- Update a single filter field ----
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchInput("");
    setSort("pertinence");
    setPage(1);
  }, []);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.priceMin !== "" ? 1 : 0) +
    (filters.priceMax !== "" ? 1 : 0) +
    (filters.delivery !== "all" ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.country !== "tous" ? 1 : 0);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 overflow-x-hidden">
      {/* ---- Header with search ---- */}
      <div className="border-b border-slate-200 dark:border-border-dark bg-white dark:bg-neutral-dark">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4">
            {t("title")}
          </h1>
          <div className="relative w-full sm:max-w-2xl">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setFilters((prev) => ({ ...prev, search: "" })); setPage(1); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---- Categories: horizontal scrollable pills ---- */}
      <div className="border-b border-slate-200 dark:border-border-dark bg-white dark:bg-neutral-dark">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {/* "All" pill */}
            <button
              onClick={() => setFilters((prev) => ({ ...prev, category: "" }))}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0",
                filters.category === ""
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <span className="material-symbols-outlined text-base">apps</span>
              {t("all_categories")}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0",
                  filters.category === cat.slug
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                {t(`cat.${cat.slug}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Main content ---- */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* ---- Filters row (desktop) + mobile filter button ---- */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Mobile: "Filtres" button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-border-dark text-sm font-semibold hover:border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              {t("filters")}
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop: inline filter dropdowns */}
            <div className="hidden md:flex items-center gap-2">
              {/* Price filter */}
              <FilterDropdown
                label={t("filter_price_range")}
                icon="payments"
                isActive={filters.priceMin !== "" || filters.priceMax !== ""}
              >
                <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
                  <input
                    type="number"
                    placeholder={t("filter_min")}
                    value={filters.priceMin}
                    onChange={(e) => updateFilter("priceMin", e.target.value)}
                    className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <span className="text-slate-400 text-xs flex-shrink-0">-</span>
                  <input
                    type="number"
                    placeholder={t("filter_max")}
                    value={filters.priceMax}
                    onChange={(e) => updateFilter("priceMax", e.target.value)}
                    className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </FilterDropdown>

              {/* Delivery filter */}
              <FilterDropdown
                label={t("filter_delivery")}
                icon="schedule"
                isActive={filters.delivery !== "all"}
              >
                <div className="flex flex-col gap-1 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
                  {DELIVERY_VALUES.map((val) => (
                    <button
                      key={val}
                      onClick={() => updateFilter("delivery", val)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        filters.delivery === val
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {t(`delivery.${val}`)}
                    </button>
                  ))}
                </div>
              </FilterDropdown>

              {/* Rating filter */}
              <FilterDropdown
                label={t("filter_min_rating")}
                icon="star"
                isActive={filters.minRating > 0}
              >
                <div className="flex flex-col gap-1 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
                  <button
                    onClick={() => updateFilter("minRating", 0)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      filters.minRating === 0
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {t("filter_all_ratings")}
                  </button>
                  {RATING_OPTIONS.map((val) => (
                    <button
                      key={val}
                      onClick={() => updateFilter("minRating", val)}
                      className={cn(
                        "flex items-center gap-1.5 text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        filters.minRating === val
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: val }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-sm text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        ))}
                      </span>
                      {t("filter_and_more")}
                    </button>
                  ))}
                </div>
              </FilterDropdown>

              {/* Country filter */}
              <FilterDropdown
                label={t("filter_country")}
                icon="public"
                isActive={filters.country !== "tous"}
              >
                <div className="flex flex-col gap-1 min-w-0 w-full sm:w-auto sm:min-w-[200px] max-h-[280px] overflow-y-auto">
                  {COUNTRY_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => updateFilter("country", key)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        filters.country === key
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {t(`country.${key}`)}
                    </button>
                  ))}
                </div>
              </FilterDropdown>

              {/* Reset button (visible when filters are active) */}
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  {t("reset_filters")}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Results count */}
            <p className="text-sm text-slate-500 dark:text-slate-400 sm:mr-2">
              <span className="font-bold text-slate-800 dark:text-white">{loading ? "..." : totalResults}</span> {t("services_found")}
            </p>

            <div className="flex items-center gap-2">
              {/* Sort dropdown -- compact on mobile, full on desktop */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-white dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors max-w-[120px] md:max-w-none"
              >
                {SORT_VALUES.map((val) => (
                  <option key={val} value={val}>{t(`sort.${val}`)}</option>
                ))}
              </select>

              {/* View toggle */}
              <div className="flex items-center border border-slate-200 dark:border-border-dark rounded-lg overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setView("grid")}
                  className={cn(
                    "p-1.5 sm:p-2 transition-colors",
                    view === "grid" ? "bg-primary text-white" : "text-slate-500 hover:text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-sm">grid_view</span>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "p-1.5 sm:p-2 transition-colors",
                    view === "list" ? "bg-primary text-white" : "text-slate-500 hover:text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-sm">view_list</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Service grid / list ---- */}
        {loading ? (
          <div
            className={cn(
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
                : "flex flex-col gap-3 sm:gap-4"
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
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
                : "flex flex-col gap-3 sm:gap-4"
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

      {/* ---- Mobile Filter Bottom Sheet ---- */}
      {mobileFiltersOpen && (
        <MobileFiltersSheet
          filters={filters}
          sort={sort}
          onChangeFilters={(f) => { setFilters(f); setPage(1); }}
          onChangeSort={setSort}
          onClose={() => setMobileFiltersOpen(false)}
          totalResults={totalResults}
          t={t}
        />
      )}
    </div>
  );
}
