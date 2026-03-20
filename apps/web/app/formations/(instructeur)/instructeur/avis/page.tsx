"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Star, MessageSquare } from "lucide-react";
import { useInstructorReviews } from "@/lib/formations/hooks";

interface Avis {
  id: string;
  rating: number;
  comment: string;
  response: string | null;
  createdAt: string;
  user: { name: string; avatar: string | null; image: string | null };
  formation: { id: string; title: string; slug: string };
}

export default function InstructeurAvisPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const [filterRating, setFilterRating] = useState(0);
  const [replyModal, setReplyModal] = useState<Avis | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading: loading, error: queryError, refetch } = useInstructorReviews();
  const avis: Avis[] = (data as { avis?: Avis[] } | null)?.avis ?? [];
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Erreur lors du chargement des avis") : null;

  const submitReply = async () => {
    if (!replyModal || !replyText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/${replyModal.formation.id}/reviews/${replyModal.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: replyText }),
      });
      if (!res.ok) throw new Error("Reply failed");
      setReplyModal(null);
      setReplyText("");
      refetch();
    } catch {
      alert(fr ? "Erreur lors de l'envoi de la réponse" : "Error sending reply");
    } finally {
      setSaving(false);
    }
  };

  const filtered = avis.filter((a) => filterRating === 0 || a.rating === filterRating);

  const avgRating = avis.length > 0
    ? avis.reduce((acc, a) => acc + a.rating, 0) / avis.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: avis.filter((a) => a.rating === r).length,
    pct: avis.length > 0 ? (avis.filter((a) => a.rating === r).length / avis.length) * 100 : 0,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Avis reçus</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global rating */}
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-slate-900 dark:text-white">{avgRating.toFixed(1)}</div>
              <div className="flex justify-center mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{avis.length} avis</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingCounts.map(({ rating, count, pct }) => (
                <div key={rating} className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterRating(filterRating === rating ? 0 : rating)}
                    className={`text-xs w-3 text-right ${filterRating === rating ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    {rating}
                  </button>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 dark:bg-border-dark rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Filter by rating */}
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Filtrer par note</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterRating(0)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filterRating === 0 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 dark:bg-border-dark text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white"}`}
            >
              Tous ({avis.length})
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(filterRating === r ? 0 : r)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${filterRating === r ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 dark:bg-border-dark text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white"}`}
              >
                {r} <Star className="w-3 h-3 fill-current" /> ({ratingCounts.find(rc => rc.rating === r)?.count ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Chargement...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-primary font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            {avis.length === 0 ? "Aucun avis reçu pour l'instant" : "Aucun avis avec ce filtre"}
          </div>
        ) : (
          filtered.map((a) => {
            const avatar = a.user.avatar || a.user.image;
            return (
              <div key={a.id} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt={a.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-sm">{(a.user?.name || "?").charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{a.user.name}</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= a.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{a.formation.title} · {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{a.comment}</p>

                    {/* Existing response */}
                    {a.response && (
                      <div className="mt-3 pl-4 border-l-2 border-primary/30">
                        <p className="text-xs text-slate-500 mb-1">Votre réponse :</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{a.response}</p>
                      </div>
                    )}

                    {/* Reply button */}
                    {!a.response && (
                      <button
                        onClick={() => { setReplyModal(a); setReplyText(""); }}
                        className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Répondre
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setReplyModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Répondre à {replyModal.user.name}</h2>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{replyModal.comment}</p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="Votre réponse publique..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-border-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark/60 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4 placeholder-slate-400"
            />
            <div className="flex gap-3">
              <button onClick={() => setReplyModal(null)} className="flex-1 border border-slate-200 dark:border-slate-700 dark:border-border-dark text-slate-700 dark:text-slate-300 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-border-dark/50 transition-colors text-sm">Annuler</button>
              <button
                onClick={submitReply}
                disabled={!replyText.trim() || saving}
                className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
              >
                {saving ? "Envoi..." : "Publier la réponse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
