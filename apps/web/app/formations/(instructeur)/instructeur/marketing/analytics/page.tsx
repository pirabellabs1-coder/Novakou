"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useMarketingAnalytics } from "@/lib/formations/hooks";
import {
  TrendingUp, DollarSign, ShoppingCart, Globe, Eye,
  MousePointerClick, CreditCard, Download,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import StatCard from "@/components/formations/StatCard";
import ChartContainer from "@/components/formations/ChartContainer";
import ConversionFunnel from "@/components/formations/ConversionFunnel";
import EmptyState from "@/components/formations/EmptyState";

// ── Types ────────────────────────────────────────────────────────────────────

interface Overview {
  totalRevenue: number;
  revenueChange: number;
  totalSales: number;
  salesChange: number;
  conversionRate: number;
  conversionChange: number;
  averageOrderValue: number;
  avgOrderChange: number;
}

interface MonthlyRevenue {
  month: string;
  formations: number;
  products: number;
}

interface SalesByProduct {
  name: string;
  type: "formation" | "product";
  sales: number;
  revenue: number;
}

interface TrafficSource {
  source: string;
  visits: number;
  conversions: number;
  revenue: number;
}

interface ConversionFunnelData {
  pageViews: number;
  addToCart: number;
  checkout: number;
  purchased: number;
}

interface TopPage {
  path: string;
  views: number;
  conversions: number;
}

interface GeographicEntry {
  country: string;
  revenue: number;
  sales: number;
}

interface AnalyticsData {
  overview: Overview;
  revenueByMonth: MonthlyRevenue[];
  salesByProduct: SalesByProduct[];
  trafficSources: TrafficSource[];
  conversionFunnel: ConversionFunnelData;
  topPages: TopPage[];
  geographicData: GeographicEntry[];
}

const COLORS = ["#6C2BD9", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const PERIODS = [
  { value: "7d", label: "7j" },
  { value: "30d", label: "30j" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1an" },
];

const COUNTRY_FLAGS: Record<string, string> = {
  SN: "\u{1F1F8}\u{1F1F3}", CI: "\u{1F1E8}\u{1F1EE}", FR: "\u{1F1EB}\u{1F1F7}", CM: "\u{1F1E8}\u{1F1F2}", MA: "\u{1F1F2}\u{1F1E6}",
  BF: "\u{1F1E7}\u{1F1EB}", TN: "\u{1F1F9}\u{1F1F3}", CD: "\u{1F1E8}\u{1F1E9}", ML: "\u{1F1F2}\u{1F1F1}", GN: "\u{1F1EC}\u{1F1F3}",
};

function formatEur(amount: number): string {
  return amount >= 1000 ? `${(amount / 1000).toFixed(1)}k\u20AC` : `${amount.toLocaleString("fr-FR")}\u20AC`;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "")}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

export default function MarketingAnalyticsPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const [period, setPeriod] = useState("30d");

  const { data, isLoading: loading, error: queryError, refetch } = useMarketingAnalytics(period);
  const error = queryError?.message ?? null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <TrendingUp className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={<TrendingUp className="w-10 h-10 text-slate-300" />}
          title={fr ? "Pas encore de données analytics" : "No analytics data yet"}
          description={fr ? "Les analytics apparaîtront après vos premières ventes" : "Analytics will appear after your first sales"}
          ctaLabel={fr ? "Retour marketing" : "Back to marketing"}
          ctaHref="/formations/instructeur/marketing"
        />
      </div>
    );
  }

  const { overview, revenueByMonth, salesByProduct, trafficSources, conversionFunnel, topPages, geographicData } = data;

  // Funnel steps for ConversionFunnel component
  const funnelSteps = [
    { label: fr ? "Pages vues" : "Page views", value: conversionFunnel.pageViews, color: "#6C2BD9" },
    { label: fr ? "Ajout panier" : "Add to cart", value: conversionFunnel.addToCart, color: "#0EA5E9" },
    { label: "Checkout", value: conversionFunnel.checkout, color: "#F59E0B" },
    { label: fr ? "Achat" : "Purchased", value: conversionFunnel.purchased, color: "#10B981" },
  ];

  // Sales by product type for PieChart
  const salesByType = [
    { name: "Formations", value: salesByProduct.filter((s) => s.type === "formation").reduce((a, s) => a + s.revenue, 0) },
    { name: fr ? "Produits" : "Products", value: salesByProduct.filter((s) => s.type === "product").reduce((a, s) => a + s.revenue, 0) },
  ].filter((s) => s.value > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {fr ? "Analytics Marketing" : "Marketing Analytics"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {fr ? "Performances détaillées de vos canaux marketing" : "Detailed performance of your marketing channels"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const allData = [
                ...revenueByMonth.map((r) => ({ ...r, section: "revenue" })),
                ...trafficSources.map((t) => ({ ...t, section: "traffic" })),
              ];
              downloadCSV(allData as unknown as Record<string, unknown>[], "analytics-marketing");
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {PERIODS.map((p) => (
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
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label={fr ? "Revenus totaux" : "Total revenue"} value={formatEur(overview.totalRevenue)} trend={overview.revenueChange} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={ShoppingCart} label={fr ? "Ventes totales" : "Total sales"} value={overview.totalSales} trend={overview.salesChange} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={MousePointerClick} label={fr ? "Taux conversion" : "Conversion rate"} value={`${overview.conversionRate}%`} trend={overview.conversionChange} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={CreditCard} label={fr ? "Panier moyen" : "Avg order"} value={formatEur(overview.averageOrderValue)} trend={overview.avgOrderChange} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Charts grid — 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by month — formations vs products */}
        <ChartContainer
          title={fr ? "Revenus par mois" : "Revenue by month"}
          exportData={revenueByMonth}
          exportFilename="revenus-mois"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByMonth} barGap={2}>
              <defs>
                <linearGradient id="gradFormations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C2BD9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6C2BD9" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="gradProducts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}\u20AC`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v: number, name: string) => [`${v.toLocaleString("fr-FR")}\u20AC`, name]}
              />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="formations" fill="url(#gradFormations)" radius={[6, 6, 0, 0]} name="Formations" />
              <Bar dataKey="products" fill="url(#gradProducts)" radius={[6, 6, 0, 0]} name={fr ? "Produits" : "Products"} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Sales by type — PieChart */}
        <ChartContainer title={fr ? "Ventes par type" : "Sales by type"}>
          {salesByType.length > 0 ? (
            <div className="flex items-center justify-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={salesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {salesByType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                    formatter={(v: number) => [`${v.toLocaleString("fr-FR")}\u20AC`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {salesByType.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-slate-700">{s.name}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white ml-auto">
                      {formatEur(s.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              {fr ? "Aucune donnée" : "No data"}
            </div>
          )}
        </ChartContainer>

        {/* Conversion funnel */}
        <ChartContainer title={fr ? "Entonnoir de conversion" : "Conversion funnel"}>
          <ConversionFunnel steps={funnelSteps} />
        </ChartContainer>

        {/* Traffic sources */}
        <ChartContainer
          title={fr ? "Sources de trafic" : "Traffic sources"}
          exportData={trafficSources}
          exportFilename="trafic-sources"
        >
          {trafficSources.length > 0 ? (
            <div className="space-y-3">
              {trafficSources.map((s, i) => {
                const maxVisits = Math.max(...trafficSources.map((t) => t.visits));
                const widthPct = maxVisits > 0 ? (s.visits / maxVisits) * 100 : 0;
                const convRate = s.visits > 0 ? ((s.conversions / s.visits) * 100).toFixed(1) : "0";
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 capitalize">{s.source}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{s.visits.toLocaleString("fr-FR")} {fr ? "visites" : "visits"}</span>
                        <span className="text-green-600 font-medium">{convRate}%</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatEur(s.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${widthPct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              {fr ? "Aucune donnée" : "No data"}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Bottom section — Top pages + Geographic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">{fr ? "Top pages" : "Top pages"}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(topPages ?? []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <span className="w-6 text-sm font-bold text-slate-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate font-mono">{p.path}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {p.views.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-green-600 font-medium">{p.conversions} conv.</span>
                </div>
              </div>
            ))}
            {(!topPages || topPages.length === 0) && (
              <p className="text-center text-slate-400 text-sm py-8">
                {fr ? "Aucune donnée" : "No data"}
              </p>
            )}
          </div>
        </div>

        {/* Geographic data */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              {fr ? "Données géographiques" : "Geographic data"}
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(geographicData ?? []).slice(0, 8).map((g, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <span className="text-lg">{COUNTRY_FLAGS[g.country] || "\u{1F30D}"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{g.country}</p>
                  <p className="text-xs text-slate-400">{g.sales} {fr ? "ventes" : "sales"}</p>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatEur(g.revenue)}</span>
              </div>
            ))}
            {(!geographicData || geographicData.length === 0) && (
              <p className="text-center text-slate-400 text-sm py-8">
                {fr ? "Aucune donnée géographique" : "No geographic data"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
