// Refonte design "Stitch" — apprenant sessions — vert Novakou — 2026-06-13
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { confirmAction } from "@/store/confirm";
import { useToastStore } from "@/store/toast";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StKpiCompact,
  StStatusPill,
  StSectionTitle,
  StAvatar,
  ST,
} from "@/components/stitch";
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

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function isJoinableNow(scheduledAt: string, durationMinutes: number): boolean {
  const m = minutesUntil(scheduledAt);
  return m <= 15 && m >= -(durationMinutes + 60);
}

const STATUS_VARIANT: Record<
  BookingStatus,
  { label: string; tone: "amber" | "green" | "blue" | "rose" | "neutral" }
> = {
  PAYMENT_PENDING: { label: "Paiement en cours", tone: "amber" },
  PENDING: { label: "En attente mentor", tone: "amber" },
  CONFIRMED: { label: "Confirmée", tone: "green" },
  CANCELLATION_REQUESTED_STUDENT: { label: "Annul. en attente admin", tone: "amber" },
  CANCELLATION_REQUESTED_MENTOR: { label: "Mentor a annulé · admin examine", tone: "amber" },
  COMPLETED: { label: "Terminée", tone: "blue" },
  RELEASED: { label: "Terminée (fonds libérés)", tone: "blue" },
  CANCELLED: { label: "Annulée", tone: "rose" },
  NO_SHOW: { label: "Absent", tone: "neutral" },
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
      <div className="bg-white rounded-[20px] max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[#f1f5f3] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-[17px] font-extrabold" style={{ color: ST.text }}>Évaluer la séance</h2>
        <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
          Votre avis aide {session.mentor.name ?? "le mentor"} et les futurs apprenants.
        </p>

        <div className="mt-5">
          <p className="text-[12px] font-extrabold mb-2" style={{ color: ST.text }}>Votre note</p>
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
          <p className="text-[12px] font-extrabold mb-1.5" style={{ color: ST.text }}>Commentaire (optionnel)</p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Qu'avez-vous appris ? Qu'avez-vous apprécié ?"
            className="w-full text-[13.5px] rounded-[12px] px-3 py-2 focus:outline-none resize-none"
            style={{ border: "1px solid #dde6e0", color: "#33453b" }}
          />
        </div>

        {err && <p className="text-[12px] font-bold mt-3" style={{ color: ST.roseText }}>{err}</p>}

        <StButton onClick={submit} disabled={submitting} className="w-full mt-5">
          {submitting ? "Envoi…" : "Publier mon avis"}
        </StButton>
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
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-4 animate-pulse">
          <div className="h-20 rounded-[18px]" style={{ background: "#f3f6f4" }} />
          <div className="grid grid-cols-4 gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-[18px]" style={{ background: "#f3f6f4" }} />
            ))}
          </div>
          <div className="h-64 rounded-[18px]" style={{ background: "#f3f6f4" }} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes sessions de mentorat"
          subtitle="Suivez vos séances réservées, rejoignez les salles Jitsi et laissez vos avis."
          actions={
            <>
              <StButton variant="secondary" href="/mentors" icon={Search}>
                Trouver un mentor
              </StButton>
              <StButton href="/apprenant/mentors" icon={UserPlus}>
                Mes mentors
              </StButton>
            </>
          }
        />

        {error && (
          <div className="rounded-[12px] px-4 py-3 flex items-center gap-2 mb-4" style={{ background: ST.roseSoft, border: "1px solid #f3cdd8" }}>
            <XCircle className="w-5 h-5" style={{ color: ST.roseText }} />
            <p className="text-[13px] font-semibold" style={{ color: ST.roseText }}>{error}</p>
          </div>
        )}

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
            <StKpiCompact label="À venir" value={stats.upcoming} icon={Calendar} tone="green" />
            <StKpiCompact label="Confirmées" value={stats.confirmed} icon={CheckCircle2} tone="green" />
            <StKpiCompact label="En attente" value={stats.pending} icon={Hourglass} tone="amber" />
            <StKpiCompact label="Terminées" value={stats.completed} icon={Star} tone="blue" />
          </div>
        )}

        {/* Upcoming */}
        <section className="mb-5">
          <StSectionTitle
            action={
              <StButton variant="ghost-green" size="sm" href="/mentors" icon={Plus}>
                Nouvelle session
              </StButton>
            }
          >
            Prochaines sessions
          </StSectionTitle>

          {upcoming.length === 0 ? (
            <StCard className="!p-10 text-center">
              <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
                <Calendar size={32} style={{ color: ST.green }} strokeWidth={1.8} />
              </div>
              <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucune session à venir</h3>
              <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                Trouvez un mentor qui correspond à vos objectifs.
              </p>
              <StButton href="/mentors" icon={Search}>Découvrir les mentors</StButton>
            </StCard>
          ) : (
            <div className="space-y-3">
              {upcoming.map((s) => {
                const cfg = STATUS_VARIANT[s.status];
                const joinable = isJoinableNow(s.scheduledAt, s.durationMinutes);
                return (
                  <StCard key={s.id} noPadding className="overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#f7faf8", borderBottom: `1px solid ${ST.divider}` }}>
                      <span className="text-[12px] font-bold capitalize" style={{ color: ST.textSecondary }}>
                        {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)}
                      </span>
                      <div className="ml-auto">
                        <StChip tone={cfg.tone}>{cfg.label}</StChip>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <StAvatar name={s.mentor.name ?? "Mentor"} src={s.mentor.image} size={40} />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/mentors/${s.mentor.id}`}
                            className="text-[13.5px] font-extrabold hover:underline"
                            style={{ color: ST.text }}
                          >
                            {s.mentor.name ?? "Mentor"}
                          </Link>
                          <p className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>{s.mentor.specialty}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-[11px] font-semibold" style={{ color: ST.textMuted }}>
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {s.durationMinutes} min
                            </span>
                            <span>·</span>
                            <span className="font-extrabold tabular-nums" style={{ color: ST.green }}>
                              {fmt(s.paidAmount)} F
                            </span>
                          </div>
                        </div>
                      </div>

                      {s.studentGoals && (
                        <div className="mt-3 rounded-[12px] px-3 py-2" style={{ background: ST.blueSoft, border: "1px solid #cfe3f5" }}>
                          <p className="text-[10px] font-extrabold uppercase mb-0.5" style={{ color: ST.blueText }}>
                            Vos objectifs
                          </p>
                          <p className="text-[12px] whitespace-pre-wrap line-clamp-2" style={{ color: "#0c447c" }}>
                            {s.studentGoals}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <StButton variant="secondary" size="sm" href={`/apprenant/sessions/${s.id}`} icon={Info}>
                          Détails
                        </StButton>

                        {s.status === "CONFIRMED" && (
                          <StButton
                            variant={joinable ? "primary" : "secondary"}
                            size="sm"
                            href={`/sessions/${s.id}/salle`}
                            icon={Video}
                          >
                            {joinable ? "Rejoindre la salle" : "Ouvrir la salle"}
                          </StButton>
                        )}

                        {s.status === "CONFIRMED" && minutesUntil(s.scheduledAt) < 30 && (
                          <>
                            {s.studentAttended === true ? (
                              <StChip tone="green" icon={CheckCircle2}>Présence confirmée</StChip>
                            ) : (
                              <StButton
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
                              </StButton>
                            )}
                          </>
                        )}

                        <StButton
                          variant="secondary"
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
                        </StButton>
                        <button
                          type="button"
                          onClick={() => cancelSession(s.id, s.status)}
                          className="inline-flex items-center justify-center gap-2 font-extrabold transition-all whitespace-nowrap px-3 py-2 text-[12px] rounded-[10px] hover:opacity-90"
                          style={{ background: ST.roseSoft, color: ST.roseText }}
                        >
                          <XCircle size={14} />
                          Annuler
                        </button>
                      </div>
                    </div>
                  </StCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section className="mb-5">
            <StSectionTitle>Sessions passées</StSectionTitle>
            <div className="space-y-2">
              {past.map((s) => {
                const cfg = STATUS_VARIANT[s.status];
                return (
                  <StCard key={s.id} className="!p-4 flex items-center gap-3">
                    <StAvatar name={s.mentor.name ?? "Mentor"} src={s.mentor.image} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-extrabold truncate" style={{ color: ST.text }}>
                        {s.mentor.name ?? "Mentor"}
                      </p>
                      <p className="text-[11px] font-semibold" style={{ color: ST.textMuted }}>
                        {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)} · {fmt(s.paidAmount)} F
                      </p>
                    </div>
                    <StChip tone={cfg.tone}>{cfg.label}</StChip>
                    {s.canReview && (
                      <StButton variant="secondary" size="sm" icon={Star} onClick={() => setReviewTarget(s)}>
                        Noter
                      </StButton>
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
                      className="hover:opacity-70"
                      style={{ color: ST.textSecondary }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </StCard>
                );
              })}
            </div>
          </section>
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
      </main>
    </div>
  );
}
