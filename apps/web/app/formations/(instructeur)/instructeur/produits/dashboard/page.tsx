"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useInstructorProductStats } from "@/lib/formations/hooks";
import {
  DollarSign, Users, ShoppingCart, TrendingUp,
  Package, Star, ChevronRight, Clock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import StatCard from "@/components/formations/StatCard";
import ChartContainer from "@/components/formations/ChartContainer";
import EmptyState from "@/components/formations/EmptyState";

interface ProductStats {
  totalRevenue: number;
  revenueThisWeek: number;
  totalClients: number;
  totalSales: number;
  revenueTrend: number;
  salesTrend: number;
  revenueByMonth: { month: string; revenue: number }[];
  topProducts: { id: string; title: string; type: string; sales: number; revenue: number; rating: number }[];
  recentPurchases: { buyerName: string; productTitle: string; amount: number; date: string }[];
}

const PERIOD_OPTIONS = [
  { value: "30d", label: "30j" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1an" },
];

export default function ProductDashboardPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const { status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState("30d");

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/formations/connexion");
  }, [status, router]);

  const {
    data: rawStats,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useInstructorProductStats(period);

  const stats = rawStats as ProductStats | undefined;
  const error = queryError ? (queryError as Error).message : null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Package className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={<Package className="w-10 h-10 text-slate-300" />}
          title={fr ? "Commencez à vendre" : "Start selling"}
          description={fr ? "Créez vos produits numériques pour voir les statistiques ici" : "Create digital products to see stats here"}
          ctaLabel={fr ? "Créer un produit" : "Create a product"}
          ctaHref="/formations/instructeur/produits/creer"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {fr ? "Dashboard Produits" : "Products Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {fr ? "Performance de vos produits numériques" : "Your digital products performance"}
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p.value ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label={fr ? "Revenus totaux" : "Total revenue"}
          value={`${stats.totalRevenue.toLocaleString("fr-FR")}€`}
          trend={stats.revenueTrend}
          color="text-green-600"
          bg="bg-green-50"
          sparkData={stats.revenueByMonth.map((m) => ({ value: m.revenue }))}
        />
        <StatCard
          icon={TrendingUp}
          label={fr ? "Revenus semaine" : "Weekly revenue"}
          value={`${stats.revenueThisWeek.toLocaleString("fr-FR")}€`}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={Users}
          label={fr ? "Clients" : "Clients"}
          value={stats.totalClients}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          icon={ShoppingCart}
          label={fr ? "Ventes totales" : "Total sales"}
          value={stats.totalSales}
          trend={stats.salesTrend}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Revenue chart */}
      <ChartContainer
        title={fr ? "Revenus par mois" : "Revenue by month"}
        exportData={stats.revenueByMonth}
        exportFilename="produits-revenus"
      >
        {stats.revenueByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.revenueByMonth} barSize={24}>
              <defs>
                <linearGradient id="productRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C2BD9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6C2BD9" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v: number) => [`${v.toLocaleString("fr-FR")}€`, fr ? "Revenus" : "Revenue"]}
              />
              <Bar dataKey="revenue" fill="url(#productRevGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={<TrendingUp className="w-8 h-8 text-slate-300" />}
            title={fr ? "Aucune donnée" : "No data"}
            description={fr ? "Les revenus apparaîtront après vos premières ventes" : "Revenue will show after first sales"}
          />
        )}
      </ChartContainer>

      {/* Bottom row — Top products + Recent purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">{fr ? "Top produits" : "Top products"}</h3>
            <Link href="/formations/instructeur/produits" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
              {fr ? "Voir tout" : "See all"} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(stats.topProducts ?? []).slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.sales} {fr ? "ventes" : "sales"}</p>
                </div>
                {p.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    <Star className="w-3 h-3 fill-amber-400" /> {p.rating.toFixed(1)}
                  </div>
                )}
                <span className="text-sm font-bold text-slate-900 dark:text-white">{p.revenue.toLocaleString("fr-FR")}€</span>
              </div>
            ))}
            {(!stats.topProducts || stats.topProducts.length === 0) && (
              <p className="text-center text-slate-400 text-sm py-8">{fr ? "Aucun produit vendu" : "No products sold"}</p>
            )}
          </div>
        </div>

        {/* Recent purchases */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">{fr ? "Achats récents" : "Recent purchases"}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(stats.recentPurchases ?? []).slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{(p.buyerName || "?").charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.buyerName}</p>
                  <p className="text-xs text-slate-500 truncate">{p.productTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">+{p.amount}€</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end">
                    <Clock className="w-2.5 h-2.5" /> {p.date}
                  </p>
                </div>
              </div>
            ))}
            {(!stats.recentPurchases || stats.recentPurchases.length === 0) && (
              <p className="text-center text-slate-400 text-sm py-8">{fr ? "Aucun achat récent" : "No recent purchases"}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
