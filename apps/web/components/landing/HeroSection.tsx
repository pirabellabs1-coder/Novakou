"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const HERO_CATEGORY_SLUGS = [
  "design-crea",
  "developpement",
  "marketing",
  "redaction",
  "video",
  "musique",
  "business",
  "ia-data",
];

const POPULAR_SEARCH_KEYS = [
  "Logo Design",
  "Site WordPress",
  "App Mobile",
  "SEO",
  "Montage Vidéo",
  "Rédaction Web",
  "UI/UX Design",
];

export function HeroSection() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const t = useTranslations("landing.hero");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("categorie", category);
    router.push(`/explorer?${params.toString()}`);
  }

  function handlePopularSearch(tag: string) {
    router.push(`/explorer?q=${encodeURIComponent(tag)}`);
  }

  return (
    <section className="relative px-4 sm:px-6 lg:px-20 pt-6 sm:pt-12 pb-10 sm:pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] flex flex-col justify-center px-5 sm:px-8 lg:px-16 py-8 sm:py-12">
          {/* Background image */}
          <div className="absolute inset-0 z-0 opacity-50">
            <img
              alt="Professional workspace"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5tMHn3iXlo2UtTqG_QRtJGsnV4ET7fnFrLu0XlMcU90NZ99up3ByX460k3LW_SbjobCS6735ENKRx5dGqoQyMGc9cHqhU5ECaRvcQZvwSGtPPSve4qWKdyvJUzPqpggU4E26MLMSveuv0GqEPWknI9QP3skKFhA8SLreffd4xpnLhNUpKr0iSWF4X8rlLrb33Y6sS9HG_qhIx0WnoDBeVM5fUXQ6H-OpS7Nxg_QM99l2ExKE1vo9wYdJKqUwdp4eAD9yHp2V-pewj"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/80 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6 lg:space-y-8">
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-accent/20 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-accent/30">
              {t("badge")}
            </span>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
              {t("title_1")}{" "}
              <span className="text-primary">{t("title_highlight")}</span> {t("title_2")}{" "}
              <span className="text-accent">{t("title_accent")}</span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed">
              {t("subtitle")}
            </p>

            {/* Search & Filter bar */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xl border border-white/10 gap-1.5 sm:gap-2"
            >
              {/* Category filter */}
              <div className="relative flex items-center shrink-0">
                <span className="material-symbols-outlined text-slate-400 absolute left-3 pointer-events-none text-xl">
                  category
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl pl-10 pr-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-primary/50 cursor-pointer w-full sm:w-[200px]"
                >
                  <option value="">{t("all_categories")}</option>
                  {HERO_CATEGORY_SLUGS.map((slug) => (
                    <option key={slug} value={slug}>
                      {t(`categories.${slug}`)}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-slate-400 text-sm absolute right-2 pointer-events-none">
                  expand_more
                </span>
              </div>

              {/* Search input */}
              <div className="flex flex-1 items-center min-w-0">
                <span className="material-symbols-outlined text-slate-400 px-3">
                  search
                </span>
                <input
                  className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base py-3 sm:py-4 min-w-0"
                  placeholder={t("search_placeholder")}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all shadow-lg flex-shrink-0"
                aria-label="Rechercher"
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">search</span>
              </button>
            </form>

            {/* Popular searches */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 sm:pt-2">
              <span className="text-xs text-slate-400 font-semibold">
                {t("popular_label")}
              </span>
              {POPULAR_SEARCH_KEYS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handlePopularSearch(tag)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-primary/30 text-white text-xs font-medium border border-white/10 hover:border-primary/40 transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
