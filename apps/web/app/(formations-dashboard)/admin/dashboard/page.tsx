"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
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
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaSection,
  KazaEmpty,
} from "@/components/kaza";
import {
  LayoutDashboard,
  Banknote,
  Users,
  Package,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Trash2,
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

/* ───────────────────────── Wipe menu ────────────────────────────────── */

function WipeMenu() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function runWipe(mode: string, label: string) {
    const ok = await confirmAction({
      title: `Voulez-vous vraiment ${label.toLowerCase()} ?`,
      message: "Cette action est irréversible.",
      confirmLabel: label,
      confirmVariant: "danger",
      icon: "delete_forever",
    });
    if (!ok) return;
    setWorking(mode);
    setResult(null);
    try {
      const res = await fetch("/api/formations/admin/wipe-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (json.success) {
        const summary = Object.entries(json.deleted)
          .map(([k, v]) => `${v} ${k}`)
          .join(", ");
        setResult(summary || "Aucun élément à supprimer");
        qc.invalidateQueries();
      } else {
        setResult(json.error ?? "Erreur");
      }
    } catch {
      setResult("Erreur réseau");
    } finally {
      setWorking(null);
      setTimeout(() => {
        setResult(null);
        setOpen(false);
      }, 4000);
    }
  }

  return (
    <div className="relative">
      <KazaButton
        variant="secondary"
        icon={Trash2}
        onClick={() => setOpen(!open)}
      >
        Nettoyer la plateforme
      </KazaButton>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-xl border border-slate-200 min-w-[300px] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Mode de nettoyage
            </p>
          </div>
          {[
            {
              mode: "demo-only",
              label: "Données démo seulement (dev-instructeur)",
              danger: false,
            },
            {
              mode: "products",
              label: "Tous les produits & formations",
              danger: true,
            },
            {
              mode: "purchases",
              label: "Toutes les ventes & inscriptions",
              danger: true,
            },
            { mode: "reviews", label: "Tous les avis", danger: true },
            {
              mode: "marketing",
              label: "Toutes les données marketing",
              danger: true,
            },
            {
              mode: "all",
              label: "TOUT (catalogue + ventes + avis)",
              danger: true,
            },
          ].map((opt) => (
            <button
              key={opt.mode}
              onClick={() => runWipe(opt.mode, opt.label)}
              disabled={working !== null}
              className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors disabled:opacity-50 border-b border-slate-50 last:border-0 ${
                opt.danger
                  ? "text-rose-700 hover:bg-rose-50"
                  : "text-slate-900 hover:bg-slate-50"
              }`}
            >
              {working === opt.mode ? "Nettoyage..." : opt.label}
            </button>
          ))}
          {result && (
            <div className="px-4 py-3 bg-slate-900 text-white text-xs tabular-nums">
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto space-y-8">
        {/* ── Hero KAZA navy ─────────────────────────────────────────── */}
        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={LayoutDashboard}
          title="Centre de contrôle"
          subtitle={
            isLoading
              ? "Chargement des indicateurs..."
              : `${(d?.kpis.totalUsers ?? 0).toLocaleString("fr-FR")} utilisateurs · ${(d?.kpis.publishedProducts ?? 0).toLocaleString("fr-FR")} produits publiés · ${pendingCount} en attente`
          }
          actions={
            <>
              <KazaButton
                variant="secondary"
                icon={TrendingUp}
                href="/admin/rapports"
              >
                Rapports
              </KazaButton>
              <WipeMenu />
            </>
          }
        />

        {/* ── KPI principaux ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KazaKpiCard
            label="Revenus totaux"
            value={
              isLoading
                ? "…"
                : `${formatFCFA(d?.kpis.totalRevenue ?? 0)} F`
            }
            delta={
              d?.kpis.platformCommission
                ? `+${formatFCFA(d.kpis.platformCommission)} F commission`
                : undefined
            }
            deltaTrend="up"
            icon={Banknote}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Utilisateurs"
            value={
              isLoading
                ? "…"
                : (d?.kpis.totalUsers ?? 0).toLocaleString("fr-FR")
            }
            delta={
              d?.kpis.newUsersToday
                ? `+${d.kpis.newUsersToday} aujourd'hui`
                : undefined
            }
            deltaTrend="up"
            icon={Users}
            iconColor="sky"
          />
          <KazaKpiCard
            label="Produits publiés"
            value={
              isLoading
                ? "…"
                : (d?.kpis.publishedProducts ?? 0).toLocaleString("fr-FR")
            }
            delta={
              d?.kpis.pendingProducts
                ? `${d.kpis.pendingProducts} en attente`
                : undefined
            }
            deltaTrend="neutral"
            icon={Package}
            iconColor="violet"
          />
          <KazaKpiCard
            label="Santé plateforme"
            value="99.98%"
            delta="Nominal"
            deltaTrend="up"
            icon={ShieldCheck}
            iconColor="emerald"
          />
        </div>

        {/* ── Analytics live (30j) ───────────────────────────────────── */}
        {charts?.data && (
          <KazaSection
            label="Live"
            title="Activité plateforme — 30 jours"
            description="Vue temps réel des revenus et acquisitions"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KazaKpiCard
                label="Revenus 30j (brut)"
                value={`${formatFCFA(charts.data.totals.grossLast30)} F`}
                icon={Banknote}
                iconColor="emerald"
              />
              <KazaKpiCard
                label="Commission plateforme"
                value={`${formatFCFA(charts.data.totals.commissionLast30)} F`}
                icon={Wallet}
                iconColor="orange"
              />
              <KazaKpiCard
                label="Nouveaux users (7j)"
                value={String(charts.data.totals.newUsersLast7)}
                icon={UserPlus}
                iconColor="sky"
              />
              <KazaKpiCard
                label="Sessions mentor (30j)"
                value={String(charts.data.totals.mentorBookingsLast30)}
                icon={CalendarCheck}
                iconColor="violet"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Revenus 30j */}
              <div className="lg:col-span-2">
                <KazaCard
                  title="Revenus par source — 30 jours"
                  subtitle="Formations · Produits · Mentors"
                >
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
                          <stop offset="0%" stopColor="#0b2540" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#0b2540" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient
                          id="gProd"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient
                          id="gMent"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) =>
                          `${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => `${formatFCFA(v)} F`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area
                        type="monotone"
                        dataKey="formations"
                        name="Formations"
                        stroke="#0b2540"
                        strokeWidth={2}
                        fill="url(#gForm)"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="products"
                        name="Produits"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#gProd)"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="mentors"
                        name="Mentors"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        fill="url(#gMent)"
                        stackId="1"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </KazaCard>
              </div>

              {/* Pie */}
              <KazaCard
                title="Répartition 30j"
                subtitle="Sources de revenus"
              >
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
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => `${formatFCFA(v)} F`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">
                    Aucune donnée
                  </div>
                )}
                <div className="space-y-1.5 mt-3">
                  {charts.data.breakdown.map((b) => (
                    <div
                      key={b.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: b.color }}
                        />
                        {b.name}
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatFCFA(b.value)} F
                      </span>
                    </div>
                  ))}
                </div>
              </KazaCard>
            </div>

            {/* New users 7d */}
            <div className="mt-6">
              <KazaCard
                title="Nouveaux utilisateurs — 7 jours"
                subtitle={`${charts.data.totals.newUsersLast7} inscrits sur la période`}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={charts.data.newUsersSeries}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Inscriptions"
                      fill="#0ea5e9"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </KazaCard>
            </div>
          </KazaSection>
        )}

        {/* ── Actions requises + ce mois ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <KazaCard
              title="Transactions récentes"
              subtitle="Les 10 derniers paiements"
              action={
                <KazaButton
                  variant="ghost"
                  size="sm"
                  href="/admin/transactions"
                  iconRight={ArrowUpRight}
                >
                  Tout voir
                </KazaButton>
              }
              noPadding
            >
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-slate-100 animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : (d?.recentTransactions ?? []).length === 0 ? (
                <div className="p-5">
                  <KazaEmpty
                    icon={Inbox}
                    title="Aucune transaction"
                    description="Les paiements apparaîtront ici dès qu'ils seront enregistrés."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                        <th className="px-5 py-3 text-left font-semibold">
                          Acheteur
                        </th>
                        <th className="px-5 py-3 text-left font-semibold">
                          Produit
                        </th>
                        <th className="px-5 py-3 text-left font-semibold">
                          Type
                        </th>
                        <th className="px-5 py-3 text-right font-semibold">
                          Montant
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d?.recentTransactions ?? []).map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-[#0b2540] to-[#1a4a7d]">
                                {tx.user.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                                {tx.user}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-slate-700 truncate max-w-[240px]">
                              {tx.product}
                            </p>
                          </td>
                          <td className="px-5 py-3">
                            <KazaBadge
                              variant={
                                tx.type === "formation" ? "blue" : "violet"
                              }
                              icon={
                                tx.type === "formation" ? BookOpen : BookText
                              }
                            >
                              {tx.type === "formation" ? "Formation" : "Produit"}
                            </KazaBadge>
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold text-emerald-700 tabular-nums">
                            {formatFCFA(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </KazaCard>
          </div>

          <div className="space-y-6">
            {/* Actions requises */}
            <KazaCard
              title="Actions requises"
              subtitle="À traiter en priorité"
            >
              <div className="space-y-3">
                <Link
                  href="/admin/produits?status=EN_ATTENTE"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Modération
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {pendingCount} produits à valider
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/admin/signalements"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <FlagIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Litiges
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {d?.quickStats.pendingRefunds ?? 0} remboursements
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/admin/signalements"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Signalements
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {d?.quickStats.pendingReports ?? 0} contenus signalés
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </KazaCard>

            {/* Ce mois */}
            <KazaCard title="Ce mois" subtitle="Synthèse du mois en cours">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Transactions
                  </p>
                  <p className="text-2xl font-extrabold tabular-nums tracking-tight text-[#0b2540]">
                    {(d?.kpis.transactionsThisMonth ?? 0).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Revenus
                  </p>
                  <p className="text-2xl font-extrabold tabular-nums text-emerald-700">
                    {formatFCFA(d?.kpis.transactionsThisMonthRevenue ?? 0)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">FCFA</p>
                </div>
              </div>
            </KazaCard>
          </div>
        </div>

        {/* ── Produits en attente d'approbation ──────────────────────── */}
        {!isLoading && (d?.pendingItems ?? []).length > 0 && (
          <KazaCard
            title="Produits en attente d'approbation"
            subtitle={`${(d?.pendingItems ?? []).length} éléments à modérer`}
            action={
              <KazaButton
                variant="ghost"
                size="sm"
                href="/admin/produits?status=EN_ATTENTE"
                iconRight={ArrowUpRight}
              >
                Tout voir
              </KazaButton>
            }
            noPadding
          >
            <div className="divide-y divide-slate-100">
              {(d?.pendingItems ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 md:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : p.kind === "formation" ? (
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    ) : (
                      <BookText className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-semibold">{p.seller}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {timeAgo(p.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-extrabold tabular-nums text-slate-900">
                      {formatFCFA(p.price)} F
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {p.type}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <KazaButton
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
                    </KazaButton>
                    <KazaButton
                      variant="ghost"
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
                    </KazaButton>
                  </div>
                </div>
              ))}
            </div>
          </KazaCard>
        )}

        {/* Footer signature subtile */}
        <div className="text-center text-xs text-slate-400 pt-4 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Tableau de bord administrateur Novakou
        </div>
      </main>
    </div>
  );
}
