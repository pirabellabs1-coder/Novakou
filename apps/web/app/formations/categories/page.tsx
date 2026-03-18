"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface Category {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  _count: { formations: number };
}

export default function FormationsCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "fr";

  useEffect(() => {
    fetch("/api/formations/categories")
      .then((r) => r.json())
      .then((d) => {
        // API returns a raw array
        setCategories(Array.isArray(d) ? d : (d.categories ?? []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/formations" className="hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors">
              {lang === "fr" ? "Formations" : "Courses"}
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">{lang === "fr" ? "Catégories" : "Categories"}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {lang === "fr" ? "Toutes les catégories" : "All Categories"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {lang === "fr"
              ? "Explorez nos formations par domaine d'expertise"
              : "Explore our courses by field of expertise"}
          </p>
        </div>
      </div>

      {/* Categories grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 animate-pulse h-32" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <span className="text-5xl block mb-4">📂</span>
            <p>{lang === "fr" ? "Aucune catégorie disponible" : "No categories available"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/formations/categories/${cat.slug}`}
                className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/40 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-primary/10 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {cat.icon}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {lang === "fr" ? cat.nameFr : cat.nameEn}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {cat._count.formations} {lang === "fr" ? "formation" : "course"}{cat._count.formations > 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
