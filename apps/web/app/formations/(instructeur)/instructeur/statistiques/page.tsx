"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface InstructeurStats {
  revenueByMonth: { month: string; revenue: number; net: number }[];
  enrollmentsByWeek: { week: string; students: number }[];
  formationPerformance: { name: string; students: number; rating: number; revenue: number }[];
  completionRate: number;
  avgQuizScore: number;
  topCountries: { country: string; students: number }[];
  conversionData: { stage: string; count: number }[];
}

const COLORS = ["#6C2BD9", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function InstructeurStatistiquesPage() {
  const [stats, setStats] = useState<InstructeurStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6m");

  useEffect(() => {
    fetch(`/api/instructeur/statistiques?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setStats(d.stats ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const INSTRUCTOR_NAV = [
    ["/formations/instructeur/dashboard", "Dashboard"],
    ["/formations/instructeur/mes-formations", "Formations"],
    ["/formations/instructeur/apprenants", "Apprenants"],
    ["/formations/instructeur/revenus", "Revenus"],
    ["/formations/instructeur/avis", "Avis"],
    ["/formations/instructeur/statistiques", "Statistiques"],
  ] as [string, string][];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Statistiques avancées</h1>
        <div className="flex gap-1 bg-border-dark/30 rounded-xl p-1">
          {(["7d", "30d", "3m", "6m", "1y"] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setLoading(true); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${period === p ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-border-dark/30 rounded-xl p-1 w-fit overflow-x-auto">
        {INSTRUCTOR_NAV.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              href.includes("statistiques") ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-border-dark/50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-neutral-dark border border-border-dark rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <div className="text-center py-12 text-slate-400">Données non disponibles</div>
      ) : (
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{stats.completionRate.toFixed(0)}%</p>
              <p className="text-xs text-slate-400 mt-1">Taux de complétion</p>
            </div>
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{stats.avgQuizScore.toFixed(0)}%</p>
              <p className="text-xs text-slate-400 mt-1">Score moyen quiz</p>
            </div>
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
              <p className="text-2xl font-bold text-white">
                {stats.enrollmentsByWeek.reduce((acc, w) => acc + w.students, 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Nouveaux apprenants</p>
            </div>
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
              <p className="text-2xl font-bold text-white">
                {stats.revenueByMonth.reduce((acc, m) => acc + m.net, 0).toFixed(0)}€
              </p>
              <p className="text-xs text-slate-400 mt-1">Revenus nets (70%)</p>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Évolution des revenus</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  content={<ChartTooltip />}
                  formatter={(v: number, name: string) => [`${v}€`, name === "revenue" ? "Brut" : "Net (70%)"]}
                />
                <Bar dataKey="revenue" fill="#6C2BD9" radius={[4, 4, 0, 0]} name="revenue" />
                <Bar dataKey="net" fill="#10b981" radius={[4, 4, 0, 0]} name="net" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Enrollments by week */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Nouveaux apprenants par semaine</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.enrollmentsByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="students" stroke="#6C2BD9" strokeWidth={2} dot={{ fill: "#6C2BD9", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Formation performance */}
          {stats.formationPerformance.length > 0 && (
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Performance par formation</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.formationPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={120} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="students" fill="#6C2BD9" radius={[0, 4, 4, 0]} name="Apprenants" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top countries */}
          {stats.topCountries.length > 0 && (
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Apprenants par pays (top 5)</h2>
              <div className="flex gap-6 items-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={stats.topCountries}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="students"
                    >
                      {stats.topCountries.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats.topCountries.map((c, i) => (
                    <div key={c.country} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-300">{c.country || "Inconnu"}</span>
                      <span className="text-xs text-slate-500 ml-2">{c.students}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
