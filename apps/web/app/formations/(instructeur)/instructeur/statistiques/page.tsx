"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useInstructorStats } from "@/lib/formations/hooks";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, Users, Award, Target, Download, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

import StatCard from "@/components/formations/StatCard";
import ChartContainer from "@/components/formations/ChartContainer";
import EmptyState from "@/components/formations/EmptyState";

interface InstructeurStats {
  revenueByMonth: { month: string; revenue: number; net: number }[];
  enrollmentsByWeek: { week: string; students: number }[];
  formationPerformance: { id?: string; name: string; students: number; rating: number; revenue: number; completionRate?: number }[];
  completionRate: number;
  avgQuizScore: number;
  topCountries: { country: string; students: number }[];
  conversionData: { stage: string; count: number }[];
  totalStudents?: number;
  totalRevenue?: number;
}

const COLORS = ["#6C2BD9", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const PERIOD_OPTIONS = [
  { value: "7d", label: "7j" },
  { value: "30d", label: "30j" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1an" },
];

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "")}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function InstructeurStatistiquesPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const [period, setPeriod] = useState("6m");
  const [sortBy, setSortBy] = useState<"students" | "revenue" | "rating">("revenue");
  const [page, setPage] = useState(0);
  const perPage = 5;

  const { data: rawData, isLoading: loading, error: queryError, refetch } = useInstructorStats(period);
  const statsRaw = rawData as ({ stats?: InstructeurStats } & InstructeurStats) | null | undefined;
  const stats: InstructeurStats | null = statsRaw ? ((statsRaw as { stats?: InstructeurStats }).stats ?? (statsRaw as InstructeurStats)) : null;
  const error = queryError ? (queryError as Error).message : null;

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
          <Target className="w-10 h-10 text-red-500 mx-auto mb-4" />
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
          icon={<TrendingUp className="w-10 h-10 text-slate-300" />}
          title={fr ? "Données non disponibles" : "Data not available"}
          description={fr ? "Les statistiques apparaîtront après vos premières ventes" : "Stats will appear after your first sales"}
        />
      </div>
    );
  }

  const totalNetRevenue = stats.revenueByMonth.reduce((acc, m) => acc + m.net, 0);
  const totalNewStudents = stats.enrollmentsByWeek.reduce((acc, w) => acc + w.students, 0);

  // Sorted formation performance
  const sortedFormations = [...(stats.formationPerformance || [])].sort((a, b) => {
    if (sortBy === "students") return b.students - a.students;
    if (sortBy === "rating") return b.rating - a.rating;
    return b.revenue - a.revenue;
  });
  const paginatedFormations = sortedFormations.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(sortedFormations.length / perPage);

  // Completion donut data
  const completionDonut = [
    { name: fr ? "Complété" : "Completed", value: stats.completionRate },
    { name: fr ? "En cours" : "In progress", value: 100 - stats.completionRate },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {fr ? "Statistiques avancées" : "Advanced analytics"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {fr ? "Vue d'ensemble de vos performances" : "Overview of your performance"}
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p.value
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label={fr ? "Revenus nets (70%)" : "Net revenue (70%)"}
          value={`${totalNetRevenue.toLocaleString("fr-FR")}€`}
          color="text-green-600"
          bg="bg-green-50"
          sparkData={stats.revenueByMonth.map((m) => ({ value: m.net }))}
        />
        <StatCard
          icon={Users}
          label={fr ? "Nouveaux apprenants" : "New students"}
          value={totalNewStudents}
          color="text-blue-600"
          bg="bg-blue-50"
          sparkData={stats.enrollmentsByWeek.map((w) => ({ value: w.students }))}
        />
        <StatCard
          icon={Award}
          label={fr ? "Taux de complétion" : "Completion rate"}
          value={`${stats.completionRate.toFixed(0)}%`}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          icon={Target}
          label={fr ? "Score moyen quiz" : "Avg quiz score"}
          value={`${stats.avgQuizScore.toFixed(0)}%`}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Charts grid — 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue BarChart */}
        <ChartContainer
          title={fr ? "Évolution des revenus" : "Revenue evolution"}
          exportData={stats.revenueByMonth}
          exportFilename="revenus-stats"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.revenueByMonth} barGap={2}>
              <defs>
                <linearGradient id="revGradStats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C2BD9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6C2BD9" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="netGradStats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v: number, name: string) => [`${v.toLocaleString("fr-FR")}€`, name === "revenue" ? (fr ? "Brut" : "Gross") : (fr ? "Net (70%)" : "Net (70%)")]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="url(#revGradStats)" radius={[6, 6, 0, 0]} name={fr ? "Brut" : "Gross"} />
              <Bar dataKey="net" fill="url(#netGradStats)" radius={[6, 6, 0, 0]} name={fr ? "Net" : "Net"} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Enrollments AreaChart */}
        <ChartContainer
          title={fr ? "Inscriptions par semaine" : "Enrollments by week"}
          exportData={stats.enrollmentsByWeek}
          exportFilename="inscriptions-stats"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.enrollmentsByWeek}>
              <defs>
                <linearGradient id="enrollGradStats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                formatter={(v: number) => [v, fr ? "Apprenants" : "Students"]}
              />
              <Area type="monotone" dataKey="students" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#enrollGradStats)" dot={{ r: 3, fill: "#0EA5E9", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Completion donut */}
        <ChartContainer title={fr ? "Taux de complétion" : "Completion rate"}>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={completionDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#6C2BD9" />
                  <Cell fill="#e2e8f0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.completionRate.toFixed(0)}%</p>
              <p className="text-sm text-slate-500 mt-1">{fr ? "des apprenants terminent" : "of students complete"}</p>
            </div>
          </div>
        </ChartContainer>

        {/* Top countries PieChart */}
        <ChartContainer
          title={fr ? "Apprenants par pays" : "Students by country"}
          exportData={stats.topCountries}
          exportFilename="pays-stats"
        >
          {stats.topCountries.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={stats.topCountries} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="students" paddingAngle={3}>
                    {stats.topCountries.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stats.topCountries.map((c, i) => (
                  <div key={c.country} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-slate-700">{c.country || (fr ? "Inconnu" : "Unknown")}</span>
                    <span className="text-xs text-slate-400 ml-auto font-medium">{c.students}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              {fr ? "Aucune donnée géographique" : "No geographic data"}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Formation performance table */}
      {sortedFormations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {fr ? "Performance par formation" : "Performance by course"}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{fr ? "Trier par" : "Sort by"}</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(0); }}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900"
              >
                <option value="revenue">{fr ? "Revenus" : "Revenue"}</option>
                <option value="students">{fr ? "Apprenants" : "Students"}</option>
                <option value="rating">{fr ? "Note" : "Rating"}</option>
              </select>
              <button
                onClick={() => downloadCSV(sortedFormations as unknown as Record<string, unknown>[], "formations-performance")}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-slate-50 dark:bg-slate-800/50"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 p-4">{fr ? "Formation" : "Course"}</th>
                  <th className="text-right text-xs font-medium text-slate-500 p-4">{fr ? "Apprenants" : "Students"}</th>
                  <th className="text-right text-xs font-medium text-slate-500 p-4">{fr ? "Complétion" : "Completion"}</th>
                  <th className="text-right text-xs font-medium text-slate-500 p-4">{fr ? "Revenus" : "Revenue"}</th>
                  <th className="text-right text-xs font-medium text-slate-500 p-4">{fr ? "Note" : "Rating"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFormations.map((f) => (
                  <tr key={f.name} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{f.name}</td>
                    <td className="p-4 text-sm text-slate-600 text-right">{f.students}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${f.completionRate ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{(f.completionRate ?? 0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">{f.revenue.toLocaleString("fr-FR")}€</td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-amber-500 font-medium">★ {f.rating.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {page * perPage + 1}–{Math.min((page + 1) * perPage, sortedFormations.length)} {fr ? "sur" : "of"} {sortedFormations.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:bg-slate-800/50"
                >
                  {fr ? "Préc." : "Prev"}
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:bg-slate-800/50"
                >
                  {fr ? "Suiv." : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
