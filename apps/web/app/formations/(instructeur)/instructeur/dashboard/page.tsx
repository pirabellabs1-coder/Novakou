"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useInstructorDashboard } from "@/lib/formations/hooks";
import {
  DollarSign, Users, BookOpen, Star, Plus, BarChart2,
  ChevronRight, AlertTriangle, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import StatCard from "@/components/formations/StatCard";
import ChartContainer from "@/components/formations/ChartContainer";
import EmptyState from "@/components/formations/EmptyState";

interface DashboardStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalStudents: number;
  activeFormations: number;
  averageRating: number;
  revenueTrend: number;
  studentsTrend: number;
  revenueByMonth: { month: string; revenue: number }[];
  enrollmentsByMonth: { month: string; students: number }[];
  formationDistribution: { name: string; value: number }[];
  topFormations: { id: string; titleFr: string; titleEn: string; students: number; revenue: number; rating: number }[];
  recentEnrollments: { id?: string; name?: string; formation?: string; date?: string; createdAt?: string; user?: { name: string }; formation_obj?: { titleFr: string } }[];
  recentReviews: { name?: string; rating: number; comment: string; formation?: string; date?: string }[];
}

const PIE_COLORS = ["#6C2BD9", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const PERIOD_OPTIONS = [
  { value: "7d", label: "7j" },
  { value: "30d", label: "30j" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1an" },
];

export default function InstructeurDashboardPage() {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [period, setPeriod] = useState("30d");

  const { data: rawData, isLoading: dataLoading, error: queryError, refetch } = useInstructorDashboard(period);

  const loading = dataLoading;
  const error = queryError ? (queryError as Error).message : null;

  // Map API fields to expected shape
  const stats: DashboardStats | null = rawData ? {
    ...(rawData as DashboardStats),
    averageRating: (rawData as DashboardStats & { avgRating?: number }).averageRating ?? (rawData as DashboardStats & { avgRating?: number }).avgRating ?? 0,
    revenueTrend: (rawData as DashboardStats).revenueTrend ?? 0,
    studentsTrend: (rawData as DashboardStats).studentsTrend ?? 0,
    revenueByMonth: ((rawData as DashboardStats).revenueByMonth ?? []).map(
      (m: { month: string; amount?: number; revenue?: number }) => ({
        month: m.month,
        revenue: (m as { revenue?: number }).revenue ?? (m as { amount?: number }).amount ?? 0,
      })
    ),
    enrollmentsByMonth: (rawData as DashboardStats).enrollmentsByMonth ?? [],
    formationDistribution: (rawData as DashboardStats).formationDistribution ??
      ((rawData as DashboardStats).topFormations ?? []).map((f) => ({
        name: f.titleFr?.substring(0, 20) || "Formation",
        value: f.students,
      })),
    recentEnrollments: (rawData as DashboardStats).recentEnrollments ?? [],
    recentReviews: (rawData as DashboardStats).recentReviews ?? [],
    topFormations: (rawData as DashboardStats).topFormations ?? [],
  } : null;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/formations/connexion");
    }
  }, [status, router]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-200 rounded-2xl" />
            <div className="h-80 bg-slate-200 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-200 rounded-2xl" />
            <div className="h-64 bg-slate-200 rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {fr ? "Une erreur est survenue" : "An error occurred"}
          </h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // Generate sparkline data from revenueByMonth
  const revenueSparkData = (stats?.revenueByMonth ?? []).map((m) => ({ value: m.revenue }));
  const enrollmentSparkData = (stats?.enrollmentsByMonth ?? []).map((m) => ({ value: m.students }));

  const statCards = [
    {
      icon: DollarSign,
      label: fr ? "CA ce mois" : "Revenue this month",
      value: `${(stats?.revenueThisMonth ?? 0).toLocaleString("fr-FR")}€`,
      color: "text-green-600",
      bg: "bg-green-50",
      trend: stats?.revenueTrend ?? null,
      sparkData: revenueSparkData,
    },
    {
      icon: Users,
      label: fr ? "Total apprenants" : "Total students",
      value: stats?.totalStudents ?? 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: stats?.studentsTrend ?? null,
      sparkData: enrollmentSparkData,
    },
    {
      icon: BookOpen,
      label: fr ? "Formations actives" : "Active courses",
      value: stats?.activeFormations ?? 0,
      color: "text-purple-600",
      bg: "bg-purple-50",
      trend: null,
    },
    {
      icon: Star,
      label: fr ? "Note moyenne" : "Avg rating",
      value: (stats?.averageRating ?? 0).toFixed(1),
      suffix: "/5",
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: null,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {fr ? "Tableau de bord" : "Dashboard"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {fr ? "Bienvenue," : "Welcome,"} {session?.user?.name}
          </p>
        </div>
        <Link
          href="/formations/instructeur/creer"
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          {fr ? "Nouvelle formation" : "New course"}
        </Link>
      </div>

      {/* KPI StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            suffix={s.suffix}
            color={s.color}
            bg={s.bg}
            trend={s.trend}
            sparkData={s.sparkData}
          />
        ))}
      </div>

      {/* Welcome empty state */}
      {stats && stats.activeFormations === 0 && stats.totalStudents === 0 && (
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {fr ? "Bienvenue sur votre espace instructeur !" : "Welcome to your instructor space!"}
          </h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {fr
              ? "Créez votre première formation et commencez à partager vos connaissances avec des apprenants du monde entier."
              : "Create your first course and start sharing your knowledge with learners worldwide."}
          </p>
          <Link
            href="/formations/instructeur/creer"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {fr ? "Créer ma première formation" : "Create my first course"}
          </Link>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue BarChart */}
        <ChartContainer
          title={fr ? "Revenus mensuels" : "Monthly revenue"}
          exportData={stats?.revenueByMonth}
          exportFilename="revenus"
          actions={
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === p.value
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        >
          {stats?.revenueByMonth && stats.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.revenueByMonth} barSize={20}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C2BD9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6C2BD9" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: number) => [`${v.toLocaleString("fr-FR")}€`, fr ? "Revenus" : "Revenue"]}
                />
                <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<TrendingUp className="w-8 h-8 text-slate-300" />}
              title={fr ? "Aucune donnée" : "No data"}
              description={fr ? "Les revenus apparaîtront ici après vos premières ventes" : "Revenue will appear here after your first sales"}
            />
          )}
        </ChartContainer>

        {/* Enrollments AreaChart */}
        <ChartContainer
          title={fr ? "Inscriptions" : "Enrollments"}
          exportData={stats?.enrollmentsByMonth}
          exportFilename="inscriptions"
        >
          {stats?.enrollmentsByMonth && stats.enrollmentsByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.enrollmentsByMonth}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: number) => [v, fr ? "Apprenants" : "Students"]}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#0EA5E9"
                  strokeWidth={2.5}
                  fill="url(#enrollGrad)"
                  dot={{ r: 4, fill: "#0EA5E9", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#0EA5E9" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {fr ? "Pas encore de données d'inscription" : "No enrollment data yet"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {fr ? "Les inscriptions apparaîtront ici après vos premières ventes" : "Enrollments will appear here after your first sales"}
                </p>
              </div>
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Distribution + Recent activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart distribution */}
        <ChartContainer title={fr ? "Répartition des apprenants" : "Student distribution"}>
          {stats?.formationDistribution && stats.formationDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stats.formationDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name?.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.formationDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  formatter={(v: number) => [v, fr ? "Apprenants" : "Students"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
              {fr ? "Aucune donnée" : "No data"}
            </div>
          )}
        </ChartContainer>

        {/* Recent enrollments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {fr ? "Dernières inscriptions" : "Recent enrollments"}
            </h3>
            <Link
              href="/formations/instructeur/apprenants"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              {fr ? "Voir tout" : "See all"} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {(stats?.recentEnrollments ?? []).slice(0, 5).map((e, i) => {
              const name = e.name || e.user?.name || "Apprenant";
              const formation = e.formation || (e as { formation_obj?: { titleFr: string } }).formation_obj?.titleFr || "";
              const date = e.date || (e.createdAt ? new Date(e.createdAt).toLocaleDateString("fr-FR") : "");
              return (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{formation}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{date}</span>
                </div>
              );
            })}
            {!stats?.recentEnrollments?.length && (
              <p className="text-center text-slate-400 text-sm py-8">
                {fr ? "Aucune inscription récente" : "No recent enrollments"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top formations */}
      {stats?.topFormations && stats.topFormations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {fr ? "Meilleures formations" : "Top courses"}
            </h3>
            <Link
              href="/formations/instructeur/mes-formations"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              {fr ? "Voir tout" : "See all"} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {stats.topFormations.map((f, i) => {
              const title = fr ? f.titleFr : f.titleEn || f.titleFr;
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{title}</p>
                    <p className="text-xs text-slate-500">
                      {f.students} {fr ? "apprenants" : "students"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {f.rating.toFixed(1)}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {f.revenue.toLocaleString("fr-FR")}€
                  </span>
                  <Link
                    href={`/formations/instructeur/${f.id}/statistiques`}
                    className="text-slate-400 hover:text-primary transition-colors"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state if no data at all */}
      {!stats?.topFormations?.length && !stats?.revenueByMonth?.length && stats?.activeFormations !== 0 && (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-slate-300" />}
          title={fr ? "Pas encore de données" : "No data yet"}
          description={fr ? "Créez votre première formation pour commencer" : "Create your first course to get started"}
          ctaLabel={fr ? "Créer une formation" : "Create a course"}
          ctaHref="/formations/instructeur/creer"
        />
      )}
    </div>
  );
}
