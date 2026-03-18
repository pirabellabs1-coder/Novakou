"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import FormationCard from "@/components/formations/FormationCard";
import DigitalProductCard from "@/components/formations/DigitalProductCard";

// ── Types ──────────────────────────────────────────────────────

interface Category {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  color: string | null;
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
  category: { nameFr: string; nameEn: string; color: string | null };
  instructeur: { user: { name: string; avatar: string | null; image: string | null } };
}

interface DigitalProduct {
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
  maxBuyers: number | null;
  currentBuyers: number;
  previewEnabled: boolean;
  instructeur: { user: { name: string; avatar: string | null; image: string | null } };
  category: { nameFr: string; nameEn: string; slug: string } | null;
}

// ── Main Page ──────────────────────────────────────────────────

export default function FormationsLandingPage() {
  const t = useTranslations("formations");
  const locale = useLocale();
  const router = useRouter();
  const lang = locale === "en" ? "en" : "fr";

  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Formation[]>([]);
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [recentCourses, setRecentCourses] = useState<Formation[]>([]);
  const [topRated, setTopRated] = useState<Formation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ formations: number; apprenants: number; instructeurs: number; averageRating: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/formations/categories").then((r) => r.json()),
      fetch("/api/formations?limit=8&sort=populaire").then((r) => r.json()),
      fetch("/api/formations/stats").then((r) => r.json()),
      fetch("/api/produits?limit=4&sort=populaire").then((r) => r.json()),
      fetch("/api/formations?limit=4&sort=recent").then((r) => r.json()),
      fetch("/api/formations?limit=4&sort=note").then((r) => r.json()),
    ]).then(([cats, form, st, prods, recent, rated]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setFeatured(Array.isArray(form?.formations) ? form.formations : []);
      setStats(st);
      setProducts(Array.isArray(prods?.products) ? prods.products : []);
      setRecentCourses(Array.isArray(recent?.formations) ? recent.formations : []);
      setTopRated(Array.isArray(rated?.formations) ? rated.formations : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/formations/explorer?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/formations/explorer");
    }
  };

  const formatStatValue = (n: number): string => {
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
    if (n > 0) return `${n}+`;
    return "0";
  };

  const STATS = [
    { value: stats ? formatStatValue(stats.apprenants) : "—", label: t("stats_learners") },
    { value: stats ? formatStatValue(stats.formations) : "—", label: t("stats_courses") },
    { value: stats ? formatStatValue(stats.instructeurs) : "—", label: t("stats_instructors") },
    { value: stats?.averageRating ? `${stats.averageRating}/5` : "—", label: t("stats_satisfaction") },
  ];

  const HOW_IT_WORKS = [
    { icon: "🔍", title: t("step1_title"), desc: t("step1_desc") },
    { icon: "💳", title: t("step2_title"), desc: t("step2_desc") },
    { icon: "📚", title: t("step3_title"), desc: t("step3_desc") },
    { icon: "🏆", title: t("step4_title"), desc: t("step4_desc") },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative px-6 lg:px-20 pt-12 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 min-h-[560px] flex flex-col justify-center px-8 lg:px-16 py-12">
            {/* Decorative blurs */}
            <div className="absolute -top-24 -right-24 size-96 bg-primary/20 blur-[150px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-accent/10 blur-[150px] rounded-full" />

            {/* Content */}
            <div className="relative z-10 max-w-3xl space-y-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider border border-accent/30">
                {t("badge_label")}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
                {t("hero_title")}
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-xl leading-relaxed">
                {t("hero_subtitle")}
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full max-w-2xl bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-2 shadow-2xl border border-white/10 gap-2">
                <div className="flex flex-1 items-center min-w-0">
                  <span className="material-symbols-outlined text-slate-400 px-3">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("hero_search_placeholder")}
                    className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-base py-4 min-w-0"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg whitespace-nowrap"
                >
                  {t("search_btn")}
                </button>
              </form>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/formations/explorer"
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all text-sm text-center"
                >
                  {t("hero_cta_explore")}
                </Link>
                <Link
                  href="/formations/inscription?role=instructeur"
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3 rounded-xl font-bold transition-all backdrop-blur-sm text-sm text-center"
                >
                  {t("hero_cta_instructor")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-5xl mx-auto -mt-8 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-extrabold text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATÉGORIES ──────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("popular_categories")}
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 animate-pulse">
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/formations/categories/${cat.slug}`}
                  className="group bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-center flex flex-col items-center gap-3"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {cat.icon ?? "📚"}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {locale === "en" ? (cat.nameEn || cat.nameFr) : cat.nameFr}
                    </p>
                    {cat._count && (
                      <p className="text-xs text-slate-400 mt-1">
                        {cat._count.formations} {t("courses_label")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FORMATIONS EN VEDETTE ────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-extrabold">{t("featured_title")}</h2>
            <Link
              href="/formations/explorer"
              className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1"
            >
              {t("see_all")}
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse">
                  <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((formation) => (
                <FormationCard key={formation.id} formation={formation} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <span className="text-6xl mb-4 block">📚</span>
              <p className="text-lg">{t("coming_soon")}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── NOUVEAUX COURS ──────────────────────────────────────────── */}
      {recentCourses.length > 0 && (
        <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-extrabold">
                {t("new_courses")}
              </h2>
              <Link
                href="/formations/explorer?sort=recent"
                className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1"
              >
                {t("see_all")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentCourses.map((formation) => (
                <FormationCard key={formation.id} formation={formation} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LES MIEUX NOTÉS ─────────────────────────────────────────── */}
      {topRated.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-extrabold">
                {t("top_rated")}
              </h2>
              <Link
                href="/formations/explorer?sort=note"
                className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1"
              >
                {t("see_all")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topRated.map((formation) => (
                <FormationCard key={formation.id} formation={formation} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRODUITS NUMÉRIQUES POPULAIRES ──────────────────────────── */}
      {products.length > 0 && (
        <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-extrabold">{t("popular_products")}</h2>
                <p className="text-slate-500 mt-1">{t("popular_products_subtitle")}</p>
              </div>
              <Link
                href="/formations/produits"
                className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1"
              >
                {t("see_all_products")} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {products.map((product) => (
                <DigitalProductCard key={product.id} product={product} lang={lang} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">{t("how_it_works_title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto -mt-2 mb-4 relative z-10 shadow-lg">
                  {i + 1}
                </div>
                <h3 className="font-bold text-base mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA INSTRUCTEUR ─────────────────────────────────────── */}
      <section className="px-6 lg:px-20 py-20">
        <div className="max-w-7xl mx-auto bg-slate-900 border border-primary/30 rounded-[3rem] p-12 lg:p-24 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-primary/10">
          <div className="absolute -top-24 -right-24 size-96 bg-primary/20 blur-[150px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 size-96 bg-accent/10 blur-[150px] rounded-full" />

          <h2 className="text-3xl md:text-5xl font-extrabold text-white max-w-3xl mx-auto leading-[1.1] relative z-10">
            {t("instructor_cta_title")}
          </h2>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto relative z-10 leading-relaxed">
            {t("instructor_cta_subtitle")}
          </p>
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full font-bold text-sm border border-accent/30 relative z-10">
            {t("instructor_revenue")}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              href="/formations/inscription?role=instructeur"
              className="bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary/30"
            >
              {t("start_teaching")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
