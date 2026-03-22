"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";
import {
  BarChart, LineChart, PieChart, AreaChart, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Bar, Line, Pie, Area,
} from "recharts";

import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { CHART_COLORS } from "@/lib/design-tokens";

const COLORS = CHART_COLORS.series;
const PERIODS: { value: "7d" | "30d" | "3m" | "6m" | "1y"; label: string }[] = [
  { value: "7d", label: "7j" },
  { value: "30d", label: "30j" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1an" },
];

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <span className="material-symbols-outlined text-4xl mb-2">analytics</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function SectionHeader({ title, onExport }: { title: string; onExport: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-white">{title}</h2>
      <button onClick={onExport} className="px-2 py-1 text-[10px] text-slate-400 hover:text-white border border-border-dark rounded-md hover:bg-border-dark transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">download</span>CSV
      </button>
    </div>
  );
}

export default function AgenceAnalytics() {
  const {
    stats, services, orders, members, reviews, reviewSummary,
    financeSummary, timePeriod, setTimePeriod, syncAll, isLoading,
  } = useAgencyStore();
  const { addToast } = useToastStore();

  useEffect(() => { syncAll(); }, [syncAll]);

  // ── Derived data ──

  const monthlyRevenue = useMemo(() => stats?.monthlyRevenue ?? [], [stats]);
  const weeklyOrders = useMemo(() => stats?.weeklyOrders ?? [], [stats]);
  const profileViews = useMemo(() => stats?.profileViews ?? [], [stats]);
  const conversionRate = stats?.conversionRate ?? 0;

  const servicePerf = useMemo(
    () => services.map((s) => ({ title: s.title, views: s.views, orderCount: s.orderCount, revenue: s.revenue, rating: s.rating })),
    [services],
  );

  const memberRevenue = useMemo(
    () => members.map((m) => ({ name: m.name, revenue: m.revenue })),
    [members],
  );

  const trafficSources = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const cat = o.category || "Autre";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const recurringVsNew = useMemo(() => {
    const clientOrderCount = new Map<string, number>();
    orders.forEach((o) => clientOrderCount.set(o.clientId, (clientOrderCount.get(o.clientId) ?? 0) + 1));
    let recurring = 0;
    let newClients = 0;
    clientOrderCount.forEach((count) => { if (count > 1) recurring++; else newClients++; });
    return [
      { name: "Récurrents", value: recurring },
      { name: "Nouveaux", value: newClients },
    ];
  }, [orders]);

  const ratingEvolution = useMemo(() => {
    if (!reviews.length) return [];
    const sorted = [...reviews].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let cumSum = 0;
    return sorted.map((r, i) => {
      cumSum += r.rating;
      return { date: r.createdAt.slice(0, 10), avg: Math.round((cumSum / (i + 1)) * 100) / 100 };
    });
  }, [reviews]);

  const revenueByCategory = useMemo(() => {
    const map = new Map<string, number>();
    services.forEach((s) => {
      const cat = s.categoryName || "Autre";
      map.set(cat, (map.get(cat) ?? 0) + s.revenue);
    });
    return Array.from(map.entries()).map(([name, revenue]) => ({ name, revenue }));
  }, [services]);

  // NPS from reviews
  const nps = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.length;
    const promoters = reviews.filter((r) => r.rating >= 4.5).length;
    const detractors = reviews.filter((r) => r.rating <= 2.5).length;
    const passives = total - promoters - detractors;
    const pctProm = Math.round((promoters / total) * 100);
    const pctDet = Math.round((detractors / total) * 100);
    const pctPas = 100 - pctProm - pctDet;
    return { score: pctProm - pctDet, promoters: pctProm, passives: pctPas, detractors: pctDet };
  }, [reviews]);

  // ── CSV export helpers ──

  const exportMonthlyRevenue = useCallback(() => {
    downloadCsv("ca-par-mois.csv", ["Mois", "Revenu"], monthlyRevenue.map((r) => [r.month, String(r.revenue)]));
    addToast("success", "Export CSV CA par mois téléchargé");
  }, [monthlyRevenue, addToast]);

  const exportWeeklyOrders = useCallback(() => {
    downloadCsv("commandes-semaine.csv", ["Semaine", "Commandes"], weeklyOrders.map((w) => [w.week, String(w.orders)]));
    addToast("success", "Export CSV commandes téléchargé");
  }, [weeklyOrders, addToast]);

  const exportServicePerf = useCallback(() => {
    downloadCsv("performance-services.csv", ["Service", "Vues", "Commandes", "Revenu", "Note"], servicePerf.map((s) => [s.title, String(s.views), String(s.orderCount), String(s.revenue), String(s.rating)]));
    addToast("success", "Export CSV services téléchargé");
  }, [servicePerf, addToast]);

  const exportMemberRevenue = useCallback(() => {
    downloadCsv("performance-membres.csv", ["Membre", "Revenu"], memberRevenue.map((m) => [m.name, String(m.revenue)]));
    addToast("success", "Export CSV membres téléchargé");
  }, [memberRevenue, addToast]);

  const exportRevenueByCategory = useCallback(() => {
    downloadCsv("revenus-categorie.csv", ["Catégorie", "Revenu"], revenueByCategory.map((c) => [c.name, String(c.revenue)]));
    addToast("success", "Export CSV catégories téléchargé");
  }, [revenueByCategory, addToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + period filter */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Performance de l&apos;équipe et métriques de l&apos;agence.</p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-dark border border-border-dark rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setTimePeriod(p.value)} className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", timePeriod === p.value ? "bg-primary text-white" : "text-slate-400 hover:text-white")}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* NPS */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <h2 className="font-bold text-white mb-4">Satisfaction Clients (NPS)</h2>
        {nps ? (
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className={cn("text-5xl font-black", nps.score >= 50 ? "text-primary" : nps.score >= 0 ? "text-amber-400" : "text-red-400")}>{nps.score}</p>
              <p className="text-xs text-slate-500 mt-1">Score NPS</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-3 bg-border-dark rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${nps.promoters}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${nps.passives}%` }} />
                  <div className="h-full bg-red-400" style={{ width: `${nps.detractors}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 font-semibold">Promoteurs {nps.promoters}%</span>
                <span className="text-amber-400 font-semibold">Passifs {nps.passives}%</span>
                <span className="text-red-400 font-semibold">Détracteurs {nps.detractors}%</span>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState text="Aucun avis pour calculer le NPS" />
        )}
      </div>

      {/* Row: CA par mois + Commandes par semaine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <SectionHeader title="CA par mois" onExport={exportMonthlyRevenue} />
          {monthlyRevenue.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f2e" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="#14B835" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Aucune donnée de revenus" />}
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <SectionHeader title="Commandes par semaine" onExport={exportWeeklyOrders} />
          {weeklyOrders.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weeklyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f2e" />
                <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="orders" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: "#0EA5E9" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Aucune commande" />}
        </div>
      </div>

      {/* Performance par service (table) */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="p-5 border-b border-border-dark">
          <SectionHeader title="Performance par service" onExport={exportServicePerf} />
        </div>
        {servicePerf.length ? (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                <th className="px-5 py-3 text-left font-semibold">Service</th>
                <th className="px-5 py-3 text-left font-semibold">Vues</th>
                <th className="px-5 py-3 text-left font-semibold">Commandes</th>
                <th className="px-5 py-3 text-left font-semibold">Revenu</th>
                <th className="px-5 py-3 text-left font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {servicePerf.map((s) => (
                <tr key={s.title} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-white truncate max-w-[220px]">{s.title}</td>
                  <td className="px-5 py-3 text-sm text-slate-300">{s.views}</td>
                  <td className="px-5 py-3 text-sm text-slate-300">{s.orderCount}</td>
                  <td className="px-5 py-3 text-sm text-primary font-semibold">{s.revenue.toLocaleString("fr-FR")} &euro;</td>
                  <td className="px-5 py-3"><span className="text-sm font-semibold text-yellow-400 flex items-center gap-0.5"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>{s.rating.toFixed(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState text="Aucun service publié" />}
      </div>

      {/* Row: Performance par membre + Vues profil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <SectionHeader title="Performance par membre" onExport={exportMemberRevenue} />
          {memberRevenue.length ? (
            <ResponsiveContainer width="100%" height={Math.max(200, memberRevenue.length * 44)}>
              <BarChart data={memberRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f2e" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Aucun membre dans l'équipe" />}
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <SectionHeader title="Vues profil" onExport={() => {
            downloadCsv("vues-profil.csv", ["Date", "Vues"], profileViews.map((v) => [v.date, String(v.views)]));
            addToast("success", "Export CSV vues téléchargé");
          }} />
          {profileViews.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={profileViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f2e" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="views" stroke="#14B835" fill="#14B835" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Aucune vue enregistrée" />}
        </div>
      </div>

      {/* Row: Sources de trafic + Clients récurrents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Sources de trafic (par catégorie)</h2>
          {trafficSources.length ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={trafficSources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {trafficSources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {trafficSources.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-300 flex-1">{s.name}</span>
                    <span className="text-white font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState text="Aucune commande pour analyser le trafic" />}
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Clients récurrents vs nouveaux</h2>
          {orders.length ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={recurringVsNew} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    <Cell fill="#14B835" />
                    <Cell fill="#0EA5E9" />
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {recurringVsNew.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? "#14B835" : "#0EA5E9" }} />
                    <span className="text-slate-300 flex-1">{d.name}</span>
                    <span className="text-white font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState text="Aucune commande" />}
        </div>
      </div>

      {/* Row: Taux de conversion + Evolution note moyenne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Taux de conversion</h2>
          <div className="flex items-center gap-6 mb-4">
            <p className="text-5xl font-black text-primary">{conversionRate.toFixed(1)}%</p>
            <p className="text-sm text-slate-400">des visiteurs deviennent clients</p>
          </div>
          {profileViews.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={profileViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f2e" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="views" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Aucune donnée" />}
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Évolution note moyenne</h2>
          {ratingEvolution.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ratingEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f2e" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis domain={[0, 5]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="avg" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Aucun avis" />}
        </div>
      </div>

      {/* Revenus par catégorie */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
        <SectionHeader title="Revenus par catégorie" onExport={exportRevenueByCategory} />
        {revenueByCategory.length ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f2e" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revenueByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 pt-4 border-t border-border-dark flex items-center justify-between">
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-sm font-bold text-primary">{revenueByCategory.reduce((s, c) => s + c.revenue, 0).toLocaleString("fr-FR")} &euro;</span>
            </div>
          </>
        ) : <EmptyState text="Aucun service publié" />}
      </div>
    </div>
  );
}
