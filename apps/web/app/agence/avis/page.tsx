"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import type { ApiReview } from "@/lib/api-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FILTER_TABS = [
  { key: "tous", label: "Tous" },
  { key: "5", label: "5 etoiles" },
  { key: "4", label: "4 etoiles" },
  { key: "3-", label: "3 et moins" },
  { key: "replied", label: "Avec reponse" },
  { key: "unreplied", label: "Sans reponse" },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function StarDisplay({
  rating,
  size = "text-sm",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn(
            "material-symbols-outlined",
            size,
            star <= rating ? "text-yellow-400" : "text-slate-600"
          )}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function CriteriaBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-border-dark rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            value >= 4 ? "bg-primary" : value >= 3 ? "bg-amber-400" : "bg-red-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-white w-6 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Build a 6-month rating evolution dataset from the reviews list.
 * Groups reviews by month and computes the average rating per month.
 */
function buildRatingEvolution(
  reviews: ApiReview[]
): { month: string; note: number }[] {
  if (reviews.length === 0) return [];

  const now = new Date();
  const months: { month: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    months.push({ month: label, key });
  }

  const grouped: Record<string, number[]> = {};
  for (const m of months) grouped[m.key] = [];

  for (const r of reviews) {
    try {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (grouped[key]) grouped[key].push(r.rating);
    } catch {
      // skip invalid dates
    }
  }

  let lastKnown = 0;
  return months.map((m) => {
    const ratings = grouped[m.key];
    if (ratings.length > 0) {
      const avg =
        Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
      lastKnown = avg;
      return { month: m.month, note: avg };
    }
    return { month: m.month, note: lastKnown };
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AgenceAvis() {
  const {
    reviews,
    reviewSummary,
    syncReviews,
    replyToReview,
    isLoading,
  } = useAgencyStore();
  const { addToast } = useToastStore();

  const [filter, setFilter] = useState("tous");
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Sync reviews on mount
  useEffect(() => {
    syncReviews();
  }, [syncReviews]);

  // Filtered reviews
  const filtered = useMemo(() => {
    switch (filter) {
      case "5":
        return reviews.filter((r) => r.rating === 5);
      case "4":
        return reviews.filter((r) => r.rating === 4);
      case "3-":
        return reviews.filter((r) => r.rating <= 3);
      case "replied":
        return reviews.filter((r) => r.reply !== null);
      case "unreplied":
        return reviews.filter((r) => r.reply === null);
      default:
        return reviews;
    }
  }, [reviews, filter]);

  // Rating evolution chart data
  const chartData = useMemo(() => buildRatingEvolution(reviews), [reviews]);

  // Computed stats
  const responseRate = useMemo(() => {
    if (reviews.length === 0) return 0;
    const replied = reviews.filter((r) => r.reply !== null).length;
    return Math.round((replied / reviews.length) * 100);
  }, [reviews]);

  const satisfactionRate = useMemo(() => {
    if (reviews.length === 0) return 0;
    const satisfied = reviews.filter((r) => r.rating >= 4).length;
    return Math.round((satisfied / reviews.length) * 100);
  }, [reviews]);

  // Submit reply
  const handleSubmitReply = useCallback(
    async (reviewId: string) => {
      const text = responseTexts[reviewId]?.trim();
      if (!text) {
        addToast("error", "Veuillez rediger une reponse.");
        return;
      }
      setSubmitting(reviewId);
      try {
        const ok = await replyToReview(reviewId, text);
        if (ok) {
          addToast("success", "Reponse publiee avec succes !");
          setResponseTexts((prev) => ({ ...prev, [reviewId]: "" }));
          setExpandedResponse(null);
        } else {
          addToast("error", "Erreur lors de la publication de la reponse.");
        }
      } catch {
        addToast("error", "Erreur lors de la publication de la reponse.");
      } finally {
        setSubmitting(null);
      }
    },
    [responseTexts, replyToReview, addToast]
  );

  // ── Loading state ──
  if (isLoading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">Avis clients</h1>
          <p className="text-slate-400 text-sm mt-1">Chargement en cours...</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-neutral-dark rounded-xl border border-border-dark p-4 h-20 animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-neutral-dark rounded-xl border border-border-dark p-5 h-40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (!isLoading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">Avis clients</h1>
          <p className="text-slate-400 text-sm mt-1">
            Consultez et repondez aux avis recus par l&apos;agence.
          </p>
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-16 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">
            reviews
          </span>
          <p className="text-lg font-bold text-slate-400 mb-2">Aucun avis</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Les avis apparaitront ici apres vos premieres commandes. Vos
            clients pourront evaluer la qualite, la communication et le respect
            des delais.
          </p>
        </div>
      </div>
    );
  }

  const avgRating = reviewSummary?.avgRating ?? 0;
  const totalReviews = reviewSummary?.totalReviews ?? reviews.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Avis clients</h1>
        <p className="text-slate-400 text-sm mt-1">
          Consultez et repondez aux avis recus par l&apos;agence.
        </p>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Note moyenne */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
          <span
            className="material-symbols-outlined text-xl text-yellow-400"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          <div>
            <p className="text-xl font-black text-white">
              {avgRating.toFixed(1)}/5
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Note moyenne
            </p>
          </div>
        </div>

        {/* Total avis */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-xl text-primary">
            reviews
          </span>
          <div>
            <p className="text-xl font-black text-white">{totalReviews}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Total avis
            </p>
          </div>
        </div>

        {/* Satisfaction */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-xl text-emerald-400">
            sentiment_satisfied
          </span>
          <div>
            <p className="text-xl font-black text-white">{satisfactionRate}%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Satisfaction
            </p>
          </div>
        </div>

        {/* Taux de reponse */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-xl text-blue-400">
            reply
          </span>
          <div>
            <p className="text-xl font-black text-white">{responseRate}%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Reponses
            </p>
          </div>
        </div>
      </div>

      {/* ── Rating distribution + chart row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Star distribution */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Répartition des notes</h2>

          {/* Big rating display */}
          <div className="flex items-center gap-4 mb-5">
            <p className="text-5xl font-black text-white">
              {avgRating.toFixed(1)}
            </p>
            <div>
              <StarDisplay rating={Math.round(avgRating)} size="text-lg" />
              <p className="text-xs text-slate-500 mt-1">
                {totalReviews} avis au total
              </p>
            </div>
          </div>

          {/* Bars */}
          <div className="space-y-2.5">
            {(reviewSummary?.starDistribution ?? [])
              .slice()
              .sort((a, b) => b.stars - a.stars)
              .map((d) => (
                <div key={d.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 flex-shrink-0">
                    <span className="text-sm font-semibold text-white">
                      {d.stars}
                    </span>
                    <span
                      className="material-symbols-outlined text-yellow-400 text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <div className="flex-1 h-3 bg-border-dark rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        d.stars >= 4
                          ? "bg-primary"
                          : d.stars === 3
                          ? "bg-amber-400"
                          : "bg-red-400"
                      )}
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right">
                    {d.percent}% ({d.count})
                  </span>
                </div>
              ))}
          </div>

          {/* Criteria averages */}
          {reviewSummary && (
            <div className="mt-5 pt-4 border-t border-border-dark space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Moyennes par critere
              </p>
              <CriteriaBar label="Qualite" value={reviewSummary.avgQualite} />
              <CriteriaBar
                label="Communication"
                value={reviewSummary.avgCommunication}
              />
              <CriteriaBar label="Delai" value={reviewSummary.avgDelai} />
            </div>
          )}
        </div>

        {/* Rating evolution chart */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">
            Evolution de la note sur 6 mois
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}/5`} />} />
                <Line
                  type="monotone"
                  dataKey="note"
                  stroke="#6C2BD9"
                  strokeWidth={2.5}
                  dot={{ fill: "#6C2BD9", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#6C2BD9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-slate-500 text-sm">
                Pas assez de données pour afficher le graphique.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              filter === f.key
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Reviews list ── */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">
              reviews
            </span>
            <p className="text-slate-500 font-semibold">
              Aucun avis dans cette categorie
            </p>
          </div>
        ) : (
          filtered.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              expanded={expandedResponse === r.id}
              responseText={responseTexts[r.id] || ""}
              isSubmitting={submitting === r.id}
              onToggleExpand={() =>
                setExpandedResponse((prev) =>
                  prev === r.id ? null : r.id
                )
              }
              onResponseTextChange={(text) =>
                setResponseTexts((prev) => ({
                  ...prev,
                  [r.id]: text,
                }))
              }
              onSubmitReply={() => handleSubmitReply(r.id)}
              onCancelReply={() => setExpandedResponse(null)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ReviewCard                                                         */
/* ------------------------------------------------------------------ */

function ReviewCard({
  review: r,
  expanded,
  responseText,
  isSubmitting,
  onToggleExpand,
  onResponseTextChange,
  onSubmitReply,
  onCancelReply,
}: {
  review: ApiReview;
  expanded: boolean;
  responseText: string;
  isSubmitting: boolean;
  onToggleExpand: () => void;
  onResponseTextChange: (text: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
}) {
  const { addToast } = useToastStore();

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleReport() {
    addToast("warning", `Avis ${r.id.slice(-6)} signale pour examen par la moderation.`);
  }

  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
      {/* Review header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Client avatar */}
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 overflow-hidden">
            {r.clientAvatar ? (
              <Image
                src={r.clientAvatar}
                alt={r.clientName}
                width={44}
                height={44}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              getInitials(r.clientName)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="font-bold text-white text-sm">{r.clientName}</p>
              {r.clientCountry && (
                <span className="text-xs text-slate-500">
                  {r.clientCountry}
                </span>
              )}
              <StarDisplay rating={r.rating} />
              <span className="text-xs font-semibold text-yellow-400">
                {r.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {r.serviceTitle} &middot; {formatDate(r.createdAt)}
            </p>
          </div>
        </div>
        <button
          onClick={handleReport}
          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
          title="Signaler cet avis"
        >
          <span className="material-symbols-outlined text-lg">flag</span>
        </button>
      </div>

      {/* Comment */}
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {r.comment}
      </p>

      {/* Criteria breakdown */}
      <div className="bg-background-dark rounded-lg p-4 border border-border-dark mb-4 space-y-2">
        <CriteriaBar label="Qualite" value={r.qualite} />
        <CriteriaBar label="Communication" value={r.communication} />
        <CriteriaBar label="Delai" value={r.delai} />
      </div>

      {/* Helpful count */}
      {r.helpful > 0 && (
        <p className="text-xs text-slate-500 mb-3">
          <span className="material-symbols-outlined text-xs align-middle mr-1">
            thumb_up
          </span>
          {r.helpful} personne{r.helpful > 1 ? "s" : ""} ont trouve cet avis utile
        </p>
      )}

      {/* Existing agency reply */}
      {r.reply && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-sm">
              reply
            </span>
            <p className="text-xs font-semibold text-primary">
              Reponse de l&apos;agence
            </p>
            {r.repliedAt && (
              <span className="text-[10px] text-slate-500 ml-auto">
                {formatDate(r.repliedAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300">{r.reply}</p>
        </div>
      )}

      {/* Response form (only if no existing reply) */}
      {!r.reply && (
        <div>
          {expanded ? (
            <div className="space-y-3">
              <textarea
                value={responseText}
                onChange={(e) => onResponseTextChange(e.target.value)}
                placeholder="Redigez votre reponse publique..."
                rows={3}
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
                disabled={isSubmitting}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCancelReply}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-slate-400 text-xs font-semibold hover:text-white transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={onSubmitReply}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary text-background-dark text-xs font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  Publier la reponse
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
            >
              <span className="material-symbols-outlined text-sm">reply</span>
              Repondre a cet avis
            </button>
          )}
        </div>
      )}
    </div>
  );
}
