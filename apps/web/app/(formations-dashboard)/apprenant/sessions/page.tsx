"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { confirmAction } from "@/store/confirm";
import { useToastStore } from "@/store/toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type BookingStatus =
  | "PAYMENT_PENDING"
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLATION_REQUESTED_STUDENT"
  | "CANCELLATION_REQUESTED_MENTOR"
  | "COMPLETED"
  | "RELEASED"
  | "CANCELLED"
  | "NO_SHOW";

interface Session {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  paidAmount: number;
  studentGoals: string | null;
  meetingLink: string | null;
  meetingUrl: string;
  studentRating: number | null;
  studentAttended?: boolean | null;
  mentorAttended?: boolean | null;
  mentor: {
    id: string;
    userId: string;
    name: string | null;
    image: string | null;
    specialty: string;
    domain: string | null;
    sessionDuration: number;
  };
  canReview: boolean;
}

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
  pending: number;
  confirmed: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null) {
  if (!name) return "M";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function isJoinableNow(scheduledAt: string, durationMinutes: number): boolean {
  const m = minutesUntil(scheduledAt);
  return m <= 15 && m >= -(durationMinutes + 60);
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; icon: string; cls: string }> = {
  PAYMENT_PENDING:                 { label: "Paiement en cours",  icon: "hourglass_top",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  PENDING:                         { label: "En attente mentor",  icon: "hourglass_top",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED:                       { label: "Confirmée",          icon: "check_circle",   cls: "bg-green-50 text-green-700 border-green-200" },
  CANCELLATION_REQUESTED_STUDENT:  { label: "Annul. en attente admin", icon: "gavel",     cls: "bg-orange-50 text-orange-700 border-orange-200" },
  CANCELLATION_REQUESTED_MENTOR:   { label: "Mentor a annulé · admin examine", icon: "gavel", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  COMPLETED:                       { label: "Terminée",           icon: "task_alt",       cls: "bg-blue-50 text-blue-700 border-blue-200" },
  RELEASED:                        { label: "Terminée (fonds libérés)", icon: "task_alt", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CANCELLED:                       { label: "Annulée",            icon: "cancel",         cls: "bg-red-50 text-red-600 border-red-200" },
  NO_SHOW:                         { label: "Absent",             icon: "person_off",     cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

// ─── Review modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  session,
  onClose,
  onSubmitted,
}: {
  session: Session;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/formations/apprenant/sessions/${session.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: review.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      onSubmitted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
        <h2 className="text-lg font-extrabold text-[#191c1e]">Évaluer la séance</h2>
        <p className="text-xs text-[#5c647a] mt-1">Votre avis aide {session.mentor.name ?? "le mentor"} et les futurs apprenants.</p>

        <div className="mt-5">
          <p className="text-xs font-semibold text-[#191c1e] mb-2">Votre note</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <span
                  className="material-symbols-outlined text-[28px]"
                  style={{
                    color: s <= rating ? "#f59e0b" : "#d1d5db",
                    fontVariationSettings: "'FILL' 1",
                  }}
                >star</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-[#191c1e] mb-1.5">Commentaire (optionnel)</p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Qu'avez-vous appris ? Qu'avez-vous apprécié ?"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none"
          />
        </div>

        {err && <p className="text-xs text-red-600 mt-3">{err}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full mt-5 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          {submitting ? "Envoi…" : "Publier mon avis"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApprenantSessionsPage() {
  const [upcoming, setUpcoming] = useState<Session[]>([]);
  const [past, setPast] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Session | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/apprenant/sessions");
      if (!res.ok) throw new Error("Erreur de chargement");
      const { data } = await res.json();
      setUpcoming(data.upcoming ?? []);
      setPast(data.past ?? []);
      setStats(data.stats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelSession(id: string, currentStatus: BookingStatus) {
    // PENDING (mentor pas encore confirmé) = remboursement automatique, pas de motif requis
    if (currentStatus === "PENDING") {
      const ok = await confirmAction({
        title: "Annuler cette session ?",
        message: "Le mentor n'a pas encore confirmé. Vous serez remboursé intégralement et automatiquement.",
        confirmLabel: "Annuler + remboursement",
        cancelLabel: "Revenir",
        confirmVariant: "danger",
        icon: "event_busy",
      });
      if (!ok) return;
      try {
        const res = await fetch(`/api/formations/apprenant/sessions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
        useToastStore.getState().addToast("success", "Session annulée — remboursement en cours");
        await load();
      } catch (e) {
        useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur");
      }
      return;
    }

    // CONFIRMED = motif obligatoire + validation admin
    const reason = window.prompt(
      "La session est déjà confirmée par le mentor. Vous devez indiquer un motif (30 caractères minimum). L'admin examinera votre demande et décidera du remboursement.",
      "",
    );
    if (!reason || reason.trim().length < 30) {
      useToastStore.getState().addToast("error", "Motif obligatoire (30 caractères minimum)");
      return;
    }

    const ok = await confirmAction({
      title: "Soumettre la demande d'annulation ?",
      message: `Motif : ${reason.trim().slice(0, 100)}${reason.trim().length > 100 ? "…" : ""}\n\nLes fonds seront bloqués en escrow jusqu'à la décision admin.`,
      confirmLabel: "Soumettre la demande",
      cancelLabel: "Revenir",
      confirmVariant: "warning",
      icon: "gavel",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/formations/apprenant/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: reason.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      useToastStore.getState().addToast("success", "Demande d'annulation envoyée — en attente admin");
      await load();
    } catch (e) {
      useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur");
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#191c1e]">Mes sessions de mentorat</h1>
        <p className="text-sm text-[#5c647a] mt-1">
          Suivez vos séances réservées, rejoignez les salles Jitsi et laissez vos avis.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] text-[#5c647a] font-medium">À venir</p>
            <p className="text-2xl font-extrabold text-[#006e2f] mt-1">{stats.upcoming}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] text-[#5c647a] font-medium">Confirmées</p>
            <p className="text-2xl font-extrabold text-green-600 mt-1">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] text-[#5c647a] font-medium">En attente</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] text-[#5c647a] font-medium">Terminées</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{stats.completed}</p>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#191c1e]">Prochaines sessions</h2>
          <Link
            href="/mentors"
            className="text-xs text-[#006e2f] font-semibold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Nouvelle session
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl">event_available</span>
            <p className="text-sm text-[#5c647a] font-medium mt-3">Aucune session à venir</p>
            <p className="text-xs text-gray-400 mt-1">Trouvez un mentor qui correspond à vos objectifs.</p>
            <Link
              href="/mentors"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[14px]">search</span>
              Découvrir les mentors
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => {
              const cfg = STATUS_CONFIG[s.status];
              const joinable = isJoinableNow(s.scheduledAt, s.durationMinutes);
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-semibold text-[#5c647a] capitalize">
                      {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)}
                    </span>
                    <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
                      <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                        {s.mentor.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.mentor.image} alt={s.mentor.name ?? ""} className="w-full h-full object-cover" />
                        ) : initials(s.mentor.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/mentors/${s.mentor.id}`}
                          className="text-sm font-bold text-[#191c1e] hover:underline"
                        >
                          {s.mentor.name ?? "Mentor"}
                        </Link>
                        <p className="text-xs text-[#5c647a]">{s.mentor.specialty}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-[#5c647a]">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">timer</span>
                            {s.durationMinutes} min
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-[#006e2f]">{fmt(s.paidAmount)} F</span>
                        </div>
                      </div>
                    </div>

                    {s.studentGoals && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                        <p className="text-[10px] font-bold text-blue-800 uppercase mb-0.5">Vos objectifs</p>
                        <p className="text-xs text-blue-900 whitespace-pre-wrap line-clamp-2">{s.studentGoals}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Link
                        href={`/apprenant/sessions/${s.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200"
                      >
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        Détails
                      </Link>

                      {s.status === "CONFIRMED" && (
                        <Link
                          href={`/sessions/${s.id}/salle`}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            joinable
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">videocam</span>
                          {joinable ? "Rejoindre la salle" : "Ouvrir la salle"}
                        </Link>
                      )}

                      {/* Présence — disponible si session démarrée (>= scheduled - 30 min) */}
                      {s.status === "CONFIRMED" && minutesUntil(s.scheduledAt) < 30 && (
                        <>
                          {s.studentAttended === true ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006e2f]/10 text-[#006e2f]">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Présence confirmée
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                const res = await fetch(`/api/formations/mentor-bookings/${s.id}/attendance`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ attended: true }),
                                });
                                if (res.ok) {
                                  useToastStore.getState().addToast("success", "Présence enregistrée");
                                  await load();
                                } else {
                                  const j = await res.json();
                                  useToastStore.getState().addToast("error", j.error ?? "Erreur");
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006e2f] text-white hover:bg-[#005a26]"
                            >
                              <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                              J&apos;ai assisté
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/formations/messages/conversations", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ otherUserId: s.mentor.userId }),
                            });
                            const json = await res.json();
                            if (json.data?.id) {
                              window.location.href = `/messages/${json.data.id}`;
                            } else {
                              useToastStore.getState().addToast("error", json.error ?? "Erreur");
                            }
                          } catch (e) {
                            useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur");
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 ml-auto"
                      >
                        <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                        Message
                      </button>
                      <button
                        onClick={() => cancelSession(s.id, s.status)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#191c1e] mb-3">Sessions passées</h2>
          <div className="space-y-2">
            {past.map((s) => {
              const cfg = STATUS_CONFIG[s.status];
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-[#006e2f]/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold overflow-hidden">
                    {s.mentor.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.mentor.image} alt={s.mentor.name ?? ""} className="w-full h-full object-cover" />
                    ) : initials(s.mentor.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#191c1e] truncate">{s.mentor.name ?? "Mentor"}</p>
                    <p className="text-[11px] text-[#5c647a]">
                      {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)} · {fmt(s.paidAmount)} F
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
                    <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
                    {cfg.label}
                  </span>
                  {s.canReview && (
                    <button
                      onClick={() => setReviewTarget(s)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100"
                    >
                      <span className="material-symbols-outlined text-[12px]">rate_review</span>
                      Noter
                    </button>
                  )}
                  {s.studentRating && (
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {[1,2,3,4,5].map(st => (
                        <span
                          key={st}
                          className="material-symbols-outlined text-[12px]"
                          style={{
                            color: st <= s.studentRating! ? "#f59e0b" : "#d1d5db",
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >star</span>
                      ))}
                    </span>
                  )}
                  <Link
                    href={`/apprenant/sessions/${s.id}`}
                    className="text-[#5c647a] hover:text-[#191c1e]"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          session={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={async () => {
            setReviewTarget(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
