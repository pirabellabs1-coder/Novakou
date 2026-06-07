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
import {
  BarChart3,
  Wallet,
  ShoppingBag,
  Users,
  Receipt,
  TrendingUp,
  Eye,
  Package,
  ShoppingCart,
  Globe,
  Filter,
  Store,
  LineChart as LineChartIcon,
} from "lucide-react";
import { countryName } from "@/lib/tracking/geo";
import { Flag } from "@/components/ui/Flag";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaSection,
  KazaEmpty,
} from "@/components/kaza";

/**
 * Tick custom Recharts pour YAxis : affiche un vrai drapeau PNG (via SVG
 * `<image>`) + le code pays.
 */
function CountryFlagTick(props: { x?: number; y?: number; payload?: { value?: string } }) {
  const { x = 0, y = 0, payload } = props;
  const code = (payload?.value ?? "").toString().toLowerCase();
  if (!code || code.length !== 2) {
    return (
      <text x={x} y={y} dy={4} fontSize={11} textAnchor="end" fill="#64748b">
        {payload?.value ?? ""}
      </text>
    );
  }
  return (
    <g transform={`translate(${x - 56},${y - 8})`}>
      <image
        href={`https://flagcdn.com/h20/${code}.png`}
        width={20}
        height={15}
        preserveAspectRatio="xMidYMid slice"
      />
      <text x={26} y={11} fontSize={11} fill="#0b2540" fontWeight={600}>
        {code.toUpperCase()}
      </text>
    </g>
  );
}

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

const BRAND = "#10b981";
const ACCENT = "#22c55e";
const CYAN = "#22d3ee";
const AMBER = "#f59e0b";
const PURPLE = "#a855f7";
const DONUT_COLORS = [BRAND, ACCENT, CYAN, AMBER, PURPLE, "#ef4444", "#3b82f6"];

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
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

  const periodLabels: Record<Period, string> = {
    "7d": "7j",
    "30d": "30j",
    "90d": "90j",
    "12m": "1 an",
    "all": "Tout",
  };

  const periodSubtitle =
    period === "all"
      ? "Depuis le début"
      : `Sur les ${period === "7d" ? "7 derniers jours" : period === "30d" ? "30 derniers jours" : period === "90d" ? "90 derniers jours" : "12 derniers mois"}`;

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <KazaHero
        badge="Pro"
        badgeColor="orange"
        title="Statistiques"
        subtitle="Analyse détaillée de vos performances et de votre audience"
        icon={BarChart3}
        actions={
          <div className="flex bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p ? "bg-white text-[#0b2540] shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KazaKpiCard
          label="Revenus bruts"
          value={isLoading ? "—" : `${formatFCFA(overview?.revenue ?? 0)} FCFA`}
          delta={
            overview?.deltaRevenue !== undefined
              ? `${overview.deltaRevenue >= 0 ? "+" : ""}${overview.deltaRevenue.toFixed(1)}%`
              : undefined
          }
          deltaTrend={overview?.deltaRevenue !== undefined ? (overview.deltaRevenue >= 0 ? "up" : "down") : "neutral"}
          icon={Wallet}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Commandes"
          value={isLoading ? "—" : (overview?.orders ?? 0).toLocaleString("fr-FR")}
          delta={
            overview?.deltaOrders !== undefined
              ? `${overview.deltaOrders >= 0 ? "+" : ""}${overview.deltaOrders.toFixed(1)}%`
              : undefined
          }
          deltaTrend={overview?.deltaOrders !== undefined ? (overview.deltaOrders >= 0 ? "up" : "down") : "neutral"}
          icon={ShoppingBag}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Clients uniques"
          value={isLoading ? "—" : (overview?.uniqueCustomers ?? 0).toLocaleString("fr-FR")}
          icon={Users}
          iconColor="violet"
        />
        <KazaKpiCard
          label="Panier moyen"
          value={isLoading ? "—" : `${formatFCFA(overview?.avgOrder ?? 0)} FCFA`}
          icon={Receipt}
          iconColor="orange"
        />
      </div>

      {/* Revenue over time + Revenue by type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <KazaCard title="Évolution du chiffre d'affaires" subtitle={periodSubtitle}>
            {isLoading ? (
              <div className="h-[280px] bg-slate-50 animate-pulse rounded-xl" />
            ) : revenueOverTime.length === 0 && monthlyTrend.every((m) => m.revenue === 0) ? (
              <EmptyChart icon={LineChartIcon} label="Aucune donnée pour cette période" />
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
          </KazaCard>
        </div>

        <KazaCard title="Répartition revenus" subtitle="Par type de produit">
          {isLoading ? (
            <div className="h-[280px] bg-slate-50 animate-pulse rounded-xl" />
          ) : revenueByType.length === 0 ? (
            <EmptyChart icon={Package} label="Aucune vente" />
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
        </KazaCard>
      </div>

      {/* Countries + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <KazaCard title="Performance par pays" subtitle="Vues (visiteurs) + achats sur la période">
            {isLoading ? (
              <div className="h-[320px] bg-slate-50 animate-pulse rounded-xl" />
            ) : countryRows.length === 0 ? (
              <EmptyChart icon={Globe} label="Pas encore de données géolocalisées" />
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
                      width={80}
                      tickLine={false}
                      axisLine={false}
                      tick={<CountryFlagTick />}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                      formatter={(v: number, name: string) => {
                        if (name === "views") return [v, "Vues"];
                        if (name === "sales") return [v, "Ventes"];
                        if (name === "revenue") return [`${formatFCFA(v)} FCFA`, "Revenus"];
                        return [v, name];
                      }}
                      labelFormatter={(c: string) => countryName(c)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="views" fill={CYAN} radius={[0, 6, 6, 0]} />
                    <Bar dataKey="sales" fill={ACCENT} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="text-left py-2 font-semibold">Pays</th>
                        <th className="text-right py-2 font-semibold">Vues</th>
                        <th className="text-right py-2 font-semibold">Ventes</th>
                        <th className="text-right py-2 font-semibold">Revenus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countryRows.map((row) => (
                        <tr key={row.country} className="border-t border-slate-100">
                          <td className="py-2 font-semibold text-slate-900">
                            <span className="inline-flex items-center gap-1.5">
                              <Flag code={row.country} size="sm" />
                              {countryName(row.country)}
                            </span>
                          </td>
                          <td className="py-2 text-right text-slate-900">{row.views.toLocaleString("fr-FR")}</td>
                          <td className="py-2 text-right text-slate-900">{row.sales.toLocaleString("fr-FR")}</td>
                          <td className="py-2 text-right font-bold text-emerald-600">
                            {row.revenue > 0 ? `${formatFCFA(row.revenue)} FCFA` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </KazaCard>
        </div>

        <KazaCard title="Entonnoir de conversion" subtitle="Visite → Produit → Achat">
          {isLoading ? (
            <div className="h-[280px] bg-slate-50 animate-pulse rounded-xl" />
          ) : !funnel || (funnel.views === 0 && funnel.productViews === 0 && funnel.purchases === 0) ? (
            <EmptyChart icon={Filter} label="Pas encore de visites tracées" />
          ) : (
            <div className="space-y-4 py-2">
              {[
                { label: "Visites totales", value: funnel.views, color: CYAN, icon: Eye },
                { label: "Vues produits", value: funnel.productViews, color: ACCENT, icon: Package },
                { label: "Achats", value: funnel.purchases, color: BRAND, icon: ShoppingCart },
              ].map((step, idx) => {
                const width = (step.value / funnelMax) * 100;
                const StepIcon = step.icon;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <StepIcon size={18} style={{ color: step.color }} />
                        <span className="text-xs font-semibold text-slate-900">{step.label}</span>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">{step.value.toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(width, 4)}%`, background: step.color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Taux de conversion</span>
                <span className="text-base font-extrabold text-emerald-600">
                  {funnel.conversionRate}%
                </span>
              </div>
            </div>
          )}
        </KazaCard>
      </div>

      {/* Top products + Monthly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <KazaCard title="Top 5 produits" subtitle="Par chiffre d'affaires">
          {isLoading ? (
            <div className="h-[260px] bg-slate-50 animate-pulse rounded-xl" />
          ) : topProducts.length === 0 || topProducts.every((p) => p.revenue === 0) ? (
            topProducts.length === 0 ? (
              <EmptyChart icon={Store} label="Aucun produit vendu" />
            ) : (
              <div className="space-y-3 py-4">
                <p className="text-xs text-slate-500 mb-3">
                  Tous les produits sont gratuits sur cette période — voici le classement par <strong className="text-slate-900">nombre de ventes</strong>.
                </p>
                {topProducts.slice(0, 5).map((p) => {
                  const max = Math.max(1, ...topProducts.map((x) => x.sales));
                  const pct = (p.sales / max) * 100;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <p className="text-xs font-semibold text-slate-900 truncate w-32">{p.title}</p>
                      <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-md"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold text-emerald-600 w-16 text-right tabular-nums">
                        {p.sales} {p.sales > 1 ? "ventes" : "vente"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )
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
        </KazaCard>

        <KazaCard title="Tendance mensuelle" subtitle="12 derniers mois">
          {isLoading ? (
            <div className="h-[260px] bg-slate-50 animate-pulse rounded-xl" />
          ) : monthlyTrend.every((m) => m.revenue === 0) ? (
            <EmptyChart icon={TrendingUp} label="Pas encore de tendance" />
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
        </KazaCard>
      </div>
    </div>
  );
}

function EmptyChart({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <div className="h-[260px] flex flex-col items-center justify-center text-center">
      <Icon size={36} className="text-slate-300 mb-2" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
