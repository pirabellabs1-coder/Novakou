// Refonte design "Stitch" — apprenant dashboard — vert Novakou — 2026-06-13
// Header sobre + KPI compacts + Continuer + Sessions mentor + Recommandé
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
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StKpiCompact,
  StSectionTitle,
  StAvatar,
  StProgressBar,
  ST,
} from "@/components/stitch";

function formatFcfa(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}
function toEur(n: number) {
  return Math.round(n / 655.957);
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl ${className ?? ""}`} style={{ background: "#f3f6f4" }} />;
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
  const firstName = fullName.split(" ")[0] || fullName;

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        {/* ── Header sobre Stitch — "Bonjour {prénom}" + CTA ── */}
        <StPageHeader
          title={`Bonjour ${firstName}`}
          subtitle={
            <>
              Bienvenue sur Novakou ·{" "}
              <span className="font-extrabold" style={{ color: ST.green }}>
                {totalEnrolled} formation{totalEnrolled > 1 ? "s" : ""} achetée{totalEnrolled > 1 ? "s" : ""}
              </span>
            </>
          }
          actions={
            <>
              <StButton href="/apprenant/mes-formations" variant="secondary" icon={BookOpen}>
                Mes formations
              </StButton>
              <StButton href="/explorer" icon={Search}>
                Explorer le catalogue
              </StButton>
            </>
          }
        />

        {/* ── KPIs : 3 cards compactes (en cours, heures, sessions mentor) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          <StCard className="!p-[16px_18px]">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>Formations en cours</span>
              {!isLoading && inProgress.length > 0 && (
                <StChip tone="green" icon={TrendingUp}>{avgProgress} %</StChip>
              )}
            </div>
            <div className="flex items-baseline gap-2 my-2">
              {isLoading ? (
                <SkeletonBlock className="w-12 h-8" />
              ) : (
                <span className="text-[21px] md:text-[23px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                  {stats.inProgress ?? 0}
                </span>
              )}
              <span className="text-[13px] font-bold" style={{ color: ST.textMuted }}>/ {totalEnrolled}</span>
            </div>
            <p className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
              {inProgress.length > 0 ? `Progression moyenne ${avgProgress} %` : "Aucune formation en cours"}
            </p>
          </StCard>

          <StCard className="!p-[16px_18px]">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>Heures d&apos;apprentissage</span>
              <Clock size={18} style={{ color: ST.green }} />
            </div>
            <div className="flex items-baseline gap-2 my-2">
              {isLoading ? (
                <SkeletonBlock className="w-16 h-8" />
              ) : (
                <span className="text-[21px] md:text-[23px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                  {totalHoursWeek}
                </span>
              )}
              <span className="text-[13px] font-bold" style={{ color: ST.textMuted }}>h</span>
            </div>
            <p className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
              {totalMin > 0 ? `${totalMin} min sur 7 jours` : "Reprenez vos leçons aujourd'hui"}
            </p>
          </StCard>

          <StCard className="!p-[16px_18px]">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>Sessions mentor</span>
              <CalendarDays size={18} style={{ color: ST.green }} />
            </div>
            <div className="flex items-baseline gap-2 my-2">
              {isLoading ? (
                <SkeletonBlock className="w-12 h-8" />
              ) : (
                <span className="text-[21px] md:text-[23px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                  {stats.mentorSessionsUpcoming ?? 0}
                </span>
              )}
              <span className="text-[13px] font-bold" style={{ color: ST.textMuted }}>prévue(s)</span>
            </div>
            <p className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
              {(stats.mentorSessionsCompleted ?? 0) > 0
                ? `${stats.mentorSessionsCompleted} session(s) effectuée(s)`
                : "Réservez un créneau mentor"}
            </p>
          </StCard>
        </div>

        {/* ── Section "Continuer où vous en êtes" ── */}
        <section className="mb-5">
          <StSectionTitle
            action={
              <Link href="/apprenant/mes-formations" className="hidden sm:inline-flex items-center gap-1 text-[12px] font-extrabold hover:underline" style={{ color: ST.green }}>
                Voir tout <ArrowRight size={14} />
              </Link>
            }
          >
            Continuer où vous en êtes
          </StSectionTitle>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
            </div>
          ) : continueList.length === 0 ? (
            <StCard className="!p-10 text-center">
              <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
                <GraduationCap size={32} style={{ color: ST.green }} strokeWidth={1.8} />
              </div>
              <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>
                Aucune formation en cours
              </h3>
              <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                Commencez votre parcours d&apos;apprentissage en explorant notre catalogue de formations.
              </p>
              <StButton href="/explorer" icon={Search}>Explorer le catalogue</StButton>
            </StCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {continueList.slice(0, 4).map((e, idx) => {
                const isHighlight = idx === 0;
                const category = e.formation?.customCategory || e.formation?.category;
                return (
                  <Link
                    key={e.id}
                    href={`/apprenant/formation/${e.id}`}
                    className="rounded-[18px] overflow-hidden hover:-translate-y-1 transition-all duration-300 group flex flex-col bg-white"
                    style={{
                      border: isHighlight ? `1.5px solid ${ST.greenBright}` : `1px solid ${ST.cardBorder}`,
                      boxShadow: "0 1px 3px rgba(16,52,32,.05)",
                    }}
                  >
                    {/* Thumbnail 16:9 */}
                    <div className="aspect-video relative overflow-hidden" style={{ background: "#eef2ef" }}>
                      {e.formation?.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.formation.thumbnail}
                          alt={e.formation?.title ?? "Formation"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: ST.gradient }}>
                          <Video className="w-12 h-12 text-white/25" strokeWidth={1.5} />
                        </div>
                      )}
                      {/* Overlay play button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90 transition-all duration-300">
                          <Play className="w-5 h-5 ml-0.5" style={{ color: ST.green }} fill="currentColor" />
                        </div>
                      </div>
                      {/* Badge catégorie */}
                      {category && (
                        <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/95 backdrop-blur shadow-sm" style={{ color: ST.green }}>
                          {category}
                        </span>
                      )}
                      {isHighlight && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-md" style={{ background: ST.gradient }}>
                          <Sparkles className="w-3 h-3" strokeWidth={2.6} />
                          Reprendre
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-extrabold text-[13.5px] leading-snug line-clamp-2 mb-2 transition-colors" style={{ color: ST.text }}>
                        {e.formation?.title ?? "Formation"}
                      </h3>

                      {/* Progress bar */}
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-bold" style={{ color: ST.textSecondary }}>Progression</span>
                          <span className="text-[11px] font-extrabold" style={{ color: ST.green }}>{e.progress}%</span>
                        </div>
                        <StProgressBar percent={e.progress} height={6} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section "Prochaines sessions mentor" ── */}
        <section className="mb-5">
          <StSectionTitle
            action={
              <Link href="/apprenant/sessions" className="hidden sm:inline-flex items-center gap-1 text-[12px] font-extrabold hover:underline" style={{ color: ST.green }}>
                Voir tout <ArrowRight size={14} />
              </Link>
            }
          >
            Prochaines sessions mentor
          </StSectionTitle>

          {isLoading ? (
            <SkeletonBlock className="h-32" />
          ) : upcomingSessions.length === 0 ? (
            <StCard className="!p-8 text-center">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-3" style={{ background: ST.greenSoft }}>
                <CalendarDays size={28} style={{ color: ST.green }} strokeWidth={1.8} />
              </div>
              <h3 className="text-[13.5px] font-extrabold mb-1" style={{ color: ST.text }}>
                Aucune session mentor planifiée
              </h3>
              <p className="text-[12px] font-semibold mb-4 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                Réservez un créneau avec un mentor pour accélérer votre progression et obtenir des
                conseils personnalisés.
              </p>
              <StButton href="/mentors" variant="dark" size="sm" icon={Sparkles}>Trouver un mentor</StButton>
            </StCard>
          ) : (
            <StCard noPadding className="overflow-hidden">
              <ul>
                {upcomingSessions.slice(0, 3).map((s, i) => {
                  const canJoin = (s.minutesUntil ?? Infinity) <= 15;
                  return (
                    <li
                      key={s.id}
                      className="p-4 md:p-5 flex items-center gap-4 hover:bg-[#f7faf8] transition-colors"
                      style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                    >
                      <StAvatar name={s.mentorName} src={s.mentorAvatar} size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-extrabold truncate" style={{ color: ST.text }}>{s.mentorName}</p>
                        {s.topic && (
                          <p className="text-[12px] font-semibold truncate mt-0.5" style={{ color: ST.textSecondary }}>{s.topic}</p>
                        )}
                        <p className="text-[11px] font-semibold mt-1 flex items-center gap-1" style={{ color: ST.textFaint }}>
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
                        <StButton href={`/apprenant/sessions/${s.id}`} size="sm" icon={Play}>Rejoindre</StButton>
                      ) : (
                        <StButton href={`/apprenant/sessions/${s.id}`} size="sm" variant="secondary" iconRight={ArrowRight}>Détails</StButton>
                      )}
                    </li>
                  );
                })}
              </ul>
            </StCard>
          )}
        </section>

        {/* ── Section "Recommandé pour vous" ── */}
        {recommendations.length > 0 && (
          <section className="mb-5">
            <StSectionTitle
              action={
                <Link href="/explorer" className="hidden sm:inline-flex items-center gap-1 text-[12px] font-extrabold hover:underline" style={{ color: ST.green }}>
                  Tout explorer <ArrowRight size={14} />
                </Link>
              }
            >
              Recommandé pour vous
            </StSectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {recommendations.map((reco) => (
                <Link
                  key={reco.id}
                  href={`/formations/${reco.id}`}
                  className="rounded-[18px] overflow-hidden hover:-translate-y-1 transition-all duration-300 group flex flex-col bg-white"
                  style={{ border: `1px solid ${ST.cardBorder}`, boxShadow: "0 1px 3px rgba(16,52,32,.05)" }}
                >
                  <div className="aspect-video relative overflow-hidden" style={{ background: "#eef2ef" }}>
                    {reco.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reco.thumbnail}
                        alt={reco.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: ST.gradient }}>
                        <BookOpen className="w-12 h-12 text-white/25" strokeWidth={1.5} />
                      </div>
                    )}
                    {reco.category && (
                      <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-sm" style={{ background: ST.gradient }}>
                        {reco.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-extrabold text-[13.5px] leading-snug line-clamp-2 mb-2 transition-colors" style={{ color: ST.text }}>
                      {reco.title}
                    </h3>
                    {reco.instructorName && (
                      <p className="text-[12px] font-semibold mb-2 truncate" style={{ color: ST.textSecondary }}>par {reco.instructorName}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      {reco.rating ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-extrabold" style={{ color: ST.text }}>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {reco.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span />
                      )}
                      {reco.price ? (
                        <span className="text-[13.5px] font-extrabold" style={{ color: ST.green }}>
                          {formatFcfa(reco.price)}
                        </span>
                      ) : (
                        <span className="text-[12px] font-extrabold" style={{ color: ST.green }}>Gratuit</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer info — certificats / terminées / total investi ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <StKpiCompact
            label="Certificats"
            value={isLoading ? "…" : stats.totalCertificates ?? 0}
            icon={Award}
            tone="amber"
          />
          <StKpiCompact
            label="Formations terminées"
            value={isLoading ? "…" : stats.completed ?? 0}
            icon={GraduationCap}
            tone="blue"
          />
          <StCard className="!p-[14px_18px] flex items-center gap-[13px]">
            <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: ST.greenSoft, color: ST.green }}>
              <TrendingUp size={19} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <SkeletonBlock className="w-24 h-6" />
              ) : (
                <>
                  <div className="text-[16px] md:text-[18px] font-extrabold tabular-nums truncate" style={{ color: ST.text }}>
                    {formatFcfa(stats.totalSpentXof ?? 0)}
                  </div>
                  <div className="text-[11px] font-semibold" style={{ color: ST.textFaint }}>≈ {toEur(stats.totalSpentXof ?? 0)} €</div>
                </>
              )}
              <div className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>Total investi</div>
            </div>
          </StCard>
        </div>
      </main>
    </div>
  );
}
