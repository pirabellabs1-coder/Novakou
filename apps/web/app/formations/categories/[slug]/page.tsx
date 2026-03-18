"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Star, Users, Clock } from "lucide-react";

interface CategoryDetail {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
}

interface Formation {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  price: number;
  isFree: boolean;
  rating: number;
  studentsCount: number;
  reviewsCount: number;
  duration: number;
  level: string;
  thumbnail: string | null;
  instructeur: { user: { name: string } };
}

const LEVEL_LABELS: Record<string, { fr: string; en: string }> = {
  DEBUTANT: { fr: "Débutant", en: "Beginner" },
  INTERMEDIAIRE: { fr: "Intermédiaire", en: "Intermediate" },
  AVANCE: { fr: "Avancé", en: "Advanced" },
  TOUS_NIVEAUX: { fr: "Tous niveaux", en: "All levels" },
};

export default function FormationCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "fr";

  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/formations/categories/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setCategory(d.category);
        setFormations(d.formations ?? []);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);

  if (!loading && error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-center p-4">
        <div>
          <span className="text-5xl block mb-4">📂</span>
          <p className="text-slate-500 mb-4">{t("Catégorie introuvable", "Category not found")}</p>
          <Link href="/formations/categories" className="text-primary hover:underline text-sm font-semibold">
            {t("Voir toutes les catégories", "View all categories")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/formations" className="hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors">
              {t("Formations", "Courses")}
            </Link>
            <span>/</span>
            <Link href="/formations/categories" className="hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors">
              {t("Catégories", "Categories")}
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">
              {category ? (lang === "fr" ? category.nameFr : category.nameEn) : slug}
            </span>
          </div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            </div>
          ) : category && (
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {lang === "fr" ? category.nameFr : category.nameEn}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {formations.length} {t("formation", "course")}{formations.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formations */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : formations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">{t("Aucune formation dans cette catégorie", "No courses in this category")}</p>
            <Link href="/formations/explorer" className="mt-4 inline-block text-primary hover:underline text-sm">
              {t("Explorer toutes les formations", "Explore all courses")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formations.map((f) => (
              <Link key={f.id} href={`/formations/${f.slug}`} className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/40 rounded-2xl overflow-hidden group transition-all hover:shadow-lg hover:shadow-primary/10">
                {/* Thumbnail */}
                <div className="relative h-40 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700">
                  {f.thumbnail ? (
                    <img src={f.thumbnail} alt={lang === "fr" ? f.titleFr : f.titleEn} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">{category?.icon ?? "📚"}</span>
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors text-sm mb-2">
                    {lang === "fr" ? f.titleFr : f.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{f.instructeur.user.name}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {f.rating.toFixed(1)} ({f.reviewsCount})
                    </span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{f.studentsCount.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(f.duration / 60)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {LEVEL_LABELS[f.level]?.[lang] ?? f.level}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {f.isFree ? t("Gratuit", "Free") : `${f.price.toFixed(0)}€`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
