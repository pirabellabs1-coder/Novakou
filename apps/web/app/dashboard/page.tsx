"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  livre: { label: "Livre", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  en_attente: { label: "En attente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  revision: { label: "Revision", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  termine: { label: "Termine", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  annule: { label: "Annule", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export default function DashboardPage() {
  const { services, orders, transactions, conversations, stats: apiStats, syncStats } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [chartPeriod, setChartPeriod] = useState("6 derniers mois");

  useEffect(() => {
    syncStats();
  }, [syncStats]);

  const stats = useMemo(() => {
    // Use API stats if available, fall back to local calculation
    if (apiStats) {
      const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0);
      const completedOrders = apiStats.completedOrders;
      const totalOrders = apiStats.totalOrders;
      const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
      return {
        totalRevenue: apiStats.summary.totalEarned,
        pendingRevenue: apiStats.summary.pending,
        activeOrders: apiStats.activeOrders,
        unreadMessages,
        completionRate,
      };
    }
    const totalRevenue = transactions
      .filter((t) => t.type === "vente" && t.status === "complete")
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingRevenue = transactions
      .filter((t) => t.type === "vente" && t.status === "en_attente")
      .reduce((sum, t) => sum + t.amount, 0);
    const activeOrders = orders.filter((o) => ["en_cours", "en_attente", "revision"].includes(o.status)).length;
    const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0);
    const completedOrders = orders.filter((o) => o.status === "termine").length;
    const totalOrders = orders.filter((o) => o.status !== "annule").length;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    return { totalRevenue, pendingRevenue, activeOrders, unreadMessages, completionRate };
  }, [transactions, orders, conversations, apiStats]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [orders]
  );

  const conversionData = useMemo(() => {
    const totalViews = services.reduce((s, sv) => s + sv.views, 0);
    const totalClicks = services.reduce((s, sv) => s + sv.clicks, 0);
    const totalOrders = services.reduce((s, sv) => s + sv.orders, 0);
    return [
      { name: "Commandes", value: totalOrders, color: "#0e7c66" },
      { name: "Clics", value: totalClicks - totalOrders, color: "#f2b705" },
      { name: "Vues restantes", value: totalViews - totalClicks, color: "#293835" },
    ];
  }, [services]);

  const monthlyRevenue = apiStats?.monthlyRevenue ?? [];
  const weeklyOrders = apiStats?.weeklyOrders ?? [];

  function handleExport() {
    const csv = ["Mois,Revenus,Commandes", ...monthlyRevenue.map((r) => `${r.month},${r.revenue},${r.orders}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revenus-freelancehigh.csv";
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Export CSV telecharge !");
  }

  return (
    <div className="max-w-full space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Apercu du Tableau de bord</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Bienvenue, gerez vos revenus et vos projets en un coup d&apos;oeil.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 rounded-lg text-sm font-semibold hover:shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exporter
          </button>
          <Link
            href="/dashboard/services/creer"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nouveau Service
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">+12.5%</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Revenus totaux</p>
          <AnimatedCounter value={stats.totalRevenue} prefix="€" className="text-2xl font-bold mt-1 block" />
        </div>

        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <span className="text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded">en attente</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">En attente</p>
          <AnimatedCounter value={stats.pendingRevenue} prefix="€" className="text-2xl font-bold mt-1 block" />
        </div>

        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <span className="material-symbols-outlined">list_alt</span>
            </div>
            <span className="text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded">actives</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Commandes en cours</p>
          <AnimatedCounter value={stats.activeOrders} className="text-2xl font-bold mt-1 block" />
        </div>

        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <span className="material-symbols-outlined">mail</span>
            </div>
            {stats.unreadMessages > 0 && (
              <span className="text-purple-500 text-xs font-bold bg-purple-500/10 px-2 py-1 rounded">+{stats.unreadMessages}</span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Messages non lus</p>
          <AnimatedCounter value={stats.unreadMessages} className="text-2xl font-bold mt-1 block" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold leading-tight">Revenus mensuels</h3>
              <div className="flex items-center gap-2 mt-1">
                <AnimatedCounter value={stats.totalRevenue} prefix="€" className="text-3xl font-black" />
                <span className="text-primary text-sm font-bold">+8% vs mois dernier</span>
              </div>
            </div>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-lg text-sm font-medium px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
            >
              <option>6 derniers mois</option>
              <option>Annee 2026</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#293835" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `€${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#11211e", border: "1px solid #293835", borderRadius: "12px", fontSize: "13px" }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [`€${value}`, "Revenus"]}
              />
              <Bar dataKey="revenue" fill="#0e7c66" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion donut */}
        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Taux de conversion</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {conversionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#11211e", border: "1px solid #293835", borderRadius: "12px", fontSize: "13px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {conversionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="font-bold">{item.value.toLocaleString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Chart + Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly orders */}
        <div className="lg:col-span-2 bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Commandes par semaine</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#293835" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#11211e", border: "1px solid #293835", borderRadius: "12px", fontSize: "13px" }}
              />
              <Line type="monotone" dataKey="orders" stroke="#f2b705" strokeWidth={2.5} dot={{ fill: "#f2b705", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Objectives */}
        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Objectifs de la semaine</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Chiffre d&apos;affaires cible</span>
                <span className="text-primary font-bold">75%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-primary/10 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: "75%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Projets termines</span>
                <span className="text-blue-500 font-bold">4/6</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-primary/10 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: "66%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Taux de completion</span>
                <span className="text-amber-500 font-bold">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-primary/10 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.completionRate}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-dashed border-primary/30">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              Conseil du jour
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
              Repondez aux messages en moins de 15 minutes pour augmenter votre visibilite de 20%.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-primary/10 flex justify-between items-center">
          <h3 className="text-lg font-bold">Commandes recentes</h3>
          <Link href="/dashboard/commandes" className="text-primary text-sm font-bold hover:underline">Voir tout</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Projet / Service</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
              {recentOrders.map((order) => {
                const s = STATUS_CONFIG[order.status];
                return (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm">{order.serviceTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{order.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                          {order.clientAvatar}
                        </div>
                        <span className="text-sm font-medium">{order.clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(order.deadline).toLocaleDateString("fr-FR")}</td>
                    <td className="px-6 py-4 text-sm font-bold">€{order.amount.toLocaleString("fr-FR")}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s?.color ?? ""}`}>
                        {s?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/commandes/${order.id}`} className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </Link>
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
