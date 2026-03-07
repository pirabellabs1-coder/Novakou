"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const PERIODS = [
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "3 mois", value: "3m" },
  { label: "1 an", value: "1a" },
];

const TRAFFIC_SOURCES = [
  { name: "Recherche", value: 45, color: "#0e7c66" },
  { name: "Direct", value: 25, color: "#0EA5E9" },
  { name: "Social", value: 20, color: "#f2b705" },
  { name: "Referral", value: 10, color: "#8b5cf6" },
];

export default function StatistiquesPage() {
  const { services, transactions, stats: apiStats, syncStats } = useDashboardStore();
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    syncStats();
  }, [syncStats]);

  const stats = useMemo(() => {
    if (apiStats) {
      const totalViews = apiStats.viewsThisMonth;
      const totalClicks = services.reduce((s, sv) => s + sv.clicks, 0);
      const totalOrders = services.reduce((s, sv) => s + sv.orders, 0);
      return {
        totalViews,
        totalClicks,
        totalOrders,
        totalRevenue: apiStats.summary.totalEarned,
        conversionRate: apiStats.conversionRate,
      };
    }
    const totalViews = services.reduce((s, sv) => s + sv.views, 0);
    const totalClicks = services.reduce((s, sv) => s + sv.clicks, 0);
    const totalOrders = services.reduce((s, sv) => s + sv.orders, 0);
    const totalRevenue = transactions.filter((t) => t.type === "vente" && t.status === "complete").reduce((s, t) => s + t.amount, 0);
    const conversionRate = totalViews > 0 ? ((totalOrders / totalViews) * 100) : 0;
    return { totalViews, totalClicks, totalOrders, totalRevenue, conversionRate };
  }, [services, transactions, apiStats]);

  const monthlyRevenue = apiStats?.monthlyRevenue ?? [];
  const profileViews = apiStats?.profileViews ?? [];
  const weeklyOrders = apiStats?.weeklyOrders ?? [];

  const servicePerf = useMemo(() =>
    services.filter((s) => s.status === "actif").map((s) => ({
      name: s.title.length > 25 ? s.title.slice(0, 25) + "..." : s.title,
      vues: s.views,
      clics: s.clicks,
      commandes: s.orders,
      revenus: s.revenue,
    })).sort((a, b) => b.revenus - a.revenus),
  [services]);

  return (
    <div className="max-w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Statistiques</h2>
          <p className="text-slate-400 mt-1">Analysez vos performances en detail.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                period === p.value ? "bg-primary text-white" : "bg-border-dark text-slate-400 hover:text-slate-200"
              )}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Vues</p>
          <AnimatedCounter value={stats.totalViews} className="text-2xl font-extrabold mt-1 block" />
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Clics</p>
          <AnimatedCounter value={stats.totalClicks} className="text-2xl font-extrabold mt-1 block" />
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Commandes</p>
          <AnimatedCounter value={stats.totalOrders} className="text-2xl font-extrabold mt-1 block" />
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Revenus</p>
          <AnimatedCounter value={stats.totalRevenue} prefix="€" className="text-2xl font-extrabold mt-1 block" />
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Conversion</p>
          <AnimatedCounter value={stats.conversionRate} suffix="%" decimals={1} className="text-2xl font-extrabold mt-1 block" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
          <h3 className="font-bold mb-6">Revenus mensuels</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#293835" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `€${v}`} />
              <Tooltip contentStyle={{ backgroundColor: "#11211e", border: "1px solid #293835", borderRadius: "12px" }} />
              <Line type="monotone" dataKey="revenue" stroke="#0e7c66" strokeWidth={2.5} dot={{ fill: "#0e7c66", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Profile Views Area Chart */}
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
          <h3 className="font-bold mb-6">Vues du profil (semaine)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={profileViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="#293835" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#11211e", border: "1px solid #293835", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="views" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources Donut */}
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
          <h3 className="font-bold mb-6">Sources de trafic</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={TRAFFIC_SOURCES} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {TRAFFIC_SOURCES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#11211e", border: "1px solid #293835", borderRadius: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {TRAFFIC_SOURCES.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400">{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
          <h3 className="font-bold mb-6">Commandes par semaine</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#293835" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#11211e", border: "1px solid #293835", borderRadius: "12px" }} />
              <Bar dataKey="orders" fill="#f2b705" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance per service */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark">
          <h3 className="font-bold">Performances par service</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-bold text-primary uppercase tracking-wider">
                <th className="text-left px-6 py-4">Service</th>
                <th className="text-right px-6 py-4">Vues</th>
                <th className="text-right px-6 py-4">Clics</th>
                <th className="text-right px-6 py-4">Commandes</th>
                <th className="text-right px-6 py-4">Revenus</th>
                <th className="text-right px-6 py-4">Taux conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {servicePerf.map((s) => {
                const rate = s.vues > 0 ? ((s.commandes / s.vues) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={s.name} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold">{s.name}</td>
                    <td className="px-6 py-3 text-sm text-right">{s.vues.toLocaleString("fr-FR")}</td>
                    <td className="px-6 py-3 text-sm text-right">{s.clics}</td>
                    <td className="px-6 py-3 text-sm text-right">{s.commandes}</td>
                    <td className="px-6 py-3 text-sm text-right font-bold">€{s.revenus}</td>
                    <td className="px-6 py-3 text-sm text-right text-primary font-bold">{rate}%</td>
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
