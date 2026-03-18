"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInstructorFormationStats } from "@/lib/formations/hooks";
import {
  ArrowLeft, Users, Star, TrendingUp, CheckCircle, Download, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

import StatCard from "@/components/formations/StatCard";
import ChartContainer from "@/components/formations/ChartContainer";
import EmptyState from "@/components/formations/EmptyState";

interface FormationStats {
  titleFr: string;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  completionRate: number;
  totalRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  enrollmentsByWeek: { week: string; count: number }[];
  avgQuizScore: number;
  lessonCompletion: { title: string; completedPct: number }[];
}

function getBarColor(pct: number): string {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#F59E0B";
  if (pct >= 30) return "#F97316";
  return "#EF4444";
}

export default function FormationStatistiquesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const fr = locale === "fr";

  const { data, isLoading: loading, error: queryError, refetch } = useInstructorFormationStats(id, "all");
  const stats = data as FormationStats | null | undefined;
  const error = queryError ? (queryError as Error).message : null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{fr ? "Erreur de chargement" : "Loading error"}</p>
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
          title={fr ? "Formation introuvable" : "Course not found"}
          description={fr ? "Cette formation n'existe pas ou a été supprimée" : "This course doesn't exist or was deleted"}
          ctaLabel={fr ? "Retour" : "Back"}
          ctaHref="/formations/instructeur/mes-formations"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/formations/instructeur/mes-formations" className="text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {fr ? "Statistiques" : "Statistics"}
            </h1>
            <p className="text-sm text-slate-500">{stats.titleFr}</p>
          </div>
        </div>
        {/* Export PDF — bientot disponible */}
        <span
          title={fr ? "Bientôt disponible" : "Coming soon"}
          className="flex items-center gap-2 text-sm text-slate-300 border border-slate-100 px-4 py-2 rounded-xl cursor-not-allowed select-none"
        >
          <Download className="w-4 h-4" />
          {fr ? "Exporter PDF" : "Export PDF"}
        </span>
      </div>

      {/* KPI StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label={fr ? "Apprenants" : "Students"}
          value={stats.studentsCount}
          color="text-blue-600"
          bg="bg-blue-50"
          sparkData={stats.enrollmentsByWeek.map((w) => ({ value: w.count }))}
        />
        <StatCard
          icon={Star}
          label={fr ? "Note moyenne" : "Avg rating"}
          value={stats.rating.toFixed(1)}
          suffix="/5"
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          icon={TrendingUp}
          label={fr ? "CA total (net)" : "Total revenue (net)"}
          value={`${(stats.totalRevenue * 0.7).toLocaleString("fr-FR")}€`}
          color="text-green-600"
          bg="bg-green-50"
          sparkData={stats.revenueByMonth.map((m) => ({ value: m.revenue }))}
        />
        <StatCard
          icon={CheckCircle}
          label={fr ? "Taux de complétion" : "Completion rate"}
          value={`${stats.completionRate.toFixed(0)}%`}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue BarChart */}
        <ChartContainer
          title={fr ? "Revenus mensuels" : "Monthly revenue"}
          exportData={stats.revenueByMonth}
          exportFilename={`revenus-${id}`}
        >
          {stats.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.revenueByMonth}>
                <defs>
                  <linearGradient id="revGradFormation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C2BD9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6C2BD9" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(v: number) => [`${v.toLocaleString("fr-FR")}€`, fr ? "Revenus nets" : "Net revenue"]}
                />
                <Bar dataKey="revenue" fill="url(#revGradFormation)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
              {fr ? "Aucun revenu" : "No revenue"}
            </div>
          )}
        </ChartContainer>

        {/* Enrollments AreaChart */}
        <ChartContainer
          title={fr ? "Inscriptions par semaine" : "Enrollments by week"}
          exportData={stats.enrollmentsByWeek}
          exportFilename={`inscriptions-${id}`}
        >
          {stats.enrollmentsByWeek.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.enrollmentsByWeek}>
                <defs>
                  <linearGradient id="enrollGradFormation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(v: number) => [v, fr ? "Inscriptions" : "Enrollments"]}
                />
                <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} fill="url(#enrollGradFormation)" dot={{ r: 3, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
              {fr ? "Aucune inscription" : "No enrollments"}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Lesson completion — horizontal bars colored by performance */}
      {stats.lessonCompletion.length > 0 && (
        <ChartContainer
          title={fr ? "Complétion par leçon" : "Completion by lesson"}
          exportData={stats.lessonCompletion}
          exportFilename={`completion-${id}`}
        >
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {stats.lessonCompletion.map((lesson, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 truncate max-w-[70%]">
                    {i + 1}. {lesson.title}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: getBarColor(lesson.completedPct) }}
                  >
                    {lesson.completedPct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${lesson.completedPct}%`,
                      backgroundColor: getBarColor(lesson.completedPct),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      )}

      {/* Quiz score */}
      {stats.avgQuizScore > 0 && (
        <ChartContainer title={fr ? "Score moyen aux quiz" : "Average quiz score"}>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="#6C2BD9"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.avgQuizScore / 100) * 327} 327`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.avgQuizScore.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {stats.avgQuizScore >= 80
                  ? (fr ? "Excellent !" : "Excellent!")
                  : stats.avgQuizScore >= 60
                  ? (fr ? "Bon niveau" : "Good level")
                  : (fr ? "Peut être amélioré" : "Room for improvement")}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {fr
                  ? "Score moyen de tous les quiz de cette formation"
                  : "Average score across all quizzes in this course"}
              </p>
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  );
}
