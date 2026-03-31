"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import FormationCard from "@/components/formations/FormationCard";
import type { FormationCardData } from "@/components/formations/FormationCard";

// ── Types ──────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { formations: number };
}

interface FiltersState {
  search: string;
  categorySlug: string;
  level: string;
  priceRange: string;
  durationRange: string;
  language: string;
}

const ITEMS_PER_PAGE = 12;

// ── Helper Components ──────────────────────────────────────────

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center transition-all"
      aria-label="Retour en haut"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

function FilterDropdown({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (val: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none text-sm font-medium px-4 py-2 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 cursor-pointer transition-all">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  );
}

// ── Sidebar Filters (desktop) ──────────────────────────────────

function SidebarFilters({
  filters, categories, levelOptions, priceOptions, durationOptions,
  onUpdateFilter, onReset, locale,
}: {
  filters: FiltersState; categories: Category[];
  levelOptions: { value: string; label: string }[];
  priceOptions: { value: string; label: string }[];
  durationOptions: { value: string; label: string }[];
  onUpdateFilter: (key: keyof FiltersState, val: string) => void;
  onReset: () => void; locale: string;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true, level: true, price: true, duration: true,
  });

  const toggle = (key: string) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <button onClick={() => toggle(id)} className="flex items-center justify-between w-full py-2 text-sm font-semibold text-slate-900 dark:text-white">
      {title}
      {expandedSections[id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="w-[250px] flex-shrink-0 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          {locale === "fr" ? "Filtres" : "Filters"}
        </h3>
        {(filters.categorySlug || filters.level || filters.priceRange || filters.durationRange) && (
          <button onClick={onReset} className="text-xs text-red-500 hover:text-red-400">{locale === "fr" ? "Réinitialiser" : "Clear"}</button>
        )}
      </div>

      {/* Category */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
        <SectionHeader id="category" title={locale === "fr" ? "Catégorie" : "Category"} />
        {expandedSections.category && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                <input type="checkbox" checked={filters.categorySlug === cat.slug} onChange={() => onUpdateFilter("categorySlug", filters.categorySlug === cat.slug ? "" : cat.slug)} className="rounded border-slate-300 text-primary focus:ring-primary/30" />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white truncate flex-1">{cat.name}</span>
                {cat._count && <span className="text-xs text-slate-400">{cat._count.formations}</span>}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Level */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
        <SectionHeader id="level" title={locale === "fr" ? "Niveau" : "Level"} />
        {expandedSections.level && (
          <div className="space-y-1">
            {levelOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 py-1 cursor-pointer group">
                <input type="radio" name="level" checked={filters.level === opt.value} onChange={() => onUpdateFilter("level", opt.value)} className="text-primary focus:ring-primary/30" />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
        <SectionHeader id="price" title={locale === "fr" ? "Prix" : "Price"} />
        {expandedSections.price && (
          <div className="space-y-1">
            {priceOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 py-1 cursor-pointer group">
                <input type="radio" name="price" checked={filters.priceRange === opt.value} onChange={() => onUpdateFilter("priceRange", opt.value)} className="text-primary focus:ring-primary/30" />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
        <SectionHeader id="duration" title={locale === "fr" ? "Durée" : "Duration"} />
        {expandedSections.duration && (
          <div className="space-y-1">
            {durationOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 py-1 cursor-pointer group">
                <input type="radio" name="duration" checked={filters.durationRange === opt.value} onChange={() => onUpdateFilter("durationRange", opt.value)} className="text-primary focus:ring-primary/30" />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function ExplorerFormationsPage() {
  const t = useTranslations("formations");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "fr";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [categories, setCategories] = useState<Category[]>([]);
  const [formations, setFormations] = useState<FormationCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return p > 0 ? p : 1;
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [sort, setSort] = useState(searchParams.get("sort") || "populaire");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("fh-explorer-view") as "grid" | "list") || "grid";
    return "grid";
  });

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
      setFormations(data.formations ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/formations/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : (d?.categories ?? [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchFormations(filters, sort, page);
    } else {
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
    setFilters({ search: "", categorySlug: "", level: "", priceRange: "", durationRange: "", language: "" });
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

  const toggleView = (mode: "grid" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") localStorage.setItem("fh-explorer-view", mode);
  };

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

  const sortOptions = [
    { value: "populaire", label: t("sort_popular") },
    { value: "note", label: t("sort_rated") },
    { value: "recent", label: t("sort_newest") },
    { value: "prix_asc", label: t("sort_price_asc") },
    { value: "prix_desc", label: t("sort_price_desc") },
  ];

  // Active filters as chips
  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filters.categorySlug) {
    const cat = categories.find((c) => c.slug === filters.categorySlug);
    activeChips.push({ label: cat?.name || filters.categorySlug, onRemove: () => updateFilter("categorySlug", "") });
  }
  if (filters.level) {
    const lvl = levelOptions.find((o) => o.value === filters.level);
    activeChips.push({ label: lvl?.label || filters.level, onRemove: () => updateFilter("level", "") });
  }
  if (filters.priceRange) {
    const pr = priceOptions.find((o) => o.value === filters.priceRange);
    activeChips.push({ label: pr?.label || filters.priceRange, onRemove: () => updateFilter("priceRange", "") });
  }
  if (filters.durationRange) {
    const dr = durationOptions.find((o) => o.value === filters.durationRange);
    activeChips.push({ label: dr?.label || filters.durationRange, onRemove: () => updateFilter("durationRange", "") });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <BackToTop />

      {/* ── Header / Search ─────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {locale === "fr" ? "Explorer les formations" : "Explore courses"}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {locale === "fr" ? "Développez vos compétences avec nos formations professionnelles" : "Build your skills with our professional courses"}
          </p>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("hero_search_placeholder")}
              className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {searchInput && (
              <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile category chips ─────────────────────────────────── */}
      <div className="lg:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button onClick={() => updateFilter("categorySlug", "")} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!filters.categorySlug ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
              {locale === "fr" ? "Toutes" : "All"}
            </button>
            {categories.slice(0, 10).map((cat) => (
              <button key={cat.id} onClick={() => updateFilter("categorySlug", filters.categorySlug === cat.slug ? "" : cat.slug)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.categorySlug === cat.slug ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile filters row ────────────────────────────────────── */}
      <div className="lg:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <FilterDropdown value={filters.level} options={levelOptions} onChange={(v) => updateFilter("level", v)} />
            <FilterDropdown value={filters.priceRange} options={priceOptions} onChange={(v) => updateFilter("priceRange", v)} />
            <FilterDropdown value={filters.durationRange} options={durationOptions} onChange={(v) => updateFilter("durationRange", v)} />
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <FilterDropdown value={sort} options={sortOptions} onChange={setSort} />
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block sticky top-4 self-start">
            <SidebarFilters
              filters={filters} categories={categories}
              levelOptions={levelOptions} priceOptions={priceOptions} durationOptions={durationOptions}
              onUpdateFilter={updateFilter} onReset={resetFilters} locale={locale}
            />
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                {!loading && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white">{total}</strong> {locale === "fr" ? "résultats" : "results"}
                    {filters.search && (
                      <span> {locale === "fr" ? "pour" : "for"} <strong className="text-primary">&ldquo;{filters.search}&rdquo;</strong></span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Desktop sort */}
                <div className="hidden lg:block">
                  <FilterDropdown value={sort} options={sortOptions} onChange={setSort} />
                </div>
                {/* View toggle */}
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button onClick={() => toggleView("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700"}`} title="Grid">
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleView("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700"}`} title="List">
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activeChips.map((chip, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                    {chip.label}
                    <button onClick={chip.onRemove} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-400 font-medium">
                  {locale === "fr" ? "Effacer tout" : "Clear all"}
                </button>
              </div>
            )}

            {/* Grid/List */}
            {loading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-4"}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden animate-pulse">
                    <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 rounded w-1/3 bg-slate-200 dark:bg-slate-700" />
                      <div className="h-4 rounded w-4/5 bg-slate-200 dark:bg-slate-700" />
                      <div className="h-5 rounded w-1/4 bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : fetchError ? (
              <div className="text-center py-16">
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">{locale === "fr" ? "Impossible de charger les formations" : "Failed to load courses"}</p>
                <button onClick={() => fetchFormations(filters, sort, page)} className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                  {locale === "fr" ? "Réessayer" : "Retry"}
                </button>
              </div>
            ) : formations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t("no_courses")}</h3>
                <p className="text-slate-500 mb-6">{locale === "fr" ? "Essayez de modifier vos filtres." : "Try adjusting your filters."}</p>
                <button onClick={resetFilters} className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">{t("filter_reset")}</button>
              </div>
            ) : (
              <>
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-4"}>
                  {formations.map((f) => (
                    <FormationCard key={f.id} formation={f} lang={lang} listView={viewMode === "list"} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-1">
                    <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4" />{locale === "fr" ? "Préc." : "Prev"}
                    </button>
                    {(() => {
                      const pages: (number | "ellipsis")[] = [];
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (page > 3) pages.push("ellipsis");
                        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                        if (page < totalPages - 2) pages.push("ellipsis");
                        pages.push(totalPages);
                      }
                      return pages.map((p, idx) =>
                        p === "ellipsis" ? <span key={`e${idx}`} className="px-2 py-2 text-sm text-slate-500">...</span> : (
                          <button key={p} onClick={() => goToPage(p)} className={`min-w-[2.25rem] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{p}</button>
                        )
                      );
                    })()}
                    <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {locale === "fr" ? "Suiv." : "Next"}<ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
