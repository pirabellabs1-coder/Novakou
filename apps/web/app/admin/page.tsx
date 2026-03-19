"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAdminStore } from "@/store/admin";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

export default function AdminDashboard() {
  const { dashboardStats, loading, config, syncDashboard, syncConfig } = useAdminStore();

  useEffect(() => {
    syncDashboard();
    syncConfig();
  }, [syncDashboard, syncConfig]);

  // Loading skeleton
  if (loading.dashboard || !dashboardStats) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="h-8 w-48 bg-neutral-dark rounded-lg" />
            <div className="h-4 w-72 bg-neutral-dark rounded-lg mt-2" />
          </div>
          <div className="h-8 w-40 bg-neutral-dark rounded-full" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 h-24" />
          ))}
        </div>

        {/* Chart + alerts skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="md:col-span-2 lg:col-span-2 bg-neutral-dark rounded-xl border border-border-dark h-72" />
          <div className="bg-neutral-dark rounded-xl border border-border-dark h-72" />
        </div>

        {/* Activity feed skeleton */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark h-48" />

        {/* Bottom row skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-neutral-dark rounded-xl border border-border-dark h-56" />
          <div className="bg-neutral-dark rounded-xl border border-border-dark h-56" />
        </div>

        {/* Quick links skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark h-16" />
          ))}
        </div>
      </div>
    );
  }

  const { users, orders, services, finances, disputes, monthlyRevenue, recentOrders, recentUsers, traffic } = dashboardStats;

  const STATS = [
    { label: "Utilisateurs", value: users.totalUsers.toLocaleString(), icon: "people", color: "text-primary", trend: "+8.2%", link: "/admin/utilisateurs" },
    { label: "GMV", value: `€${orders.gmv.toLocaleString()}`, icon: "payments", color: "text-blue-400", trend: "+12.5%", link: "/admin/finances" },
    { label: "Commandes actives", value: orders.active.toString(), icon: "shopping_cart", color: "text-amber-400", link: "/admin/commandes" },
    { label: "Commissions", value: `€${finances.platformRevenue.toLocaleString()}`, icon: "account_balance", color: "text-emerald-400", trend: "+15.1%", link: "/admin/finances" },
    { label: "Litiges", value: disputes.total.toString(), icon: "gavel", color: "text-red-400", link: "/admin/litiges" },
    { label: "Modération", value: services.pendingModeration.toString(), icon: "pending", color: "text-purple-400", link: "/admin/services" },
  ];

  const roleCounts = [
    { role: "Freelances", count: users.freelances, pct: users.totalUsers > 0 ? Math.round((users.freelances / users.totalUsers) * 100) : 0 },
    { role: "Clients", count: users.clients, pct: users.totalUsers > 0 ? Math.round((users.clients / users.totalUsers) * 100) : 0 },
    { role: "Agences", count: users.agencies, pct: users.totalUsers > 0 ? Math.round((users.agencies / users.totalUsers) * 100) : 0 },
  ];

  const rolePie = [
    { name: "Freelances", value: users.freelances, color: "#6C2BD9" },
    { name: "Clients", value: users.clients, color: "#0EA5E9" },
    { name: "Agences", value: users.agencies, color: "#10B981" },
  ];

  // Chart data: map monthlyRevenue to recharts format
  const chartData = monthlyRevenue.map(m => ({
    month: m.month,
    revenue: m.revenue,
    commissions: m.commission,
  }));

  // Build activity feed from recentOrders + recentUsers
  const activities = (() => {
    const acts: { text: string; time: string; icon: string; color: string; link: string }[] = [];

    recentOrders.forEach(o => {
      if (o.status === "en_cours") acts.push({ text: `Commande ${o.id} en cours — ${o.serviceTitle}`, time: o.createdAt, icon: "shopping_cart", color: "text-amber-400", link: "/admin/commandes" });
      else if (o.status === "termine") acts.push({ text: `Commande ${o.id} terminée — €${o.amount}`, time: o.createdAt, icon: "check_circle", color: "text-emerald-400", link: "/admin/commandes" });
      else if (o.status === "litige") acts.push({ text: `Litige ouvert sur ${o.id}`, time: o.createdAt, icon: "gavel", color: "text-red-400", link: "/admin/litiges" });
      else acts.push({ text: `Commande ${o.id} — ${o.serviceTitle} (${o.status})`, time: o.createdAt, icon: "shopping_cart", color: "text-slate-400", link: "/admin/commandes" });
    });

    recentUsers.forEach(u => acts.push({ text: `${u.name} inscrit comme ${u.role}`, time: u.createdAt, icon: "person_add", color: "text-primary", link: "/admin/utilisateurs" }));

    return acts.slice(0, 8);
  })();

  // Dynamic alerts computed from dashboardStats
  const alerts = (() => {
    const list: { title: string; description: string; severity: "haute" | "moyenne"; icon: string; link: string }[] = [];
    if (disputes.total > 0) list.push({ title: `${disputes.total} litige(s) ouvert(s)`, description: "Des litiges nécessitent votre attention", severity: "haute", icon: "gavel", link: "/admin/litiges" });
    if (services.pendingModeration > 0) list.push({ title: `${services.pendingModeration} service(s) en attente`, description: "Des services attendent votre approbation", severity: "moyenne", icon: "pending", link: "/admin/services" });
    if (finances.pendingWithdrawals > 0) list.push({ title: `€${finances.pendingWithdrawals.toLocaleString()} en retraits`, description: "Retraits en attente de traitement", severity: "moyenne", icon: "account_balance_wallet", link: "/admin/finances" });
    return list;
  })();

  // Key metrics
  const completionRate = orders.total > 0 ? Math.round((orders.completed / orders.total) * 100) : 0;
  const avgOrderValue = orders.total > 0 ? Math.round(orders.gmv / orders.total) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Administration</h1>
          <p className="text-slate-400 text-sm mt-1">Vue globale de la plateforme FreelanceHigh.</p>
        </div>
        <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold", config?.maintenanceMode ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400")}>
          <span className={cn("w-2 h-2 rounded-full", config?.maintenanceMode ? "bg-red-400" : "bg-emerald-400 animate-pulse")} />
          {config?.maintenanceMode ? "Mode maintenance" : "Plateforme en ligne"}
        </span>
      </div>

      {/* Stats clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        {STATS.map(s => (
          <Link key={s.label} href={s.link} className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-white group-hover:text-primary transition-colors">{s.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
              {s.trend && <span className="text-[10px] text-emerald-400 font-bold">{s.trend}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Traffic en direct */}
      {traffic && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 lg:p-5">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            Trafic en direct
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-black text-emerald-400">{traffic.activeSessions}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sessions actives</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">{traffic.todayPageViews.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pages vues (24h)</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-black text-blue-400">{traffic.todayUniques.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Visiteurs uniques</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-black text-amber-400">{traffic.avgSessionDuration}s</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Durée moy. session</p>
            </div>
          </div>
          {traffic.topPages.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-dark">
              <p className="text-xs text-slate-500 mb-2">Pages populaires aujourd&apos;hui</p>
              <div className="flex flex-wrap gap-2">
                {traffic.topPages.map((p, i) => (
                  <span key={i} className="px-2 py-1 bg-background-dark rounded-lg text-xs text-slate-300">
                    {p.path} <span className="text-primary font-bold">{p.views}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Revenue chart with recharts */}
        <div className="md:col-span-2 lg:col-span-2 bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Revenus plateforme</h2>
            <div className="flex bg-border-dark rounded-lg p-0.5">
              {["12m"].map(p => (
                <button key={p} className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-neutral-dark text-primary shadow-sm">
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C2BD9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C2BD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip formatter={(v) => `€${v.toLocaleString("fr-FR")}`} />} />
              <Area type="monotone" dataKey="revenue" stroke="#6C2BD9" strokeWidth={2.5} fill="url(#dashGrad)" name="Revenus" />
              <Area type="monotone" dataKey="commissions" stroke="#10B981" strokeWidth={1.5} fill="none" name="Commissions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Alerts */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 lg:p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications_active</span>
            Alertes ({alerts.length})
          </h2>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
              <p className="text-sm text-slate-400 mt-2">Aucune alerte !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <Link key={i} href={a.link} className={cn("block p-3 rounded-xl border transition-colors", a.severity === "haute" ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40")}>
                  <div className="flex items-start gap-2">
                    <span className={cn("material-symbols-outlined text-lg mt-0.5", a.severity === "haute" ? "text-red-400" : "text-amber-400")}>{a.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{a.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 lg:p-5">
        <h2 className="font-bold text-white mb-4">Activité récente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {activities.map((a, i) => (
            <Link key={i} href={a.link} className="flex items-center gap-3 p-3 rounded-xl hover:bg-background-dark/30 transition-colors">
              <span className={cn("material-symbols-outlined text-lg", a.color)}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{a.text}</p>
                <p className="text-[10px] text-slate-500">{a.time}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Users by role */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 lg:p-5">
          <h3 className="font-bold text-white text-sm mb-3">Utilisateurs par rôle</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={rolePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={4}>
                {rolePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {roleCounts.map(r => (
            <div key={r.role} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-300">{r.role}</span>
              <span className="text-sm font-bold text-white">{r.count} ({r.pct}%)</span>
            </div>
          ))}
        </div>

        {/* Key metrics */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 lg:p-5">
          <h3 className="font-bold text-white text-sm mb-3">Métriques clés</h3>
          {[
            { label: "Taux de complétion", value: `${completionRate}%` },
            { label: "Panier moyen", value: `€${avgOrderValue}` },
            { label: "Escrow en cours", value: `€${finances.escrowFunds.toLocaleString()}` },
            { label: "Services actifs", value: `${services.active}` },
            { label: "Transactions totales", value: `${finances.totalTransactions}` },
          ].map(m => (
            <div key={m.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-slate-500">{m.label}</span>
              <span className="text-sm font-bold text-white">{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Catégories", icon: "category", link: "/admin/categories", color: "text-primary" },
          { label: "Blog", icon: "article", link: "/admin/blog", color: "text-blue-400" },
          { label: "KYC", icon: "verified", link: "/admin/kyc", color: "text-amber-400" },
          { label: "Configuration", icon: "settings", link: "/admin/configuration", color: "text-slate-400" },
        ].map(q => (
          <Link key={q.label} href={q.link} className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 flex items-center gap-3 hover:border-primary/30 transition-all group">
            <span className={cn("material-symbols-outlined text-2xl", q.color)}>{q.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{q.label}</p>
            </div>
            <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
