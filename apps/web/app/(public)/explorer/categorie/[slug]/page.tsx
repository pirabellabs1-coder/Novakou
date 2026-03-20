"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const CATEGORY_SLUGS = [
  "developpement-web",
  "design-ui-ux",
  "marketing-digital",
  "redaction",
  "traduction",
  "video-animation",
  "ia-data",
  "mobile",
  "seo",
  "cybersecurite",
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  "developpement-web": "code",
  "design-ui-ux": "palette",
  "marketing-digital": "campaign",
  "redaction": "edit_note",
  "traduction": "translate",
  "video-animation": "videocam",
  "ia-data": "psychology",
  "mobile": "smartphone",
  "seo": "search",
  "cybersecurite": "security",
};

function getCategoryTranslationKey(slug: string): string {
  return `cat_${slug.replace(/-/g, "_")}`;
}

const DEMO_SERVICES: { id: string; title: string; category: string; price: number; rating: number; reviews: number; seller: string; level: string; delivery: number; image: string }[] = [];

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const t = useTranslations("category_page");
  const isValidCategory = CATEGORY_SLUGS.includes(slug as typeof CATEGORY_SLUGS[number]);
  const categoryIcon = CATEGORY_ICONS[slug];
  const categoryNameKey = getCategoryTranslationKey(slug);
  const categoryDescKey = `${categoryNameKey}_desc`;
  const [sortBy, setSortBy] = useState("pertinence");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const services = useMemo(() => {
    const filtered = DEMO_SERVICES.filter(s => s.category === slug);
    if (sortBy === "prix-asc") filtered.sort((a, b) => a.price - b.price);
    if (sortBy === "prix-desc") filtered.sort((a, b) => b.price - a.price);
    if (sortBy === "note") filtered.sort((a, b) => b.rating - a.rating);
    if (sortBy === "populaire") filtered.sort((a, b) => b.reviews - a.reviews);
    return filtered;
  }, [slug, sortBy]);

  if (!isValidCategory) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
          <h2 className="text-xl font-bold mb-2">{t("not_found_title")}</h2>
          <Link href="/explorer" className="text-primary hover:underline">{t("back_to_marketplace")}</Link>
        </div>
      </div>
    );
  }

  const categoryName = t(categoryNameKey);
  const categoryDescription = t(categoryDescKey);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-primary">{t("breadcrumb_home")}</Link>
          <span>/</span>
          <Link href="/explorer" className="hover:text-primary">{t("breadcrumb_explorer")}</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-white font-medium">{categoryName}</span>
        </nav>

        {/* Category header */}
        <div className="bg-white dark:bg-neutral-dark rounded-2xl p-8 border border-slate-200 dark:border-border-dark mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">{categoryIcon}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{categoryName}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{categoryDescription}</p>
              <p className="text-sm text-primary font-semibold mt-1">{t("services_available", { count: String(services.length) })}</p>
            </div>
          </div>
        </div>

        {/* Sort bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">{t("results_count", { count: String(services.length) })}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{t("sort_by")}</span>
            {[
              { key: "pertinence", labelKey: "sort_pertinence" },
              { key: "prix-asc", labelKey: "sort_price_asc" },
              { key: "prix-desc", labelKey: "sort_price_desc" },
              { key: "note", labelKey: "sort_rating" },
              { key: "populaire", labelKey: "sort_popular" },
            ].map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", sortBy === s.key ? "bg-primary text-white" : "bg-slate-100 dark:bg-neutral-dark text-slate-600 dark:text-slate-400 hover:bg-slate-200")}>
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Services grid */}
        {services.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">inbox</span>
            <p className="text-lg font-semibold text-slate-500">{t("no_services")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map(s => (
              <Link key={s.id} href={`/services/${s.id}`} className="group bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-5xl text-primary/40">{s.image}</span>
                  <span className="absolute top-3 left-3 bg-primary/90 text-white text-xs font-bold px-2 py-1 rounded-lg">{categoryName}</span>
                  <button onClick={(e) => { e.preventDefault(); setFavorites(prev => { const n = new Set(prev); if (n.has(s.id)) { n.delete(s.id); } else { n.add(s.id); } return n; }); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-neutral-dark/80 flex items-center justify-center hover:bg-white transition-colors">
                    <span className={cn("material-symbols-outlined text-lg", favorites.has(s.id) ? "text-rose-500" : "text-slate-400")}>{favorites.has(s.id) ? "favorite" : "favorite_border"}</span>
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{(s.seller || "?").charAt(0)}</div>
                    <span className="text-xs text-slate-500">{s.seller}</span>
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{s.level}</span>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
                    <span className="text-sm font-bold">{s.rating}</span>
                    <span className="text-xs text-slate-400">({s.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-border-dark pt-3">
                    <span className="text-xs text-slate-400">{t("delivery_days", { count: String(s.delivery) })}</span>
                    <span className="font-bold text-primary">{t("from_price", { price: String(s.price) })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All categories link */}
        <div className="mt-12 text-center">
          <Link href="/explorer" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            <span className="material-symbols-outlined">arrow_back</span>
            {t("see_all_categories")}
          </Link>
        </div>
      </div>
    </div>
  );
}
