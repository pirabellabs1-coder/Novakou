// Refonte design "Stitch" — rendez-vous mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : query bookings, actions (confirm/complete/cancel/link/feedback),
// onglets, recherche, regroupement par jour.
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StCard,
  StPageHeader,
  StButton,
  StTabs,
  ST,
} from "@/components/stitch";
import {
  CalendarCheck,
  Search,
  Edit3,
  Calendar,
  Timer,
  Video,
  Star,
  Flag,
  CheckCircle2,
  X,
  Loader2,
  MessageSquarePlus,
  Gavel,
} from "lucide-react";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface BookingStudent {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Booking {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  paidAmount: number;
  status: BookingStatus;
  meetingLink: string | null;
  sessionNotes: string | null;
  studentGoals?: string | null;
  studentRating: number | null;
  mentorFeedback: string | null;
  student: BookingStudent;
}

function buildJitsiUrl(bookingId: string): string {
  return `https://meet.jit.si/freelancehigh-mentor-${bookingId}`;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
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
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().split("T")[0];
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; fg: string }
> = {
  PENDING: { label: "En attente", bg: ST.amberSoft, fg: ST.amberText },
  CONFIRMED: { label: "Confirmé", bg: ST.greenSoft, fg: ST.green },
  COMPLETED: { label: "Terminé", bg: ST.blueSoft, fg: ST.blueText },
  CANCELLED: { label: "Annulé", bg: ST.roseSoft, fg: ST.roseText },
  NO_SHOW: { label: "Absent", bg: "#f1efe8", fg: "#5f5e5a" },
};

function StatusPill({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-full whitespace-nowrap" style={{ background: cfg.bg, color: cfg.fg }}>
      {cfg.label}
    </span>
  );
}

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "PENDING", label: "En attente" },
  { key: "CONFIRMED", label: "Confirmés" },
  { key: "COMPLETED", label: "Terminés" },
  { key: "CANCELLED", label: "Annulés" },
];

function DangerButton({
  onClick,
  disabled,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: typeof Gavel;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 font-extrabold text-[12px] rounded-[10px] px-3 py-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      style={{ background: ST.roseSoft, color: ST.roseText }}
    >
      <Icon size={14} className={Icon === Loader2 ? "animate-spin" : undefined} />
      {children}
    </button>
  );
}

function BookingCard({
  booking,
  onAction,
}: {
  booking: Booking;
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => Promise<void>;
}) {
  const cfg = STATUS_CONFIG[booking.status];
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkVal, setLinkVal] = useState(booking.meetingLink ?? "");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackVal, setFeedbackVal] = useState(booking.mentorFeedback ?? "");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  async function act(action: string, extra?: Record<string, unknown>) {
    setLoadingAction(action);
    await onAction(booking.id, action, extra);
    setLoadingAction(null);
  }

  const isPast = new Date(booking.scheduledAt) < new Date();

  return (
    <StCard noPadding className="overflow-hidden transition-all hover:-translate-y-0.5">
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "#f7faf8", borderBottom: `1px solid ${ST.divider}` }}>
        <span className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
          {fmtDate(booking.scheduledAt)} — {fmtTime(booking.scheduledAt)}
        </span>
        <div className="ml-auto">
          <StatusPill status={booking.status} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold flex-shrink-0 overflow-hidden"
            style={{ background: ST.avatarBg, color: ST.green }}
          >
            {booking.student.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.student.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(booking.student.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
              {booking.student.name ?? booking.student.email ?? "Apprenant"}
            </p>
            {booking.student.email && (
              <p className="text-[11.5px] font-semibold truncate" style={{ color: ST.textMuted }}>{booking.student.email}</p>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[11.5px] font-semibold flex items-center gap-1" style={{ color: ST.textSecondary }}>
                <Timer size={12} />
                {booking.durationMinutes} min
              </span>
              <span className="text-[12px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                {fmt(booking.paidAmount)} FCFA
              </span>
              {booking.studentRating && (
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-3 h-3"
                      fill={s <= booking.studentRating! ? "#f59e0b" : "transparent"}
                      stroke={s <= booking.studentRating! ? "#f59e0b" : "#d1d5db"}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        {booking.studentGoals && (
          <div className="mt-3 rounded-[12px] px-3 py-2" style={{ background: ST.amberSoft, border: "1px solid #f3e2bd" }}>
            <p className="text-[10px] font-extrabold uppercase mb-0.5 flex items-center gap-1" style={{ color: ST.amberText }}>
              <Flag size={12} />
              Objectifs de l&apos;apprenant
            </p>
            <p className="text-[12px] font-medium whitespace-pre-wrap" style={{ color: "#633806" }}>{booking.studentGoals}</p>
          </div>
        )}

        {(booking.meetingLink || booking.status === "CONFIRMED") && (
          <a
            href={booking.meetingLink || buildJitsiUrl(booking.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold hover:underline break-all"
            style={{ color: ST.blueText }}
          >
            <Video size={14} />
            <span className="font-extrabold">Salle Jitsi</span>
            <span className="truncate">{booking.meetingLink || buildJitsiUrl(booking.id)}</span>
          </a>
        )}

        {booking.mentorFeedback && (
          <div className="mt-3 rounded-[12px] px-3 py-2" style={{ background: "#f7faf8" }}>
            <p className="text-[10px] font-extrabold mb-0.5 uppercase tracking-wider" style={{ color: ST.textMuted }}>
              Mon feedback
            </p>
            <p className="text-[12px] font-medium" style={{ color: ST.text }}>{booking.mentorFeedback}</p>
          </div>
        )}

        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
            {booking.status === "PENDING" && (
              <StButton
                size="sm"
                disabled={!!loadingAction}
                icon={loadingAction === "confirm" ? Loader2 : CheckCircle2}
                onClick={() => act("confirm")}
              >
                Confirmer
              </StButton>
            )}

            {booking.status === "CONFIRMED" && isPast && !showCompleteConfirm && (
              <StButton
                variant="secondary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => setShowCompleteConfirm(true)}
              >
                Marquer terminé
              </StButton>
            )}

            {showCompleteConfirm && (
              <div className="w-full space-y-2">
                <textarea
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Feedback optionnel pour l'apprenant…"
                  className="w-full text-[12px] font-medium rounded-[12px] px-3 py-2 resize-none h-16 focus:outline-none"
                  style={{ border: "1px solid #dde6e0", color: "#33453b" }}
                />
                <div className="flex gap-2">
                  <StButton
                    size="sm"
                    icon={CheckCircle2}
                    disabled={!!loadingAction}
                    onClick={() => {
                      act("complete", { mentorFeedback: feedbackVal || undefined });
                      setShowCompleteConfirm(false);
                    }}
                  >
                    Confirmer fin de séance
                  </StButton>
                  <StButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCompleteConfirm(false)}
                  >
                    Annuler
                  </StButton>
                </div>
              </div>
            )}

            {booking.status === "CONFIRMED" && (
              <StButton
                size="sm"
                icon={Video}
                href={booking.meetingLink || buildJitsiUrl(booking.id)}
              >
                Rejoindre la salle
              </StButton>
            )}

            <StButton
              variant="secondary"
              size="sm"
              icon={Edit3}
              onClick={() => setShowLinkForm(!showLinkForm)}
            >
              {booking.meetingLink && !booking.meetingLink.includes("meet.jit.si")
                ? "Modifier lien perso"
                : "Lien perso (Zoom/Meet)"}
            </StButton>

            <DangerButton
              disabled={!!loadingAction}
              icon={loadingAction === "cancel" ? Loader2 : Gavel}
              onClick={() => act("cancel")}
            >
              Annuler
            </DangerButton>

            {showLinkForm && (
              <div className="w-full flex gap-2 mt-1">
                <input
                  type="url"
                  value={linkVal}
                  onChange={(e) => setLinkVal(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="flex-1 text-[12px] font-semibold rounded-[10px] px-3 py-2 focus:outline-none"
                  style={{ border: "1px solid #dde6e0", color: ST.text }}
                />
                <StButton
                  size="sm"
                  disabled={!linkVal || !!loadingAction}
                  onClick={() => {
                    act("set_link", { meetingLink: linkVal });
                    setShowLinkForm(false);
                  }}
                >
                  OK
                </StButton>
                <StButton variant="secondary" size="sm" onClick={() => setShowLinkForm(false)}>
                  <X size={12} />
                </StButton>
              </div>
            )}
          </div>
        )}

        {booking.status === "COMPLETED" && !booking.mentorFeedback && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
            {!showFeedbackForm ? (
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="text-[11.5px] font-semibold flex items-center gap-1 hover:opacity-80"
                style={{ color: ST.textSecondary }}
              >
                <MessageSquarePlus size={14} />
                Ajouter un feedback
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Votre feedback pour l'apprenant…"
                  className="w-full text-[12px] font-medium rounded-[12px] px-3 py-2 resize-none h-16 focus:outline-none"
                  style={{ border: "1px solid #dde6e0", color: "#33453b" }}
                />
                <div className="flex gap-2">
                  <StButton
                    size="sm"
                    disabled={!feedbackVal || !!loadingAction}
                    onClick={() => {
                      act("add_feedback", { mentorFeedback: feedbackVal });
                      setShowFeedbackForm(false);
                    }}
                  >
                    Enregistrer
                  </StButton>
                  <StButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFeedbackForm(false)}
                  >
                    Annuler
                  </StButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StCard>
  );
}

function DayGroup({
  date,
  bookings,
  onAction,
}: {
  date: string;
  bookings: Booking[];
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => Promise<void>;
}) {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  let dayLabel: string;
  if (d.toDateString() === today.toDateString()) dayLabel = "Aujourd'hui";
  else if (d.toDateString() === tomorrow.toDateString()) dayLabel = "Demain";
  else if (d.toDateString() === yesterday.toDateString()) dayLabel = "Hier";
  else
    dayLabel = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-[12px] flex flex-col items-center justify-center flex-shrink-0" style={{ background: ST.greenSoft }}>
          <p className="text-[10px] font-extrabold uppercase leading-none" style={{ color: ST.green }}>
            {d.toLocaleDateString("fr-FR", { month: "short" })}
          </p>
          <p className="text-[18px] font-extrabold leading-none" style={{ color: ST.green }}>{d.getDate()}</p>
        </div>
        <div>
          <p className="text-[13px] font-extrabold capitalize" style={{ color: ST.text }}>{dayLabel}</p>
          <p className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>
            {bookings.length} séance{bookings.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 h-px" style={{ background: ST.divider }} />
      </div>
      <div className="space-y-3 ml-3 pl-10" style={{ borderLeft: `2px solid ${ST.divider}` }}>
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

export default function MentorRendezVousPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = activeTab !== "all" ? `?status=${activeTab}` : "";
      const res = await fetch(`/api/formations/mentor/bookings${status}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBookings(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: string, action: string, extra?: Record<string, unknown>) {
    await fetch(`/api/formations/mentor/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    await load();
  }

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.student.name ?? "").toLowerCase().includes(q) ||
      (b.student.email ?? "").toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce<Record<string, Booking[]>>((acc, b) => {
    const k = dayKey(b.scheduledAt);
    if (!acc[k]) acc[k] = [];
    acc[k].push(b);
    return acc;
  }, {});
  const sortedDays = Object.keys(grouped).sort();

  const counts: Record<string, number> = { all: bookings.length };
  bookings.forEach((b) => {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
  });

  const tabsWithCounts = TABS.map((t) => ({
    key: t.key,
    label: t.label,
    count: counts[t.key] > 0 ? counts[t.key] : undefined,
  }));

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Rendez-vous & séances"
          subtitle="Gérez l'ensemble de vos réservations de mentorat."
          actions={
            <>
              <StButton variant="secondary" href="/mentor/profil" icon={Edit3}>
                Mon profil
              </StButton>
              <StButton href="/mentor/calendrier" icon={Calendar}>
                Mon calendrier
              </StButton>
            </>
          }
        />

        {/* Search */}
        <div className="relative max-w-md mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ST.textMuted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un apprenant…"
            className="w-full pl-10 pr-4 py-2.5 text-[13px] font-semibold rounded-[12px] bg-white focus:outline-none"
            style={{ border: `1px solid ${ST.cardBorder}`, color: ST.text }}
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 overflow-x-auto pb-1">
          <StTabs tabs={tabsWithCounts} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-[18px]" style={{ background: "#e9efeb" }} />
            ))}
          </div>
        ) : sortedDays.length === 0 ? (
          <StCard className="text-center py-12">
            <CalendarCheck size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>
              {search ? "Aucun résultat pour cette recherche" : "Aucune réservation"}
            </p>
            <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              {search
                ? "Essayez avec d'autres mots-clés."
                : "Vous n'avez pas de rendez-vous dans cette catégorie."}
            </p>
            {search && (
              <div className="mt-4">
                <StButton variant="secondary" onClick={() => setSearch("")}>Effacer la recherche</StButton>
              </div>
            )}
          </StCard>
        ) : (
          <div className="space-y-8">
            {sortedDays.map((day) => (
              <DayGroup key={day} date={day} bookings={grouped[day]} onAction={handleAction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
