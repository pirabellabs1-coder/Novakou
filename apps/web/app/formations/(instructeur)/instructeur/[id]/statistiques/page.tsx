"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Star, TrendingUp, CheckCircle, Download } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

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

export default function FormationStatistiquesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stats, setStats] = useState<FormationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/instructeur/formations/${id}/statistiques`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const statCards = stats
    ? [
        { label: "Apprenants", value: stats.studentsCount, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Note moyenne", value: `${stats.rating.toFixed(1)} ⭐`, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        { label: "CA total", value: `${(stats.totalRevenue * 0.7).toFixed(0)}€`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
        { label: "Taux de complétion", value: `${stats.completionRate.toFixed(0)}%`, icon: CheckCircle, color: "text-purple-400", bg: "bg-purple-500/10" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/formations/instructeur/mes-formations" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Statistiques</h1>
            {stats && <p className="text-sm text-slate-400">{stats.titleFr}</p>}
          </div>
        </div>
        {stats && (
          <a
            href={`/api/instructeur/formations/export-pdf?formationId=${id}`}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-border-dark hover:border-primary/50 px-4 py-2 rounded-xl transition-colors"
            download
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </a>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : !stats ? (
        <div className="text-center py-12 text-slate-400">Formation introuvable</div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-neutral-dark border border-border-dark rounded-xl p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {stats.revenueByMonth.length > 0 && (
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Revenus mensuels</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                    content={<ChartTooltip />}
                    formatter={(v: number) => [`${v}€`, "Revenus nets"]}
                  />
                  <Bar dataKey="revenue" fill="#6C2BD9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Enrollments by week */}
          {stats.enrollmentsByWeek.length > 0 && (
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Nouvelles inscriptions (8 dernières semaines)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.enrollmentsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Lesson completion */}
          {stats.lessonCompletion.length > 0 && (
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Complétion par leçon</h2>
              <div className="space-y-3">
                {stats.lessonCompletion.slice(0, 10).map((lesson) => (
                  <div key={lesson.title}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 truncate max-w-[70%]">{lesson.title}</span>
                      <span className="text-sm text-slate-400">{lesson.completedPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-border-dark rounded-full">
                      <div
                        className="h-2 bg-primary rounded-full transition-all"
                        style={{ width: `${lesson.completedPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz score */}
          {stats.avgQuizScore > 0 && (
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
              <h2 className="font-semibold text-white mb-2">Score moyen aux quiz</h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{stats.avgQuizScore.toFixed(0)}%</div>
                <div className="h-4 flex-1 bg-border-dark rounded-full">
                  <div
                    className="h-4 bg-primary rounded-full"
                    style={{ width: `${stats.avgQuizScore}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
