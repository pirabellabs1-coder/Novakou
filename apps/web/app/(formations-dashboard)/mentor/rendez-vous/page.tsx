"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; icon: string; badgeCls: string; dotCls: string }
> = {
  PENDING: {
    label: "En attente",
    icon: "hourglass_top",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200",
    dotCls: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Confirmé",
    icon: "check_circle",
    badgeCls: "bg-green-50 text-green-700 border-green-200",
    dotCls: "bg-green-500",
  },
  COMPLETED: {
    label: "Terminé",
    icon: "task_alt",
    badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
    dotCls: "bg-blue-500",
  },
  CANCELLED: {
    label: "Annulé",
    icon: "cancel",
    badgeCls: "bg-red-50 text-red-600 border-red-200",
    dotCls: "bg-red-400",
  },
  NO_SHOW: {
    label: "Absent",
    icon: "person_off",
    badgeCls: "bg-gray-100 text-gray-500 border-gray-200",
    dotCls: "bg-gray-400",
  },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const TABS: { label: string; value: string }[] = [
  { label: "Tous", value: "all" },
  { label: "En attente", value: "PENDING" },
  { label: "Confirmés", value: "CONFIRMED" },
  { label: "Terminés", value: "COMPLETED" },
  { label: "Annulés", value: "CANCELLED" },
];

// ─── Booking Card ─────────────────────────────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#006e2f]/20 hover:shadow-sm transition-all">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotCls}`} />
        <span className="text-xs font-semibold text-[#5c647a]">
          {fmtDate(booking.scheduledAt)} — {fmtTime(booking.scheduledAt)}
        </span>
        <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badgeCls}`}>
          <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>

      <div className="p-4">
        {/* Student + meta */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br from-[#006e2f] to-[#22c55e] overflow-hidden">
            {booking.student.image ? (
              <img src={booking.student.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(booking.student.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#191c1e]">
              {booking.student.name ?? booking.student.email ?? "Apprenant"}
            </p>
            {booking.student.email && (
              <p className="text-xs text-[#5c647a] truncate">{booking.student.email}</p>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-[#5c647a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">timer</span>
                {booking.durationMinutes} min
              </span>
              <span className="text-xs font-bold text-[#006e2f]">
                {fmt(booking.paidAmount)} FCFA
              </span>
              {booking.studentRating && (
                <span className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span
                      key={s}
                      className="material-symbols-outlined text-[11px]"
                      style={{
                        color: s <= booking.studentRating! ? "#f59e0b" : "#d1d5db",
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >star</span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Student goals */}
        {booking.studentGoals && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-amber-800 uppercase mb-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">flag</span>
              Objectifs de l&apos;apprenant
            </p>
            <p className="text-xs text-amber-900 whitespace-pre-wrap">{booking.studentGoals}</p>
          </div>
        )}

        {/* Meeting link */}
        {(booking.meetingLink || booking.status === "CONFIRMED") && (
          <a
            href={booking.meetingLink || buildJitsiUrl(booking.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:underline break-all"
          >
            <span className="material-symbols-outlined text-[14px]">videocam</span>
            <span className="font-semibold">Salle Jitsi</span>
            <span className="truncate">{booking.meetingLink || buildJitsiUrl(booking.id)}</span>
          </a>
        )}

        {/* Mentor feedback */}
        {booking.mentorFeedback && (
          <div className="mt-3 bg-[#f7f9fb] rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-[#5c647a] mb-0.5">Mon feedback</p>
            <p className="text-xs text-[#191c1e]">{booking.mentorFeedback}</p>
          </div>
        )}

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
            {booking.status === "PENDING" && (
              <button
                onClick={() => act("confirm")}
                disabled={!!loadingAction}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006e2f] text-white hover:bg-[#005a26] disabled:opacity-50 transition-colors"
              >
                {loadingAction === "confirm" ? (
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                )}
                Confirmer
              </button>
            )}

            {booking.status === "CONFIRMED" && isPast && !showCompleteConfirm && (
              <button
                onClick={() => setShowCompleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">task_alt</span>
                Marquer terminé
              </button>
            )}

            {showCompleteConfirm && (
              <div className="w-full space-y-2">
                <textarea
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Feedback optionnel pour l'apprenant…"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      act("complete", { mentorFeedback: feedbackVal || undefined });
                      setShowCompleteConfirm(false);
                    }}
                    disabled={!!loadingAction}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">task_alt</span>
                    Confirmer fin de séance
                  </button>
                  <button
                    onClick={() => setShowCompleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {booking.status === "CONFIRMED" && (
              <a
                href={booking.meetingLink || buildJitsiUrl(booking.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">videocam</span>
                Rejoindre la salle
              </a>
            )}

            <button
              onClick={() => setShowLinkForm(!showLinkForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors"
              title="Remplacer la salle Jitsi auto par un autre lien (Zoom, Meet…)"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              {booking.meetingLink && !booking.meetingLink.includes("meet.jit.si")
                ? "Modifier lien perso"
                : "Lien perso (Zoom/Meet)"}
            </button>

            <button
              onClick={() => act("cancel")}
              disabled={!!loadingAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "cancel" ? (
                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[14px]">cancel</span>
              )}
              Annuler
            </button>

            {showLinkForm && (
              <div className="w-full flex gap-2 mt-1">
                <input
                  type="url"
                  value={linkVal}
                  onChange={(e) => setLinkVal(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                />
                <button
                  onClick={() => {
                    act("set_link", { meetingLink: linkVal });
                    setShowLinkForm(false);
                  }}
                  disabled={!linkVal || !!loadingAction}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006e2f] text-white hover:bg-[#005a26] disabled:opacity-50"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowLinkForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback for completed sessions without feedback */}
        {booking.status === "COMPLETED" && !booking.mentorFeedback && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {!showFeedbackForm ? (
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="text-xs text-[#5c647a] hover:text-[#191c1e] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">add_comment</span>
                Ajouter un feedback
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Votre feedback pour l'apprenant…"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      act("add_feedback", { mentorFeedback: feedbackVal });
                      setShowFeedbackForm(false);
                    }}
                    disabled={!feedbackVal || !!loadingAction}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006e2f] text-white disabled:opacity-50"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setShowFeedbackForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Timeline day group ────────────────────────────────────────────────────────
function DayGroup({ date, bookings, onAction }: {
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
        <div className="w-10 h-10 rounded-xl bg-[#006e2f]/10 flex flex-col items-center justify-center flex-shrink-0">
          <p className="text-[10px] font-bold text-[#006e2f] uppercase leading-none">
            {d.toLocaleDateString("fr-FR", { month: "short" })}
          </p>
          <p className="text-base font-extrabold text-[#006e2f] leading-none">{d.getDate()}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-[#191c1e] capitalize">{dayLabel}</p>
          <p className="text-xs text-[#5c647a]">
            {bookings.length} séance{bookings.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="space-y-3 ml-3 pl-10 border-l-2 border-gray-100">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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

  // Filter by search
  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.student.name ?? "").toLowerCase().includes(q) ||
      (b.student.email ?? "").toLowerCase().includes(q)
    );
  });

  // Group by day
  const grouped = filtered.reduce<Record<string, Booking[]>>((acc, b) => {
    const k = dayKey(b.scheduledAt);
    if (!acc[k]) acc[k] = [];
    acc[k].push(b);
    return acc;
  }, {});
  const sortedDays = Object.keys(grouped).sort();

  // Counts per tab
  const counts: Record<string, number> = { all: bookings.length };
  bookings.forEach((b) => {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/mentor/dashboard" className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="text-sm font-bold text-[#191c1e] flex-1">Mes rendez-vous</span>
          <Link
            href="/mentor/profil"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Profil
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#191c1e]">Rendez-vous & Séances</h1>
            <p className="text-sm text-[#5c647a] mt-0.5">
              Gérez l&apos;ensemble de vos réservations de mentorat.
            </p>
          </div>
          {/* Search */}
          <div className="relative sm:ml-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[#5c647a]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un apprenant…"
              className="w-full sm:w-56 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
            />
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? "bg-[#006e2f] text-white shadow-sm"
                  : "bg-white text-[#5c647a] border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : sortedDays.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <span className="material-symbols-outlined text-gray-300 text-6xl">event_busy</span>
            <p className="text-sm font-semibold text-[#5c647a] mt-3">
              {search ? "Aucun résultat pour cette recherche" : "Aucune réservation dans cette catégorie"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-xs text-[#006e2f] font-semibold hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDays.map((day) => (
              <DayGroup
                key={day}
                date={day}
                bookings={grouped[day]}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
