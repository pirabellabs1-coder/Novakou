"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const CATEGORIES_META = [
  { icon: "draw", slug: "design-crea" },
  { icon: "terminal", slug: "developpement" },
  { icon: "ads_click", slug: "marketing" },
  { icon: "edit_note", slug: "redaction" },
  { icon: "videocam", slug: "video" },
  { icon: "music_note", slug: "musique" },
  { icon: "business_center", slug: "business" },
  { icon: "psychology", slug: "ia-data" },
];

export function CategoriesSection() {
  const t = useTranslations("landing.categories");

  return (
    <section className="px-4 sm:px-6 lg:px-20 py-12 sm:py-20 lg:py-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 lg:mb-16 gap-3 sm:gap-4">
          <div className="space-y-2 sm:space-y-4">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">{t("title")}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base lg:text-lg">{t("subtitle")}</p>
          </div>
          <Link
            href="/explorer"
            className="hidden sm:flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all flex-shrink-0"
          >
            {t("see_all")} <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {CATEGORIES_META.map((cat) => (
            <Link
              key={cat.slug}
              href={`/explorer?categorie=${cat.slug}`}
              className="group bg-white dark:bg-slate-800/40 hover:bg-primary border border-slate-200 dark:border-slate-800 hover:border-primary p-4 sm:p-6 lg:p-10 rounded-xl sm:rounded-2xl lg:rounded-3xl transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/20"
            >
              <span className="material-symbols-outlined text-2xl sm:text-3xl lg:text-5xl text-primary group-hover:text-white mb-3 sm:mb-5 lg:mb-8 block transition-transform group-hover:scale-110">
                {cat.icon}
              </span>
              <h4 className="text-xs sm:text-sm lg:text-xl font-bold text-slate-900 dark:text-white group-hover:text-white mb-1 sm:mb-2 leading-tight">{t(`items.${cat.slug}.title`)}</h4>
              <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 group-hover:text-white/80 leading-relaxed hidden sm:block">
                {t(`items.${cat.slug}.description`)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
