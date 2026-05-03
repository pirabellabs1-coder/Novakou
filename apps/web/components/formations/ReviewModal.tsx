"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  kind: "formation" | "product" | "bundle" | "subscription";
  itemId: string;
  itemTitle: string;
  initialRating?: number;
  initialComment?: string;
};

export function ReviewModal({
  open, onClose, onSuccess, kind, itemId, itemTitle,
  initialRating, initialComment,
}: Props) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating < 1) { setError("Choisissez une note"); return; }
    if (comment.trim().length < 5) { setError("Le commentaire doit faire au moins 5 caractères"); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/formations/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, itemId, rating, comment }),
      });
      const json = await res.json();
      if (res.ok && !json.error) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(json.error ?? "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <p className="text-lg font-bold text-zinc-900 mb-1">Merci pour votre avis !</p>
            <p className="text-sm text-zinc-500">Votre évaluation aide la communauté.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1">
                  {initialRating ? "Modifier mon avis" : "Laisser un avis"}
                </p>
                <h2 className="text-lg font-bold text-zinc-900 line-clamp-1">{itemTitle}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100">
                <span className="material-symbols-outlined text-[20px] text-zinc-500">close</span>
              </button>
            </div>

            {/* Star selector */}
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Votre note</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    type="button"
                    className="transition-transform hover:scale-110"
                  >
                    <span
                      className={`material-symbols-outlined text-[38px] ${
                        n <= (hover || rating) ? "text-amber-400" : "text-zinc-200"
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  {rating}/5 · {["", "Décevant", "Moyen", "Bien", "Très bien", "Excellent"][rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">
                Votre commentaire
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Qu'avez-vous pensé ? Qu'est-ce qui vous a plu ou moins plu ?"
                rows={5}
                maxLength={1000}
                className="w-full bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-3 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none resize-none"
              />
              <p className="text-[10px] text-zinc-400 mt-1 text-right font-mono">{comment.length}/1000</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#ffdad6] border-l-4 border-[#ba1a1a]">
                <p className="text-xs text-[#93000a]">{error}</p>
              </div>
            )}

            <div className="flex gap-0">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-100 text-zinc-700 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || rating < 1 || comment.trim().length < 5}
                className="flex-1 py-3 bg-[#22c55e] text-[#004b1e] text-xs font-bold uppercase tracking-widest hover:bg-[#4ae176] disabled:opacity-50 transition-colors"
              >
                {submitting ? "Envoi…" : "Publier l'avis"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
