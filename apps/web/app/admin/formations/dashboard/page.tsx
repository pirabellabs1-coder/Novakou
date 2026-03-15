"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, Users, DollarSign, Award, Clock, TrendingUp, TrendingDown,
  Minus, GraduationCap, FileCheck, UserPlus,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

// ── Types ──────────────────────────────────────────────────────

interface AdminFormationStats {
  totalFormations: number;
  totalStudents: number;
  revenueThisMonth: number;
  certificatesIssued: number;
  pendingFormations: number;
  pendingInstructors: number;
  revenueByMonth: { month: string; revenue: number; commission: number }[];
  enrollmentsByMonth: { month: string; enrollments: number }[];
  topCategories: { name: string; value: number; color: string }[];
  recentActivity: { type: string; title: string; user: string; date: string; timestamp?: string }[];
  trends: {
    formationsTrend: number;
    studentsTrend: number;
    revenueTrend: number;
    certificatesTrend: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────

const CHART_COLORS = ["#22C55E", "#3B82F6", "#A855F7", "#F59E0B", "#EF4444", "#06B6D4"];

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-500">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
        <TrendingUp className="w-3 h-3" /> +{value}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-400">
      <TrendingDown className="w-3 h-3" /> {value}%
    </span>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <BarChart className="w-6 h-6 text-slate-600" />
      </div>
      <p className="text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 px-3 py-2 shadow-xl text-xs" style={{ backgroundColor: "#1E293B" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.name.includes("Revenu") ? `${p.value}\u00A0\u20AC` : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Activity Icon ──────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "enrollment":
      return (
        <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-4 h-4 text-blue-400" />
        </div>
      );
    case "certificate":
      return (
        <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <FileCheck className="w-4 h-4 text-emerald-400" />
        </div>
      );
    default:
      return (
        <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-4 h-4 text-purple-400" />
        </div>
      );
  }
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminFormationsDashboardPage() {
  const [stats, setStats] = useState<AdminFormationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/formations/stats")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const statCards = [
    {
      label: "Formations actives",
      value: stats?.totalFormations ?? 0,
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      trend: stats?.trends?.formationsTrend ?? 0,
    },
    {
      label: "Total apprenants",
      value: (stats?.totalStudents ?? 0).toLocaleString(),
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      trend: stats?.trends?.studentsTrend ?? 0,
    },
    {
      label: "CA ce mois",
      value: `${(stats?.revenueThisMonth ?? 0).toFixed(0)}\u00A0\u20AC`,
      icon: DollarSign,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      trend: stats?.trends?.revenueTrend ?? 0,
    },
    {
      label: "Certificats delivres",
      value: (stats?.certificatesIssued ?? 0).toLocaleString(),
      icon: Award,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      trend: stats?.trends?.certificatesTrend ?? 0,
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 rounded w-1/3" style={{ backgroundColor: "#1E293B" }} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl" style={{ backgroundColor: "#111827" }} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 rounded-xl" style={{ backgroundColor: "#111827" }} />
            <div className="h-72 rounded-xl" style={{ backgroundColor: "#111827" }} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Impossible de charger les statistiques</h3>
          <p className="text-sm text-slate-400 mb-4">Verifiez la connexion au serveur et reessayez.</p>
          <button
            onClick={() => { setError(false); setLoading(true); window.location.reload(); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-5 py-2 rounded-lg transition-colors text-sm"
          >
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  const hasRevenueData = stats?.revenueByMonth?.some((m) => m.revenue > 0);
  const hasEnrollmentData = stats?.enrollmentsByMonth?.some((m) => m.enrollments > 0);
  const hasCategoryData = stats?.topCategories && stats.topCategories.length > 0;
  const hasActivityData = stats?.recentActivity && stats.recentActivity.length > 0;

  return (
    <div className="p-8 space-y-6" style={{ backgroundColor: "#0F172A" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Administration Formations</h1>
          <p className="text-sm text-slate-400 mt-1">Vue d&apos;ensemble des performances</p>
        </div>
        <div className="flex gap-3">
          {stats && stats.pendingFormations > 0 && (
            <Link href="/admin/formations/liste?status=EN_ATTENTE" className="flex items-center gap-2 bg-amber-500/10 text-amber-400 text-sm font-medium px-3 py-2 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
              <Clock className="w-4 h-4" />
              {stats.pendingFormations} en attente
            </Link>
          )}
          {stats && stats.pendingInstructors > 0 && (
            <Link href="/admin/formations/instructeurs?status=EN_ATTENTE" className="flex items-center gap-2 bg-orange-500/10 text-orange-400 text-sm font-medium px-3 py-2 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
              <Users className="w-4 h-4" />
              {stats.pendingInstructors} instructeur{stats.pendingInstructors > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ backgroundColor: "#111827" }}>
        {([
          ["/admin/formations/dashboard", "Dashboard"],
          ["/admin/formations/liste", "Formations"],
          ["/admin/formations/instructeurs", "Instructeurs"],
          ["/admin/formations/apprenants", "Apprenants"],
          ["/admin/formations/finances", "Finances"],
          ["/admin/formations/certificats", "Certificats"],
          ["/admin/formations/categories", "Categories"],
        ] as [string, string][]).map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              href.includes("dashboard") ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-5 border ${s.borderColor}`}
            style={{ backgroundColor: "#111827" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <TrendBadge value={s.trend} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <div className="rounded-xl p-6 border border-white/5" style={{ backgroundColor: "#111827" }}>
          <h2 className="font-semibold text-white mb-1">Revenus formations</h2>
          <p className="text-xs text-slate-500 mb-5">12 derniers mois</p>
          {hasRevenueData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.revenueByMonth} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}\u20AC`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} name="Revenus bruts" />
                <Bar dataKey="commission" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Commissions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Les revenus apparaitront lorsque des apprenants acheteront des formations." />
          )}
        </div>

        {/* Enrollments Line Chart */}
        <div className="rounded-xl p-6 border border-white/5" style={{ backgroundColor: "#111827" }}>
          <h2 className="font-semibold text-white mb-1">Inscriptions par mois</h2>
          <p className="text-xs text-slate-500 mb-5">Evolution des inscriptions</p>
          {hasEnrollmentData ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats?.enrollmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  dot={{ fill: "#22C55E", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#22C55E", stroke: "#0F172A", strokeWidth: 3 }}
                  name="Inscriptions"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Les statistiques d'inscriptions apparaitront lorsque des apprenants s'inscriront aux formations." />
          )}
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories (Donut Chart) */}
        <div className="rounded-xl p-6 border border-white/5" style={{ backgroundColor: "#111827" }}>
          <h2 className="font-semibold text-white mb-1">Top categories</h2>
          <p className="text-xs text-slate-500 mb-5">Repartition des formations</p>
          {hasCategoryData ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats?.topCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {stats?.topCategories.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
                {stats?.topCategories.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs text-slate-400">{cat.name} ({cat.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart message="Les categories apparaitront lorsque des formations seront publiees." />
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 overflow-hidden" style={{ backgroundColor: "#111827" }}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Activite recente</h2>
              <p className="text-xs text-slate-500">Dernieres actions sur la plateforme</p>
            </div>
          </div>

          {hasActivityData ? (
            <div className="divide-y divide-white/5">
              {stats?.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <ActivityIcon type={a.type} />

                  {/* Timeline connector */}
                  <div className="relative flex-shrink-0 w-0">
                    {i < (stats?.recentActivity?.length ?? 0) - 1 && (
                      <div className="absolute left-0 top-4 w-px h-8 bg-white/5" style={{ marginLeft: "-33px" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.user}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 font-medium">{a.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                L&apos;activite apparaitra lorsque vous aurez des formations, des apprenants ou des certificats.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
