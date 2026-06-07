// Refonte style KAZA — apprenant sessions — 2026-06-07
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { confirmAction } from "@/store/confirm";
import { useToastStore } from "@/store/toast";
import {
  KazaHero,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
  KazaSection,
} from "@/components/kaza";
import {
  Calendar,
  CalendarCheck,
  Plus,
  Search,
  Video,
  MessageSquare,
  XCircle,
  CheckCircle2,
  Hourglass,
  Timer,
  Star,
  ArrowRight,
  X,
  Info,
  UserPlus,
} from "lucide-react";

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

const STATUS_VARIANT: Record<
  BookingStatus,
  { label: string; variant: "orange" | "green" | "blue" | "rose" | "slate" | "violet" }
> = {
  PAYMENT_PENDING: { label: "Paiement en cours", variant: "orange" },
  PENDING: { label: "En attente mentor", variant: "orange" },
  CONFIRMED: { label: "Confirmée", variant: "green" },
  CANCELLATION_REQUESTED_STUDENT: { label: "Annul. en attente admin", variant: "orange" },
  CANCELLATION_REQUESTED_MENTOR: { label: "Mentor a annulé · admin examine", variant: "orange" },
  COMPLETED: { label: "Terminée", variant: "blue" },
  RELEASED: { label: "Terminée (fonds libérés)", variant: "blue" },
  CANCELLED: { label: "Annulée", variant: "rose" },
  NO_SHOW: { label: "Absent", variant: "slate" },
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
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-extrabold text-[#0b2540]">Évaluer la séance</h2>
        <p className="text-xs text-slate-500 mt-1">
          Votre avis aide {session.mentor.name ?? "le mentor"} et les futurs apprenants.
        </p>

        <div className="mt-5">
          <p className="text-xs font-semibold text-[#0b2540] mb-2">Votre note</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className="w-7 h-7"
                  fill={s <= rating ? "#f59e0b" : "transparent"}
                  stroke={s <= rating ? "#f59e0b" : "#d1d5db"}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-[#0b2540] mb-1.5">Commentaire (optionnel)</p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Qu'avez-vous appris ? Qu'avez-vous apprécié ?"
            className="w-full text-sm border-2 border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 resize-none"
          />
        </div>

        {err && <p className="text-xs text-rose-600 mt-3">{err}</p>}

        <KazaButton
          variant="primary"
          onClick={submit}
          disabled={submitting}
          className="w-full mt-5"
        >
          {submitting ? "Envoi…" : "Publier mon avis"}
        </KazaButton>
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
    if (currentStatus === "PENDING") {
      const ok = await confirmAction({
        title: "Annuler cette session ?",
        message:
          "Le mentor n'a pas encore confirmé. Vous serez remboursé intégralement et automatiquement.",
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
      <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={CalendarCheck}
        title="Mes sessions de mentorat"
        subtitle="Suivez vos séances réservées, rejoignez les salles Jitsi et laissez vos avis."
        actions={
          <>
            <KazaButton variant="secondary" href="/mentors" icon={Search}>
              Trouver un mentor
            </KazaButton>
            <KazaButton variant="primary" href="/apprenant/mentors" icon={UserPlus}>
              Mes mentors
            </KazaButton>
          </>
        }
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-rose-500" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* KPIs */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KazaKpiCard label="À venir" value={stats.upcoming} icon={Calendar} iconColor="emerald" />
          <KazaKpiCard
            label="Confirmées"
            value={stats.confirmed}
            icon={CheckCircle2}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="En attente"
            value={stats.pending}
            icon={Hourglass}
            iconColor="orange"
          />
          <KazaKpiCard label="Terminées" value={stats.completed} icon={Star} iconColor="sky" />
        </section>
      )}

      {/* Upcoming */}
      <KazaSection
        label="À venir"
        title="Prochaines sessions"
        action={
          <KazaButton variant="ghost" size="sm" href="/mentors" icon={Plus}>
            Nouvelle session
          </KazaButton>
        }
      >
        {upcoming.length === 0 ? (
          <KazaEmpty
            icon={Calendar}
            title="Aucune session à venir"
            description="Trouvez un mentor qui correspond à vos objectifs."
            action={{ label: "Découvrir les mentors", href: "/mentors" }}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => {
              const cfg = STATUS_VARIANT[s.status];
              const joinable = isJoinableNow(s.scheduledAt, s.durationMinutes);
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 capitalize">
                      {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)}
                    </span>
                    <div className="ml-auto">
                      <KazaBadge variant={cfg.variant} size="sm">
                        {cfg.label}
                      </KazaBadge>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
                      >
                        {s.mentor.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.mentor.image}
                            alt={s.mentor.name ?? ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials(s.mentor.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/mentors/${s.mentor.id}`}
                          className="text-sm font-bold text-[#0b2540] hover:underline"
                        >
                          {s.mentor.name ?? "Mentor"}
                        </Link>
                        <p className="text-xs text-slate-500">{s.mentor.specialty}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {s.durationMinutes} min
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-emerald-600 tabular-nums">
                            {fmt(s.paidAmount)} F
                          </span>
                        </div>
                      </div>
                    </div>

                    {s.studentGoals && (
                      <div className="mt-3 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
                        <p className="text-[10px] font-bold text-sky-800 uppercase mb-0.5">
                          Vos objectifs
                        </p>
                        <p className="text-xs text-sky-900 whitespace-pre-wrap line-clamp-2">
                          {s.studentGoals}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                      <KazaButton
                        variant="ghost"
                        size="sm"
                        href={`/apprenant/sessions/${s.id}`}
                        icon={Info}
                      >
                        Détails
                      </KazaButton>

                      {s.status === "CONFIRMED" && (
                        <KazaButton
                          variant={joinable ? "primary" : "ghost"}
                          size="sm"
                          href={`/sessions/${s.id}/salle`}
                          icon={Video}
                        >
                          {joinable ? "Rejoindre la salle" : "Ouvrir la salle"}
                        </KazaButton>
                      )}

                      {s.status === "CONFIRMED" && minutesUntil(s.scheduledAt) < 30 && (
                        <>
                          {s.studentAttended === true ? (
                            <KazaBadge variant="green" size="md" icon={CheckCircle2}>
                              Présence confirmée
                            </KazaBadge>
                          ) : (
                            <KazaButton
                              variant="primary"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={async () => {
                                const res = await fetch(
                                  `/api/formations/mentor-bookings/${s.id}/attendance`,
                                  {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ attended: true }),
                                  },
                                );
                                if (res.ok) {
                                  useToastStore.getState().addToast("success", "Présence enregistrée");
                                  await load();
                                } else {
                                  const j = await res.json();
                                  useToastStore.getState().addToast("error", j.error ?? "Erreur");
                                }
                              }}
                            >
                              J&apos;ai assisté
                            </KazaButton>
                          )}
                        </>
                      )}

                      <KazaButton
                        variant="ghost"
                        size="sm"
                        icon={MessageSquare}
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
                            useToastStore
                              .getState()
                              .addToast("error", e instanceof Error ? e.message : "Erreur");
                          }
                        }}
                        className="ml-auto"
                      >
                        Message
                      </KazaButton>
                      <KazaButton
                        variant="danger"
                        size="sm"
                        icon={XCircle}
                        onClick={() => cancelSession(s.id, s.status)}
                      >
                        Annuler
                      </KazaButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </KazaSection>

      {/* Past */}
      {past.length > 0 && (
        <KazaSection label="Historique" title="Sessions passées">
          <div className="space-y-2">
            {past.map((s) => {
              const cfg = STATUS_VARIANT[s.status];
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:border-emerald-200 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
                  >
                    {s.mentor.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.mentor.image}
                        alt={s.mentor.name ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials(s.mentor.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0b2540] truncate">
                      {s.mentor.name ?? "Mentor"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)} · {fmt(s.paidAmount)} F
                    </p>
                  </div>
                  <KazaBadge variant={cfg.variant} size="sm">
                    {cfg.label}
                  </KazaBadge>
                  {s.canReview && (
                    <KazaButton
                      variant="ghost"
                      size="sm"
                      icon={Star}
                      onClick={() => setReviewTarget(s)}
                    >
                      Noter
                    </KazaButton>
                  )}
                  {s.studentRating && (
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star
                          key={st}
                          className="w-3 h-3"
                          fill={st <= s.studentRating! ? "#f59e0b" : "transparent"}
                          stroke={st <= s.studentRating! ? "#f59e0b" : "#d1d5db"}
                        />
                      ))}
                    </span>
                  )}
                  <Link
                    href={`/apprenant/sessions/${s.id}`}
                    className="text-slate-500 hover:text-[#0b2540]"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </KazaSection>
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
