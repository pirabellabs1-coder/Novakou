"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { countryToFlag, countryName } from "@/lib/tracking/geo";

type Period = "7d" | "30d" | "90d" | "12m" | "all";

type StatsData = {
  overview: {
    revenue: number;
    netRevenue: number;
    orders: number;
    uniqueCustomers: number;
    avgOrder: number;
    deltaRevenue: number;
    deltaOrders: number;
  };
  revenueOverTime: { date: string; amount: number; orders: number }[];
  salesByCountry: { country: string; count: number; revenue: number }[];
  viewsByCountry: { country: string; count: number }[];
  topProducts: { id: string; title: string; type: string; sales: number; revenue: number }[];
  ratingDist: { star: number; count: number }[];
  conversionFunnel: { views: number; productViews: number; purchases: number; conversionRate: number };
  monthlyTrend: { month: string; revenue: number; orders: number }[];
  revenueByType: { type: string; value: number }[];
};

const BRAND = "#006e2f";
const ACCENT = "#22c55e";
const CYAN = "#22d3ee";
const AMBER = "#f59e0b";
const PURPLE = "#a855f7";
const DONUT_COLORS = [BRAND, ACCENT, CYAN, AMBER, PURPLE, "#ef4444", "#3b82f6"];

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function Kpi({
  label,
  value,
  sub,
  delta,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  icon: string;
  tone: "brand" | "accent" | "cyan" | "purple";
}) {
  const toneMap = {
    brand: { bg: `bg-[${BRAND}]/10`, fg: `text-[${BRAND}]` },
    accent: { bg: "bg-green-50", fg: "text-green-600" },
    cyan: { bg: "bg-cyan-50", fg: "text-cyan-600" },
    purple: { bg: "bg-purple-50", fg: "text-purple-600" },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneMap.bg}`}>
          <span
            className={`material-symbols-outlined text-[22px] ${toneMap.fg}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
        {typeof delta === "number" && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              delta >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-extrabold text-[#191c1e] leading-snug">{value}</p>
      {sub && <p className="text-[11px] text-[#5c647a] mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-[#191c1e] text-base">{title}</h2>
          {subtitle && <p className="text-xs text-[#5c647a] mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function StatistiquesPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const { data, isLoading } = useQuery<{ data: StatsData | null }>({
    queryKey: ["vendeur-stats", period],
    queryFn: () => fetch(`/api/formations/vendeur/stats?period=${period}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const d = data?.data;
  const overview = d?.overview;
  const revenueOverTime = d?.revenueOverTime ?? [];
  const salesByCountry = d?.salesByCountry ?? [];
  const viewsByCountry = d?.viewsByCountry ?? [];
  const topProducts = d?.topProducts ?? [];
  const funnel = d?.conversionFunnel;
  const monthlyTrend = d?.monthlyTrend ?? [];
  const revenueByType = d?.revenueByType ?? [];

  // Merge views + sales by country for the combined table
  const countryMap = new Map<string, { country: string; views: number; sales: number; revenue: number }>();
  for (const v of viewsByCountry) {
    countryMap.set(v.country, { country: v.country, views: v.count, sales: 0, revenue: 0 });
  }
  for (const s of salesByCountry) {
    const entry = countryMap.get(s.country) || { country: s.country, views: 0, sales: 0, revenue: 0 };
    entry.sales = s.count;
    entry.revenue = s.revenue;
    countryMap.set(s.country, entry);
  }
  const countryRows = [...countryMap.values()]
    .sort((a, b) => b.revenue - a.revenue || b.views - a.views)
    .slice(0, 10);

  const funnelMax = funnel ? Math.max(funnel.views, funnel.productViews, funnel.purchases, 1) : 1;

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Statistiques</h1>
          <p className="text-sm text-[#5c647a] mt-1">Analyse détaillée de vos performances et audience</p>
        </div>
        {/* Period selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 self-start sm:self-auto">
          {([
            { key: "7d", label: "7j" },
            { key: "30d", label: "30j" },
            { key: "90d", label: "90j" },
            { key: "12m", label: "1 an" },
            { key: "all", label: "Tout" },
          ] as { key: Period; label: string }[]).map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                period === p.key ? "bg-white text-[#191c1e] shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          label="Revenus bruts"
          value={overview ? `${formatFCFA(overview.revenue)} FCFA` : "—"}
          sub={overview ? `Net : ${formatFCFA(overview.netRevenue)}` : ""}
          delta={overview?.deltaRevenue}
          icon="payments"
          tone="brand"
        />
        <Kpi
          label="Commandes"
          value={overview ? overview.orders.toLocaleString("fr-FR") : "—"}
          sub="Transactions validées"
          delta={overview?.deltaOrders}
          icon="shopping_bag"
          tone="accent"
        />
        <Kpi
          label="Clients uniques"
          value={overview ? overview.uniqueCustomers.toLocaleString("fr-FR") : "—"}
          sub="Acheteurs distincts"
          icon="group"
          tone="cyan"
        />
        <Kpi
          label="Panier moyen"
          value={overview ? `${formatFCFA(overview.avgOrder)} FCFA` : "—"}
          sub="Par commande"
          icon="receipt_long"
          tone="purple"
        />
      </div>

      {/* Revenue over time + Revenue by type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Évolution du chiffre d'affaires"
            subtitle={period === "all" ? "Depuis le début" : `Sur les ${period === "7d" ? "7 derniers jours" : period === "30d" ? "30 derniers jours" : period === "90d" ? "90 derniers jours" : "12 derniers mois"}`}
          >
            {isLoading ? (
              <div className="h-[280px] bg-gray-50 animate-pulse rounded-xl" />
            ) : revenueOverTime.length === 0 && monthlyTrend.every((m) => m.revenue === 0) ? (
              <EmptyState icon="show_chart" label="Aucune donnée pour cette période" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueOverTime.length > 0 ? revenueOverTime : monthlyTrend.map((m) => ({ date: m.month, amount: m.revenue, orders: m.orders }))}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v: number, name: string) => (name === "amount" ? [`${formatFCFA(v)} FCFA`, "Revenus"] : [v, "Commandes"])}
                  />
                  <Area type="monotone" dataKey="amount" stroke={BRAND} strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Répartition revenus" subtitle="Par type de produit">
          {isLoading ? (
            <div className="h-[280px] bg-gray-50 animate-pulse rounded-xl" />
          ) : revenueByType.length === 0 ? (
            <EmptyState icon="donut_large" label="Aucune vente" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={revenueByType}
                  dataKey="value"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                >
                  {revenueByType.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "Revenus"]} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Countries + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Performance par pays"
            subtitle="Vues (visiteurs) + achats sur la période"
          >
            {isLoading ? (
              <div className="h-[320px] bg-gray-50 animate-pulse rounded-xl" />
            ) : countryRows.length === 0 ? (
              <EmptyState icon="public" label="Pas encore de données géolocalisées" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={Math.max(180, countryRows.length * 28)}>
                  <BarChart layout="vertical" data={countryRows} margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" fontSize={10} stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="country"
                      fontSize={11}
                      width={60}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(c: string) => `${countryToFlag(c)} ${c}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                      formatter={(v: number, name: string) => {
                        if (name === "views") return [v, "Vues"];
                        if (name === "sales") return [v, "Ventes"];
                        if (name === "revenue") return [`${formatFCFA(v)} FCFA`, "Revenus"];
                        return [v, name];
                      }}
                      labelFormatter={(c: string) => `${countryToFlag(c)} ${countryName(c)}`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="views" fill={CYAN} radius={[0, 6, 6, 0]} />
                    <Bar dataKey="sales" fill={ACCENT} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Detail table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#5c647a] uppercase tracking-wider text-[10px]">
                        <th className="text-left py-2 font-semibold">Pays</th>
                        <th className="text-right py-2 font-semibold">Vues</th>
                        <th className="text-right py-2 font-semibold">Ventes</th>
                        <th className="text-right py-2 font-semibold">Revenus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countryRows.map((row) => (
                        <tr key={row.country} className="border-t border-gray-100">
                          <td className="py-2 font-semibold text-[#191c1e]">
                            <span className="mr-1.5">{countryToFlag(row.country)}</span>
                            {countryName(row.country)}
                          </td>
                          <td className="py-2 text-right text-[#191c1e]">{row.views.toLocaleString("fr-FR")}</td>
                          <td className="py-2 text-right text-[#191c1e]">{row.sales.toLocaleString("fr-FR")}</td>
                          <td className="py-2 text-right font-bold text-[#006e2f]">
                            {row.revenue > 0 ? `${formatFCFA(row.revenue)} FCFA` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Entonnoir de conversion" subtitle="Visite → Produit → Achat">
          {isLoading || !funnel ? (
            <div className="h-[280px] bg-gray-50 animate-pulse rounded-xl" />
          ) : (
            <div className="space-y-4 py-2">
              {[
                { label: "Visites totales", value: funnel.views, color: CYAN, icon: "visibility" },
                { label: "Vues produits", value: funnel.productViews, color: ACCENT, icon: "inventory_2" },
                { label: "Achats", value: funnel.purchases, color: BRAND, icon: "shopping_cart_checkout" },
              ].map((step, idx) => {
                const width = (step.value / funnelMax) * 100;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: step.color }}>
                          {step.icon}
                        </span>
                        <span className="text-xs font-semibold text-[#191c1e]">{step.label}</span>
                      </div>
                      <span className="text-sm font-extrabold text-[#191c1e]">{step.value.toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(width, 4)}%`, background: step.color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-[#5c647a]">Taux de conversion</span>
                <span className="text-base font-extrabold" style={{ color: BRAND }}>
                  {funnel.conversionRate}%
                </span>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top products + Monthly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Top 5 produits" subtitle="Par chiffre d'affaires">
          {isLoading ? (
            <div className="h-[260px] bg-gray-50 animate-pulse rounded-xl" />
          ) : topProducts.length === 0 ? (
            <EmptyState icon="storefront" label="Aucun produit vendu" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" fontSize={10} stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)} />
                <YAxis
                  type="category"
                  dataKey="title"
                  fontSize={10}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(t: string) => (t.length > 16 ? t.slice(0, 16) + "…" : t)}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "CA"]}
                />
                <Bar dataKey="revenue" fill={BRAND} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Tendance mensuelle" subtitle="12 derniers mois">
          {isLoading ? (
            <div className="h-[260px] bg-gray-50 animate-pulse rounded-xl" />
          ) : monthlyTrend.every((m) => m.revenue === 0) ? (
            <EmptyState icon="trending_up" label="Pas encore de tendance" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" fontSize={10} stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis fontSize={10} stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v: number, name: string) => (name === "revenue" ? [`${formatFCFA(v)} FCFA`, "Revenus"] : [v, "Commandes"])}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2.5} dot={{ r: 3, fill: BRAND }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="orders" stroke={CYAN} strokeWidth={2} dot={{ r: 3, fill: CYAN }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="h-[260px] flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-[36px] text-gray-300 mb-2">{icon}</span>
      <p className="text-sm text-[#5c647a]">{label}</p>
    </div>
  );
}
