"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

type WeeklyClick = { day: string; clicks: number };
type RecentCommission = {
  id: string;
  orderId: string;
  orderType: string;
  orderAmount: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
};
type TopPage = { page: string; clicks: number; conversions: number; earnings: number };
type StatsData = {
  commissionPct: number;
  profile: { affiliateCode: string; pendingEarnings: number; paidEarnings: number; totalClicks: number; totalConversions: number; conversionRate: number } | null;
  weeklyClicks: WeeklyClick[];
  recentCommissions: RecentCommission[];
  commissionSummary: { total: number; confirmed: number; pending: number; paid: number };
  quickStats: { conversionRatePct: number; avgPerSaleXof: number };
  perPage: TopPage[];
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e3a2f]/60 rounded-xl ${className ?? ""}`} />;
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  APPROVED: { label: "confirmé",  cls: "bg-[#22c55e]/20 text-[#22c55e]" },
  PENDING:  { label: "en attente", cls: "bg-amber-500/20 text-amber-400" },
  PAID:     { label: "versé",     cls: "bg-blue-500/20 text-blue-400" },
  REJECTED: { label: "rejeté",    cls: "bg-red-500/20 text-red-400" },
};

export default function AffilieDashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Affilié";

  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["affilie-stats"],
    queryFn: () => fetch("/api/formations/affilie/stats").then((r) => r.json()),
    staleTime: 60_000,
  });

  const COMM = data?.commissionPct ?? 40;
  const weeklyClicks = data?.weeklyClicks ?? [];
  const recentCommissions = data?.recentCommissions ?? [];
  const summary = data?.commissionSummary ?? { total: 0, confirmed: 0, pending: 0, paid: 0 };
  const qs = data?.quickStats ?? { conversionRatePct: 0, avgPerSaleXof: 0 };
  const profile = data?.profile ?? null;
  const topPages = data?.perPage ?? [];

  const totalWeeklyClicks = weeklyClicks.reduce((s, d) => s + d.clicks, 0);
  const maxClicks = Math.max(...weeklyClicks.map((d) => d.clicks), 1);

  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">Tableau de bord</h1>
          <p className="text-sm text-[#5c9e7a] mt-0.5">
            Bienvenue, {userName.split(" ")[0]} — vos performances en temps réel
          </p>
        </div>
        {profile?.affiliateCode && (
          <div className="flex items-center gap-2 bg-[#0d1f17] border border-[#1e3a2f] rounded-xl px-4 py-2">
            <span className="text-[10px] text-[#5c9e7a]">Code</span>
            <span className="font-mono font-bold text-[#22c55e] text-sm">{profile.affiliateCode}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [0,1,2,3].map((i) => <SkeletonBlock key={i} className="h-32" />)
        ) : [
          {
            icon: "payments",
            label: "Commissions totales",
            value: formatFcfa(summary.total),
            sub: `≈ ${toEur(summary.total)} €`,
            badge: `${profile?.totalConversions ?? 0} ventes`,
            color: "text-[#22c55e]",
            bg: "bg-[#22c55e]/10",
          },
          {
            icon: "link",
            label: "Clics sur liens",
            value: (profile?.totalClicks ?? 0).toLocaleString("fr-FR"),
            sub: "total cumulé",
            badge: `${totalWeeklyClicks} cette sem.`,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            icon: "shopping_bag",
            label: "Conversions",
            value: (profile?.totalConversions ?? 0).toLocaleString("fr-FR"),
            sub: `${qs.conversionRatePct.toFixed(1)}% taux`,
            badge: `moy. ${formatFcfa(qs.avgPerSaleXof)}`,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            icon: "account_balance_wallet",
            label: "Solde disponible",
            value: formatFcfa(profile?.pendingEarnings ?? 0),
            sub: `≈ ${toEur(profile?.pendingEarnings ?? 0)} €`,
            badge: "Retirer",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            action: "/affilie/retraits",
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {kpi.icon}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-white mb-0.5">{kpi.value}</p>
            <p className="text-[10px] text-[#5c9e7a] mb-2">{kpi.label}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#5c9e7a]">{kpi.sub}</span>
              {kpi.action ? (
                <Link href={kpi.action} className="text-[10px] font-bold text-[#22c55e] hover:underline">
                  {kpi.badge}
                </Link>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e]">
                  {kpi.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly clicks chart */}
        <div className="lg:col-span-2 bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">Clics cette semaine</h2>
              <p className="text-[10px] text-[#5c9e7a]">Trafic généré via vos liens affiliés</p>
            </div>
            {isLoading ? (
              <SkeletonBlock className="w-12 h-7" />
            ) : (
              <span className="text-2xl font-extrabold text-[#22c55e]">{totalWeeklyClicks}</span>
            )}
          </div>
          {isLoading ? (
            <SkeletonBlock className="h-32" />
          ) : weeklyClicks.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-[#5c9e7a]">
              Aucun clic cette semaine
            </div>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {weeklyClicks.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max((d.clicks / maxClicks) * 112, d.clicks > 0 ? 4 : 2)}px`,
                      background: d.clicks > 0 ? "linear-gradient(to top, #006e2f, #22c55e)" : "#1e3a2f",
                      opacity: d.clicks === maxClicks ? 1 : 0.6,
                    }}
                  />
                  <span className="text-[9px] text-[#5c9e7a]">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6">
          <h2 className="text-sm font-bold text-white mb-4">Statistiques rapides</h2>
          {isLoading ? (
            <div className="space-y-4">{[0,1,2,3,4].map((i) => <SkeletonBlock key={i} className="h-8" />)}</div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Commission par vente", value: `${COMM}%`, icon: "percent" },
                { label: "Taux de conversion", value: `${qs.conversionRatePct.toFixed(1)}%`, icon: "trending_up" },
                { label: "Gain moyen / vente", value: formatFcfa(qs.avgPerSaleXof), icon: "payments" },
                { label: "Confirmées", value: formatFcfa(summary.confirmed), icon: "check_circle" },
                { label: "En attente", value: formatFcfa(summary.pending), icon: "schedule" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e3a2f] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-[#5c9e7a]">{s.icon}</span>
                    <span className="text-xs text-[#5c9e7a]">{s.label}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top performing pages */}
      {(isLoading || topPages.length > 0) && (
        <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white">Meilleures formations</h2>
            <Link href="/affilie/performances" className="text-xs text-[#22c55e] hover:underline">
              Voir tout
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-4">{[0,1,2].map((i) => <SkeletonBlock key={i} className="h-12" />)}</div>
          ) : (
            <div className="space-y-4">
              {topPages.slice(0, 5).map((p, i) => {
                const name = p.page?.split("/").filter(Boolean).pop() ?? p.page ?? "Formation";
                const gradients: [string,string][] = [
                  ["#006e2f","#22c55e"], ["#1e3a5f","#2563eb"], ["#7c3aed","#a855f7"],
                  ["#92400e","#d97706"], ["#be185d","#db2777"],
                ];
                const [gFrom, gTo] = gradients[i % gradients.length];
                return (
                  <div key={p.page ?? i} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-[#5c9e7a] w-5 text-center">{i + 1}</span>
                    <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{name}</p>
                      <p className="text-[10px] text-[#5c9e7a]">{p.clicks} clics · {p.conversions} ventes</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-[#22c55e]">{formatFcfa(p.earnings)}</p>
                      <p className="text-[10px] text-[#5c9e7a]">commissions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent commissions */}
      <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-white">Conversions récentes</h2>
          <Link href="/affilie/commissions" className="text-xs text-[#22c55e] hover:underline">
            Voir tout
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">{[0,1,2,3].map((i) => <SkeletonBlock key={i} className="h-14" />)}</div>
        ) : recentCommissions.length === 0 ? (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-[32px] text-[#1e3a2f] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            <p className="text-sm text-[#5c9e7a]">Aucune conversion pour le moment.</p>
            <Link href="/affilie/liens" className="text-xs text-[#22c55e] font-semibold hover:underline mt-2 inline-block">
              Générer des liens →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr className="text-[10px] text-[#5c9e7a] uppercase tracking-wide border-b border-[#1e3a2f]">
                  <th className="text-left pb-3 font-semibold">Formation</th>
                  <th className="text-left pb-3 font-semibold">Date</th>
                  <th className="text-right pb-3 font-semibold">Vente</th>
                  <th className="text-right pb-3 font-semibold">Commission</th>
                  <th className="text-right pb-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentCommissions.map((c) => {
                  const st = statusLabels[c.status] ?? { label: c.status, cls: "bg-gray-500/20 text-gray-400" };
                  const date = new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                  const typeLabel = c.orderType === "formation" ? "Formation" : c.orderType === "product" ? "Produit" : c.orderType;
                  return (
                    <tr key={c.id} className="border-b border-[#1e3a2f] last:border-0">
                      <td className="py-3 pr-4">
                        <p className="text-xs text-white font-medium truncate max-w-[200px]">{typeLabel}</p>
                        <p className="text-[10px] text-[#5c9e7a] font-mono">#{c.orderId?.slice(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-xs text-[#5c9e7a] whitespace-nowrap">{date}</p>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <p className="text-xs text-white">{formatFcfa(c.orderAmount)}</p>
                      </td>
                      <td className="py-3 text-right">
                        <p className="text-xs font-bold text-[#22c55e]">+{formatFcfa(c.commissionAmount)}</p>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
