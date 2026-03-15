"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { RankProgress } from "@/components/dashboard/RankProgress";
import { CHART_COLORS } from "@/lib/design-tokens";

const PERIOD_OPTIONS = [
  { label: "7j", value: "7d" as const },
  { label: "30j", value: "30d" as const },
  { label: "3m", value: "3m" as const },
  { label: "6m", value: "6m" as const },
  { label: "1an", value: "1y" as const },
];

const COLORS = CHART_COLORS.series;

export default function AgencyDashboard() {
  const {
    syncAll, isLoading, stats, financeSummary, services, orders, reviews,
    reviewSummary, activities, members, timePeriod, setTimePeriod,
  } = useAgencyStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      syncAll();
    } catch {
      setError("Impossible de charger les donnees du dashboard agence.");
    }
  }, [syncAll]);

  // Auto-refresh stats every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      useAgencyStore.getState().syncStats();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Computed stats from real data
  const totalCA = financeSummary?.totalEarned ?? 0;
  const activeOrders = stats?.activeOrders ?? 0;
  const memberCount = members.length || 1; // At least the owner
  const avgRating = reviewSummary?.avgRating ?? 0;
  const activeServices = stats?.servicesCount?.active ?? 0;
  const conversionRate = stats?.conversionRate ?? 0;

  const STATS_CARDS = [
    { label: "CA total", value: `\u20AC${totalCA.toLocaleString("fr-FR")}`, icon: "trending_up", color: "text-primary" },
    { label: "Commandes actives", value: activeOrders.toString(), icon: "shopping_cart", color: "text-blue-400" },
    { label: "Membres", value: memberCount.toString(), icon: "groups", color: "text-purple-400" },
    { label: "Note moyenne", value: avgRating > 0 ? `${avgRating.toFixed(1)}/5` : "—", icon: "star", color: "text-amber-400" },
    { label: "Services actifs", value: activeServices.toString(), icon: "work", color: "text-emerald-400" },
    { label: "Taux conversion", value: `${conversionRate.toFixed(1)}%`, icon: "percent", color: "text-orange-400" },
  ];

  // Monthly revenue data for BarChart
  const monthlyRevenue = useMemo(() => {
    return stats?.monthlyRevenue ?? [];
  }, [stats]);

  // Weekly orders data for LineChart
  const weeklyOrders = useMemo(() => {
    return stats?.weeklyOrders ?? [];
  }, [stats]);

  // Service category distribution for PieChart
  const categoryDistribution = useMemo(() => {
    const cats = new Map<string, number>();
    services.forEach((s) => {
      const cat = s.categoryName || "Autre";
      cats.set(cat, (cats.get(cat) ?? 0) + 1);
    });
    return Array.from(cats.entries()).map(([name, value]) => ({ name, value }));
  }, [services]);

  // Profile views for AreaChart
  const profileViews = useMemo(() => {
    return stats?.profileViews ?? [];
  }, [stats]);

  const fmt = (n: number) => `\u20AC${n.toLocaleString("fr-FR")}`;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-3xl text-red-400">error</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Erreur de chargement</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center mb-6">{error}</p>
        <button onClick={() => { setError(null); syncAll(); }} className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all">
          Reessayer
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-neutral-dark rounded-lg w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-4 h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-neutral-dark rounded-xl border border-border-dark h-72" />
          <div className="bg-neutral-dark rounded-xl border border-border-dark h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Tableau de bord</h1>
          <p className="text-slate-400 text-sm mt-1">Vue globale de votre agence</p>
        </div>
        <div className="flex gap-2">
          <Link href="/agence/services/creer" className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Nouveau service
          </Link>
          <Link href="/agence/equipe" className="px-4 py-2.5 bg-neutral-dark border border-border-dark text-white text-sm font-bold rounded-xl hover:bg-border-dark transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Inviter
          </Link>
        </div>
      </div>

      {/* Time period filter */}
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.value}
            onClick={() => setTimePeriod(p.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              timePeriod === p.value
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STATS_CARDS.map((s) => (
          <div key={s.label} className="bg-neutral-dark rounded-xl border border-border-dark p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={cn("material-symbols-outlined text-xl", s.color)}>{s.icon}</span>
            </div>
            <p className="text-xl font-black text-white">{isLoading ? "..." : s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CA par mois - BarChart */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">CA par mois</h2>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt(v)} />} />
                <Bar dataKey="revenue" fill="rgb(20, 184, 53)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Pas encore de données
            </div>
          )}
        </div>

        {/* Commandes par semaine - LineChart */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Commandes par semaine</h2>
          {weeklyOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="orders" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 4, fill: "#0EA5E9" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Pas encore de données
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Répartition services par catégorie - PieChart */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Services par catégorie</h2>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                  {categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
              Aucun service
            </div>
          )}
          {categoryDistribution.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {categoryDistribution.map((c, i) => (
                <span key={c.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {c.name} ({c.value})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Taux de conversion - AreaChart */}
        <div className="lg:col-span-2 bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Vues du profil</h2>
          {profileViews.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={profileViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B835" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B835" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="views" stroke="#14B835" strokeWidth={2} fill="url(#viewsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
              Pas encore de données
            </div>
          )}
        </div>
      </div>

      {/* Rank Progress */}
      <RankProgress completedSales={stats?.completedOrders ?? 0} />

      {/* Activity Feed */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
        <h2 className="font-bold text-white mb-4">Activité récente</h2>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((a) => (
              <Link key={a.id} href={a.link} className="flex items-start gap-3 hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors">
                <span className={cn("material-symbols-outlined text-lg mt-0.5", a.color)}>{a.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{a.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-500 text-sm">chevron_right</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">inbox</span>
            <p className="text-slate-500 text-sm">Aucune activite pour le moment</p>
            <p className="text-slate-600 text-xs mt-1">Les actions de votre agence apparaitront ici</p>
          </div>
        )}
      </div>
    </div>
  );
}
