"use client";

import Link from "next/link";
import { Clock, Users, Award } from "lucide-react";
import {
  formatDuration,
  formatPrice,
  isNew as isNewCourse,
  discountPercent,
  StarRating,
} from "@/lib/formations/format-helpers";

// ── Data interface ──────────────────────────────────────────────

export interface FormationCardData {
  id: string;
  slug: string;
  title: string;
  shortDesc?: string | null;
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
}

// ── Component ───────────────────────────────────────────────────

export default function FormationCard({
  formation,
  lang,
  compact = false,
}: FormationCardProps) {
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

  return (
    <Link
      href={`/formations/${formation.slug}`}
      className="group bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      <div className="relative overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 dark:bg-slate-700">
        {formation.thumbnail ? (
          <img
            src={formation.thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              backgroundColor:
                (formation.category.color ?? "#0e7c66") + "20",
            }}
          >
            <span className="text-4xl opacity-60">🎓</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {isBestseller && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
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
      </div>

      <div className={`flex flex-col flex-1 ${compact ? "p-3" : "p-4"}`}>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 self-start"
          style={{
            backgroundColor:
              (formation.category.color ?? "#0e7c66") + "20",
            color: formation.category.color ?? "#0e7c66",
          }}
        >
          {catName}
        </span>

        <h3
          className={`font-bold line-clamp-2 mb-1 group-hover:text-primary transition-colors ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {title}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={instructorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs flex items-center justify-center h-full text-primary font-medium">
                {instructorName.charAt(0)}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {instructorName}
          </span>
        </div>

        {formation.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-500 text-sm font-bold">
              {formation.rating.toFixed(1)}
            </span>
            <StarRating rating={formation.rating} />
            <span className="text-xs text-slate-400">
              ({formation.reviewsCount.toLocaleString()})
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(formation.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {formation.studentsCount.toLocaleString()}
          </span>
          {formation.hasCertificate && (
            <span className="flex items-center gap-1 text-primary">
              <Award className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            {formation.isFree ? (
              <span className="text-lg font-extrabold text-green-500">
                {freeLabel}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatPrice(formation.price, false)}
                </span>
                {formation.originalPrice &&
                  formation.originalPrice > formation.price && (
                    <span className="text-sm text-slate-400 line-through">
                      {formation.originalPrice.toFixed(0)}&nbsp;&euro;
                    </span>
                  )}
              </div>
            )}
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
            {viewLabel} &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
