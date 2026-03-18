"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import AnimatedCounter from "@/components/formations/AnimatedCounter";
import ActivityHeatmap from "@/components/formations/ActivityHeatmap";
import RevenueWaterfall from "@/components/formations/RevenueWaterfall";
import ConversionFunnelChart from "@/components/formations/ConversionFunnelChart";
import ChartContainer from "@/components/formations/ChartContainer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelStep {
  step: string;
  count: number;
}

interface WaterfallData {
  gross: number;
  commissions: number;
  refunds: number;
  net: number;
}

interface CategoryRadarItem {
  name: string;
  formations: number;
  students: number;
  revenue: number;
  rating: number;
  completionRate: number;
}

interface InstructorRow {
  id: string;
  name: string;
  avatar: string | null;
  formations: number;
  students: number;
  revenue: number;
  rating: number;
  completionRate: number;
  trend: number;
}

interface GeoItem {
  country: string;
  flag: string;
  count: number;
  percentage: number;
}

interface AdminFormationStats {
  totalFormations: number;
  totalInstructors: number;
  totalStudents: number;
  revenueThisMonth: number;
  certificatesIssued: number;
  pendingFormations: number;
  pendingInstructors: number;
  formationsTrend: number;
  studentsTrend: number;
  revenueTrend: number;
  certificatesTrend: number;
  enrollmentsByMonth: { month: string; enrollments: number }[];
  revenueByMonth: { month: string; revenue: number; commission: number }[];
  topCategories: { name: string; value: number }[];
  recentActivity: { type: string; title: string; user: string; date: string }[];
  conversionFunnel: FunnelStep[];
  revenueWaterfall: WaterfallData;
  activityHeatmap: { date: string; count: number }[];
  categoryRadar: CategoryRadarItem[];
  topInstructors: InstructorRow[];
  geoDistribution: GeoItem[];
  marketing?: {
    totalProducts: number;
    productSales: number;
    productRevenue: number;
    abandonedCarts: number;
    recoveredCarts: number;
    recoveryRate: number;
    failedPayments: number;
  };
}

// ---------------------------------------------------------------------------
// Period options
// ---------------------------------------------------------------------------

type Period = "7d" | "30d" | "3m" | "6m" | "1y";

const PERIOD_KEYS: Record<Period, string> = {
  "7d": "admin_period_7d",
  "30d": "admin_period_30d",
  "3m": "admin_period_3m",
  "6m": "admin_period_6m",
  "1y": "admin_period_1y",
};

// ---------------------------------------------------------------------------
// Sortable table types
// ---------------------------------------------------------------------------

type SortField = "name" | "formations" | "students" | "revenue" | "rating" | "completionRate";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminFormationsDashboardPage() {
  const t = useTranslations("formations_nav");
  const locale = useLocale();
  const fr = locale === "fr";

  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<AdminFormationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Instructor table sort
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Fetch data ──
  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`/api/admin/formations/stats?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((d) => {
        const { trends, ...rest } = d;
        setStats({
          totalInstructors: 0,
          formationsTrend: 0,
          studentsTrend: 0,
          revenueTrend: 0,
          certificatesTrend: 0,
          enrollmentsByMonth: [],
          topCategories: [],
          conversionFunnel: [],
          revenueWaterfall: { gross: 0, commissions: 0, refunds: 0, net: 0 },
          activityHeatmap: [],
          categoryRadar: [],
          topInstructors: [],
          geoDistribution: [],
          ...rest,
          ...(trends ?? {}),
        });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [period]);

  // ── Sorted instructors ──
  const sortedInstructors = useMemo(() => {
    if (!stats?.topInstructors) return [];
    const list = [...stats.topInstructors];
    list.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortDir === "asc" ? numA - numB : numB - numA;
    });
    return list;
  }, [stats?.topInstructors, sortField, sortDir]);

  // ── Normalize radar data for percentage display ──
  const normalizedRadar = useMemo(() => {
    if (!stats?.categoryRadar || stats.categoryRadar.length === 0) return [];
    const maxVals = {
      formations: Math.max(...stats.categoryRadar.map((c) => c.formations), 1),
      students: Math.max(...stats.categoryRadar.map((c) => c.students), 1),
      revenue: Math.max(...stats.categoryRadar.map((c) => c.revenue), 1),
      rating: 5,
      completionRate: 100,
    };
    return stats.categoryRadar.map((c) => ({
      name: c.name,
      [fr ? "Formations" : "Courses"]: Math.round((c.formations / maxVals.formations) * 100),
      [fr ? "Apprenants" : "Students"]: Math.round((c.students / maxVals.students) * 100),
      [fr ? "Revenus" : "Revenue"]: Math.round((c.revenue / maxVals.revenue) * 100),
      [fr ? "Note" : "Rating"]: Math.round((c.rating / maxVals.rating) * 100),
      [fr ? "Complétion" : "Completion"]: Math.round(c.completionRate),
    }));
  }, [stats?.categoryRadar, fr]);

  // ── Max geo count for bar sizing ──
  const maxGeoCount = useMemo(() => {
    if (!stats?.geoDistribution || stats.geoDistribution.length === 0) return 1;
    return Math.max(...stats.geoDistribution.map((g) => g.count), 1);
  }, [stats?.geoDistribution]);

  // ── Toggle sort ──
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return "unfold_more";
    return sortDir === "asc" ? "expand_less" : "expand_more";
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Period bar */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-80" />
        </div>
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        {/* Funnel + Waterfall */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        {/* Heatmap */}
        <div className="h-44 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        {/* Radar + Geo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        {/* Table */}
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        {/* Activity */}
        <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-4xl text-red-400 mb-3 block">error</span>
        <p className="text-slate-600 dark:text-slate-400">{t("admin_no_data")}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(false);
            setPeriod((p) => p); // re-trigger fetch via useEffect dependency
            window.location.reload();
          }}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {fr ? "Recharger" : "Reload"}
        </button>
      </div>
    );
  }

  // ── KPI card data ──
  const statCards = [
    {
      label: t("admin_stat_formations"),
      value: stats?.totalFormations ?? 0,
      icon: "library_books",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      trend: stats?.formationsTrend ?? 0,
    },
    {
      label: t("admin_stat_students"),
      value: stats?.totalStudents ?? 0,
      icon: "groups",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      trend: stats?.studentsTrend ?? 0,
    },
    {
      label: t("admin_stat_revenue"),
      value: stats?.revenueThisMonth ?? 0,
      suffix: " \u20AC",
      icon: "account_balance_wallet",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      trend: stats?.revenueTrend ?? 0,
    },
    {
      label: t("admin_stat_certificates"),
      value: stats?.certificatesIssued ?? 0,
      icon: "workspace_premium",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      trend: stats?.certificatesTrend ?? 0,
    },
  ];

  // ── Radar dimension keys ──
  const radarKeys = fr
    ? ["Formations", "Apprenants", "Revenus", "Note", "Compl\u00e9tion"]
    : ["Courses", "Students", "Revenue", "Rating", "Completion"];

  const RADAR_COLORS = ["#6C2BD9", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* Header + Period Selector                                         */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("admin_dashboard_title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("admin_overview_subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pending alerts */}
          {stats && stats.pendingFormations > 0 && (
            <Link
              href="/formations/admin/formations"
              className="hidden md:flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm font-medium px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 transition-colors"
            >
              <span className="material-symbols-outlined text-base">pending</span>
              {stats.pendingFormations} {t("admin_pending_formations")}
            </Link>
          )}
          {stats && stats.pendingInstructors > 0 && (
            <Link
              href="/formations/admin/instructeurs"
              className="hidden md:flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm font-medium px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors"
            >
              <span className="material-symbols-outlined text-base">person_alert</span>
              {stats.pendingInstructors} {t("admin_pending_instructors")}
            </Link>
          )}

          {/* Period selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {(Object.keys(PERIOD_KEYS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === p
                    ? "bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t(PERIOD_KEYS[p])}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Row 1 -- 4 KPI Cards                                            */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
              </div>
              {s.trend !== 0 && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                    s.trend > 0
                      ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                      : "text-red-600 bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {s.trend > 0 ? "trending_up" : "trending_down"}
                  </span>
                  {s.trend > 0 ? "+" : ""}
                  {s.trend}%
                </span>
              )}
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              <AnimatedCounter value={s.value} suffix={s.suffix || ""} />
            </p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* Row 2 -- Conversion Funnel (left) + Revenue Waterfall (right)    */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title={t("admin_conversion_funnel")}
          exportData={stats?.conversionFunnel?.map((s) => ({ step: s.step, count: s.count }))}
          exportFilename="conversion-funnel"
        >
          {stats?.conversionFunnel && stats.conversionFunnel.length > 0 ? (
            <ConversionFunnelChart data={stats.conversionFunnel} />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
              {t("admin_no_data")}
            </div>
          )}
        </ChartContainer>

        <ChartContainer
          title={t("admin_revenue_waterfall")}
          exportData={
            stats?.revenueWaterfall
              ? [
                  {
                    gross: stats.revenueWaterfall.gross,
                    commissions: stats.revenueWaterfall.commissions,
                    refunds: stats.revenueWaterfall.refunds,
                    net: stats.revenueWaterfall.net,
                  },
                ]
              : undefined
          }
          exportFilename="revenue-waterfall"
        >
          {stats?.revenueWaterfall ? (
            <RevenueWaterfall data={stats.revenueWaterfall} />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
              {t("admin_no_data")}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* ================================================================ */}
      {/* Row 3 -- Activity Heatmap (full width)                           */}
      {/* ================================================================ */}
      <ChartContainer
        title={t("admin_activity_heatmap")}
        exportData={stats?.activityHeatmap}
        exportFilename="activity-heatmap"
      >
        <div className="overflow-x-auto">
          {stats?.activityHeatmap && stats.activityHeatmap.length > 0 ? (
            <ActivityHeatmap data={stats.activityHeatmap} />
          ) : (
            <div className="h-[120px] flex items-center justify-center text-slate-400 text-sm">
              {t("admin_no_data")}
            </div>
          )}
        </div>
      </ChartContainer>

      {/* ================================================================ */}
      {/* Row 4 -- Category Radar (left) + Geo Distribution (right)        */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Radar */}
        <ChartContainer
          title={t("admin_category_radar")}
          exportData={stats?.categoryRadar?.map((c) => ({
            category: c.name,
            formations: c.formations,
            students: c.students,
            revenue: c.revenue,
            rating: c.rating,
            completionRate: c.completionRate,
          }))}
          exportFilename="category-radar"
        >
          {normalizedRadar.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={normalizedRadar}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickCount={5}
                />
                {radarKeys.map((key, i) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}%`, undefined]}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
              {t("admin_no_data")}
            </div>
          )}
        </ChartContainer>

        {/* Geographic Distribution */}
        <ChartContainer
          title={t("admin_geo_distribution")}
          exportData={stats?.geoDistribution?.map((g) => ({
            country: g.country,
            students: g.count,
            percentage: g.percentage,
          }))}
          exportFilename="geo-distribution"
        >
          {stats?.geoDistribution && stats.geoDistribution.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {stats.geoDistribution.slice(0, 15).map((geo) => (
                <div key={geo.country} className="flex items-center gap-3">
                  {/* Flag + Country */}
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className="text-lg leading-none">{geo.flag || "🌍"}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {geo.country}
                    </span>
                  </div>

                  {/* Horizontal bar */}
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700/50 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-md transition-all duration-700 ease-out"
                      style={{ width: `${Math.max((geo.count / maxGeoCount) * 100, 3)}%` }}
                    />
                  </div>

                  {/* Count + Percentage */}
                  <div className="text-right w-24 shrink-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {geo.count.toLocaleString(fr ? "fr-FR" : "en-US")}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">({geo.percentage}%)</span>
                  </div>
                </div>
              ))}
              {stats.geoDistribution.length === 0 && (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
                  {t("admin_no_geo_data")}
                </div>
              )}
            </div>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
              {t("admin_no_geo_data")}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* ================================================================ */}
      {/* Row 5 -- Top 10 Instructors Table (full width)                   */}
      {/* ================================================================ */}
      <ChartContainer
        title={t("admin_top_instructors")}
        exportData={stats?.topInstructors?.map((inst) => ({
          name: inst.name,
          formations: inst.formations,
          students: inst.students,
          revenue: inst.revenue,
          rating: inst.rating,
          completionRate: inst.completionRate,
          trend: inst.trend,
        }))}
        exportFilename="top-instructors"
      >
        {sortedInstructors.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 pr-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    #
                  </th>
                  {([
                    { field: "name" as SortField, label: t("admin_col_name") },
                    { field: "formations" as SortField, label: t("admin_col_formations") },
                    { field: "students" as SortField, label: t("admin_col_students") },
                    { field: "revenue" as SortField, label: t("admin_col_revenue") },
                    { field: "rating" as SortField, label: t("admin_col_rating") },
                    { field: "completionRate" as SortField, label: t("admin_col_completion") },
                  ]).map((col) => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      className="text-left py-3 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <span className="material-symbols-outlined text-[14px]">
                          {sortIcon(col.field)}
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className="text-left py-3 pl-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    {t("admin_col_trend")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {sortedInstructors.map((inst, idx) => (
                  <tr
                    key={inst.id}
                    className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 pr-4">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : idx === 1
                            ? "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
                            : idx === 2
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Name + Avatar */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                          {inst.avatar ? (
                            <img
                              src={inst.avatar}
                              alt={inst.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            inst.name?.charAt(0)?.toUpperCase() || "?"
                          )}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[140px]">
                          {inst.name}
                        </span>
                      </div>
                    </td>

                    {/* Formations */}
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {inst.formations}
                    </td>

                    {/* Students */}
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {inst.students.toLocaleString(fr ? "fr-FR" : "en-US")}
                    </td>

                    {/* Revenue */}
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {inst.revenue.toLocaleString(fr ? "fr-FR" : "en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      {"\u20AC"}
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-amber-400 text-base">
                          star
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {inst.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Completion rate */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(inst.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {inst.completionRate}%
                        </span>
                      </div>
                    </td>

                    {/* Trend */}
                    <td className="py-3 pl-3">
                      {inst.trend !== 0 ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                            inst.trend > 0
                              ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                              : "text-red-600 bg-red-50 dark:bg-red-900/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {inst.trend > 0 ? "trending_up" : "trending_down"}
                          </span>
                          {inst.trend > 0 ? "+" : ""}
                          {inst.trend}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
            {t("admin_no_instructors_data")}
          </div>
        )}
      </ChartContainer>

      {/* ================================================================ */}
      {/* Row 6 -- Recent Activity Feed (full width)                       */}
      {/* ================================================================ */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">{t("admin_recent_activity")}</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {(stats?.recentActivity ?? []).slice(0, 8).map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  a.type === "enrollment"
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : a.type === "certificate"
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-purple-50 dark:bg-purple-900/20"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-base ${
                    a.type === "enrollment"
                      ? "text-blue-600"
                      : a.type === "certificate"
                      ? "text-green-600"
                      : "text-purple-600"
                  }`}
                >
                  {a.type === "enrollment"
                    ? "person_add"
                    : a.type === "certificate"
                    ? "workspace_premium"
                    : "library_books"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {a.title}
                </p>
                <p className="text-xs text-slate-500">{a.user}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{a.date}</span>
            </div>
          ))}
          {!stats?.recentActivity?.length && (
            <p className="text-center text-slate-400 text-sm py-8">{t("admin_no_activity")}</p>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Alerts row                                                       */}
      {/* ================================================================ */}
      {stats && (stats.pendingFormations > 0 || stats.pendingInstructors > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.pendingFormations > 0 && (
            <Link
              href="/formations/admin/formations"
              className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-sm p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-yellow-600">pending</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {fr ? "Formations en attente" : "Pending courses"}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-yellow-600">{stats.pendingFormations}</p>
              <p className="text-xs text-slate-500 mt-1">
                {fr ? "En attente d'approbation" : "Awaiting approval"}
              </p>
            </Link>
          )}
          {stats.pendingInstructors > 0 && (
            <Link
              href="/formations/admin/instructeurs"
              className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-600">person_alert</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {fr ? "Instructeurs en attente" : "Pending instructors"}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-orange-600">{stats.pendingInstructors}</p>
              <p className="text-xs text-slate-500 mt-1">
                {fr ? "Candidatures a examiner" : "Applications to review"}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* Marketing & Products stats                                       */}
      {/* ================================================================ */}
      {stats?.marketing && (
        <>
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            {t("admin_marketing_title_section")}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-indigo-600">inventory_2</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={stats.marketing.totalProducts} />
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t("admin_marketing_products")}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-pink-600">shopping_cart</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={stats.marketing.abandonedCarts} />
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t("admin_marketing_abandoned")}</p>
              {stats.marketing.recoveryRate > 0 && (
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  {stats.marketing.recoveryRate.toFixed(1)}% {t("admin_marketing_recovered")}
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-red-600">error</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={stats.marketing.failedPayments} />
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t("admin_marketing_failed")}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-teal-600">trending_up</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={stats.marketing.productRevenue} suffix=" \u20AC" />
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t("admin_marketing_revenue")}</p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.marketing.productSales} {t("admin_marketing_sales")}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
