"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/formations/EmptyState";

// ── Types ─────────────────────────────────────────────────────────

type ReviewStatus = "published" | "pending" | "rejected";

interface Review {
  id: string;
  formationId: string;
  formationSlug: string;
  formationTitle: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  canEdit: boolean;
  instructorResponse: string | null;
  instructorName: string | null;
}

// ── Component ─────────────────────────────────────────────────────

export default function MesAvisPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/formations/connexion");
      return;
    }
  }, [status, router]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apprenant/reviews");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch {
      setError(
        fr
          ? "Impossible de charger vos avis"
          : "Failed to load your reviews"
      );
    } finally {
      setLoading(false);
    }
  }, [fr]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReviews();
    }
  }, [status, fetchReviews]);

  // ── Edit handlers ───────────────────────────────────────────────

  function startEditing(review: Review) {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditRating(5);
    setEditComment("");
  }

  async function saveEdit(reviewId: string) {
    if (!editComment.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/apprenant/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
      if (!res.ok) throw new Error("Save failed");
      // Update locally
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, rating: editRating, comment: editComment }
            : r
        )
      );
      cancelEditing();
    } catch {
      // Keep editing mode open on error
    } finally {
      setSaving(false);
    }
  }

  // ── Delete handler ──────────────────────────────────────────────

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/apprenant/reviews/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setReviews((prev) => prev.filter((r) => r.id !== deletingId));
      setDeletingId(null);
    } catch {
      // Keep dialog open on error
    } finally {
      setDeleting(false);
    }
  }

  // ── Status badge ────────────────────────────────────────────────

  const statusLabel = (s: ReviewStatus) =>
    ({
      published: fr ? "Publie" : "Published",
      pending: fr ? "En attente" : "Pending",
      rejected: fr ? "Refuse" : "Rejected",
    }[s]);

  const statusColor = (s: ReviewStatus) =>
    ({
      published:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      rejected:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    }[s]);

  // ── Star rendering ──────────────────────────────────────────────

  function renderStars(rating: number, interactive = false) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setEditRating(star)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <span
              className={`material-symbols-outlined text-lg ${
                star <= rating
                  ? "text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
              style={star <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              star
            </span>
          </button>
        ))}
      </div>
    );
  }

  // ── Loading skeleton ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-red-500">
              error
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {fr ? "Erreur de chargement" : "Loading error"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchReviews}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {fr ? "Reessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Delete confirmation dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeletingId(null)}
          />
          <div className="relative z-50 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-red-500">
                  delete
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {t("reviews_delete")}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              {t("reviews_confirm_delete")}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    {fr ? "Suppression..." : "Deleting..."}
                  </span>
                ) : (
                  t("reviews_delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("my_reviews")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {fr
            ? "Retrouvez et gerez tous vos avis"
            : "View and manage all your reviews"}
        </p>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={
            <span className="material-symbols-outlined text-4xl text-slate-400">
              rate_review
            </span>
          }
          title={t("reviews_no_reviews")}
          description={t("reviews_no_reviews_desc")}
          ctaLabel={fr ? "Explorer les formations" : "Explore courses"}
          ctaHref="/formations/explorer"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isEditing = editingId === review.id;

            return (
              <div
                key={review.id}
                className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5"
              >
                {isEditing ? (
                  /* ── Edit mode ────────────────────────────────── */
                  <div className="space-y-4">
                    {/* Formation title (read-only in edit mode) */}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {review.formationTitle}
                    </p>

                    {/* Rating selector */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        {fr ? "Note" : "Rating"}
                      </label>
                      {renderStars(editRating, true)}
                    </div>

                    {/* Comment textarea */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        {fr ? "Commentaire" : "Comment"}
                      </label>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={4}
                        className="w-full border border-slate-200 dark:border-slate-700 dark:border-slate-600 bg-white dark:bg-slate-900 dark:bg-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                        placeholder={
                          fr ? "Votre commentaire..." : "Your comment..."
                        }
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        onClick={() => saveEdit(review.id)}
                        disabled={saving || !editComment.trim()}
                        className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm animate-spin">
                              progress_activity
                            </span>
                            {t("saving")}
                          </span>
                        ) : (
                          t("save")
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display mode ─────────────────────────────── */
                  <div>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                        <span
                          className="material-symbols-outlined text-xl text-amber-500"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Formation name */}
                        <Link
                          href={`/formations/${review.formationSlug}`}
                          className="text-xs text-primary hover:underline mb-1 block truncate"
                        >
                          {review.formationTitle}
                        </Link>

                        {/* Rating + status */}
                        <div className="flex items-center gap-3 mb-2">
                          {renderStars(review.rating)}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(
                              review.status
                            )}`}
                          >
                            {statusLabel(review.status)}
                          </span>
                        </div>

                        {/* Comment */}
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-line">
                          {review.comment}
                        </p>

                        {/* Date */}
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            schedule
                          </span>
                          {new Date(review.createdAt).toLocaleDateString(
                            fr ? "fr-FR" : "en-US",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>

                        {/* Instructor response */}
                        {review.instructorResponse && (
                          <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 border-l-4 border-primary rounded-r-xl p-3">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                reply
                              </span>
                              {review.instructorName ??
                                (fr ? "Instructeur" : "Instructor")}
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                              {review.instructorResponse}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {review.canEdit && (
                          <button
                            onClick={() => startEditing(review)}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                            title={t("reviews_edit")}
                          >
                            <span className="material-symbols-outlined text-lg">
                              edit
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingId(review.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                          title={t("reviews_delete")}
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </div>
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
