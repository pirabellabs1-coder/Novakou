"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

type MonthlyPoint = { month: string; totalXof: number };
type ByType = { formation: number; product: number; mentor: number };

type SpendingData = {
  totalXof: number;
  totalEur: number;
  totalPurchases: number;
  monthly: MonthlyPoint[];
  byType: ByType;
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ""}`} />;
}

export default function DepensesPage() {
  const [filterType, setFilterType] = useState<string>("tous");

  const { data, isLoading } = useQuery<SpendingData>({
    queryKey: ["apprenant-spending"],
    queryFn:  () => fetch("/api/formations/apprenant/spending").then((r) => r.json()),
    staleTime: 60_000,
  });

  const monthly: MonthlyPoint[] = data?.monthly ?? [];
  const byType: ByType = data?.byType ?? { formation: 0, product: 0, mentor: 0 };
  const maxSpending = Math.max(...monthly.map((m) => m.totalXof), 1);
  const totalXof = data?.totalXof ?? 0;
  const totalPurchases = data?.totalPurchases ?? 0;

  // Derive breakdown percentages
  const totalForBreakdown = byType.formation + byType.product + byType.mentor || 1;
  const breakdownData = [
    { label: "Formations vidéo", type: "formation", count: 0, fcfa: byType.formation, color: "bg-blue-500",   pct: Math.round((byType.formation / totalForBreakdown) * 100) },
    { label: "Coaching mentor",  type: "mentor",    count: 0, fcfa: byType.mentor,    color: "bg-purple-500", pct: Math.round((byType.mentor / totalForBreakdown) * 100) },
    { label: "Produits",         type: "product",   count: 0, fcfa: byType.product,   color: "bg-amber-500",  pct: Math.round((byType.product / totalForBreakdown) * 100) },
  ].filter((b) => b.fcfa > 0);

  // Best month
  const bestMonth = monthly.reduce((best, m) => m.totalXof > best.totalXof ? m : best, { month: "—", totalXof: 0 });

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#191c1e]">Mes dépenses</h1>
          <p className="text-sm text-[#5c647a] mt-0.5">Suivi de vos investissements en formation</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          [0,1,2,3].map((i) => <SkeletonBlock key={i} className="h-28" />)
        ) : [
          { icon: "payments",     iconColor: "text-[#006e2f]",   bg: "bg-[#006e2f]/10", label: "Total dépensé",     value: formatFcfa(totalXof),              sub: `≈ ${toEur(totalXof)} €` },
          { icon: "shopping_bag", iconColor: "text-blue-600",    bg: "bg-blue-50",      label: "Achats effectués",  value: String(totalPurchases),            sub: "produits & formations" },
          { icon: "play_circle",  iconColor: "text-purple-600",  bg: "bg-purple-50",    label: "Formations",        value: String(byType.formation > 0 ? 1 : 0), sub: "achetées" },
          { icon: "trending_up",  iconColor: "text-amber-600",   bg: "bg-amber-50",     label: "Mois le plus actif", value: bestMonth.month.charAt(0).toUpperCase() + bestMonth.month.slice(1), sub: formatFcfa(bestMonth.totalXof) },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${stat.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
            </div>
            <p className="text-lg font-extrabold text-[#191c1e] leading-tight">{stat.value}</p>
            <p className="text-xs font-semibold text-[#191c1e] mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-[#5c647a]">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-[#191c1e] text-sm">Dépenses par mois</h2>
            <span className="text-xs text-[#5c647a]">6 derniers mois</span>
          </div>
          {isLoading ? (
            <SkeletonBlock className="h-32" />
          ) : monthly.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[#5c647a] text-sm">Aucune dépense enregistrée</div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthly.map((m) => {
                const pct = maxSpending > 0 ? (m.totalXof / maxSpending) * 100 : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-semibold text-[#5c647a]">
                      {m.totalXof > 0 ? `${Math.round(m.totalXof / 1000)}k` : ""}
                    </span>
                    <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                      <div className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${Math.max(pct, m.totalXof > 0 ? 4 : 0)}%`,
                          background: m.totalXof > 0 ? "linear-gradient(to top, #006e2f, #22c55e)" : "#f3f4f6",
                          minHeight: m.totalXof > 0 ? "4px" : "2px",
                        }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#5c647a]">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-[#191c1e] text-sm mb-5">Répartition</h2>
          {isLoading ? (
            <div className="space-y-4">{[0,1,2].map((i) => <SkeletonBlock key={i} className="h-12" />)}</div>
          ) : breakdownData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[#5c647a] text-sm text-center">Aucune dépense</div>
          ) : (
            <div className="space-y-4">
              {breakdownData.map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-[#5c647a]">{cat.label}</span>
                    <span className="text-xs font-bold text-[#191c1e]">{cat.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.color} transition-all duration-500`} style={{ width: `${cat.pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[#5c647a]">{cat.label}</span>
                    <span className="text-[10px] text-[#5c647a]">{formatFcfa(cat.fcfa)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#191c1e] text-sm">Résumé par catégorie</h2>
          <div className="flex items-center gap-1 flex-wrap">
            {["tous", "formation", "product", "mentor"].map((type) => (
              <button key={type} onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  filterType === type ? "bg-[#006e2f] text-white" : "bg-gray-100 text-[#5c647a] hover:text-[#191c1e]"
                }`}>
                {type === "tous" ? "Tous" : type === "formation" ? "Formations" : type === "product" ? "Produits" : "Mentors"}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3">{[0,1,2].map((i) => <SkeletonBlock key={i} className="h-14" />)}</div>
        ) : (
          <div className="space-y-3">
            {[
              { type: "formation", label: "Formations vidéo", icon: "play_circle", color: "text-blue-600", bg: "bg-blue-50", value: byType.formation },
              { type: "product",   label: "Produits numériques", icon: "inventory_2", color: "text-amber-600", bg: "bg-amber-50", value: byType.product },
              { type: "mentor",    label: "Sessions mentor",  icon: "support_agent", color: "text-purple-600", bg: "bg-purple-50", value: byType.mentor },
            ]
            .filter((row) => filterType === "tous" || row.type === filterType)
            .map((row) => (
              <div key={row.type} className="flex items-center gap-4 p-3 rounded-xl bg-[#f7f9fb]">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${row.bg}`}>
                  <span className={`material-symbols-outlined text-[18px] ${row.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{row.icon}</span>
                </div>
                <span className="flex-1 text-sm text-[#5c647a]">{row.label}</span>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#006e2f]">{formatFcfa(row.value)}</p>
                  <p className="text-[10px] text-[#5c647a]">≈ {toEur(row.value)} €</p>
                </div>
              </div>
            ))}
            {filterType !== "tous" && byType[filterType as keyof ByType] === 0 && (
              <p className="text-center text-sm text-[#5c647a] py-4">Aucune dépense dans cette catégorie.</p>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 mt-5 pt-4 flex items-center justify-between">
          <span className="font-bold text-[#191c1e]">Total global</span>
          <div className="text-right">
            <p className="font-extrabold text-[#006e2f]">{isLoading ? "…" : formatFcfa(totalXof)}</p>
            <p className="text-[10px] text-[#5c647a]">≈ {isLoading ? "…" : toEur(totalXof)} €</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/apprenant/commandes"
            className="text-xs text-[#006e2f] font-semibold hover:underline">
            Voir l&apos;historique des commandes →
          </Link>
        </div>
      </div>
    </div>
  );
}
