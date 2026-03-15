"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search, X, Star, Clock, Users, Award, ChevronUp, ChevronDown } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface Category {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
  _count?: { formations: number };
}

interface Formation {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  shortDescFr: string | null;
  shortDescEn: string | null;
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
  category: { nameFr: string; nameEn: string; color: string | null; slug: string };
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

const ITEMS_PER_PAGE = 100;

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
  const title = locale === "fr" ? formation.titleFr : (formation.titleEn || formation.titleFr);
  const catName = locale === "fr" ? formation.category.nameFr : (formation.category.nameEn || formation.category.nameFr);
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
      className="group block rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-200 overflow-hidden"
      style={{ backgroundColor: "#111827" }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: "#1a2332" }}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-20">🎓</span>
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
        <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={instructorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs flex items-center justify-center h-full text-emerald-400 font-medium">
                {instructorName.charAt(0)}
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
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${formation.isFree ? "text-emerald-400" : "text-white"}`}>
              {formatPrice(formation.price, formation.isFree, t("free"))}
            </span>
            {formation.originalPrice && formation.originalPrice > formation.price && (
              <span className="text-xs text-slate-500 line-through">
                {formation.originalPrice.toFixed(0)}&nbsp;&euro;
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-white/5">
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
      <h3 className="text-xl font-bold text-white mb-2">
        {locale === "fr" ? "Aucune formation trouvee" : "No courses found"}
      </h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        {locale === "fr"
          ? "Essayez de modifier vos filtres ou explorez nos categories populaires."
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
        <div className="mt-8 pt-8 border-t border-white/5">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {locale === "fr" ? "Categories populaires" : "Popular categories"}
          </h4>
          <div className="flex flex-wrap justify-center gap-3">
            {popularCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/formations/explorer?category=${cat.slug}`}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
                style={{ backgroundColor: "#111827" }}
              >
                {locale === "fr" ? cat.nameFr : (cat.nameEn || cat.nameFr)}
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
        className="appearance-none text-sm font-medium px-4 py-2 pr-8 rounded-lg border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 cursor-pointer transition-all"
        style={{ backgroundColor: "#111827" }}
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [searchInput, setSearchInput] = useState(filters.search);

  const fetchFormations = useCallback(async (f: FiltersState, s: string, p: number, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);

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
      const res = await fetch(`/api/formations?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: Formation[] = data.formations ?? [];
      const tot: number = data.total ?? 0;
      const totalPages: number = data.totalPages ?? 1;

      if (append) {
        setFormations((prev) => [...prev, ...items]);
      } else {
        setFormations(items);
      }
      setTotal(tot);
      setHasMore(p < totalPages);
    } catch {
      // API error — keep current state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/formations/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchFormations(filters, sort, 1, false);
  }, [filters, sort, fetchFormations]);

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
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFormations(filters, sort, next, true);
  };

  const hasActiveFilters = filters.search || filters.categorySlug || filters.level || filters.priceRange || filters.durationRange || filters.language;

  const levelOptions = [
    { value: "", label: locale === "fr" ? "Tous les niveaux" : "All levels" },
    { value: "DEBUTANT", label: locale === "fr" ? "Debutant" : "Beginner" },
    { value: "INTERMEDIAIRE", label: locale === "fr" ? "Intermediaire" : "Intermediate" },
    { value: "AVANCE", label: locale === "fr" ? "Avance" : "Advanced" },
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
    { value: "fr", label: "Francais" },
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
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      <BackToTop />

      {/* ── Header / Search ─────────────────────────────────────── */}
      <div className="border-b border-white/5" style={{ backgroundColor: "#111827" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {locale === "fr" ? "Explorer les formations" : "Explore courses"}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {locale === "fr"
              ? "Developpez vos competences avec nos formations professionnelles"
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
              className="w-full pl-12 pr-10 py-3 rounded-xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
              style={{ backgroundColor: "#0F172A" }}
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
      <div className="border-b border-white/5" style={{ backgroundColor: "#0F172A" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => updateFilter("categorySlug", "")}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !filters.categorySlug
                  ? "bg-emerald-500 text-white"
                  : "text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
              }`}
              style={filters.categorySlug ? { backgroundColor: "#111827" } : undefined}
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
                    : "text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}
                style={filters.categorySlug !== cat.slug ? { backgroundColor: "#111827" } : undefined}
              >
                {locale === "fr" ? cat.nameFr : (cat.nameEn || cat.nameFr)}
                {cat._count && <span className="ml-1 opacity-60">({cat._count.formations})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters (horizontal) ────────────────────────────────── */}
      <div className="border-b border-white/5" style={{ backgroundColor: "#0F172A" }}>
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
              label={locale === "fr" ? "Duree" : "Duration"}
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

            <div className="w-px h-8 bg-white/10 flex-shrink-0" />

            <FilterDropdown
              label={locale === "fr" ? "Trier" : "Sort"}
              value={sort}
              options={sortOptions}
              onChange={setSort}
            />

            {hasActiveFilters && (
              <>
                <div className="w-px h-8 bg-white/10 flex-shrink-0" />
                <button
                  onClick={resetFilters}
                  className="flex-shrink-0 flex items-center gap-1 text-sm text-red-400 hover:text-red-300 font-medium px-3 py-2 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {locale === "fr" ? "Reinitialiser" : "Clear"}
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
                  {locale === "fr" ? "pour" : "for"} <strong className="text-white">&quot;{filters.search}&quot;</strong>
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
                className="rounded-xl border border-white/5 overflow-hidden animate-pulse"
                style={{ backgroundColor: "#111827" }}
              >
                <div className="aspect-video" style={{ backgroundColor: "#1a2332" }} />
                <div className="p-4 space-y-3">
                  <div className="h-3 rounded w-1/3" style={{ backgroundColor: "#1a2332" }} />
                  <div className="h-4 rounded w-4/5" style={{ backgroundColor: "#1a2332" }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: "#1a2332" }} />
                  <div className="h-3 rounded w-2/3" style={{ backgroundColor: "#1a2332" }} />
                  <div className="h-5 rounded w-1/4" style={{ backgroundColor: "#1a2332" }} />
                </div>
              </div>
            ))}
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

            {/* Load more */}
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {loadingMore
                    ? (locale === "fr" ? "Chargement..." : "Loading...")
                    : (locale === "fr" ? "Charger plus de formations" : "Load more courses")}
                </button>
              </div>
            )}

            {!hasMore && formations.length > 0 && (
              <p className="text-center text-sm text-slate-500 mt-10">
                {locale === "fr"
                  ? `${total} formation${total > 1 ? "s" : ""} au total`
                  : `${total} course${total > 1 ? "s" : ""} total`}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
