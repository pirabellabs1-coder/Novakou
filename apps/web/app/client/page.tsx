"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

// ── Skeleton for loading states ──
function KPISkeleton() {
  return (
    <div className="bg-neutral-dark rounded-xl p-5 border border-border-dark animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-border-dark rounded" />
        <div className="w-10 h-10 bg-border-dark rounded-lg" />
      </div>
      <div className="h-8 w-20 bg-border-dark rounded mt-2" />
      <div className="h-3 w-32 bg-border-dark rounded mt-3" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="h-5 w-40 bg-border-dark rounded mb-4" />
      <div className="h-56 bg-border-dark rounded" />
    </div>
  );
}

// ── Pie chart colors ──
const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const PIE_STATUS_LABELS: Record<string, string> = {
  en_cours: "En cours",
  termine: "Terminé",
  livre: "Livré",
  revision: "Révision",
  litige: "Litige",
  annule: "Annulé",
};

export default function ClientDashboard() {
  const store = useClientStore();
  const [error, setError] = useState<string | null>(null);

  // Sync all data on mount
  useEffect(() => {
    try {
      store.syncAll();
    } catch {
      setError("Impossible de charger les donnees du dashboard client.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh stats (5min en dev, 60s en prod)
  useEffect(() => {
    const pollMs = process.env.NODE_ENV === "development" ? 300_000 : 60_000;
    const interval = setInterval(() => {
      store.syncStats();
    }, pollMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute unique freelances from orders
  const uniqueFreelances = useMemo(() => {
    const ids = new Set(store.orders.map((o) => o.freelanceId).filter(Boolean));
    return ids.size;
  }, [store.orders]);

  // Build order status distribution for pie chart
  const orderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    store.orders.forEach((o) => {
      const key = o.status || "autre";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: PIE_STATUS_LABELS[status] || status,
      value: count,
    }));
  }, [store.orders]);

  // Enrich projects with icons/colors
  const myProjects = useMemo(() => {
    return store.projects
      .filter((p) => p.status === "actif")
      .slice(0, 5)
      .map((p) => ({
        ...p,
        icon: p.progress >= 80 ? "rocket_launch" : p.progress >= 50 ? "hub" : "edit",
        iconBg: p.progress >= 80 ? "bg-orange-500/20" : p.progress >= 50 ? "bg-primary/20" : "bg-blue-500/20",
        iconColor: p.progress >= 80 ? "text-orange-400" : p.progress >= 50 ? "text-primary" : "text-blue-400",
        statusLabel: p.status === "actif" ? "En cours" : p.status === "termine" ? "Terminé" : "Brouillon",
        statusColor: p.progress >= 80 ? "text-orange-400" : p.progress >= 50 ? "text-primary" : "text-blue-400",
        barColor: p.progress >= 80 ? "bg-orange-400" : p.progress >= 50 ? "bg-primary" : "bg-blue-400",
      }));
  }, [store.projects]);

  // Recent orders for right panel
  const recentOrders = useMemo(() => store.orders.slice(0, 5), [store.orders]);

  // KPI values
  const activeProjectsCount = store.stats?.activeOrders || store.projects.filter((p) => p.status === "actif").length;
  const totalSpent = store.stats?.summary?.totalEarned || 0;
  const activeOrdersCount = store.stats?.activeOrders || 0;
  const completedOrders = store.stats?.completedOrders || 0;

  const isLoadingStats = store.loading.stats || store.loading.all;

  const STATS = [
    {
      label: "Projets Actifs",
      value: activeProjectsCount.toString(),
      variation: `${completedOrders} terminés`,
      variationColor: "text-primary",
      icon: "folder_copy",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Dépenses Totales",
      value: `${totalSpent.toLocaleString("fr-FR")} \u20AC`,
      variation: `${store.orders.length} commandes`,
      variationColor: "text-emerald-400",
      icon: "payments",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
    {
      label: "Commandes en cours",
      value: activeOrdersCount.toString(),
      variation: `${completedOrders} livrées`,
      variationColor: "text-blue-400",
      icon: "shopping_bag",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      label: "Freelances Engagés",
      value: uniqueFreelances.toString(),
      variation: "Freelances uniques",
      variationColor: "text-slate-400",
      icon: "people",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-3xl text-red-400">error</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Erreur de chargement</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center mb-6">{error}</p>
        <button onClick={() => { setError(null); store.syncAll(); }} className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all">
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
        <p className="text-slate-400 mt-1">Bienvenue, voici un aperçu de votre activité actuelle.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoadingStats
          ? Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
          : STATS.map((s) => (
              <div key={s.label} className="bg-neutral-dark rounded-xl p-5 border border-border-dark">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">{s.label}</p>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", s.iconBg)}>
                    <span className={cn("material-symbols-outlined text-xl", s.iconColor)}>{s.icon}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className={cn("text-xs mt-1", s.variationColor)}>{s.variation}</p>
              </div>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart — Monthly Revenue */}
        {isLoadingStats ? (
          <ChartSkeleton />
        ) : (
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <h2 className="text-base font-bold text-white mb-4">Dépenses Mensuelles</h2>
            {store.stats?.monthlyRevenue && store.stats.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={store.stats.monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v.toLocaleString("fr-FR")} \u20AC`} />} />
                  <Bar dataKey="revenue" fill="rgb(var(--color-primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
                Aucune donnée de dépenses disponible
              </div>
            )}
          </div>
        )}

        {/* Pie Chart — Order Status */}
        {isLoadingStats ? (
          <ChartSkeleton />
        ) : (
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <h2 className="text-base font-bold text-white mb-4">Répartition des Commandes</h2>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
                Aucune commande pour le moment
              </div>
            )}
          </div>
        )}
      </div>

      {/* Projects + Right Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Projets Actifs */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Projets Actifs</h2>
            <Link href="/client/projets" className="text-sm text-primary font-semibold hover:underline">Voir tout</Link>
          </div>

          <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border-dark text-xs text-slate-500 uppercase font-semibold">
              <div className="col-span-5">Nom du projet</div>
              <div className="col-span-4">Progression</div>
              <div className="col-span-3 text-right">Deadline</div>
            </div>

            {/* Table rows */}
            {store.loading.all || store.loading.projects ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border-dark/50 animate-pulse">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-border-dark rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-border-dark rounded" />
                      <div className="h-3 w-20 bg-border-dark rounded" />
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="h-2 flex-1 bg-border-dark rounded-full" />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <div className="h-4 w-20 bg-border-dark rounded" />
                  </div>
                </div>
              ))
            ) : myProjects.length > 0 ? (
              myProjects.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border-dark/50 hover:bg-white/[0.02] transition-colors items-center">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", p.iconBg)}>
                      <span className={cn("material-symbols-outlined text-lg", p.iconColor)}>{p.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.category}</p>
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 w-8">{p.progress}%</span>
                    <div className="flex-1 h-2 bg-border-dark rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", p.barColor)} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={cn("text-xs font-semibold", p.statusColor)}>{p.statusLabel}</span>
                  </div>
                  <div className="col-span-3 text-right text-sm text-slate-400">
                    {p.deadline || "N/A"}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-slate-500 text-sm">
                <span className="material-symbols-outlined text-3xl mb-2 block">folder_off</span>
                Aucun projet actif
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Dernières Commandes */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <h3 className="text-base font-bold text-white mb-4">Dernières Commandes</h3>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((o) => (
                  <Link key={o.id} href={`/client/commandes/${o.id}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-border-dark flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-slate-400 text-lg">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">{o.serviceTitle}</p>
                      <p className="text-xs text-slate-500">#{o.id.slice(-4)} · {o.status}</p>
                    </div>
                    <span className="text-sm font-bold text-white flex-shrink-0">{o.amount.toLocaleString("fr-FR")} \u20AC</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Aucune commande</p>
              )}
            </div>
            <Link href="/client/commandes" className="block text-center text-sm text-primary font-semibold mt-4 py-2 border border-border-dark rounded-lg hover:bg-primary/5 transition-colors">
              Voir tout l&apos;historique
            </Link>
          </div>

          {/* Resume financier */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 relative overflow-hidden">
            <p className="text-primary font-bold text-sm mb-2">Total dépensé</p>
            <p className="text-4xl font-bold text-white">{totalSpent.toLocaleString("fr-FR")} \u20AC</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Commandes terminées</span>
                <span className="font-bold text-emerald-400">{completedOrders}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Projets actifs</span>
                <span className="font-bold text-blue-400">{activeProjectsCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Freelances engagés</span>
                <span className="font-bold text-violet-400">{uniqueFreelances}</span>
              </div>
            </div>
            {/* Decorative */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-600/20 rounded-full" />
            <div className="absolute -bottom-2 -right-1 w-16 h-16 bg-slate-600/10 rounded-full" />
          </div>

          {/* Activité récente */}
          {store.activities.length > 0 && (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <h3 className="text-base font-bold text-white mb-4">Activité Récente</h3>
              <div className="space-y-3">
                {store.activities.slice(0, 6).map((a) => (
                  <Link key={a.id} href={a.link} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-border-dark flex items-center justify-center flex-shrink-0">
                      <span className={cn("material-symbols-outlined text-base", a.color)}>{a.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">{a.message}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-sm group-hover:text-primary transition-colors">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
