// Refonte style KAZA — apprenant depenses — 2026-06-07
"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  KazaHero,
  KazaKpiCard,
  KazaCard,
  KazaButton,
} from "@/components/kaza";
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
function toEur(n: number) { return Math.round(n / 655.957); }

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
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className ?? ""}`} />;
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
    { label: "Formations vidéo", type: "formation", fcfa: byType.formation, color: "bg-blue-500", pct: Math.round((byType.formation / totalForBreakdown) * 100) },
    { label: "Coaching mentor", type: "mentor", fcfa: byType.mentor, color: "bg-violet-500", pct: Math.round((byType.mentor / totalForBreakdown) * 100) },
    { label: "Produits", type: "product", fcfa: byType.product, color: "bg-amber-500", pct: Math.round((byType.product / totalForBreakdown) * 100) },
  ].filter((b) => b.fcfa > 0);

  const bestMonth = monthly.reduce((best, m) => (m.totalXof > best.totalXof ? m : best), { month: "—", totalXof: 0 });

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={TrendingUp}
        title="Mes dépenses"
        subtitle="Suivi de vos investissements en formation, produits et accompagnement"
        actions={
          <KazaButton variant="secondary" href="/apprenant/commandes" iconRight={ArrowRight}>
            Historique commandes
          </KazaButton>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KazaKpiCard
          label="Total dépensé"
          value={isLoading ? "…" : formatFcfa(totalXof)}
          delta={isLoading ? undefined : `≈ ${toEur(totalXof)} €`}
          icon={Wallet}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Achats effectués"
          value={isLoading ? "…" : totalPurchases}
          icon={ShoppingBag}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Formations achetées"
          value={isLoading ? "…" : byType.formation > 0 ? 1 : 0}
          icon={PlayCircle}
          iconColor="violet"
        />
        <KazaKpiCard
          label="Mois le plus actif"
          value={isLoading ? "…" : bestMonth.month.charAt(0).toUpperCase() + bestMonth.month.slice(1)}
          delta={isLoading ? undefined : formatFcfa(bestMonth.totalXof)}
          icon={TrendingUp}
          iconColor="orange"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly chart */}
        <KazaCard
          title="Dépenses par mois"
          subtitle="6 derniers mois"
          className="lg:col-span-2"
        >
          {isLoading ? (
            <SkeletonBlock className="h-40" />
          ) : monthly.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              Aucune dépense enregistrée
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthly.map((m) => {
                const pct = maxSpending > 0 ? (m.totalXof / maxSpending) * 100 : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-semibold text-slate-500">
                      {m.totalXof > 0 ? `${Math.round(m.totalXof / 1000)}k` : ""}
                    </span>
                    <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                      <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${Math.max(pct, m.totalXof > 0 ? 4 : 0)}%`,
                          background: m.totalXof > 0 ? "linear-gradient(to top, #0b2540, #10b981)" : "#f3f4f6",
                          minHeight: m.totalXof > 0 ? "4px" : "2px",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </KazaCard>

        {/* Breakdown */}
        <KazaCard title="Répartition">
          {isLoading ? (
            <div className="space-y-4">{[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-12" />)}</div>
          ) : breakdownData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              Aucune dépense
            </div>
          ) : (
            <div className="space-y-4">
              {breakdownData.map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-slate-600">{cat.label}</span>
                    <span className="text-xs font-bold text-[#0b2540]">{cat.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.color} transition-all duration-500`} style={{ width: `${cat.pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-500">{cat.label}</span>
                    <span className="text-[10px] text-slate-500">{formatFcfa(cat.fcfa)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </KazaCard>
      </div>

      {/* Summary by category */}
      <KazaCard
        title="Résumé par catégorie"
        action={
          <div className="flex items-center gap-1 flex-wrap">
            {["tous", "formation", "product", "mentor"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filterType === type ? "bg-[#0b2540] text-white" : "bg-slate-100 text-slate-600 hover:text-[#0b2540]"
                }`}
              >
                {type === "tous" ? "Tous" : type === "formation" ? "Formations" : type === "product" ? "Produits" : "Mentors"}
              </button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-14" />)}</div>
        ) : (
          <div className="space-y-3">
            {[
              { type: "formation", label: "Formations vidéo", icon: PlayCircle, iconColor: "text-blue-600", bg: "bg-blue-50", value: byType.formation },
              { type: "product", label: "Produits numériques", icon: Package, iconColor: "text-amber-600", bg: "bg-amber-50", value: byType.product },
              { type: "mentor", label: "Sessions mentor", icon: Headset, iconColor: "text-violet-600", bg: "bg-violet-50", value: byType.mentor },
            ]
              .filter((row) => filterType === "tous" || row.type === filterType)
              .map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.type} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${row.bg}`}>
                      <Icon className={`w-5 h-5 ${row.iconColor}`} />
                    </div>
                    <span className="flex-1 text-sm text-slate-600">{row.label}</span>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-600">{formatFcfa(row.value)}</p>
                      <p className="text-[10px] text-slate-500">≈ {toEur(row.value)} €</p>
                    </div>
                  </div>
                );
              })}
            {filterType !== "tous" && byType[filterType as keyof ByType] === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">Aucune dépense dans cette catégorie.</p>
            )}
          </div>
        )}

        <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
          <span className="font-bold text-[#0b2540]">Total global</span>
          <div className="text-right">
            <p className="font-extrabold text-emerald-600">{isLoading ? "…" : formatFcfa(totalXof)}</p>
            <p className="text-[10px] text-slate-500">≈ {isLoading ? "…" : toEur(totalXof)} €</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/apprenant/commandes" className="text-xs text-emerald-600 font-semibold hover:underline">
            Voir l&apos;historique des commandes
          </Link>
        </div>
      </KazaCard>
    </div>
  );
}
