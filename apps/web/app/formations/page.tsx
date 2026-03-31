"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import FormationCard from "@/components/formations/FormationCard";
import DigitalProductCard from "@/components/formations/DigitalProductCard";
import DynamicIcon from "@/components/ui/DynamicIcon";
import AnimatedCounter from "@/components/formations/AnimatedCounter";
import TrustBar from "@/components/formations/TrustBar";
import TestimonialCarousel from "@/components/formations/TestimonialCarousel";
import TopInstructors from "@/components/formations/TopInstructors";
import LearningPaths from "@/components/formations/LearningPaths";
import { Shield } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
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
  category: { name: string; color: string | null };
  instructeur: { user: { name: string; avatar: string | null; image: string | null } };
}

interface DigitalProduct {
  id: string;
  slug: string;
  title: string;
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
  category: { name: string; slug: string } | null;
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
      setCategories(Array.isArray(cats) ? cats : (cats?.categories ?? []));
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

  const STATS = [
    { value: stats?.apprenants ?? 0, suffix: "+", label: t("stats_learners") },
    { value: stats?.formations ?? 0, suffix: "+", label: t("stats_courses") },
    { value: stats?.instructeurs ?? 0, suffix: "+", label: t("stats_instructors") },
    { value: stats?.averageRating ?? 0, suffix: "/5", decimals: 1, label: t("stats_satisfaction") },
  ];

  const HOW_IT_WORKS = [
    { icon: "search", title: t("step1_title"), desc: t("step1_desc") },
    { icon: "payment", title: t("step2_title"), desc: t("step2_desc") },
    { icon: "school", title: t("step3_title"), desc: t("step3_desc") },
    { icon: "emoji_events", title: t("step4_title"), desc: t("step4_desc") },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative px-3 sm:px-6 lg:px-20 pt-6 sm:pt-12 pb-10 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 min-h-[400px] sm:min-h-[560px] flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
            {/* Decorative blurs */}
            <div className="absolute -top-24 -right-24 size-96 bg-primary/20 blur-[150px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-accent/10 blur-[150px] rounded-full" />

            {/* Content */}
            <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6 lg:space-y-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider border border-accent/30">
                {t("badge_label")}
              </span>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
                <span className="bg-gradient-to-r from-white via-primary/90 to-accent bg-clip-text text-transparent">
                  {t("hero_title")}
                </span>
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-slate-300 max-w-xl leading-relaxed">
                {t("hero_subtitle")}
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex flex-row items-center w-full max-w-2xl bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xl border border-white/10">
                <DynamicIcon name="search" className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mx-2 sm:mx-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("hero_search_placeholder")}
                  className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base py-2.5 sm:py-3 min-w-0"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all flex-shrink-0"
                  aria-label="Rechercher"
                >
                  <DynamicIcon name="search" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2">
                <Link
                  href="/formations/explorer"
                  className="bg-primary hover:bg-primary/90 text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold shadow-lg shadow-primary/30 transition-all text-xs sm:text-sm text-center"
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
            <div key={stat.label} className="text-center bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-extrabold text-primary mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
              </div>
              <div className="text-xs text-slate-500 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────── */}
      <TrustBar />

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
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.slice(0, 12).map((cat, index) => (
                  <Link
                    key={cat.id}
                    href={`/formations/categories/${cat.slug}`}
                    className={`group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-center flex flex-col items-center gap-3 relative overflow-hidden${index >= 6 ? " hidden sm:flex" : ""}`}
                    style={{ borderLeftWidth: 3, borderLeftColor: cat.color ?? "#0e7c66" }}
                  >
                    <DynamicIcon name={cat.icon ?? "library_books"} className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {cat.name}
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
              {categories.length > 12 && (
                <div className="text-center mt-8">
                  <Link
                    href="/formations/categories"
                    className="text-primary hover:text-primary/80 font-semibold text-sm"
                  >
                    {t("see_all")} ({categories.length})
                  </Link>
                </div>
              )}
            </>
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
              <DynamicIcon name="library_books" className="w-16 h-16 mb-4 mx-auto block" />
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

      {/* ── PARCOURS D'APPRENTISSAGE ────────────────────────────── */}
      <LearningPaths />

      {/* ── GARANTIE ──────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <Shield className="w-10 h-10 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800 dark:text-green-300">{t("guarantee_title")}</p>
            <p className="text-sm text-green-700 dark:text-green-400">{t("guarantee_desc")}</p>
          </div>
        </div>
      </div>

      {/* ── TÉMOIGNAGES ───────────────────────────────────────────── */}
      <TestimonialCarousel />

      {/* ── TOP INSTRUCTEURS ──────────────────────────────────────── */}
      <TopInstructors />

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">{t("how_it_works_title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DynamicIcon name={step.icon} className="w-8 h-8" />
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
