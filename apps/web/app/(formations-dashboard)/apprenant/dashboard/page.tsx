"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)       { return Math.round(n / 655.957); }

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ""}`} />;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="material-symbols-outlined text-[14px] text-amber-400"
          style={{ fontVariationSettings: s <= Math.floor(rating) ? "'FILL' 1" : "'FILL' 0" }}>
          star
        </span>
      ))}
      <span className="text-xs text-[#5c647a] ml-0.5">{rating}</span>
    </div>
  );
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function ApprenantDashboardPage() {
  const { data: session }   = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? "…";

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-dashboard"],
    queryFn: () => fetch("/api/formations/apprenant/dashboard").then((r) => r.json()),
    staleTime: 60_000,
  });

  const stats        = data?.stats        ?? {};
  const weekly       = (data?.weeklyActivity ?? DAYS.map((day) => ({ day, minutesStudied: 0 }))) as { day: string; minutesStudied: number }[];
  const recent       = (data?.recentEnrollments ?? []) as Array<{ id: string; progress: number; formation?: { title?: string; category?: string; level?: string; rating?: number } }>;
  const maxMin       = Math.max(...weekly.map((d) => d.minutesStudied), 1);
  const totalMin     = weekly.reduce((s, d) => s + d.minutesStudied, 0);
  const weekGoalPct  = Math.min(Math.round((totalMin / 300) * 100), 100); // 300 min/week goal

  const lastEnrollment = recent[0];

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-1">
            Bienvenue, {userName} 👋
          </h1>
          <p className="text-[#5c647a] text-sm">
            {isLoading ? "Chargement de vos données…" : weekGoalPct > 0
              ? <>Vous avez complété <span className="font-semibold text-[#006e2f]">{weekGoalPct}%</span> de votre objectif cette semaine.</>
              : "Commencez à apprendre dès aujourd'hui !"}
          </p>
        </div>
        <Link href="/explorer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 flex-shrink-0 self-start"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
          <span className="material-symbols-outlined text-[16px]">explore</span>
          Explorer
        </Link>
      </div>

      {/* Continue learning */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-[#191c1e] mb-4">Continuer l&apos;apprentissage</h2>
        {isLoading ? (
          <SkeletonBlock className="h-40" />
        ) : !lastEnrollment ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-[#5c647a] mb-3 block">school</span>
            <p className="text-sm text-[#5c647a] mb-4">Vous n&apos;avez pas encore de formation en cours.</p>
            <Link href="/explorer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
              Explorer le catalogue
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-72 h-44 md:h-auto flex-shrink-0 relative flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #006e2f 0%, #22c55e 100%)" }}>
                <span className="material-symbols-outlined text-white/30 text-[80px]">play_circle</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40">
                    <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-5 md:p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {lastEnrollment.formation?.category && (
                    <span className="bg-[#006e2f]/10 text-[#006e2f] text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      {lastEnrollment.formation.category}
                    </span>
                  )}
                  {lastEnrollment.formation?.level && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      {lastEnrollment.formation.level}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[#191c1e] text-lg mb-4 leading-snug">
                  {lastEnrollment.formation?.title ?? "Formation"}
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-[#5c647a]">Progression</span>
                    <span className="text-xs font-bold text-[#006e2f]">{lastEnrollment.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${lastEnrollment.progress}%`, background: "linear-gradient(to right, #006e2f, #22c55e)" }} />
                  </div>
                </div>
                <Link href={`/apprenant/formation/${lastEnrollment.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                  Continuer
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Weekly activity + purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#191c1e]">Activité cette semaine</h2>
            <span className="text-xs text-[#5c647a] font-medium">{totalMin} min totales</span>
          </div>
          {isLoading ? <SkeletonBlock className="h-28" /> : (
            <div className="flex items-end gap-2 h-28">
              {weekly.map((d) => {
                const pct = (d.minutesStudied / maxMin) * 100;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-[#5c647a]">
                      {d.minutesStudied > 0 ? `${d.minutesStudied}m` : ""}
                    </span>
                    <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                      <div className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${Math.max(pct, d.minutesStudied > 0 ? 6 : 0)}%`,
                          background: d.minutesStudied > 0 ? "linear-gradient(to top, #006e2f, #22c55e)" : "#f3f4f6",
                          minHeight: d.minutesStudied > 0 ? "4px" : "2px",
                        }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#5c647a]">{d.day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#191c1e]">Mes achats</h2>
            <Link href="/apprenant/depenses" className="text-xs text-[#006e2f] font-semibold hover:underline">Voir tout</Link>
          </div>
          {isLoading ? <SkeletonBlock className="h-32" /> : (
            <div className="space-y-3">
              {[
                { icon: "play_circle", label: "Formations vidéo", value: stats.totalEnrollments ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
                { icon: "inventory_2",  label: "Produits numériques", value: stats.totalProducts ?? 0, color: "text-amber-600", bg: "bg-amber-50" },
                { icon: "support_agent", label: "Sessions mentor",    value: stats.mentorSessions ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                    <span className={`material-symbols-outlined text-[16px] ${item.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                  <span className="flex-1 text-xs text-[#5c647a]">{item.label}</span>
                  <span className="text-sm font-extrabold text-[#191c1e]">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#5c647a]">Total dépensé</span>
              {isLoading ? <SkeletonBlock className="w-24 h-5" /> : (
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#006e2f]">{formatFcfa(stats.totalSpentXof ?? 0)}</p>
                  <p className="text-[10px] text-[#5c647a]">≈ {toEur(stats.totalSpentXof ?? 0)} €</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-[#191c1e] mb-4">Vos statistiques</h2>
        {isLoading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><SkeletonBlock className="h-28" /><SkeletonBlock className="h-28" /><SkeletonBlock className="h-28" /><SkeletonBlock className="h-28" /></div> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: "play_circle",        iconColor: "text-blue-500",     bg: "bg-blue-50",         label: "Formations",       value: String(stats.totalEnrollments ?? 0),  sub: "acquises" },
              { icon: "check_circle",       iconColor: "text-[#006e2f]",    bg: "bg-[#006e2f]/10",    label: "Terminées",        value: String(stats.completed ?? 0),         sub: "formations" },
              { icon: "workspace_premium",  iconColor: "text-purple-500",   bg: "bg-purple-50",       label: "Certificats",      value: String(stats.totalCertificates ?? 0), sub: "obtenus" },
              { icon: "schedule",           iconColor: "text-amber-500",    bg: "bg-amber-50",        label: "En cours",         value: String(stats.inProgress ?? 0),        sub: "formations" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
                  <span className={`material-symbols-outlined text-[20px] ${stat.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                </div>
                <p className="text-2xl font-extrabold text-[#191c1e]">{stat.value}</p>
                <p className="text-xs font-semibold text-[#191c1e] mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-[#5c647a]">{stat.sub}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent enrollments */}
      {!isLoading && recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#191c1e]">Formations récentes</h2>
            <Link href="/apprenant/mes-formations" className="text-xs text-[#006e2f] font-semibold hover:underline flex items-center gap-1">
              Voir tout <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((e) => (
              <Link key={e.id} href={`/apprenant/formation/${e.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group block">
                <div className="h-28 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #006e2f 0%, #22c55e 100%)" }}>
                  <span className="material-symbols-outlined text-white/20 text-[48px] group-hover:scale-110 transition-transform duration-300">play_circle</span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-[#191c1e] text-xs leading-snug line-clamp-2 mb-2">
                    {e.formation?.title ?? "Formation"}
                  </p>
                  <div className="flex items-center justify-between">
                    {e.formation?.rating ? <StarRating rating={e.formation.rating} /> : <span />}
                    <span className="text-xs font-bold text-[#006e2f]">{e.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full rounded-full" style={{ width: `${e.progress}%`, background: "linear-gradient(to right, #006e2f, #22c55e)" }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
