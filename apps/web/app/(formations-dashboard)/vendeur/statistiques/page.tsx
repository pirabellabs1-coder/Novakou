"use client";
// Statistiques vendeur — design "Stitch" (maquette stich/novakou_statistiques.html
// validée par Lissanon) : KPI + delta chips, évolution des revenus, tunnel de
// conversion, top pays, performance par produit. 2026-06-10.

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  LineChart as LineChartIcon,
  Filter,
  Globe,
  Store,
  type LucideIcon,
} from "lucide-react";
import { countryName } from "@/lib/tracking/geo";
import {
  StCard,
  StPageHeader,
  StSectionTitle,
  StTabs,
  StDeltaChip,
  ST,
} from "@/components/stitch";

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

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function formatPct1(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Bornes de la période sélectionnée (miroir du calcul de cutoff côté API). */
function periodRange(period: Period): { start: Date; end: Date } | null {
  const end = new Date();
  switch (period) {
    case "7d":
      return { start: new Date(Date.now() - 7 * 86400000), end };
    case "30d":
      return { start: new Date(Date.now() - 30 * 86400000), end };
    case "90d":
      return { start: new Date(Date.now() - 90 * 86400000), end };
    case "12m":
      return { start: new Date(end.getFullYear(), end.getMonth() - 11, 1), end };
    case "all":
      return null;
  }
}

function rangeSubtitle(period: Period): string {
  const range = periodRange(period);
  if (!range) return "Performance de votre boutique depuis le début.";
  const sameYear = range.start.getFullYear() === range.end.getFullYear();
  const startLabel = range.start.toLocaleDateString(
    "fr-FR",
    sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" },
  );
  const endLabel = range.end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `Performance de votre boutique du ${startLabel} au ${endLabel}.`;
}

/* ── KPI card (maquette : label 12px 700, valeur 20px 800, chip delta) ──── */
function KpiCard({ label, value, delta }: { label: string; value: ReactNode; delta?: number | null }) {
  return (
    <StCard className="!p-[15px_18px]">
      <div className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>{label}</div>
      <div className="text-[20px] font-extrabold mt-[7px] mb-1.5 tabular-nums" style={{ color: ST.text }}>
        {value}
      </div>
      {delta !== undefined && <StDeltaChip pct={delta} />}
    </StCard>
  );
}

function EmptyBlock({ icon: Icon, label, height = 212 }: { icon: LucideIcon; label: string; height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
      <Icon size={36} style={{ color: "#d6e0da" }} />
      <p className="text-[12.5px] font-bold mt-2.5" style={{ color: ST.textSecondary }}>{label}</p>
    </div>
  );
}

function LoadingBlock({ height = 212 }: { height?: number }) {
  return <div className="animate-pulse rounded-xl" style={{ height, background: ST.divider }} />;
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

  // ── Top pays : part de chaque pays (revenus si dispo, sinon vues) ──
  const countryRevTotal = countryRows.reduce((s, r) => s + r.revenue, 0);
  const countryViewsTotal = countryRows.reduce((s, r) => s + r.views, 0);
  const countryShare = (row: { revenue: number; views: number }) =>
    countryRevTotal > 0
      ? (row.revenue / countryRevTotal) * 100
      : countryViewsTotal > 0
        ? (row.views / countryViewsTotal) * 100
        : 0;
  const topCountries = countryRows.slice(0, 6);

  // ── Tunnel de conversion (4 lignes maquette — Checkout non tracké : "—") ──
  const funnelRows: { label: string; value: number | null; pct: number | null; sub: string }[] = funnel
    ? [
        { label: "Visiteurs", value: funnel.views, pct: (funnel.views / funnelMax) * 100, sub: "" },
        {
          label: "Fiche produit",
          value: funnel.productViews,
          pct: (funnel.productViews / funnelMax) * 100,
          sub: funnel.views > 0 ? `− ${Math.round((1 - funnel.productViews / funnel.views) * 100)} %` : "",
        },
        { label: "Checkout", value: null, pct: null, sub: "" },
        {
          label: "Achat",
          value: funnel.purchases,
          pct: (funnel.purchases / funnelMax) * 100,
          sub: `taux global ${formatPct1(funnel.conversionRate)} %`,
        },
      ]
    : [];
  const funnelEmpty = !funnel || (funnel.views === 0 && funnel.productViews === 0 && funnel.purchases === 0);

  // ── Chart : journalier (7j/30j/90j), repli mensuel sinon ──
  const chartIsDaily = revenueOverTime.length > 0;
  const chartData = chartIsDaily
    ? revenueOverTime.map((r) => ({
        label: new Date(`${r.date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        amount: r.amount,
      }))
    : monthlyTrend.map((m) => ({ label: m.month, amount: m.revenue }));
  const chartEmpty = chartData.length === 0 || chartData.every((c) => c.amount === 0);

  return (
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="max-w-[1400px] mx-auto px-5 md:px-7 py-6 md:py-7">
        <StPageHeader
          title="Statistiques"
          subtitle={rangeSubtitle(period)}
          actions={
            <StTabs
              tabs={[
                { key: "7d", label: "7 j" },
                { key: "30d", label: "30 j" },
                { key: "90d", label: "90 j" },
                { key: "12m", label: "1 an" },
              ]}
              active={period}
              onChange={(key) => setPeriod(key as Period)}
            />
          }
        />

        {/* ── 4 KPI (maquette) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
          <KpiCard
            label="Revenus"
            value={isLoading ? "—" : `${formatFCFA(overview?.revenue ?? 0)} FCFA`}
            delta={isLoading ? null : (overview?.deltaRevenue ?? null)}
          />
          <KpiCard
            label="Ventes"
            value={isLoading ? "—" : (overview?.orders ?? 0).toLocaleString("fr-FR")}
            delta={isLoading ? null : (overview?.deltaOrders ?? null)}
          />
          <KpiCard
            label="Taux de conversion"
            value={isLoading ? "—" : `${formatPct1(funnel?.conversionRate ?? 0)} %`}
          />
          <KpiCard
            label="Panier moyen"
            value={isLoading ? "—" : `${formatFCFA(overview?.avgOrder ?? 0)} FCFA`}
          />
        </div>

        {/* ── Évolution des revenus + Tunnel de conversion ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-3.5 mb-4">
          <StCard className="!p-[18px_20px]">
            <StSectionTitle
              className="!mb-2"
              action={
                <span className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                  {chartIsDaily ? "FCFA / jour" : "FCFA / mois"}
                </span>
              }
            >
              Évolution des revenus
            </StSectionTitle>
            {isLoading ? (
              <LoadingBlock />
            ) : chartEmpty ? (
              <EmptyBlock icon={LineChartIcon} label="Aucune donnée pour cette période" />
            ) : (
              <ResponsiveContainer width="100%" height={212}>
                <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke={ST.divider} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: ST.textFaint, fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={42}
                  />
                  <YAxis
                    tick={{ fill: ST.textFaint, fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)} k` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${ST.cardBorder}`,
                      fontSize: 12,
                      fontWeight: 600,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                    formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "Revenus"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={ST.green}
                    strokeWidth={2.5}
                    fill="rgba(34,197,94,.14)"
                    dot={false}
                    activeDot={{ r: 4, fill: ST.green }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </StCard>

          <StCard className="!p-[18px_20px]">
            <StSectionTitle>Tunnel de conversion</StSectionTitle>
            {isLoading ? (
              <LoadingBlock />
            ) : funnelEmpty ? (
              <EmptyBlock icon={Filter} label="Pas encore de visites tracées" />
            ) : (
              <div>
                {funnelRows.map((row, i) => (
                  <div key={row.label} className={i < funnelRows.length - 1 ? "mb-[13px]" : ""}>
                    <div
                      className="flex justify-between text-[12px] font-extrabold mb-[5px]"
                      style={{ color: ST.text }}
                    >
                      <span>{row.label}</span>
                      <span className="tabular-nums">
                        {row.value === null ? "—" : row.value.toLocaleString("fr-FR")}
                        {row.sub && (
                          <span className="ml-[7px] text-[10.5px] font-bold" style={{ color: ST.textFaint }}>
                            {row.sub}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-[15px] rounded-full overflow-hidden" style={{ background: ST.divider }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(Math.min(row.pct ?? 0, 100), 8)}%`,
                          background: ST.gradientH,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StCard>
        </div>

        {/* ── Top pays + Performance par produit ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.65fr] gap-3.5">
          <StCard className="!p-[18px_20px]">
            <StSectionTitle>Top pays</StSectionTitle>
            {isLoading ? (
              <LoadingBlock />
            ) : topCountries.length === 0 ? (
              <EmptyBlock icon={Globe} label="Pas encore de données géolocalisées" />
            ) : (
              <div>
                {topCountries.map((row, i) => {
                  const isOther = row.country === "??";
                  const tone = !isOther && i < 4
                    ? { background: ST.greenSoft, color: ST.green }
                    : { background: "#f1efe8", color: "#5f5e5a" };
                  return (
                    <div
                      key={row.country}
                      className="flex items-center gap-[11px] py-2"
                      style={i > 0 ? { borderTop: "1px solid #f3f6f4" } : undefined}
                    >
                      <div
                        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                        style={tone}
                      >
                        {isOther ? "—" : row.country.toUpperCase()}
                      </div>
                      <span
                        className="text-[12.5px] font-extrabold w-[96px] truncate"
                        style={{ color: ST.text }}
                      >
                        {isOther ? "Autres" : countryName(row.country)}
                      </span>
                      <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: ST.divider }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(countryShare(row), 100)}%`, background: ST.gradientH }}
                        />
                      </div>
                      <span
                        className="text-[12px] font-extrabold w-[38px] text-right tabular-nums"
                        style={{ color: ST.text }}
                      >
                        {Math.round(countryShare(row))} %
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </StCard>

          <StCard className="!p-[18px_20px]">
            <StSectionTitle className="!mb-2.5">Performance par produit</StSectionTitle>
            {isLoading ? (
              <LoadingBlock />
            ) : topProducts.length === 0 ? (
              <EmptyBlock icon={Store} label="Aucun produit vendu sur la période" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Produit", "Vues", "Ventes", "Conversion", "Revenus"].map((h, i) => (
                        <th
                          key={h}
                          className={`text-[10.5px] uppercase font-extrabold pb-[9px] pr-2 ${
                            i === 4 ? "text-right" : "text-left"
                          }`}
                          style={{
                            color: ST.textMuted,
                            letterSpacing: ".06em",
                            ...(i === 0 ? { width: "36%" } : {}),
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p) => (
                      <tr key={p.id}>
                        <td
                          className="text-[12.5px] font-bold py-[10px] pr-2"
                          style={{ color: ST.text, borderTop: `1px solid ${ST.divider}` }}
                        >
                          {p.title}
                        </td>
                        {/* Vues par produit non disponibles dans l'API — pas d'invention */}
                        <td
                          className="text-[12.5px] font-bold py-[10px] pr-2 tabular-nums"
                          style={{ color: ST.textSecondary, borderTop: `1px solid ${ST.divider}` }}
                        >
                          —
                        </td>
                        <td
                          className="text-[12.5px] font-bold py-[10px] pr-2 tabular-nums"
                          style={{ color: ST.textSecondary, borderTop: `1px solid ${ST.divider}` }}
                        >
                          {p.sales.toLocaleString("fr-FR")}
                        </td>
                        <td
                          className="text-[12.5px] font-bold py-[10px] pr-2"
                          style={{ color: ST.textSecondary, borderTop: `1px solid ${ST.divider}` }}
                        >
                          —
                        </td>
                        <td
                          className="text-[12.5px] font-extrabold py-[10px] text-right tabular-nums"
                          style={{ color: ST.text, borderTop: `1px solid ${ST.divider}` }}
                        >
                          {formatFCFA(p.revenue)}{" "}
                          <span className="text-[10px] font-bold" style={{ color: ST.textFaint }}>
                            FCFA
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </StCard>
        </div>
      </main>
    </div>
  );
}
