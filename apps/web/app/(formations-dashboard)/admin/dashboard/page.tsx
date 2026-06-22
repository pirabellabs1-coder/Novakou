"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  StCard,
  StPageHeader,
  StKpi,
  StKpiCompact,
  StButton,
  StChip,
  StSectionTitle,
  StHeroGradient,
  ST,
} from "@/components/stitch";
import {
  Banknote,
  Users,
  Package,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  CalendarCheck,
  UserPlus,
  CheckCircle,
  BookOpen,
  BookText,
  Inbox,
  ArrowUpRight,
  Sparkles,
  Flag as FlagIcon,
  Wallet,
} from "lucide-react";

/* ───────────────────────── Types ────────────────────────────────────── */

type DashboardData = {
  kpis: {
    totalRevenue: number;
    platformCommission: number;
    affiliatePayouts: number;
    ledgerGross: number;
    ledgerCount: number;
    totalUsers: number;
    newUsersToday: number;
    totalProducts: number;
    publishedProducts: number;
    pendingProducts: number;
    transactionsThisMonth: number;
    transactionsThisMonthRevenue: number;
  };
  quickStats: {
    pendingReports: number;
    pendingRefunds: number;
    pendingFormations: number;
    pendingProducts: number;
  };
  monthlyChart: { month: string; revenue: number; transactions: number }[];
  recentTransactions: {
    id: string;
    type: "formation" | "product";
    user: string;
    product: string;
    amount: number;
    createdAt: string;
    status: string;
  }[];
  pendingItems: {
    id: string;
    kind: "formation" | "product";
    title: string;
    price: number;
    thumbnail: string | null;
    type: string;
    seller: string;
    submittedAt: string;
  }[];
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `${m} min`;
  if (h < 24) return `${h}h`;
  return `${d}j`;
}

/* ───────────────────────── Page ─────────────────────────────────────── */

export default function AdminDashboardPage() {
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetch("/api/formations/admin/dashboard").then((r) => r.json()),
    staleTime: 30_000,
  });

  type ChartsData = {
    revenueSeries: {
      date: string;
      formations: number;
      products: number;
      mentors: number;
      total: number;
    }[];
    newUsersSeries: { date: string; count: number }[];
    breakdown: { name: string; value: number; color: string }[];
    totals: {
      grossLast30: number;
      commissionLast30: number;
      commissionPercent: number;
      newUsersLast7: number;
      mentorBookingsLast30: number;
    };
  };
  const { data: charts } = useQuery<{ data: ChartsData }>({
    queryKey: ["admin-charts"],
    queryFn: () => fetch("/api/formations/admin/charts").then((r) => r.json()),
    staleTime: 60_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      kind,
      action,
    }: {
      id: string;
      kind: string;
      action: string;
    }) =>
      fetch(`/api/formations/admin/produits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, action }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-produits"] });
    },
  });

  const d = response?.data;
  const pendingCount =
    (d?.quickStats.pendingFormations ?? 0) + (d?.quickStats.pendingProducts ?? 0);

  return (
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <StPageHeader
          title="Centre de contrôle"
          subtitle={
            isLoading
              ? "Chargement des indicateurs..."
              : `${(d?.kpis.totalUsers ?? 0).toLocaleString("fr-FR")} utilisateurs · ${(d?.kpis.publishedProducts ?? 0).toLocaleString("fr-FR")} produits publiés · ${pendingCount} en attente`
          }
          actions={
            <>
              <StButton
                variant="secondary"
                icon={TrendingUp}
                href="/admin/rapports"
              >
                Rapports
              </StButton>
            </>
          }
        />

        {/* ── Hero GMV + KPI principaux ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_2fr] gap-3.5">
          <StHeroGradient className="flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-white/80">Revenus totaux</span>
              <Banknote size={20} className="text-white/80" />
            </div>
            <div className="text-[30px] md:text-[34px] font-extrabold mt-2 tabular-nums leading-none">
              {isLoading ? "…" : formatFCFA(d?.kpis.totalRevenue ?? 0)}
              <span className="text-[15px] ml-1.5 text-white/75">FCFA</span>
            </div>
            {!!d?.kpis.platformCommission && (
              <div className="mt-3 inline-flex items-center gap-1.5 self-start text-[11.5px] font-extrabold px-2.5 py-1 rounded-full bg-white/15 text-white">
                <TrendingUp size={13} />
                +{formatFCFA(d.kpis.platformCommission)} F commission
              </div>
            )}
          </StHeroGradient>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <StKpi
              label="Utilisateurs"
              value={isLoading ? "…" : (d?.kpis.totalUsers ?? 0).toLocaleString("fr-FR")}
              icon={Users}
              chip={
                d?.kpis.newUsersToday ? (
                  <StChip tone="green" icon={UserPlus}>
                    +{d.kpis.newUsersToday} aujourd&apos;hui
                  </StChip>
                ) : undefined
              }
            />
            <StKpi
              label="Produits publiés"
              value={isLoading ? "…" : (d?.kpis.publishedProducts ?? 0).toLocaleString("fr-FR")}
              icon={Package}
              chip={
                d?.kpis.pendingProducts ? (
                  <StChip tone="amber">{d.kpis.pendingProducts} en attente</StChip>
                ) : undefined
              }
            />
            <StKpi
              label="Santé plateforme"
              value="99.98%"
              icon={ShieldCheck}
              chip={<StChip tone="green">Nominal</StChip>}
            />
          </div>
        </div>

        {/* ── Analytics live (30j) ───────────────────────────────────── */}
        {charts?.data && (
          <div className="space-y-3.5">
            <StSectionTitle className="!mb-0 mt-1">Activité plateforme — 30 jours</StSectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              <StKpiCompact
                label="Revenus 30j (brut)"
                value={`${formatFCFA(charts.data.totals.grossLast30)}`}
                unit="F"
                icon={Banknote}
                tone="green"
              />
              <StKpiCompact
                label="Commission plateforme"
                value={`${formatFCFA(charts.data.totals.commissionLast30)}`}
                unit="F"
                icon={Wallet}
                tone="amber"
              />
              <StKpiCompact
                label="Nouveaux users (7j)"
                value={String(charts.data.totals.newUsersLast7)}
                icon={UserPlus}
                tone="blue"
              />
              <StKpiCompact
                label="Sessions mentor (30j)"
                value={String(charts.data.totals.mentorBookingsLast30)}
                icon={CalendarCheck}
                tone="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {/* Revenus 30j */}
              <div className="lg:col-span-2">
                <StCard className="!p-[18px_20px]">
                  <StSectionTitle
                    className="!mb-3"
                    action={
                      <span className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                        Formations · Produits · Mentors
                      </span>
                    }
                  >
                    Revenus par source — 30 jours
                  </StSectionTitle>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={charts.data.revenueSeries}>
                      <defs>
                        <linearGradient
                          id="gForm"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#006e2f" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#006e2f" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient
                          id="gProd"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient
                          id="gMent"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#185fa5" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#185fa5" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#eef2ef"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#9baba1" }}
                        axisLine={false}
                        tickLine={false}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9baba1" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) =>
                          `${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e4eae6",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => `${formatFCFA(v)} F`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area
                        type="monotone"
                        dataKey="formations"
                        name="Formations"
                        stroke="#006e2f"
                        strokeWidth={2}
                        fill="url(#gForm)"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="products"
                        name="Produits"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#gProd)"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="mentors"
                        name="Mentors"
                        stroke="#185fa5"
                        strokeWidth={2}
                        fill="url(#gMent)"
                        stackId="1"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </StCard>
              </div>

              {/* Pie */}
              <StCard className="!p-[18px_20px]">
                <StSectionTitle className="!mb-3">Répartition 30j</StSectionTitle>
                {charts.data.breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={charts.data.breakdown}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {charts.data.breakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e4eae6",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => `${formatFCFA(v)} F`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-xs" style={{ color: ST.textSecondary }}>
                    Aucune donnée
                  </div>
                )}
                <div className="space-y-1.5 mt-3">
                  {charts.data.breakdown.map((b) => (
                    <div
                      key={b.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2" style={{ color: ST.textSecondary }}>
                        <span
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: b.color }}
                        />
                        {b.name}
                      </span>
                      <span className="font-extrabold tabular-nums" style={{ color: ST.text }}>
                        {formatFCFA(b.value)} F
                      </span>
                    </div>
                  ))}
                </div>
              </StCard>
            </div>

            {/* New users 7d */}
            <div>
              <StCard className="!p-[18px_20px]">
                <StSectionTitle className="!mb-3">
                  Nouveaux utilisateurs — 7 jours
                  <span className="ml-2 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                    · {charts.data.totals.newUsersLast7} inscrits
                  </span>
                </StSectionTitle>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={charts.data.newUsersSeries}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#eef2ef"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9baba1" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9baba1" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e4eae6",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Inscriptions"
                      fill="#22c55e"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </StCard>
            </div>
          </div>
        )}

        {/* ── Actions requises + ce mois ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <div className="lg:col-span-2">
            <StCard noPadding>
              <div className="flex items-center justify-between px-5 pt-[18px] pb-3">
                <div>
                  <h3 className="text-[15px] font-extrabold" style={{ color: ST.text }}>Transactions récentes</h3>
                  <p className="text-[12px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>Les 10 derniers paiements</p>
                </div>
                <StButton variant="secondary" size="sm" href="/admin/transactions" iconRight={ArrowUpRight}>
                  Tout voir
                </StButton>
              </div>
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl"
                      style={{ background: ST.divider }}
                    />
                  ))}
                </div>
              ) : (d?.recentTransactions ?? []).length === 0 ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <Inbox size={36} style={{ color: "#d6e0da" }} />
                  <p className="text-[13px] font-extrabold mt-3" style={{ color: ST.text }}>Aucune transaction</p>
                  <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                    Les paiements apparaîtront ici dès qu&apos;ils seront enregistrés.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {["Acheteur", "Produit", "Type", "Montant"].map((h, i) => (
                          <th
                            key={h}
                            className={`text-[10.5px] uppercase font-extrabold px-5 py-3 ${i === 3 ? "text-right" : "text-left"}`}
                            style={{ color: ST.textMuted, letterSpacing: ".06em" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(d?.recentTransactions ?? []).map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-5 py-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-extrabold flex-shrink-0"
                                style={{ background: ST.avatarBg, color: ST.green }}
                              >
                                {tx.user.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[12.5px] font-bold truncate max-w-[180px]" style={{ color: ST.text }}>
                                {tx.user}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                            <p className="text-[12.5px] font-bold truncate max-w-[240px]" style={{ color: ST.textSecondary }}>
                              {tx.product}
                            </p>
                          </td>
                          <td className="px-5 py-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                            <StChip
                              tone={tx.type === "formation" ? "blue" : "green"}
                              icon={tx.type === "formation" ? BookOpen : BookText}
                            >
                              {tx.type === "formation" ? "Formation" : "Produit"}
                            </StChip>
                          </td>
                          <td
                            className="px-5 py-3 text-right text-[12.5px] font-extrabold tabular-nums"
                            style={{ color: ST.green, borderTop: `1px solid ${ST.divider}` }}
                          >
                            {formatFCFA(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </StCard>
          </div>

          <div className="space-y-3.5">
            {/* Actions requises */}
            <StCard className="!p-[18px_20px]">
              <StSectionTitle className="!mb-3">Actions requises</StSectionTitle>
              <div className="space-y-3">
                <Link
                  href="/admin/produits?status=EN_ATTENTE"
                  className="flex items-center justify-between p-3 rounded-xl transition-colors group hover:bg-[#f0faf3]"
                  style={{ background: ST.bg }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ST.greenSoft, color: ST.green }}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: ST.textMuted }}>
                        Modération
                      </p>
                      <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                        {pendingCount} produits à valider
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" style={{ color: ST.textMuted }} />
                </Link>

                <Link
                  href="/admin/signalements"
                  className="flex items-center justify-between p-3 rounded-xl transition-colors group hover:bg-[#f0faf3]"
                  style={{ background: ST.bg }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ST.roseSoft, color: ST.roseText }}>
                      <FlagIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: ST.textMuted }}>
                        Litiges
                      </p>
                      <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                        {d?.quickStats.pendingRefunds ?? 0} remboursements
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" style={{ color: ST.textMuted }} />
                </Link>

                <Link
                  href="/admin/signalements"
                  className="flex items-center justify-between p-3 rounded-xl transition-colors group hover:bg-[#f0faf3]"
                  style={{ background: ST.bg }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ST.amberSoft, color: ST.amberText }}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: ST.textMuted }}>
                        Signalements
                      </p>
                      <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                        {d?.quickStats.pendingReports ?? 0} contenus signalés
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" style={{ color: ST.textMuted }} />
                </Link>
              </div>
            </StCard>

            {/* Ce mois */}
            <StCard className="!p-[18px_20px]">
              <StSectionTitle className="!mb-3">Ce mois</StSectionTitle>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.textMuted }}>
                    Transactions
                  </p>
                  <p className="text-[22px] font-extrabold tabular-nums tracking-tight" style={{ color: ST.text }}>
                    {(d?.kpis.transactionsThisMonth ?? 0).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="h-px" style={{ background: ST.divider }} />
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.textMuted }}>
                    Revenus
                  </p>
                  <p className="text-[22px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                    {formatFCFA(d?.kpis.transactionsThisMonthRevenue ?? 0)}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: ST.textFaint }}>FCFA</p>
                </div>
              </div>
            </StCard>
          </div>
        </div>

        {/* ── Produits en attente d'approbation ──────────────────────── */}
        {!isLoading && (d?.pendingItems ?? []).length > 0 && (
          <StCard noPadding>
            <div className="flex items-center justify-between px-5 pt-[18px] pb-3">
              <div>
                <h3 className="text-[15px] font-extrabold" style={{ color: ST.text }}>Produits en attente d&apos;approbation</h3>
                <p className="text-[12px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>
                  {(d?.pendingItems ?? []).length} éléments à modérer
                </p>
              </div>
              <StButton variant="secondary" size="sm" href="/admin/produits?status=EN_ATTENTE" iconRight={ArrowUpRight}>
                Tout voir
              </StButton>
            </div>
            <div>
              {(d?.pendingItems ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 md:px-5 transition-colors hover:bg-[#f7faf8]"
                  style={{ borderTop: `1px solid ${ST.divider}` }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: ST.divider }}
                  >
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : p.kind === "formation" ? (
                      <BookOpen className="w-5 h-5" style={{ color: ST.textMuted }} />
                    ) : (
                      <BookText className="w-5 h-5" style={{ color: ST.textMuted }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11.5px]" style={{ color: ST.textSecondary }}>
                      <span className="font-bold">{p.seller}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {timeAgo(p.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                      {formatFCFA(p.price)} F
                    </p>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: ST.textMuted }}>
                      {p.type}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <StButton
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() =>
                        approveMutation.mutate({
                          id: p.id,
                          kind: p.kind,
                          action: "approve",
                        })
                      }
                      disabled={approveMutation.isPending}
                    >
                      Valider
                    </StButton>
                    <StButton
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        approveMutation.mutate({
                          id: p.id,
                          kind: p.kind,
                          action: "reject",
                        })
                      }
                      disabled={approveMutation.isPending}
                    >
                      Refuser
                    </StButton>
                  </div>
                </div>
              ))}
            </div>
          </StCard>
        )}

        {/* Footer signature subtile */}
        <div className="text-center text-xs pt-4 flex items-center justify-center gap-1.5" style={{ color: ST.textFaint }}>
          <Sparkles className="w-3 h-3" />
          Tableau de bord administrateur Novakou
        </div>
      </main>
    </div>
  );
}
