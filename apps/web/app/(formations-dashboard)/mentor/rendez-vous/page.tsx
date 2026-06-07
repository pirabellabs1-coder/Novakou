// Refonte style KAZA — mentor rendez-vous — 2026-06-07
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KazaHero,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
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
  { label: string; variant: "orange" | "green" | "blue" | "rose" | "slate" }
> = {
  PENDING: { label: "En attente", variant: "orange" },
  CONFIRMED: { label: "Confirmé", variant: "green" },
  COMPLETED: { label: "Terminé", variant: "blue" },
  CANCELLED: { label: "Annulé", variant: "rose" },
  NO_SHOW: { label: "Absent", variant: "slate" },
};

const TABS: { label: string; value: string }[] = [
  { label: "Tous", value: "all" },
  { label: "En attente", value: "PENDING" },
  { label: "Confirmés", value: "CONFIRMED" },
  { label: "Terminés", value: "COMPLETED" },
  { label: "Annulés", value: "CANCELLED" },
];

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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500">
          {fmtDate(booking.scheduledAt)} — {fmtTime(booking.scheduledAt)}
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
          >
            {booking.student.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.student.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(booking.student.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0b2540]">
              {booking.student.name ?? booking.student.email ?? "Apprenant"}
            </p>
            {booking.student.email && (
              <p className="text-xs text-slate-500 truncate">{booking.student.email}</p>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {booking.durationMinutes} min
              </span>
              <span className="text-xs font-bold text-emerald-600 tabular-nums">
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
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-amber-800 uppercase mb-0.5 flex items-center gap-1">
              <Flag className="w-3 h-3" />
              Objectifs de l&apos;apprenant
            </p>
            <p className="text-xs text-amber-900 whitespace-pre-wrap">{booking.studentGoals}</p>
          </div>
        )}

        {(booking.meetingLink || booking.status === "CONFIRMED") && (
          <a
            href={booking.meetingLink || buildJitsiUrl(booking.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1.5 text-xs text-sky-600 hover:underline break-all"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="font-semibold">Salle Jitsi</span>
            <span className="truncate">{booking.meetingLink || buildJitsiUrl(booking.id)}</span>
          </a>
        )}

        {booking.mentorFeedback && (
          <div className="mt-3 bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">
              Mon feedback
            </p>
            <p className="text-xs text-[#0b2540]">{booking.mentorFeedback}</p>
          </div>
        )}

        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
            {booking.status === "PENDING" && (
              <KazaButton
                variant="primary"
                size="sm"
                disabled={!!loadingAction}
                icon={loadingAction === "confirm" ? Loader2 : CheckCircle2}
                onClick={() => act("confirm")}
              >
                Confirmer
              </KazaButton>
            )}

            {booking.status === "CONFIRMED" && isPast && !showCompleteConfirm && (
              <KazaButton
                variant="ghost"
                size="sm"
                icon={CheckCircle2}
                onClick={() => setShowCompleteConfirm(true)}
              >
                Marquer terminé
              </KazaButton>
            )}

            {showCompleteConfirm && (
              <div className="w-full space-y-2">
                <textarea
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Feedback optionnel pour l'apprenant…"
                  className="w-full text-xs border-2 border-slate-200 rounded-xl px-3 py-2 resize-none h-16 focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500"
                />
                <div className="flex gap-2">
                  <KazaButton
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    disabled={!!loadingAction}
                    onClick={() => {
                      act("complete", { mentorFeedback: feedbackVal || undefined });
                      setShowCompleteConfirm(false);
                    }}
                  >
                    Confirmer fin de séance
                  </KazaButton>
                  <KazaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompleteConfirm(false)}
                  >
                    Annuler
                  </KazaButton>
                </div>
              </div>
            )}

            {booking.status === "CONFIRMED" && (
              <KazaButton
                variant="primary"
                size="sm"
                icon={Video}
                href={booking.meetingLink || buildJitsiUrl(booking.id)}
              >
                Rejoindre la salle
              </KazaButton>
            )}

            <KazaButton
              variant="ghost"
              size="sm"
              icon={Edit3}
              onClick={() => setShowLinkForm(!showLinkForm)}
            >
              {booking.meetingLink && !booking.meetingLink.includes("meet.jit.si")
                ? "Modifier lien perso"
                : "Lien perso (Zoom/Meet)"}
            </KazaButton>

            <KazaButton
              variant="danger"
              size="sm"
              disabled={!!loadingAction}
              icon={loadingAction === "cancel" ? Loader2 : Gavel}
              onClick={() => act("cancel")}
            >
              Annuler
            </KazaButton>

            {showLinkForm && (
              <div className="w-full flex gap-2 mt-1">
                <input
                  type="url"
                  value={linkVal}
                  onChange={(e) => setLinkVal(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="flex-1 text-xs border-2 border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                />
                <KazaButton
                  variant="primary"
                  size="sm"
                  disabled={!linkVal || !!loadingAction}
                  onClick={() => {
                    act("set_link", { meetingLink: linkVal });
                    setShowLinkForm(false);
                  }}
                >
                  OK
                </KazaButton>
                <KazaButton variant="ghost" size="sm" onClick={() => setShowLinkForm(false)}>
                  <X className="w-3 h-3" />
                </KazaButton>
              </div>
            )}
          </div>
        )}

        {booking.status === "COMPLETED" && !booking.mentorFeedback && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {!showFeedbackForm ? (
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="text-xs text-slate-500 hover:text-[#0b2540] flex items-center gap-1"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Ajouter un feedback
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Votre feedback pour l'apprenant…"
                  className="w-full text-xs border-2 border-slate-200 rounded-xl px-3 py-2 resize-none h-16 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <KazaButton
                    variant="primary"
                    size="sm"
                    disabled={!feedbackVal || !!loadingAction}
                    onClick={() => {
                      act("add_feedback", { mentorFeedback: feedbackVal });
                      setShowFeedbackForm(false);
                    }}
                  >
                    Enregistrer
                  </KazaButton>
                  <KazaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedbackForm(false)}
                  >
                    Annuler
                  </KazaButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex flex-col items-center justify-center flex-shrink-0">
          <p className="text-[10px] font-bold text-emerald-700 uppercase leading-none">
            {d.toLocaleDateString("fr-FR", { month: "short" })}
          </p>
          <p className="text-lg font-extrabold text-emerald-700 leading-none">{d.getDate()}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-[#0b2540] capitalize">{dayLabel}</p>
          <p className="text-xs text-slate-500">
            {bookings.length} séance{bookings.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      <div className="space-y-3 ml-3 pl-10 border-l-2 border-slate-100">
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

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Mentor"
        badgeColor="white"
        icon={CalendarCheck}
        title="Rendez-vous & séances"
        subtitle="Gérez l'ensemble de vos réservations de mentorat."
        actions={
          <>
            <KazaButton variant="secondary" href="/mentor/profil" icon={Edit3}>
              Mon profil
            </KazaButton>
            <KazaButton variant="primary" href="/mentor/calendrier" icon={Calendar}>
              Mon calendrier
            </KazaButton>
          </>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un apprenant…"
          className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#0b2540] text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : sortedDays.length === 0 ? (
        <KazaEmpty
          icon={CalendarCheck}
          title={search ? "Aucun résultat pour cette recherche" : "Aucune réservation"}
          description={
            search
              ? "Essayez avec d'autres mots-clés."
              : "Vous n'avez pas de rendez-vous dans cette catégorie."
          }
          action={search ? { label: "Effacer la recherche", onClick: () => setSearch("") } : undefined}
        />
      ) : (
        <div className="space-y-8">
          {sortedDays.map((day) => (
            <DayGroup key={day} date={day} bookings={grouped[day]} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
