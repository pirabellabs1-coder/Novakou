// Refonte style KAZA — apprenant dashboard — 2026-06-07
// Hero navy gradient + badge Apprenant + KPIs + Continuer + Sessions + Recommandé
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  CalendarDays,
  Search,
  Play,
  ArrowRight,
  Sparkles,
  Star,
  Video,
  GraduationCap,
  Award,
  TrendingUp,
} from "lucide-react";

function formatFcfa(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}
function toEur(n: number) {
  return Math.round(n / 655.957);
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className ?? ""}`} />;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type Enrollment = {
  id: string;
  progress: number;
  completedAt?: string | null;
  formation?: {
    title?: string;
    category?: string;
    customCategory?: string;
    level?: string;
    rating?: number;
    thumbnail?: string;
    duration?: number;
  };
};

type RecommendedFormation = {
  id: string;
  title: string;
  thumbnail?: string;
  category?: string;
  rating?: number;
  price?: number;
  instructorName?: string;
};

function getInitials(name?: string | null): string {
  if (!name) return "AP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ApprenantDashboardPage() {
  const { data: session } = useSession();
  const fullName = session?.user?.name ?? "Apprenant";
  const initials = getInitials(session?.user?.name);

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-dashboard"],
    queryFn: () => fetch("/api/formations/apprenant/dashboard").then((r) => r.json()),
    staleTime: 60_000,
  });

  // Recommandations (basé sur catégories achetées) — endpoint best-effort, fallback silencieux
  const { data: recoResp } = useQuery<{ data?: RecommendedFormation[] }>({
    queryKey: ["apprenant-recommandations"],
    queryFn: () =>
      fetch("/api/formations/apprenant/recommandations")
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] })),
    staleTime: 5 * 60_000,
  });

  const stats = data?.stats ?? {};
  const weekly = (data?.weeklyActivity ?? DAYS.map((day) => ({ day, minutesStudied: 0 }))) as {
    day: string;
    minutesStudied: number;
  }[];
  const recent = (data?.recentEnrollments ?? []) as Enrollment[];
  const totalMin = weekly.reduce((s, d) => s + d.minutesStudied, 0);
  const totalHoursWeek = (totalMin / 60).toFixed(1);

  // "Continuer où vous en êtes" = formations non terminées avec progression > 0
  const inProgress = recent.filter((e) => !e.completedAt && e.progress < 100);
  const continueList = inProgress.length > 0 ? inProgress : recent.slice(0, 4);

  // Progression moyenne sur les formations en cours
  const avgProgress =
    inProgress.length > 0
      ? Math.round(inProgress.reduce((s, e) => s + (e.progress || 0), 0) / inProgress.length)
      : 0;

  // Mentor sessions à venir (mock data — endpoint dédié à venir)
  const upcomingSessions = (data?.upcomingMentorSessions ?? []) as Array<{
    id: string;
    mentorName: string;
    mentorAvatar?: string;
    topic?: string;
    startsAt: string;
    minutesUntil?: number;
  }>;

  const recommendations = (recoResp?.data ?? []).slice(0, 4);

  const totalEnrolled = stats.totalEnrollments ?? 0;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto">
        {/* ── Hero style KAZA — gradient navy + badge Apprenant + avatar + CTAs ── */}
        <header
          className="relative overflow-hidden rounded-3xl mb-8 p-7 md:p-10 text-white"
          style={{
            background: "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)",
          }}
        >
          {/* Halos décoratifs subtils */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-12 w-[360px] h-[360px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0 flex items-center gap-4 md:gap-5">
              {/* Avatar avec initiales — 64x64 rounded-2xl */}
              <div className="w-16 h-16 md:w-[68px] md:h-[68px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-extrabold text-lg md:text-xl flex-shrink-0 shadow-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white text-[#0b2540] shadow-md">
                  Apprenant
                </span>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight truncate">
                  {fullName}
                </h1>
                <p className="text-xs md:text-sm text-white/70 mt-1">
                  Bienvenue sur Novakou · {totalEnrolled} formation{totalEnrolled > 1 ? "s" : ""} achetée
                  {totalEnrolled > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Link
                href="/apprenant/mes-formations"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition-colors"
              >
                <BookOpen className="w-4 h-4" strokeWidth={2.4} />
                Mes formations
              </Link>
              <Link
                href="/explorer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg hover:bg-emerald-600 transition-colors"
              >
                <Search className="w-4 h-4" strokeWidth={2.4} />
                Explorer le catalogue
              </Link>
            </div>
          </div>
        </header>

        {/* ── KPIs : 3 cards (Formations en cours, Heures cette semaine, Sessions mentor) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* KPI 1 — Formations en cours avec progression */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(11, 37, 64, 0.08)", color: "#0b2540" }}
              >
                <BookOpen className="w-5 h-5" strokeWidth={2.2} />
              </div>
              {!isLoading && inProgress.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-3 h-3" strokeWidth={2.6} />
                  {avgProgress}%
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Formations en cours</p>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <SkeletonBlock className="w-12 h-9" />
              ) : (
                <span className="text-3xl font-extrabold text-[#0b2540] tabular-nums tracking-tight">
                  {stats.inProgress ?? 0}
                </span>
              )}
              <span className="text-sm font-bold text-slate-400">/ {totalEnrolled}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {inProgress.length > 0
                ? `Progression moyenne ${avgProgress}%`
                : "Aucune formation en cours"}
            </p>
          </div>

          {/* KPI 2 — Heures d'apprentissage cette semaine */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}
              >
                <Clock className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Cette semaine
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Heures d&apos;apprentissage</p>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <SkeletonBlock className="w-16 h-9" />
              ) : (
                <span className="text-3xl font-extrabold text-[#0b2540] tabular-nums tracking-tight">
                  {totalHoursWeek}
                </span>
              )}
              <span className="text-sm font-bold text-slate-400">h</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {totalMin > 0 ? `${totalMin} min sur 7 jours` : "Reprenez vos leçons aujourd'hui"}
            </p>
          </div>

          {/* KPI 3 — Sessions mentor à venir */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(249, 115, 22, 0.1)", color: "#f97316" }}
              >
                <CalendarDays className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                À venir
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Sessions mentor</p>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <SkeletonBlock className="w-12 h-9" />
              ) : (
                <span className="text-3xl font-extrabold text-[#0b2540] tabular-nums tracking-tight">
                  {stats.mentorSessionsUpcoming ?? 0}
                </span>
              )}
              <span className="text-sm font-bold text-slate-400">prévue(s)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {(stats.mentorSessionsCompleted ?? 0) > 0
                ? `${stats.mentorSessionsCompleted} session(s) effectuée(s)`
                : "Réservez un créneau mentor"}
            </p>
          </div>
        </section>

        {/* ── Section "Continuer où vous en êtes" — carrousel horizontal ── */}
        <section className="mb-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest mb-1 block">
                Reprendre
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0b2540] tracking-tight">
                Continuer où vous en êtes
              </h2>
            </div>
            <Link
              href="/apprenant/mes-formations"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#0b2540] hover:text-emerald-600 transition-colors"
            >
              Voir tout
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
            </div>
          ) : continueList.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-slate-400" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-[#0b2540] mb-1.5">
                Aucune formation en cours
              </h3>
              <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                Commencez votre parcours d&apos;apprentissage en explorant notre catalogue de formations.
              </p>
              <Link
                href="/explorer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" strokeWidth={2.4} />
                Explorer le catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {continueList.slice(0, 4).map((e, idx) => {
                const isHighlight = idx === 0;
                const category = e.formation?.customCategory || e.formation?.category;
                return (
                  <Link
                    key={e.id}
                    href={`/apprenant/formation/${e.id}`}
                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col ${
                      isHighlight ? "border-emerald-200 ring-2 ring-emerald-500/10" : "border-slate-100"
                    }`}
                  >
                    {/* Thumbnail 16:9 */}
                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                      {e.formation?.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.formation.thumbnail}
                          alt={e.formation?.title ?? "Formation"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)",
                          }}
                        >
                          <Video className="w-12 h-12 text-white/20" strokeWidth={1.5} />
                        </div>
                      )}
                      {/* Overlay play button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90 transition-all duration-300">
                          <Play className="w-5 h-5 text-[#0b2540] ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      {/* Badge catégorie */}
                      {category && (
                        <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur text-[#0b2540] shadow-sm">
                          {category}
                        </span>
                      )}
                      {isHighlight && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-md">
                          <Sparkles className="w-3 h-3" strokeWidth={2.6} />
                          Reprendre
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-[#0b2540] text-sm leading-snug line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
                        {e.formation?.title ?? "Formation"}
                      </h3>

                      {/* Progress bar */}
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-medium text-slate-500">Progression</span>
                          <span className="text-[11px] font-extrabold text-emerald-600">
                            {e.progress}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-emerald-400"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section "Prochaines sessions mentor" ── */}
        <section className="mb-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="text-orange-500 font-bold text-[10px] uppercase tracking-widest mb-1 block">
                Mentorat
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0b2540] tracking-tight">
                Prochaines sessions mentor
              </h2>
            </div>
            <Link
              href="/apprenant/sessions"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#0b2540] hover:text-emerald-600 transition-colors"
            >
              Voir tout
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </Link>
          </div>

          {isLoading ? (
            <SkeletonBlock className="h-32" />
          ) : upcomingSessions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-7 h-7 text-orange-400" strokeWidth={1.8} />
              </div>
              <h3 className="text-sm font-bold text-[#0b2540] mb-1">
                Aucune session mentor planifiée
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                Réservez un créneau avec un mentor pour accélérer votre progression et obtenir des
                conseils personnalisés.
              </p>
              <Link
                href="/mentors"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0b2540] text-white text-xs font-bold hover:bg-[#103057] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.6} />
                Trouver un mentor
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {upcomingSessions.slice(0, 3).map((s) => {
                  const canJoin = (s.minutesUntil ?? Infinity) <= 15;
                  return (
                    <li
                      key={s.id}
                      className="p-4 md:p-5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      {s.mentorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.mentorAvatar}
                          alt={s.mentorName}
                          className="w-11 h-11 rounded-2xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-[#0b2540] flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                          {getInitials(s.mentorName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0b2540] truncate">{s.mentorName}</p>
                        {s.topic && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{s.topic}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" strokeWidth={2.4} />
                          {new Date(s.startsAt).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {canJoin ? (
                        <Link
                          href={`/apprenant/sessions/${s.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm flex-shrink-0"
                        >
                          <Play className="w-3.5 h-3.5" fill="currentColor" />
                          Rejoindre
                        </Link>
                      ) : (
                        <Link
                          href={`/apprenant/sessions/${s.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors flex-shrink-0"
                        >
                          Détails
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* ── Section "Recommandé pour vous" — formations suggérées ── */}
        {recommendations.length > 0 && (
          <section className="mb-8">
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="text-[#0b2540] font-bold text-[10px] uppercase tracking-widest mb-1 block">
                  Découvrir
                </span>
                <h2 className="text-lg md:text-xl font-extrabold text-[#0b2540] tracking-tight">
                  Recommandé pour vous
                </h2>
              </div>
              <Link
                href="/explorer"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#0b2540] hover:text-emerald-600 transition-colors"
              >
                Tout explorer
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((reco) => (
                <Link
                  key={reco.id}
                  href={`/formations/${reco.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    {reco.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reco.thumbnail}
                        alt={reco.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)",
                        }}
                      >
                        <BookOpen className="w-12 h-12 text-white/20" strokeWidth={1.5} />
                      </div>
                    )}
                    {reco.category && (
                      <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow-sm">
                        {reco.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-[#0b2540] text-sm leading-snug line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
                      {reco.title}
                    </h3>
                    {reco.instructorName && (
                      <p className="text-xs text-slate-500 mb-2 truncate">par {reco.instructorName}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      {reco.rating ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {reco.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span />
                      )}
                      {reco.price ? (
                        <span className="text-sm font-extrabold text-emerald-600">
                          {formatFcfa(reco.price)}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">Gratuit</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer info — récap dépenses + certificats ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-amber-500" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Certificats
              </p>
              <p className="text-xl font-extrabold text-[#0b2540] tabular-nums">
                {isLoading ? "…" : stats.totalCertificates ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-blue-500" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Formations terminées
              </p>
              <p className="text-xl font-extrabold text-[#0b2540] tabular-nums">
                {isLoading ? "…" : stats.completed ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total investi
              </p>
              {isLoading ? (
                <SkeletonBlock className="w-24 h-6" />
              ) : (
                <>
                  <p className="text-base font-extrabold text-[#0b2540] tabular-nums">
                    {formatFcfa(stats.totalSpentXof ?? 0)}
                  </p>
                  <p className="text-[10px] text-slate-400">≈ {toEur(stats.totalSpentXof ?? 0)} €</p>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
