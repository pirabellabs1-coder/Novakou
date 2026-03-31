"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Users, Award, CheckCircle, Play } from "lucide-react";
import {
  formatDuration,
  formatPrice,
  isNew as isNewCourse,
  discountPercent,
  StarRating,
} from "@/lib/formations/format-helpers";
import DynamicIcon from "@/components/ui/DynamicIcon";

// ── Data interface ──────────────────────────────────────────────

export interface FormationCardData {
  id: string;
  slug: string;
  title: string;
  shortDesc?: string | null;
  learnPoints?: string[];
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
  updatedAt?: string;
  category: {
    name: string;
    color: string | null;
    slug?: string;
  };
  instructeur: {
    user: {
      name: string;
      avatar: string | null;
      image: string | null;
    };
  };
}

// ── Props ───────────────────────────────────────────────────────

interface FormationCardProps {
  formation: FormationCardData;
  lang: string;
  compact?: boolean;
  listView?: boolean;
}

// ── Component ───────────────────────────────────────────────────

export default function FormationCard({
  formation,
  lang,
  compact = false,
  listView = false,
}: FormationCardProps) {
  const [hovered, setHovered] = useState(false);
  const title = formation.title;
  const catName = formation.category.name;
  const instructorName = formation.instructeur?.user?.name ?? "Instructeur";
  const avatarUrl =
    formation.instructeur?.user?.avatar || formation.instructeur?.user?.image;

  const showNew = isNewCourse(formation.createdAt);
  const isBestseller = formation.studentsCount > 100;
  const discount = discountPercent(formation.price, formation.originalPrice);

  const freeLabel = lang === "en" ? "Free" : "Gratuit";
  const viewLabel = lang === "en" ? "View" : "Voir";
  const catColor = formation.category.color ?? "#0e7c66";

  // ── List View ──
  if (listView) {
    return (
      <Link
        href={`/formations/${formation.slug}`}
        className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-row"
      >
        <div className="relative w-48 sm:w-64 flex-shrink-0 bg-slate-100 dark:bg-slate-700">
          {formation.thumbnail ? (
            <img src={formation.thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: catColor + "20" }}>
              <DynamicIcon name="school" className="w-10 h-10 opacity-60" />
            </div>
          )}
          {isBestseller && (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">Bestseller</span>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors mb-1">{title}</h3>
            {formation.shortDesc && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{formation.shortDesc}</p>}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>{instructorName}</span>
              <span>·</span>
              <span>{formatDuration(formation.duration)}</span>
              <span>·</span>
              <span>{formation.studentsCount.toLocaleString()} {lang === "en" ? "students" : "apprenants"}</span>
            </div>
            {formation.rating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-sm font-bold">{formation.rating.toFixed(1)}</span>
                <StarRating rating={formation.rating} />
                <span className="text-xs text-slate-400">({formation.reviewsCount})</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            {formation.isFree ? (
              <span className="font-extrabold text-green-500">{freeLabel}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white">{formatPrice(formation.price, false)}</span>
                {formation.originalPrice && formation.originalPrice > formation.price && (
                  <span className="text-sm text-slate-400 line-through">{formation.originalPrice.toFixed(0)}&nbsp;&euro;</span>
                )}
              </div>
            )}
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">{viewLabel} &rarr;</span>
          </div>
        </div>
      </Link>
    );
  }

  // ── Grid View (default) ──
  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/formations/${formation.slug}`}
        className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
        style={{ borderLeftWidth: 3, borderLeftColor: catColor }}
      >
        {/* Thumbnail */}
        <div className="relative overflow-hidden aspect-video bg-slate-100 dark:bg-slate-700">
          {formation.thumbnail ? (
            <img src={formation.thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${catColor}20, ${catColor}40)` }}>
              <DynamicIcon name="school" className="w-12 h-12 opacity-40" />
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M0 0h10v10H0z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {isBestseller && (
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-900 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                Bestseller
              </span>
            )}
            {showNew && !isBestseller && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {lang === "en" ? "New" : "Nouveau"}
              </span>
            )}
          </div>

          {discount && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}

          {/* Rating overlay on thumbnail */}
          {formation.rating > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <span className="text-yellow-400">{formation.rating.toFixed(1)}</span>
              <span className="text-yellow-400">★</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col flex-1 ${compact ? "p-3" : "p-4"}`}>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 self-start" style={{ backgroundColor: catColor + "20", color: catColor }}>
            {catName}
          </span>

          <h3 className={`font-bold line-clamp-2 mb-1 group-hover:text-primary transition-colors ${compact ? "text-xs" : "text-sm"}`}>
            {title}
          </h3>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={instructorName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs flex items-center justify-center h-full text-primary font-medium">{instructorName.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{instructorName}</span>
          </div>

          {formation.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-yellow-500 text-sm font-bold">{formation.rating.toFixed(1)}</span>
              <StarRating rating={formation.rating} />
              <span className="text-xs text-slate-400">({formation.reviewsCount.toLocaleString()})</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(formation.duration)}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formation.studentsCount.toLocaleString()}</span>
            {formation.hasCertificate && <span className="flex items-center gap-1 text-primary"><Award className="w-3.5 h-3.5" /></span>}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              {formation.isFree ? (
                <span className="text-lg font-extrabold text-green-500">{freeLabel}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{formatPrice(formation.price, false)}</span>
                  {formation.originalPrice && formation.originalPrice > formation.price && (
                    <span className="text-sm text-red-400 line-through font-medium">{formation.originalPrice.toFixed(0)}&nbsp;&euro;</span>
                  )}
                </div>
              )}
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">{viewLabel} &rarr;</span>
          </div>
        </div>
      </Link>

      {/* ── Hover Preview (desktop only) ── */}
      {hovered && formation.learnPoints && formation.learnPoints.length > 0 && (
        <div className="hidden lg:block absolute left-full top-0 ml-2 w-72 z-50 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 animate-in fade-in-0 slide-in-from-left-2 duration-200">
          {formation.shortDesc && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 line-clamp-3">{formation.shortDesc}</p>
          )}
          <div className="space-y-1.5 mb-3">
            {(formation.learnPoints || []).slice(0, 3).map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{point}</span>
              </div>
            ))}
          </div>
          {formation.updatedAt && (
            <p className="text-[10px] text-slate-400 mb-3">
              {lang === "en" ? "Updated" : "Mis à jour"} {new Date(formation.updatedAt).toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", { month: "short", year: "numeric" })}
            </p>
          )}
          <Link
            href={`/formations/${formation.slug}`}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            {lang === "en" ? "Free preview" : "Aperçu gratuit"}
          </Link>
        </div>
      )}
    </div>
  );
}
