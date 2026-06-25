// Refonte design "Stitch" — apprenant depenses — vert Novakou — 2026-06-13
"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StCard, StPageHeader, StButton, StKpiCompact, StSectionTitle, StTabs, ST } from "@/components/stitch";
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  PlayCircle,
  Package,
  Headset,
  ArrowRight,
} from "lucide-react";

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }

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
  return <div className={`animate-pulse rounded-xl ${className ?? ""}`} style={{ background: "#f3f6f4" }} />;
}

export default function DepensesPage() {
  const [filterType, setFilterType] = useState<string>("tous");

  const { data, isLoading } = useQuery<SpendingData>({
    queryKey: ["apprenant-spending"],
    queryFn: () => fetch("/api/formations/apprenant/spending").then((r) => r.json()),
    staleTime: 60_000,
  });

  const monthly: MonthlyPoint[] = data?.monthly ?? [];
  const byType: ByType = data?.byType ?? { formation: 0, product: 0, mentor: 0 };
  const maxSpending = Math.max(...monthly.map((m) => m.totalXof), 1);
  const totalXof = data?.totalXof ?? 0;
  const totalPurchases = data?.totalPurchases ?? 0;

  const totalForBreakdown = byType.formation + byType.product + byType.mentor || 1;
  const breakdownData = [
    { label: "Formations vidéo", type: "formation", fcfa: byType.formation, color: ST.blueText, pct: Math.round((byType.formation / totalForBreakdown) * 100) },
    { label: "Coaching mentor", type: "mentor", fcfa: byType.mentor, color: ST.green, pct: Math.round((byType.mentor / totalForBreakdown) * 100) },
    { label: "Produits", type: "product", fcfa: byType.product, color: ST.amberText, pct: Math.round((byType.product / totalForBreakdown) * 100) },
  ].filter((b) => b.fcfa > 0);

  const bestMonth = monthly.reduce((best, m) => (m.totalXof > best.totalXof ? m : best), { month: "—", totalXof: 0 });

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes dépenses"
          subtitle="Suivi de vos investissements en formation, produits et accompagnement"
          actions={
            <StButton variant="secondary" href="/apprenant/commandes" iconRight={ArrowRight}>
              Historique commandes
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <StKpiCompact label="Total dépensé" value={isLoading ? "…" : formatFcfa(totalXof)} icon={Wallet} tone="green" />
          <StKpiCompact label="Achats effectués" value={isLoading ? "…" : totalPurchases} icon={ShoppingBag} tone="blue" />
          <StKpiCompact label="Formations achetées" value={isLoading ? "…" : byType.formation > 0 ? 1 : 0} icon={PlayCircle} tone="green" />
          <StKpiCompact
            label="Mois le plus actif"
            value={isLoading ? "…" : bestMonth.month.charAt(0).toUpperCase() + bestMonth.month.slice(1)}
            icon={TrendingUp}
            tone="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-4">
          {/* Monthly chart */}
          <StCard className="lg:col-span-2">
            <StSectionTitle action={<span className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>6 derniers mois</span>}>
              Dépenses par mois
            </StSectionTitle>
            {isLoading ? (
              <SkeletonBlock className="h-40" />
            ) : monthly.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[13px] font-semibold" style={{ color: ST.textSecondary }}>
                Aucune dépense enregistrée
              </div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {monthly.map((m) => {
                  const pct = maxSpending > 0 ? (m.totalXof / maxSpending) * 100 : 0;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[9px] font-bold" style={{ color: ST.textSecondary }}>
                        {m.totalXof > 0 ? `${Math.round(m.totalXof / 1000)}k` : ""}
                      </span>
                      <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                        <div
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${Math.max(pct, m.totalXof > 0 ? 4 : 0)}%`,
                            background: m.totalXof > 0 ? "linear-gradient(to top, #006e2f, #22c55e)" : "#eef2ef",
                            minHeight: m.totalXof > 0 ? "4px" : "2px",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: ST.textSecondary }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </StCard>

          {/* Breakdown */}
          <StCard>
            <StSectionTitle>Répartition</StSectionTitle>
            {isLoading ? (
              <div className="space-y-4">{[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-12" />)}</div>
            ) : breakdownData.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[13px] font-semibold" style={{ color: ST.textSecondary }}>
                Aucune dépense
              </div>
            ) : (
              <div className="space-y-4">
                {breakdownData.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>{cat.label}</span>
                      <span className="text-[12px] font-extrabold" style={{ color: ST.text }}>{cat.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e9efeb" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.pct}%`, background: cat.color }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] font-semibold" style={{ color: ST.textMuted }}>{cat.label}</span>
                      <span className="text-[10px] font-semibold" style={{ color: ST.textMuted }}>{formatFcfa(cat.fcfa)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StCard>
        </div>

        {/* Summary by category */}
        <StCard>
          <StSectionTitle
            action={
              <StTabs
                tabs={[
                  { key: "tous", label: "Tous" },
                  { key: "formation", label: "Formations" },
                  { key: "product", label: "Produits" },
                  { key: "mentor", label: "Mentors" },
                ]}
                active={filterType}
                onChange={setFilterType}
              />
            }
          >
            Résumé par catégorie
          </StSectionTitle>

          {isLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-14" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { type: "formation", label: "Formations vidéo", icon: PlayCircle, color: ST.blueText, bg: ST.blueSoft, value: byType.formation },
                { type: "product", label: "Produits numériques", icon: Package, color: ST.amberText, bg: ST.amberSoft, value: byType.product },
                { type: "mentor", label: "Sessions mentor", icon: Headset, color: ST.green, bg: ST.greenSoft, value: byType.mentor },
              ]
                .filter((row) => filterType === "tous" || row.type === filterType)
                .map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.type} className="flex items-center gap-4 p-3 rounded-[12px]" style={{ background: "#f7faf8" }}>
                      <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: row.bg }}>
                        <Icon className="w-5 h-5" style={{ color: row.color }} />
                      </div>
                      <span className="flex-1 text-[13px] font-semibold" style={{ color: ST.textSecondary }}>{row.label}</span>
                      <div className="text-right">
                        <p className="text-[13px] font-extrabold" style={{ color: ST.green }}>{formatFcfa(row.value)}</p>
                      </div>
                    </div>
                  );
                })}
              {filterType !== "tous" && byType[filterType as keyof ByType] === 0 && (
                <p className="text-center text-[13px] font-semibold py-4" style={{ color: ST.textSecondary }}>Aucune dépense dans cette catégorie.</p>
              )}
            </div>
          )}

          <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${ST.divider}` }}>
            <span className="font-extrabold" style={{ color: ST.text }}>Total global</span>
            <div className="text-right">
              <p className="font-extrabold" style={{ color: ST.green }}>{isLoading ? "…" : formatFcfa(totalXof)}</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link href="/apprenant/commandes" className="text-[12px] font-extrabold hover:underline" style={{ color: ST.green }}>
              Voir l&apos;historique des commandes
            </Link>
          </div>
        </StCard>
      </main>
    </div>
  );
}
