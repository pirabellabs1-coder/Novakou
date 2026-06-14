"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Star,
  UserX,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Headset,
  BadgeCheck,
  Trophy,
  Users,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  CalendarPlus,
  Tag,
  PiggyBank,
  ShoppingBag,
  MessageSquareText,
  Share2,
  ShieldCheck,
  Repeat,
  Video,
} from "lucide-react";
import { stripHtml } from "@/lib/sanitize-html";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import TrackPageView from "@/components/tracking/TrackPageView";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MentorReview {
  id: string;
  rating: number | null;
  review: string | null;
  date: string;
  student: { id: string; name: string | null; image: string | null };
}

interface MentorSessionPackPublic {
  id: string;
  title: string;
  sessionsCount: number;
  price: number;
  originalPrice: number;
  sessionDurationMinutes: number;
  description: string | null;
  validityDays: number;
  savingPct: number;
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
  sessionPacks?: MentorSessionPackPublic[];
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
        <Star
          key={s}
          size={size}
          className={`text-yellow-400 ${s <= Math.floor(rating) ? "fill-yellow-400" : ""}`}
        />
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function MentorPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: mentorId } = use(params);
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
        const res = await fetch(`/api/formations/public/mentors/${mentorId}`);
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
  }, [mentorId]);

  useEffect(() => {
    async function loadSlots() {
      try {
        const from = startOfMonth(calMonth);
        // Load current month + next month for the mini calendar
        const to = new Date(calMonth.getFullYear(), calMonth.getMonth() + 2, 0);
        const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
        const res = await fetch(`/api/formations/mentors/${mentorId}/slots?${qs.toString()}`);
        if (!res.ok) return;
        const { data } = await res.json();
        setPreviewSlots(data.slots ?? []);
      } catch {
        // silent
      }
    }
    if (mentor?.isAvailable) loadSlots();
  }, [mentorId, mentor?.isAvailable, calMonth]);

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
        `/connexion?callbackUrl=/formations/mentors/${mentorId}/reserver?slot=${encodeURIComponent(slot.start)}`,
      );
      return;
    }
    router.push(`/mentors/${mentorId}/reserver?slot=${encodeURIComponent(slot.start)}`);
  }

  function handleBookClick() {
    if (!session) {
      router.push(`/connexion?callbackUrl=/formations/mentors/${mentorId}/reserver`);
      return;
    }
    router.push(`/mentors/${mentorId}/reserver`);
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
          <UserX size={48} className="text-gray-300 mx-auto" />
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Mentor introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Ce profil n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/mentors"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const isTopMentor = mentor.rating >= 4.5 && mentor.reviewsCount > 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TrackPageView
        type="mentor_view"
        entityType="mentor"
        entityId={mentor.id}
        metadata={{ name: mentor.name, specialty: mentor.specialty, sessionPrice: mentor.sessionPrice }}
      />
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-[#5c647a]">
          <Link href="/" className="hover:text-[#006e2f] transition-colors">Accueil</Link>
          <ChevronRight size={12} />
          <Link href="/mentors" className="hover:text-[#006e2f] transition-colors">Mentors</Link>
          <ChevronRight size={12} />
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
                  <Headset size={100} className="text-white/30" />
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
                    <BadgeCheck size={13} />
                    VÉRIFIÉ
                  </span>
                )}
                {isTopMentor && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                    <Trophy size={13} />
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
                  <Users size={14} />
                  <span className="font-semibold text-[#191c1e]">{fmt(mentor.totalStudents)}</span>
                  apprenant{mentor.totalStudents > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <CalendarCheck size={14} />
                  <span className="font-semibold text-[#191c1e]">{fmt(mentor.totalSessions)}</span>
                  séance{mentor.totalSessions > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <CalendarDays size={14} />
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
                    <TiptapRenderer content={mentor.bio} />
                  ) : (
                    <p className="text-sm text-[#5c647a] leading-relaxed">
                      Ce mentor n&apos;a pas encore rédigé sa bio.
                    </p>
                  )}
                </div>

                {/* Domaine d'expertise */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">Domaine d&apos;expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.domain && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#006e2f]/10 text-[#006e2f]">
                        <Tag size={14} />
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

                {/* Packs de séances — affichés seulement si dispos */}
                {mentor.sessionPacks && mentor.sessionPacks.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag size={20} className="text-[#006e2f]" />
                      <h2 className="text-lg font-extrabold text-[#191c1e]">Packs de séances</h2>
                    </div>
                    <p className="text-sm text-[#5c647a] mb-4">
                      Économisez en réservant plusieurs séances d&apos;avance
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mentor.sessionPacks.map((pack) => (
                        <div
                          key={pack.id}
                          className="border-2 border-gray-100 hover:border-[#006e2f]/30 rounded-2xl p-5 transition-all flex flex-col"
                        >
                          {pack.savingPct > 0 && (
                            <span className="self-start inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 mb-3">
                              <PiggyBank size={12} />
                              -{pack.savingPct}%
                            </span>
                          )}
                          <h3 className="font-bold text-[#191c1e] text-base mb-1">{pack.title}</h3>
                          <p className="text-xs text-[#5c647a] mb-3">
                            {pack.sessionsCount} séance{pack.sessionsCount > 1 ? "s" : ""} · {pack.sessionDurationMinutes} min · Validité {pack.validityDays}j
                          </p>
                          {pack.description && (
                            <p className="text-xs text-[#5c647a] mb-4 line-clamp-3">{pack.description}</p>
                          )}
                          <div className="mt-auto">
                            <div className="flex items-baseline gap-2 mb-3">
                              {pack.savingPct > 0 && (
                                <span className="text-xs text-[#9ca3af] line-through">
                                  {new Intl.NumberFormat("fr-FR").format(pack.originalPrice)} FCFA
                                </span>
                              )}
                              <span className="text-xl font-extrabold text-[#191c1e]">
                                {new Intl.NumberFormat("fr-FR").format(pack.price)} FCFA
                              </span>
                            </div>
                            <button
                              onClick={() => router.push(`/checkout?pid=${pack.id}&kind=mentor-pack`)}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
                              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                            >
                              <ShoppingBag size={16} />
                              Acheter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disponibilités — mini calendar */}
                {mentor.isAvailable && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-lg font-extrabold text-[#191c1e] flex items-center gap-2">
                        <CalendarCheck size={20} className="text-[#006e2f]" />
                        Disponibilités
                      </h2>
                      <button
                        onClick={handleBookClick}
                        className="text-xs font-semibold text-[#006e2f] hover:underline flex items-center gap-1"
                      >
                        Tous les créneaux
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {previewSlots.length === 0 ? (
                      <div className="text-center py-6">
                        <CalendarX size={36} className="text-gray-300 mx-auto" />
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
                            <ChevronLeft size={18} />
                          </button>
                          <p className="text-sm font-bold text-[#191c1e]">
                            {MONTHS_FR[calMonth.getMonth()]} {calMonth.getFullYear()}
                          </p>
                          <button
                            onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5c647a]"
                            aria-label="Mois suivant"
                          >
                            <ChevronRight size={18} />
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
                    <MessageSquareText size={48} className="text-gray-300 mx-auto" />
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
                  <CalendarPlus size={18} />
                  {mentor.isAvailable ? "Réserver une séance" : "Indisponible"}
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="w-full mt-2 py-2.5 rounded-xl text-[#191c1e] font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  Partager
                </button>

                {/* Trust */}
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <ShieldCheck size={16} className="text-[#006e2f]" />
                    Paiement 100% sécurisé
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <Repeat size={16} className="text-[#006e2f]" />
                    Annulation gratuite jusqu&apos;à 24h
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <Headset size={16} className="text-[#006e2f]" />
                    Support disponible 24/7
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <Video size={16} className="text-[#006e2f]" />
                    Séance en visio sécurisée
                  </div>
                </div>
              </div>
            </div>

            {/* Back link */}
            <Link
              href="/mentors"
              className="inline-flex items-center justify-center gap-1 w-full text-center text-xs font-semibold text-[#5c647a] hover:text-[#006e2f] transition-colors"
            >
              <ArrowLeft size={14} />
              Retour à la liste des mentors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
