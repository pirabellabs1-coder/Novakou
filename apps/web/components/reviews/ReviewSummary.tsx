"use client";

import { cn } from "@/lib/utils";

export interface ReviewSummaryData {
  qualite: number;
  communication: number;
  delai: number;
  rating: number;
}

interface ReviewSummaryProps {
  reviews: ReviewSummaryData[];
  totalCount: number;
}

function Stars({ rating, size = "text-base" }: { rating: number; size?: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={cn(
            "material-symbols-outlined",
            size,
            s <= Math.round(rating) ? "text-yellow-400" : "text-white/10"
          )}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function CriteriaAverageBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min((value / 5) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-[100px] shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function ReviewSummary({ reviews, totalCount }: ReviewSummaryProps) {
  if (totalCount === 0 || reviews.length === 0) {
    return (
      <div className="bg-white/[0.03] rounded-xl p-5 border border-white/10 text-center">
        <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">
          rate_review
        </span>
        <p className="text-sm text-slate-500">Aucun avis pour l&apos;instant.</p>
      </div>
    );
  }

  // Average overall rating
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Average criteria
  const avgQualite =
    reviews.reduce((sum, r) => sum + r.qualite, 0) / reviews.length;
  const avgCommunication =
    reviews.reduce((sum, r) => sum + r.communication, 0) / reviews.length;
  const avgDelai =
    reviews.reduce((sum, r) => sum + r.delai, 0) / reviews.length;

  // Star distribution (count per star level)
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rounded = Math.round(r.rating);
    const clamped = Math.max(1, Math.min(5, rounded));
    distribution[clamped] = (distribution[clamped] || 0) + 1;
  });

  const maxDistCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="bg-white/[0.03] rounded-xl p-5 border border-white/10">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Big average */}
        <div className="flex flex-col items-center justify-center sm:min-w-[140px] sm:border-r sm:border-white/10 sm:pr-6">
          <span className="text-4xl font-bold text-white leading-none">
            {avgRating.toFixed(1)}
          </span>
          <div className="mt-2">
            <Stars rating={avgRating} size="text-lg" />
          </div>
          <span className="text-xs text-slate-500 mt-1.5">
            ({totalCount} avis)
          </span>
        </div>

        {/* Right: Distribution + Criteria */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Star distribution chart */}
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const pct =
                totalCount > 0 ? (count / totalCount) * 100 : 0;
              const barWidth =
                maxDistCount > 0 ? (count / maxDistCount) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 w-[50px] shrink-0 justify-end">
                    <span className="text-xs text-slate-400">{star}</span>
                    <span
                      className="material-symbols-outlined text-yellow-400 text-xs"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        star >= 4
                          ? "bg-yellow-400"
                          : star === 3
                            ? "bg-amber-500"
                            : "bg-orange-500"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 w-[60px] shrink-0">
                    <span className="text-[11px] text-slate-500 w-7 text-right">
                      {pct.toFixed(0)}%
                    </span>
                    <span className="text-[11px] text-slate-600">
                      ({count})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Criteria averages */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <CriteriaAverageBar label="Qualit\u00e9" value={avgQualite} />
            <CriteriaAverageBar label="Communication" value={avgCommunication} />
            <CriteriaAverageBar label="D\u00e9lai" value={avgDelai} />
          </div>
        </div>
      </div>
    </div>
  );
}
