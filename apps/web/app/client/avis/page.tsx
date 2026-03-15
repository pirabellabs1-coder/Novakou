"use client";

import { useEffect, useState, useMemo } from "react";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/client/EmptyState";

function StarRating({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={cn("material-symbols-outlined", size, i <= rating ? "text-yellow-400" : "text-slate-600")}
          style={{ fontVariationSettings: i <= rating ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function StarInput({ value, onChange, size = "text-xl" }: { value: number; onChange: (v: number) => void; size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            "material-symbols-outlined transition-colors",
            size,
            i <= value ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400/50"
          )}
          style={{ fontVariationSettings: i <= value ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </button>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-border-dark" />
          <div className="space-y-2">
            <div className="h-3 w-28 bg-border-dark rounded" />
            <div className="h-2 w-40 bg-border-dark rounded" />
          </div>
        </div>
        <div className="h-4 w-24 bg-border-dark rounded" />
      </div>
      <div className="h-3 w-full bg-border-dark rounded mb-2" />
      <div className="h-3 w-3/4 bg-border-dark rounded" />
    </div>
  );
}

export default function ClientReviews() {
  const [tab, setTab] = useState<"donnes" | "en_attente">("donnes");
  const [newRating, setNewRating] = useState<Record<string, { qualite: number; communication: number; delai: number; comment: string }>>({});
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const {
    reviews,
    reviewSummary,
    orders,
    loading,
    syncReviews,
    syncOrders,
    submitReview,
  } = useClientStore();

  useEffect(() => {
    syncReviews();
    syncOrders();
  }, [syncReviews, syncOrders]);

  const isLoading = loading.reviews || loading.orders;

  // Completed orders that do not have a review yet
  const pendingReviewOrders = useMemo(() => {
    return orders.filter(
      o => o.status === "termine" && !reviews.find(r => r.orderId === o.id)
    );
  }, [orders, reviews]);

  // Reviews that are less than 7 days old can be edited
  const isEditable = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  function getRatingForm(orderId: string) {
    return newRating[orderId] || { qualite: 0, communication: 0, delai: 0, comment: "" };
  }

  function updateRatingForm(orderId: string, field: string, value: number | string) {
    setNewRating(prev => ({
      ...prev,
      [orderId]: { ...getRatingForm(orderId), [field]: value },
    }));
  }

  async function handleSubmitReview(orderId: string) {
    const form = getRatingForm(orderId);
    if (form.qualite === 0 || form.communication === 0 || form.delai === 0) {
      addToast("error", "Veuillez attribuer une note pour chaque critere");
      return;
    }
    setSubmittingOrderId(orderId);
    const ok = await submitReview({
      orderId,
      qualite: form.qualite,
      communication: form.communication,
      delai: form.delai,
      comment: form.comment || undefined,
    });
    setSubmittingOrderId(null);
    if (ok) {
      addToast("success", "Avis publie avec succes !");
      setNewRating(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } else {
      addToast("error", "Erreur lors de la publication de l'avis");
    }
  }

  const avgRating = reviewSummary?.avgRating ?? 0;
  const totalReviews = reviewSummary?.totalReviews ?? reviews.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Mes Avis</h1>
        <p className="text-slate-400 text-sm mt-1">Consultez vos evaluations et laissez des avis sur vos collaborations.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-border-dark" />
                <div className="space-y-2">
                  <div className="h-5 w-10 bg-border-dark rounded" />
                  <div className="h-2 w-20 bg-border-dark rounded" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-yellow-400">star</span>
              <div>
                <p className="text-xl font-black text-white">{avgRating > 0 ? avgRating.toFixed(1) : "-"}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Note moyenne</p>
              </div>
            </div>
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-primary">rate_review</span>
              <div>
                <p className="text-xl font-black text-white">{totalReviews}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Avis donnes</p>
              </div>
            </div>
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-amber-400">schedule</span>
              <div>
                <p className="text-xl font-black text-amber-400">{pendingReviewOrders.length}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">En attente</p>
              </div>
            </div>
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-primary">thumb_up</span>
              <div>
                <p className="text-xl font-black text-white">
                  {totalReviews > 0 ? `${Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100)}%` : "-"}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Satisfaction</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("donnes")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            tab === "donnes"
              ? "bg-primary text-background-dark"
              : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
          )}
        >
          Avis donnes ({totalReviews})
        </button>
        <button
          onClick={() => setTab("en_attente")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
            tab === "en_attente"
              ? "bg-primary text-background-dark"
              : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
          )}
        >
          En attente ({pendingReviewOrders.length})
          {pendingReviewOrders.length > 0 && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
        </button>
      </div>

      {/* Given Reviews */}
      {tab === "donnes" && (
        <div className="space-y-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon="rate_review"
              title="Aucun avis donne"
              description="Vos avis apparaitront ici apres vos premieres commandes terminees."
              actionLabel="Voir mes commandes"
              actionHref="/client/commandes"
            />
          ) : (
            reviews.map(r => (
              <div key={r.id} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold overflow-hidden">
                      {r.clientAvatar ? (
                        <img src={r.clientAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        r.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{r.clientName}</p>
                      <p className="text-xs text-slate-500">{r.serviceTitle} &middot; {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating rating={r.rating} />
                    <span className="text-sm font-bold text-white">{r.rating.toFixed(1)}</span>
                  </div>
                </div>

                {r.comment && <p className="text-sm text-slate-300 mb-3">{r.comment}</p>}

                {/* Detail ratings */}
                <div className="flex gap-6 text-xs mb-3 flex-wrap">
                  <span className="text-slate-500 flex items-center gap-1">Qualite : <StarRating rating={r.qualite} size="text-[10px]" /></span>
                  <span className="text-slate-500 flex items-center gap-1">Communication : <StarRating rating={r.communication} size="text-[10px]" /></span>
                  <span className="text-slate-500 flex items-center gap-1">Delai : <StarRating rating={r.delai} size="text-[10px]" /></span>
                </div>

                {r.reply && (
                  <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                    <p className="text-xs text-primary font-semibold mb-1">Reponse du freelance</p>
                    <p className="text-xs text-slate-400">{r.reply}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-dark">
                  {isEditable(r.createdAt) && (
                    <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">edit</span>
                      Modifier
                    </button>
                  )}
                  {isEditable(r.createdAt) && (
                    <span className="text-slate-600">&middot;</span>
                  )}
                  <button
                    onClick={() => addToast("info", "Signalement envoye")}
                    className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">flag</span>
                    Signaler
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Reviews */}
      {tab === "en_attente" && (
        <div className="space-y-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : pendingReviewOrders.length === 0 ? (
            <EmptyState
              icon="rate_review"
              title="Aucun avis en attente"
              description="Vous avez evalue toutes vos commandes terminees."
            />
          ) : (
            pendingReviewOrders.map(order => {
              const form = getRatingForm(order.id);
              const isSubmitting = submittingOrderId === order.id;
              return (
                <div key={order.id} className="bg-neutral-dark rounded-xl border border-border-dark p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <span className="material-symbols-outlined">rate_review</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{order.serviceTitle}</p>
                        <p className="text-xs text-slate-500">
                          Freelance : {order.clientName} &middot; Terminée le {new Date(order.completedAt || order.updatedAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      En attente
                    </span>
                  </div>

                  {/* Rating form */}
                  <div className="space-y-4 bg-background-dark rounded-xl p-5 border border-border-dark">
                    <p className="text-sm font-bold text-white">Evaluer cette commande</p>
                    {[
                      { key: "qualite", label: "Qualite du travail" },
                      { key: "communication", label: "Communication" },
                      { key: "delai", label: "Respect des delais" },
                    ].map(c => (
                      <div key={c.key} className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">{c.label}</span>
                        <StarInput
                          value={form[c.key as keyof typeof form] as number}
                          onChange={(v) => updateRatingForm(order.id, c.key, v)}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Commentaire (optionnel)</label>
                      <textarea
                        value={form.comment}
                        onChange={e => updateRatingForm(order.id, "comment", e.target.value)}
                        rows={3}
                        placeholder="Partagez votre experience avec ce freelance..."
                        className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => handleSubmitReview(order.id)}
                      disabled={isSubmitting}
                      className={cn(
                        "px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all",
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? "Publication..." : "Publier l'avis"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
