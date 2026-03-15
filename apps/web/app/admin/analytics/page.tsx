"use client";

import { useState, useEffect } from "react";
import { useToastStore } from "@/store/dashboard";
import { useAdminStore } from "@/store/admin";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

const COLORS = ["#6C2BD9", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#D946EF"];

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-neutral-dark rounded-xl p-5 border border-border-dark">
            <div className="h-4 w-8 bg-border-dark rounded mb-3" />
            <div className="h-7 w-20 bg-border-dark rounded mb-2" />
            <div className="h-3 w-24 bg-border-dark rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-dark rounded-xl border border-border-dark p-5">
          <div className="h-5 w-40 bg-border-dark rounded mb-4" />
          <div className="h-[250px] bg-border-dark/30 rounded" />
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <div className="h-5 w-36 bg-border-dark rounded mb-4" />
          <div className="h-[200px] bg-border-dark/30 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <div className="h-5 w-40 bg-border-dark rounded mb-4" />
            <div className="h-[200px] bg-border-dark/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30j");
  const { addToast } = useToastStore();
  const { analytics, loading, syncAnalytics } = useAdminStore();

  useEffect(() => {
    syncAnalytics();
  }, [syncAnalytics]);

  if (loading.analytics || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Analytics Plateforme
            </h1>
            <p className="text-slate-400 text-sm mt-1">Vue complete des performances de FreelanceHigh.</p>
          </div>
        </div>
        <AnalyticsSkeleton />
      </div>
    );
  }

  // Derive KPIs from analytics data
  const totalRevenue = analytics.revenueTrends.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = analytics.revenueTrends.reduce((s, r) => s + r.orders, 0);
  const totalCommission = analytics.revenueTrends.reduce((s, r) => s + r.commission, 0);
  const avgConversion = analytics.servicePerformance.avgConversion;
  const avgRating = analytics.servicePerformance.avgRating;

  // Build role pie from registration trends total
  const latestTrend = analytics.registrationTrends.length > 0 ? analytics.registrationTrends[analytics.registrationTrends.length - 1] : null;
  const rolePie = latestTrend ? [
    { name: "Freelances", value: latestTrend.freelances, color: "#dc2626" },
    { name: "Clients", value: latestTrend.clients, color: "#3b82f6" },
    { name: "Agences", value: latestTrend.agencies, color: "#a855f7" },
  ] : [];

  // Revenue chart data from revenueTrends
  const revenueChartData = analytics.revenueTrends.map(r => ({
    month: r.month,
    revenue: r.revenue,
    commissions: r.commission,
  }));

  // Registration bar chart from registrationTrends
  const registrationBarData = analytics.registrationTrends.map(r => ({
    month: r.month,
    value: r.total,
  }));

  // Funnel from conversionFunnel
  const funnel = analytics.conversionFunnel;

  // Revenue by category
  const revenueByCategory = analytics.revenueByCategory;

  // Review stats distribution for pie chart
  const reviewDistribution = analytics.reviewStats.distribution.map(d => ({
    name: `${d.stars} etoile${d.stars > 1 ? "s" : ""}`,
    value: d.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">bar_chart</span>
            Analytics Plateforme
          </h1>
          <p className="text-slate-400 text-sm mt-1">Vue complete des performances de FreelanceHigh.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-border-dark rounded-lg p-0.5">
            {["7j", "30j", "90j", "12m"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", period === p ? "bg-neutral-dark text-primary shadow-sm" : "text-slate-500 hover:text-slate-300")}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => addToast("success", "Rapport exporte")} className="px-3 py-1.5 border border-border-dark rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-primary/5 flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Revenus totaux", value: `EUR${totalRevenue.toLocaleString()}`, icon: "payments", color: "text-primary" },
          { label: "Taux conversion", value: `${avgConversion}%`, icon: "trending_up", color: "text-emerald-400" },
          { label: "Commissions", value: `EUR${totalCommission.toLocaleString()}`, icon: "account_balance", color: "text-blue-400" },
          { label: "Note moyenne", value: avgRating.toFixed(1), icon: "star", color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-neutral-dark rounded-xl p-5 border border-border-dark">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Revenus & Commissions</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C2BD9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C2BD9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `EUR${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip formatter={(v) => `EUR${v.toLocaleString()}`} />} />
              <Area type="monotone" dataKey="revenue" stroke="#6C2BD9" strokeWidth={2} fill="url(#revGrad)" name="Revenus" />
              <Area type="monotone" dataKey="commissions" stroke="#10B981" strokeWidth={2} fill="url(#commGrad)" name="Commissions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Inscriptions recentes</h2>
          {rolePie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={rolePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {rolePie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {rolePie.map(r => (
                  <div key={r.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-xs text-slate-400">{r.name} ({r.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Registrations + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Tendance des inscriptions</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={registrationBarData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="#6C2BD9" radius={[6, 6, 0, 0]} name="Inscriptions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Tunnel de conversion</h2>
          <div className="space-y-3">
            {funnel.map((f, idx) => (
              <div key={f.step}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-300">{f.step}</span>
                  <span className="font-bold text-white">{f.count.toLocaleString()} <span className="text-slate-500 font-normal">({f.rate}%)</span></span>
                </div>
                <div className="h-3 bg-border-dark rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(f.rate, 2)}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by category + Review distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Revenus par categorie</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByCategory} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `EUR${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={130} />
              <Tooltip content={<ChartTooltip formatter={(v) => `EUR${v.toLocaleString()}`} />} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4">Distribution des avis</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{analytics.reviewStats.avgQualite.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 uppercase">Qualite</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{analytics.reviewStats.avgCommunication.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 uppercase">Communication</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{analytics.reviewStats.avgDelai.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 uppercase">Delai</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={reviewDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                paddingAngle={2}
                label={({ name, value }) => value > 0 ? `${name} (${value})` : ""}
              >
                {reviewDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {analytics.reviewStats.reported > 0 && (
            <p className="text-xs text-red-400 text-center mt-2">{analytics.reviewStats.reported} avis signale(s)</p>
          )}
        </div>
      </div>

      {/* Top countries */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
        <h2 className="font-bold text-white mb-4">Activité par pays</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dark">
                <th className="px-4 py-2 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">#</th>
                <th className="px-4 py-2 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pays</th>
                <th className="px-4 py-2 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Utilisateurs</th>
                <th className="px-4 py-2 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Commandes</th>
                <th className="px-4 py-2 text-right text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Revenus</th>
                <th className="px-4 py-2 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Part</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topCountries.map((c, idx) => {
                const totalRev = analytics.topCountries.reduce((s, x) => s + x.revenue, 0);
                const pct = totalRev > 0 ? Math.round((c.revenue / totalRev) * 100) : 0;
                return (
                  <tr key={c.country} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                    <td className="px-4 py-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS[idx % COLORS.length] + "30", color: COLORS[idx % COLORS.length] }}>{idx + 1}</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-300 font-medium">{c.country}</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-white">{c.users}</td>
                    <td className="px-4 py-2 text-center text-sm text-slate-400">{c.orders}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-primary">EUR{c.revenue.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-border-dark rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
