"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";

const FLAG: Record<string, string> = { CI: "🇨🇮", SN: "🇸🇳", FR: "🇫🇷", ML: "🇲🇱", BJ: "🇧🇯", CM: "🇨🇲", BF: "🇧🇫" };

export default function AvisPage() {
  const { reviews, reviewSummary, syncReviews, apiReplyToReview, apiReportReview, apiMarkHelpful } = useDashboardStore();
  const { addToast } = useToastStore();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    syncReviews().finally(() => setLoading(false));
  }, [syncReviews]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const ok = await apiReplyToReview(reviewId, replyText.trim());
    setSubmitting(false);
    if (ok) {
      addToast("success", "Réponse publiée avec succès");
      setReplyingTo(null);
      setReplyText("");
    } else {
      addToast("error", "Erreur lors de la publication de la réponse");
    }
  };

  const handleReport = async (reviewId: string) => {
    const ok = await apiReportReview(reviewId);
    if (ok) {
      addToast("info", "Avis signalé aux modérateurs");
    }
  };

  const handleHelpful = async (reviewId: string) => {
    await apiMarkHelpful(reviewId);
  };

  const avgRating = reviewSummary?.avgRating ?? 0;
  const dist = reviewSummary?.starDistribution ?? [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: 0, percent: 0 }));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">Avis reçus</h2>
          <p className="text-sm text-slate-400 mt-0.5">Chargement...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-background-dark/50 rounded-2xl border border-border-dark p-5 animate-pulse">
              <div className="h-10 bg-slate-800 rounded-xl w-3/4 mb-3" />
              <div className="h-4 bg-slate-800 rounded w-full mb-2" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-100">Avis reçus</h2>
        <p className="text-sm text-slate-400 mt-0.5">{reviews.length} avis vérifiés</p>
      </div>

      {/* Summary */}
      <div className="bg-background-dark/50 rounded-2xl border border-border-dark p-6 flex flex-col sm:flex-row items-center gap-8">
        {/* Global score */}
        <div className="text-center flex-shrink-0">
          <p className="text-6xl font-black text-slate-100 mb-1">{avgRating.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={cn("material-symbols-outlined text-xl leading-none", i < Math.floor(avgRating) ? "text-amber-400" : "text-slate-600")}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 font-semibold">Note globale</p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-2 w-full sm:w-auto">
          {dist.map(({ stars, count, percent }) => (
            <div key={stars} className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span className="text-xs font-bold text-slate-400">{stars}</span>
                <span className="material-symbols-outlined text-xs leading-none text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div className="flex-1 h-2 bg-border-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-4 text-right flex-shrink-0">{count}</span>
            </div>
          ))}
        </div>

        {/* Sub-scores */}
        <div className="space-y-2 flex-shrink-0">
          {[
            { label: "Qualité", score: (reviewSummary?.avgQualite ?? 0).toFixed(1) },
            { label: "Communication", score: (reviewSummary?.avgCommunication ?? 0).toFixed(1) },
            { label: "Délai", score: (reviewSummary?.avgDelai ?? 0).toFixed(1) },
          ].map(({ label, score }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-semibold">{label}</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs leading-none text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-xs font-black text-slate-100">{score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="bg-background-dark/50 rounded-2xl border border-border-dark p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">reviews</span>
          <p className="text-sm text-slate-400">Aucun avis reçu pour le moment</p>
          <p className="text-xs text-slate-500 mt-1">Les avis apparaîtront ici une fois que vos clients auront évalué vos services.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const isExpanded = expandedId === r.id;
            const isReplying = replyingTo === r.id;

            return (
              <div key={r.id} className="bg-background-dark/50 rounded-2xl border border-border-dark p-5">
                {/* Review header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-primary">{r.clientAvatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-100">{r.clientName}</p>
                      <span className="text-xs text-slate-400">{FLAG[r.clientCountry] ?? ""}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={cn("material-symbols-outlined text-xs leading-none", i < Math.floor(r.rating) ? "text-amber-400" : "text-slate-600")}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-black text-slate-300">{r.rating}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{r.serviceTitle}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReport(r.id)}
                    className={cn(
                      "flex-shrink-0 p-1.5 rounded-lg transition-colors",
                      r.reported ? "text-red-400 bg-red-500/10" : "text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                    )}
                    title={r.reported ? "Signalé" : "Signaler"}
                    disabled={r.reported}
                  >
                    <span className="material-symbols-outlined text-sm leading-none">flag</span>
                  </button>
                </div>

                {/* Comment */}
                <p className={cn("text-sm text-slate-400 leading-relaxed", !isExpanded && "line-clamp-3")}>{r.comment}</p>
                {r.comment.length > 180 && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 mt-1"
                  >
                    {isExpanded ? (
                      <><span className="material-symbols-outlined text-xs leading-none">expand_less</span> Voir moins</>
                    ) : (
                      <><span className="material-symbols-outlined text-xs leading-none">expand_more</span> Lire la suite</>
                    )}
                  </button>
                )}

                {/* My reply */}
                {r.reply && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/30">
                    <p className="text-xs font-bold text-primary mb-1">Votre réponse</p>
                    <p className="text-xs text-slate-400">{r.reply}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border-dark">
                  <button
                    onClick={() => handleHelpful(r.id)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {r.helpful} personnes ont trouvé cet avis utile
                  </button>
                  {!r.reply && (
                    <button
                      onClick={() => setReplyingTo(isReplying ? null : r.id)}
                      className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">chat_bubble</span>
                      Répondre
                    </button>
                  )}
                </div>

                {/* Reply form */}
                {isReplying && !r.reply && (
                  <div className="mt-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Rédigez votre réponse publique…"
                      rows={3}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary resize-none mb-2 placeholder:text-slate-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(r.id)}
                        disabled={submitting || !replyText.trim()}
                        className="bg-primary hover:opacity-90 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
                      >
                        {submitting ? "Publication..." : "Publier la réponse"}
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(""); }}
                        className="px-4 py-2 border border-border-dark rounded-xl text-xs font-bold text-slate-400 hover:bg-primary/5"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
