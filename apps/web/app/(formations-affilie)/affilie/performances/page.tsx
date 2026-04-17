"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type MonthlyPoint = { month: string; clicks: number; conversions: number; earnings: number };
type PagePerf = { page: string; clicks: number; conversions: number; earnings: number };
type PerfData = {
  isAffiliate: boolean;
  commissionPct: number;
  monthly: MonthlyPoint[];
  perPage: PagePerf[];
  totals: { clicks: number; conversions: number; earnings: number };
};

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e3a2f]/60 rounded-xl ${className ?? ""}`} />;
}

const GRADIENTS: [string, string][] = [
  ["#006e2f","#22c55e"], ["#1e3a5f","#2563eb"], ["#7c3aed","#a855f7"],
  ["#92400e","#d97706"], ["#be185d","#db2777"], ["#0e7490","#0891b2"],
  ["#065f46","#047857"], ["#0f3460","#16213e"],
];

export default function PerformancesPage() {
  const [metric, setMetric] = useState<"earnings" | "clicks">("earnings");

  const { data, isLoading } = useQuery<PerfData>({
    queryKey: ["affilie-performances"],
    queryFn: () => fetch("/api/formations/affilie/performances").then((r) => r.json()),
    staleTime: 60_000,
  });

  const monthly: MonthlyPoint[] = data?.monthly ?? [];
  const perPage: PagePerf[] = data?.perPage ?? [];
  const totals = data?.totals ?? { clicks: 0, conversions: 0, earnings: 0 };
  const COMM = data?.commissionPct ?? 40;

  const maxVal = Math.max(...monthly.map((d) => metric === "earnings" ? d.earnings : d.clicks), 1);
  const avgCtr = totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">Performances</h1>
          <p className="text-sm text-[#5c9e7a] mt-0.5">Analysez l&apos;efficacité de vos liens affiliés</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0d1f17] border border-[#1e3a2f] rounded-xl px-3 py-1.5">
          <span className="text-[10px] text-[#5c9e7a]">Commission</span>
          <span className="text-sm font-extrabold text-[#22c55e]">{COMM}%</span>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [0,1,2,3].map((i) => <SkeletonBlock key={i} className="h-28" />)
        ) : [
          {
            label: "Clics totaux",
            value: totals.clicks.toLocaleString("fr-FR"),
            icon: "ads_click",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            sub: "6 derniers mois",
          },
          {
            label: "Conversions",
            value: totals.conversions.toLocaleString("fr-FR"),
            icon: "shopping_bag",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            sub: "achats via vos liens",
          },
          {
            label: "Taux de conversion",
            value: `${avgCtr}%`,
            icon: "trending_up",
            color: "text-[#22c55e]",
            bg: "bg-[#22c55e]/10",
            sub: "clics → achats",
          },
          {
            label: "Commissions",
            value: formatFcfa(totals.earnings),
            icon: "payments",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            sub: `≈ ${toEur(totals.earnings)} €`,
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {kpi.icon}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-white mb-0.5">{kpi.value}</p>
            <p className="text-[10px] text-[#5c9e7a] mb-1">{kpi.label}</p>
            <p className="text-[10px] text-[#5c9e7a]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-white">Évolution sur 6 mois</h2>
          <div className="flex items-center gap-2">
            {[
              { key: "earnings", label: "Commissions" },
              { key: "clicks",   label: "Clics" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key as "clicks" | "earnings")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  metric === m.key ? "bg-[#22c55e] text-white" : "bg-[#1e3a2f] text-[#5c9e7a] hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <SkeletonBlock className="h-40" />
        ) : monthly.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-[#5c9e7a]">
            Aucune donnée disponible
          </div>
        ) : (
          <div className="flex items-end gap-4 h-40">
            {monthly.map((d) => {
              const value = metric === "earnings" ? d.earnings : d.clicks;
              const pct = (value / maxVal) * 144;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[9px] text-[#5c9e7a] mb-1">
                      {value > 0 ? (metric === "earnings" ? `${Math.round(value / 1000)}k` : value) : ""}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, value > 0 ? 4 : 2)}px`,
                        background: value > 0 ? "linear-gradient(to top, #006e2f, #22c55e)" : "#1e3a2f",
                        opacity: value === maxVal ? 1 : 0.55,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#5c9e7a]">{d.month}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-page performance table */}
      <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6">
        <h2 className="text-sm font-bold text-white mb-5">Performance par formation</h2>
        {isLoading ? (
          <div className="space-y-3">{[0,1,2,3].map((i) => <SkeletonBlock key={i} className="h-16" />)}</div>
        ) : perPage.length === 0 ? (
          <div className="py-10 text-center text-[#5c9e7a] text-sm">
            Partagez vos liens affiliés pour voir les performances apparaître ici.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#1e3a2f]">
                  {["Formation", "Clics", "Conversions", "CTR", "Commissions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#5c9e7a] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perPage.map((p, i) => {
                  const [gFrom, gTo] = GRADIENTS[i % GRADIENTS.length];
                  const name = p.page?.split("/").filter(Boolean).pop() ?? p.page ?? "Page inconnue";
                  const ctr = p.clicks > 0 ? (p.conversions / p.clicks) * 100 : 0;
                  return (
                    <tr key={p.page ?? i} className="border-b border-[#1e3a2f] last:border-0 hover:bg-[#1e3a2f]/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }} />
                          <p className="text-xs text-white font-medium leading-snug max-w-[200px] truncate">{name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-white font-semibold">{p.clicks}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-white font-semibold">{p.conversions}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-[#1e3a2f] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min((ctr / 20) * 100, 100)}%`,
                                background: "linear-gradient(to right, #006e2f, #22c55e)",
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#22c55e] font-bold">{ctr.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold text-[#22c55e]">{formatFcfa(p.earnings)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Conversion funnel — only if we have data */}
        {!isLoading && totals.clicks > 0 && (
          <div className="mt-6 pt-6 border-t border-[#1e3a2f]">
            <h3 className="text-xs font-bold text-white mb-4">Entonnoir de conversion</h3>
            <div className="space-y-3">
              {[
                { label: "Clics sur les liens",   value: totals.clicks,       pct: 100 },
                { label: "Pages vues (estimées)",  value: Math.round(totals.clicks * 0.78), pct: 78 },
                { label: "Achats finalisés",        value: totals.conversions, pct: totals.clicks > 0 ? parseFloat(((totals.conversions / totals.clicks) * 100).toFixed(1)) : 0 },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-[#5c9e7a] w-36 flex-shrink-0">{step.label}</span>
                  <div className="flex-1 h-5 rounded-lg bg-[#1e3a2f] overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-2 transition-all"
                      style={{
                        width: `${Math.max(step.pct, step.value > 0 ? 5 : 0)}%`,
                        background: "linear-gradient(to right, #006e2f, #22c55e)",
                        minWidth: step.value > 0 ? "2rem" : "0",
                      }}
                    >
                      <span className="text-[9px] text-white font-bold whitespace-nowrap">{step.value.toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#5c9e7a] w-12 text-right">{step.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
