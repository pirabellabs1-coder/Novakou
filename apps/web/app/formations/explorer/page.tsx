"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X, Star, Clock, Users, Award, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import DynamicIcon from "@/components/ui/DynamicIcon";

// ── Types ──────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { formations: number };
}

interface Formation {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  thumbnail: string | null;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  duration: number;
  level: string;
  hasCertificate: boolean;
  createdAt: string;
  publishedAt: string | null;
  category: { name: string; color: string | null; slug: string };
  instructeur: { user: { name: string; avatar: string | null; image: string | null } };
}

interface FiltersState {
  search: string;
  categorySlug: string;
  level: string;
  priceRange: string;
  durationRange: string;
  language: string;
}

// ── Helpers ────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatPrice(price: number, isFree: boolean, freeLabel: string): string {
  if (isFree) return freeLabel;
  return `${price.toFixed(0)}\u00A0\u20AC`;
}

function isNew(createdAt: string): boolean {
  const d = new Date(createdAt);
  const now = new Date();
  return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
}

const ITEMS_PER_PAGE = 12;

// ── Components ─────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
        />
      ))}
    </span>
  );
}

function FormationCard({ formation, locale, t }: { formation: Formation; locale: string; t: ReturnType<typeof useTranslations> }) {
  const title = formation.title;
  const catName = formation.category.name;
  const instructorName = formation.instructeur?.user?.name ?? "Instructeur";
  const avatarUrl = formation.instructeur?.user?.avatar || formation.instructeur?.user?.image;
  const thumbnail = formation.thumbnail;
  const showBestseller = formation.studentsCount > 100;
  const showNew = isNew(formation.createdAt) && !showBestseller;
  const discountPct = formation.originalPrice && formation.originalPrice > formation.price
    ? Math.round((1 - formation.price / formation.originalPrice) * 100)
    : null;

  return (
    <Link
      href={`/formations/${formation.slug}`}
      className="group block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 hover:border-emerald-500/30 transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 dark:bg-slate-700">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DynamicIcon name="school" className="w-10 h-10 opacity-20" />
          </div>
        )}
        {showBestseller && (
          <span className="absolute top-2.5 left-2.5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-md">
            {t("bestseller")}
          </span>
        )}
        {showNew && (
          <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-md">
            {t("new")}
          </span>
        )}
        {discountPct && (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-md">
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Category badge */}
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 bg-emerald-500/10 text-emerald-400">
          {catName}
        </span>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={instructorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs flex items-center justify-center h-full text-emerald-400 font-medium">
                {(instructorName || "?").charAt(0)}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 truncate">{instructorName}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-bold text-amber-400">{formation.rating.toFixed(1)}</span>
          <StarRating rating={formation.rating} />
          <span className="text-xs text-slate-500">({formation.reviewsCount.toLocaleString()})</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(formation.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {formation.studentsCount.toLocaleString()}
          </span>
          {formation.hasCertificate && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Award className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${formation.isFree ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
              {formatPrice(formation.price, formation.isFree, t("free"))}
            </span>
            {formation.originalPrice && formation.originalPrice > formation.price && (
              <span className="text-xs text-slate-500 line-through">
                {formation.originalPrice.toFixed(0)}&nbsp;&euro;
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 dark:bg-slate-700">
            {t("level_" + formation.level.toLowerCase().replace("tous_niveaux", "tous").replace("débutant", "debutant").replace("intermédiaire", "intermediaire").replace("avancé", "avance"))}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Empty State ─────────────────────────────────────────────────

function EmptyState({
  onReset,
  categories,
  locale,
  t,
}: {
  onReset: () => void;
  categories: Category[];
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const popularCategories = categories.slice(0, 6);

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
        <Search className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {locale === "fr" ? "Aucune formation trouvée" : "No courses found"}
      </h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        {locale === "fr"
          ? "Essayez de modifier vos filtres ou explorez nos catégories populaires."
          : "Try adjusting your filters or explore our popular categories."}
      </p>
      <button
        onClick={onReset}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors mb-10"
      >
        {t("filter_reset")}
      </button>

      {/* Suggested categories */}
      {popularCategories.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {locale === "fr" ? "Catégories populaires" : "Popular categories"}
          </h4>
          <div className="flex flex-wrap justify-center gap-3">
            {popularCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/formations/explorer?category=${cat.slug}`}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-emerald-500/40 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
              >
                {cat.name}
                {cat._count && (
                  <span className="ml-1.5 text-slate-500">({cat._count.formations})</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Back to Top Button ──────────────────────────────────────────

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center transition-all"
      aria-label="Retour en haut"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

// ── Filter Dropdown ─────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-sm font-medium px-4 py-2 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 cursor-pointer transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function ExplorerFormationsPage() {
  const t = useTranslations("formations");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [categories, setCategories] = useState<Category[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return p > 0 ? p : 1;
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [sort, setSort] = useState(searchParams.get("sort") || "populaire");

  const [filters, setFilters] = useState<FiltersState>({
    search: searchParams.get("q") || "",
    categorySlug: searchParams.get("category") || "",
    level: searchParams.get("level") || "",
    priceRange: searchParams.get("price") || "",
    durationRange: searchParams.get("duration") || "",
    language: searchParams.get("language") || "",
  });

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Helper to sync filters/sort/page to URL
  const updateURL = useCallback((newFilters: FiltersState, newSort: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set("q", newFilters.search);
    if (newFilters.categorySlug) params.set("category", newFilters.categorySlug);
    if (newFilters.level) params.set("level", newFilters.level);
    if (newFilters.priceRange) params.set("price", newFilters.priceRange);
    if (newFilters.durationRange) params.set("duration", newFilters.durationRange);
    if (newFilters.language) params.set("language", newFilters.language);
    if (newSort !== "populaire") params.set("sort", newSort);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, pathname]);

  const fetchFormations = useCallback(async (f: FiltersState, s: string, p: number) => {
    setLoading(true);

    const params = new URLSearchParams();
    if (f.search) params.set("q", f.search);
    if (f.categorySlug) params.set("category", f.categorySlug);
    if (f.level) params.set("level", f.level);
    if (f.priceRange) params.set("price", f.priceRange);
    if (f.durationRange) params.set("duration", f.durationRange);
    if (f.language) params.set("language", f.language);
    params.set("sort", s);
    params.set("page", String(p));
    params.set("limit", String(ITEMS_PER_PAGE));

    try {
      setFetchError(false);
      const res = await fetch(`/api/formations?${params.toString()}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const items: Formation[] = data.formations ?? [];
      const tot: number = data.total ?? 0;
      const tp: number = data.totalPages ?? 1;

      setFormations(items);
      setTotal(tot);
      setTotalPages(tp);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/formations/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      // On initial mount, use page from URL
      isInitialMount.current = false;
      fetchFormations(filters, sort, page);
    } else {
      // On subsequent filter/sort changes, reset to page 1
      setPage(1);
      fetchFormations(filters, sort, 1);
      updateURL(filters, sort, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: val }));
    }, 400);
  };

  const updateFilter = (key: keyof FiltersState, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => {
    const fresh: FiltersState = { search: "", categorySlug: "", level: "", priceRange: "", durationRange: "", language: "" };
    setFilters(fresh);
    setSearchInput("");
    setSort("populaire");
  };

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchFormations(filters, sort, newPage);
    updateURL(filters, sort, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = filters.search || filters.categorySlug || filters.level || filters.priceRange || filters.durationRange || filters.language;

  const levelOptions = [
    { value: "", label: locale === "fr" ? "Tous les niveaux" : "All levels" },
    { value: "DEBUTANT", label: locale === "fr" ? "Débutant" : "Beginner" },
    { value: "INTERMEDIAIRE", label: locale === "fr" ? "Intermédiaire" : "Intermediate" },
    { value: "AVANCE", label: locale === "fr" ? "Avancé" : "Advanced" },
  ];

  const priceOptions = [
    { value: "", label: t("price_all") },
    { value: "free", label: t("price_free") },
    { value: "paid", label: t("price_paid") },
    { value: "under20", label: t("price_under20") },
    { value: "20to50", label: "20 - 50 EUR" },
    { value: "over50", label: t("price_over50") },
  ];

  const durationOptions = [
    { value: "", label: t("duration_all") },
    { value: "under2h", label: t("duration_under2h") },
    { value: "2h5h", label: "2h - 5h" },
    { value: "5h10h", label: "5h - 10h" },
    { value: "over10h", label: t("duration_over10h") },
  ];

  const languageOptions = [
    { value: "", label: locale === "fr" ? "Toutes les langues" : "All languages" },
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
  ];

  const sortOptions = [
    { value: "populaire", label: t("sort_popular") },
    { value: "note", label: t("sort_rated") },
    { value: "recent", label: t("sort_newest") },
    { value: "prix_asc", label: t("sort_price_asc") },
    { value: "prix_desc", label: t("sort_price_desc") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
      <BackToTop />

      {/* ── Header / Search ─────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {locale === "fr" ? "Explorer les formations" : "Explore courses"}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {locale === "fr"
              ? "Développez vos compétences avec nos formations professionnelles"
              : "Build your skills with our professional courses"}
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("hero_search_placeholder")}
              className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Categories (horizontal) ─────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => updateFilter("categorySlug", "")}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !filters.categorySlug
                  ? "bg-emerald-500 text-white"
                  : "bg-white dark:bg-slate-900 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {locale === "fr" ? "Toutes" : "All"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilter("categorySlug", filters.categorySlug === cat.slug ? "" : cat.slug)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filters.categorySlug === cat.slug
                    ? "bg-emerald-500 text-white"
                    : "bg-white dark:bg-slate-900 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {cat.name}
                {cat._count && <span className="ml-1 opacity-60">({cat._count.formations})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters (horizontal) ────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hide">
            <FilterDropdown
              label={locale === "fr" ? "Niveau" : "Level"}
              value={filters.level}
              options={levelOptions}
              onChange={(v) => updateFilter("level", v)}
            />
            <FilterDropdown
              label={locale === "fr" ? "Prix" : "Price"}
              value={filters.priceRange}
              options={priceOptions}
              onChange={(v) => updateFilter("priceRange", v)}
            />
            <FilterDropdown
              label={locale === "fr" ? "Durée" : "Duration"}
              value={filters.durationRange}
              options={durationOptions}
              onChange={(v) => updateFilter("durationRange", v)}
            />
            <FilterDropdown
              label={locale === "fr" ? "Langue" : "Language"}
              value={filters.language}
              options={languageOptions}
              onChange={(v) => updateFilter("language", v)}
            />

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

            <FilterDropdown
              label={locale === "fr" ? "Trier" : "Sort"}
              value={sort}
              options={sortOptions}
              onChange={setSort}
            />

            {hasActiveFilters && (
              <>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <button
                  onClick={resetFilters}
                  className="flex-shrink-0 flex items-center gap-1 text-sm text-red-400 hover:text-red-300 font-medium px-3 py-2 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {locale === "fr" ? "Réinitialiser" : "Clear"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-400">
              {t("courses_found", { count: total })}
              {filters.search && (
                <span className="ml-1">
                  {locale === "fr" ? "pour" : "for"} <strong className="text-slate-900 dark:text-white">&quot;{filters.search}&quot;</strong>
                </span>
              )}
            </p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
                <div className="p-4 space-y-3">
                  <div className="h-3 rounded w-1/3 bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 rounded w-4/5 bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 rounded w-1/2 bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 rounded w-2/3 bg-slate-200 dark:bg-slate-700" />
                  <div className="h-5 rounded w-1/4 bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
              {locale === "fr" ? "Impossible de charger les formations" : "Failed to load courses"}
            </p>
            <button
              onClick={() => fetchFormations(filters, sort, page)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {locale === "fr" ? "Réessayer" : "Retry"}
            </button>
          </div>
        ) : formations.length === 0 ? (
          <EmptyState onReset={resetFilters} categories={categories} locale={locale} t={t} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {formations.map((f) => (
                <FormationCard key={f.id} formation={f} locale={locale} t={t} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
                {/* Previous button */}
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {locale === "fr" ? "Prec." : "Prev"}
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages: (number | "ellipsis")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 3) pages.push("ellipsis");
                    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                      pages.push(i);
                    }
                    if (page < totalPages - 2) pages.push("ellipsis");
                    pages.push(totalPages);
                  }
                  return pages.map((p, idx) =>
                    p === "ellipsis" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-slate-500">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`min-w-[2.25rem] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}

                {/* Next button */}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {locale === "fr" ? "Suiv." : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}

            {/* Total count */}
            <p className="text-center text-sm text-slate-500 mt-4">
              {locale === "fr"
                ? `${total} formation${total > 1 ? "s" : ""} au total`
                : `${total} course${total > 1 ? "s" : ""} total`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
