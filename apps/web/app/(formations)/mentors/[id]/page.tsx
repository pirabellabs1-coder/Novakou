"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { sanitizeRichHtml, stripHtml } from "@/lib/sanitize-html";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MentorReview {
  id: string;
  rating: number | null;
  review: string | null;
  date: string;
  student: { id: string; name: string | null; image: string | null };
}

interface MentorPublic {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  specialty: string;
  bio: string;
  domain: string | null;
  coverImage: string | null;
  sessionPrice: number;
  sessionDuration: number;
  languages: string[];
  badges: string[];
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  totalSessions: number;
  totalStudents: number;
  memberSince: string;
  reviews: MentorReview[];
}

interface PreviewSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

// Mini-calendar helpers
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const MINI_WEEK_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const dayIdx = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - dayIdx);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const c = new Date(start);
    c.setDate(start.getDate() + i);
    cells.push(c);
  }
  return cells;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function initials(name: string | null) {
  if (!name) return "M";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "Aujourd'hui";
  if (d < 7) return `Il y a ${d}j`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an(s)`;
}

const LANG_MAP: Record<string, { flag: string; label: string }> = {
  FR: { flag: "🇫🇷", label: "Français" },
  EN: { flag: "🇬🇧", label: "Anglais" },
  AR: { flag: "🇸🇦", label: "Arabe" },
  WO: { flag: "🇸🇳", label: "Wolof" },
  DI: { flag: "🇨🇮", label: "Dioula" },
  PT: { flag: "🇵🇹", label: "Portugais" },
  ES: { flag: "🇪🇸", label: "Espagnol" },
};

// ─── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined text-yellow-400"
          style={{
            fontSize: `${size}px`,
            fontVariationSettings: s <= Math.floor(rating) ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function MentorPublicProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mentor, setMentor] = useState<MentorPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previewSlots, setPreviewSlots] = useState<PreviewSlot[]>([]);
  const [activeTab, setActiveTab] = useState<"description" | "avis">("description");
  const [calMonth, setCalMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/public/mentors/${params.id}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setMentor(json.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  useEffect(() => {
    async function loadSlots() {
      try {
        const from = startOfMonth(calMonth);
        // Load current month + next month for the mini calendar
        const to = new Date(calMonth.getFullYear(), calMonth.getMonth() + 2, 0);
        const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
        const res = await fetch(`/api/formations/mentors/${params.id}/slots?${qs.toString()}`);
        if (!res.ok) return;
        const { data } = await res.json();
        setPreviewSlots(data.slots ?? []);
      } catch {
        // silent
      }
    }
    if (mentor?.isAvailable) loadSlots();
  }, [params.id, mentor?.isAvailable, calMonth]);

  /** "YYYY-M-D" → list of slots (local-day key) */
  const slotsByDayKey = useMemo(() => {
    const m = new Map<string, PreviewSlot[]>();
    for (const s of previewSlots) {
      const d = new Date(s.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = m.get(key) ?? [];
      list.push(s);
      m.set(key, list);
    }
    return m;
  }, [previewSlots]);

  const monthGrid = useMemo(() => buildMonthGrid(calMonth), [calMonth]);

  function dayHasSlots(d: Date): boolean {
    return slotsByDayKey.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  function slotsForDay(d: Date): PreviewSlot[] {
    return slotsByDayKey.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];
  }

  function handleSlotClick(slot: PreviewSlot) {
    if (!session) {
      router.push(
        `/connexion?callbackUrl=/formations/mentors/${params.id}/reserver?slot=${encodeURIComponent(slot.start)}`,
      );
      return;
    }
    router.push(`/mentors/${params.id}/reserver?slot=${encodeURIComponent(slot.start)}`);
  }

  function handleBookClick() {
    if (!session) {
      router.push(`/connexion?callbackUrl=/formations/mentors/${params.id}/reserver`);
      return;
    }
    router.push(`/mentors/${params.id}/reserver`);
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `${mentor?.name ?? "Mentor"} · Mentor Novakou`,
        text: mentor?.specialty ?? "",
        url: window.location.href,
      });
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] animate-pulse">
        <div className="h-12 bg-white border-b border-gray-100" />
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
          <div className="h-10 w-2/3 bg-gray-200 rounded-xl" />
          <div className="h-60 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-gray-300 text-5xl">person_off</span>
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Mentor introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Ce profil n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/mentors"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const isTopMentor = mentor.rating >= 4.5 && mentor.reviewsCount > 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-[#5c647a]">
          <Link href="/" className="hover:text-[#006e2f] transition-colors">Accueil</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link href="/mentors" className="hover:text-[#006e2f] transition-colors">Mentors</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-[#191c1e] font-medium truncate max-w-[200px]">{mentor.name ?? "Mentor"}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Banner */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#003d1a] to-[#22c55e]">
              {mentor.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mentor.coverImage} alt={mentor.name ?? "Mentor"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-white/30 text-[100px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    support_agent
                  </span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${
                    mentor.isAvailable
                      ? "bg-white/95 text-[#191c1e]"
                      : "bg-gray-800/80 text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      mentor.isAvailable ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    }`}
                  />
                  {mentor.isAvailable ? "Disponible" : "Indisponible"}
                </span>
                {mentor.domain && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#006e2f] text-white">
                    {mentor.domain}
                  </span>
                )}
              </div>
            </div>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {mentor.languages && mentor.languages.slice(0, 4).map((code) => {
                  const l = LANG_MAP[code];
                  if (!l) return null;
                  return (
                    <span
                      key={code}
                      className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-[#5c647a]"
                    >
                      #{code.toLowerCase()}
                    </span>
                  );
                })}
                {mentor.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                    <span
                      className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    VÉRIFIÉ
                  </span>
                )}
                {isTopMentor && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                    <span
                      className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      emoji_events
                    </span>
                    TOP MENTOR
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight">
                {mentor.name ?? "Mentor"}
              </h1>
              <p className="text-base text-[#5c647a] mt-1">{mentor.specialty}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={mentor.rating} size={16} />
                  <span className="text-sm font-bold text-[#191c1e]">
                    {mentor.rating > 0 ? mentor.rating.toFixed(1) : "Nouveau"}
                  </span>
                  {mentor.reviewsCount > 0 && (
                    <span className="text-xs text-[#5c647a]">({mentor.reviewsCount} avis)</span>
                  )}
                </div>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">groups</span>
                  <span className="font-semibold text-[#191c1e]">{fmt(mentor.totalStudents)}</span>
                  apprenant{mentor.totalStudents > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">event_available</span>
                  <span className="font-semibold text-[#191c1e]">{fmt(mentor.totalSessions)}</span>
                  séance{mentor.totalSessions > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  Membre depuis {new Date(mentor.memberSince).getFullYear()}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit">
              {(["description", "avis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab ? "bg-[#006e2f] text-white shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"
                  }`}
                >
                  {tab === "description" ? "Description" : `Avis (${mentor.reviewsCount})`}
                </button>
              ))}
            </div>

            {/* Description tab */}
            {activeTab === "description" && (
              <div className="space-y-5">
                {/* À propos */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">À propos du mentor</h2>
                  {mentor.bio && stripHtml(mentor.bio).length > 0 ? (
                    <div
                      className="mentor-bio prose prose-sm max-w-none text-[#5c647a] leading-relaxed prose-headings:text-[#191c1e] prose-strong:text-[#191c1e] prose-a:text-[#006e2f] prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-hr:border-gray-200"
                      // bio is sanitized server-side on save, sanitized again here as defense-in-depth
                      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(mentor.bio) }}
                    />
                  ) : (
                    <p className="text-sm text-[#5c647a] leading-relaxed">
                      Ce mentor n&apos;a pas encore rédigé sa bio.
                    </p>
                  )}
                  <style dangerouslySetInnerHTML={{ __html: `
                    .mentor-bio [data-video-embed] { position: relative; padding-bottom: 56.25%; height: 0; margin: 1rem 0; border-radius: 0.75rem; overflow: hidden; background: #000; }
                    .mentor-bio [data-video-embed] iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
                    .mentor-bio mark { padding: 0 3px; border-radius: 3px; }
                  `}} />
                </div>

                {/* Domaine d'expertise */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">Domaine d&apos;expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.domain && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#006e2f]/10 text-[#006e2f]">
                        <span className="material-symbols-outlined text-[14px]">category</span>
                        {mentor.domain}
                      </span>
                    )}
                    {mentor.languages && mentor.languages.length > 0 && (
                      <>
                        {mentor.languages.map((code) => {
                          const l = LANG_MAP[code];
                          return l ? (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-[#5c647a] border border-gray-200"
                            >
                              <span>{l.flag}</span>
                              {l.label}
                            </span>
                          ) : null;
                        })}
                      </>
                    )}
                  </div>
                </div>

                {/* Disponibilités — mini calendar */}
                {mentor.isAvailable && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-lg font-extrabold text-[#191c1e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#006e2f]">event_available</span>
                        Disponibilités
                      </h2>
                      <button
                        onClick={handleBookClick}
                        className="text-xs font-semibold text-[#006e2f] hover:underline flex items-center gap-1"
                      >
                        Tous les créneaux
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>

                    {previewSlots.length === 0 ? (
                      <div className="text-center py-6">
                        <span className="material-symbols-outlined text-gray-300 text-4xl">event_busy</span>
                        <p className="text-sm text-[#5c647a] mt-2">
                          Aucun créneau disponible pour le moment.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Calendar header */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5c647a]"
                            aria-label="Mois précédent"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                          </button>
                          <p className="text-sm font-bold text-[#191c1e]">
                            {MONTHS_FR[calMonth.getMonth()]} {calMonth.getFullYear()}
                          </p>
                          <button
                            onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5c647a]"
                            aria-label="Mois suivant"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                        </div>

                        {/* Week headers */}
                        <div className="grid grid-cols-7 text-[10px] font-bold text-[#5c647a] mb-1">
                          {MINI_WEEK_HEADERS.map((h, i) => (
                            <div key={i} className="text-center py-1">{h}</div>
                          ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {monthGrid.map((d, i) => {
                            const inMonth = d.getMonth() === calMonth.getMonth();
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isPast = d < today;
                            const has = dayHasSlots(d);
                            const isSelected =
                              selectedDay &&
                              d.getFullYear() === selectedDay.getFullYear() &&
                              d.getMonth() === selectedDay.getMonth() &&
                              d.getDate() === selectedDay.getDate();
                            return (
                              <button
                                key={i}
                                onClick={() => has && setSelectedDay(d)}
                                disabled={!has || isPast}
                                className={`aspect-square rounded-lg text-sm font-bold transition-colors flex items-center justify-center relative ${
                                  isSelected
                                    ? "bg-[#006e2f] text-white ring-2 ring-[#006e2f] shadow-sm"
                                    : has
                                      ? "bg-[#006e2f]/10 text-[#006e2f] hover:bg-[#006e2f]/20 border border-[#006e2f]/30"
                                      : inMonth
                                        ? "text-[#191c1e] bg-gray-50 cursor-not-allowed"
                                        : "text-gray-400 bg-transparent cursor-not-allowed"
                                } ${isPast ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                              >
                                {d.getDate()}
                                {has && !isSelected && (
                                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#006e2f] rounded-full" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected day's slots */}
                        {selectedDay && (
                          <div className="mt-5 pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-[#191c1e] mb-2 capitalize">
                              {selectedDay.toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {slotsForDay(selectedDay).map((s) => (
                                <button
                                  key={s.start}
                                  onClick={() => handleSlotClick(s)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006e2f]/5 border border-[#006e2f]/30 text-[#006e2f] hover:bg-[#006e2f] hover:text-white transition-colors"
                                >
                                  {new Date(s.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-[#5c647a] mt-4 text-center">
                          Cliquez sur un jour pour voir les créneaux disponibles.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "avis" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                {mentor.reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-gray-300 text-5xl">reviews</span>
                    <p className="text-sm text-[#5c647a] mt-3">Aucun avis publié pour l&apos;instant.</p>
                    <p className="text-xs text-gray-400 mt-1">Soyez le premier à réserver une séance !</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mentor.reviews.map((r) => (
                      <div key={r.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                            {r.student.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.student.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              initials(r.student.name)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-[#191c1e]">
                                {r.student.name ?? "Apprenant"}
                              </p>
                              <span className="text-[11px] text-[#5c647a]">{timeAgo(r.date)}</span>
                            </div>
                            {r.rating && <StarRating rating={r.rating} size={13} />}
                            {r.review && (
                              <p className="text-sm text-[#5c647a] mt-1.5 leading-relaxed">{r.review}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-4">
              <div className="p-6">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {mentor.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mentor.image} alt={mentor.name ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      initials(mentor.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#191c1e] truncate">{mentor.name ?? "Mentor"}</p>
                    <p className="text-xs text-[#5c647a] truncate">{mentor.specialty}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-extrabold text-[#006e2f]">{fmt(mentor.sessionPrice)}</p>
                    <span className="text-sm font-bold text-[#5c647a]">FCFA</span>
                  </div>
                  <p className="text-xs text-[#5c647a] mt-1">
                    {mentor.sessionDuration} min · ≈ {Math.round(mentor.sessionPrice / 655.957)} EUR
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleBookClick}
                  disabled={!mentor.isAvailable}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  {mentor.isAvailable ? "Réserver une séance" : "Indisponible"}
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="w-full mt-2 py-2.5 rounded-xl text-[#191c1e] font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Partager
                </button>

                {/* Trust */}
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">verified_user</span>
                    Paiement 100% sécurisé
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">event_repeat</span>
                    Annulation gratuite jusqu&apos;à 24h
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">support_agent</span>
                    Support disponible 24/7
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">video_camera_front</span>
                    Séance en visio sécurisée
                  </div>
                </div>
              </div>
            </div>

            {/* Back link */}
            <Link
              href="/mentors"
              className="block text-center text-xs font-semibold text-[#5c647a] hover:text-[#006e2f] transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] align-middle">arrow_back</span>{" "}
              Retour à la liste des mentors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
