"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

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
        const summary = Object.entries(json.deleted).map(([k, v]) => `${v} ${k}`).join(", ");
        setResult(`✓ ${summary || "Aucun élément à supprimer"}`);
        qc.invalidateQueries();
      } else {
        setResult(`✗ ${json.error ?? "Erreur"}`);
      }
    } catch {
      setResult("✗ Erreur réseau");
    } finally {
      setWorking(null);
      setTimeout(() => { setResult(null); setOpen(false); }, 4000);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[14px]">cleaning_services</span>
        Nettoyer la plateforme
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 bg-white shadow-xl border border-zinc-200 min-w-[280px]">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mode de nettoyage</p>
          </div>
          {[
            { mode: "demo-only", label: "Données démo seulement (dev-instructeur)", danger: false },
            { mode: "products", label: "Tous les produits & formations", danger: true },
            { mode: "purchases", label: "Toutes les ventes & inscriptions", danger: true },
            { mode: "reviews", label: "Tous les avis", danger: true },
            { mode: "marketing", label: "Toutes les données marketing", danger: true },
            { mode: "all", label: "TOUT (catalogue + ventes + avis)", danger: true },
          ].map((opt) => (
            <button
              key={opt.mode}
              onClick={() => runWipe(opt.mode, opt.label)}
              disabled={working !== null}
              className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors disabled:opacity-50 border-b border-zinc-50 last:border-0 ${
                opt.danger ? "text-[#ba1a1a] hover:bg-[#ffdad6]" : "text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              {working === opt.mode ? "Nettoyage..." : opt.label}
            </button>
          ))}
          {result && (
            <div className="px-4 py-3 bg-zinc-900 text-white text-xs tabular-nums">
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  if (m < 60) return `${m} MIN`;
  if (h < 24) return `${h}H`;
  return `${d}J`;
}

export default function AdminDashboardPage() {
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetch("/api/formations/admin/dashboard").then((r) => r.json()),
    staleTime: 30_000,
  });

  type ChartsData = {
    revenueSeries: { date: string; formations: number; products: number; mentors: number; total: number }[];
    newUsersSeries: { date: string; count: number }[];
    breakdown: { name: string; value: number; color: string }[];
    totals: { grossLast30: number; commissionLast30: number; commissionPercent: number; newUsersLast7: number; mentorBookingsLast30: number };
  };
  const { data: charts } = useQuery<{ data: ChartsData }>({
    queryKey: ["admin-charts"],
    queryFn: () => fetch("/api/formations/admin/charts").then((r) => r.json()),
    staleTime: 60_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, kind, action }: { id: string; kind: string; action: string }) =>
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
  const chart = d?.monthlyChart ?? [];
  const maxRev = Math.max(...chart.map((m) => m.revenue), 1);

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1920px] mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
              System Overview
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 max-w-4xl">
              Centre de Contrôle Plateforme
            </h1>
          </div>
          <WipeMenu />
        </header>

        {/* High-Level Stats (Bento) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-8 flex flex-col justify-between hover:translate-x-1 transition-transform duration-300">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4">
                Revenus totaux
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight break-all text-zinc-900 tabular-nums">
                {isLoading ? "…" : formatFCFA(d?.kpis.totalRevenue ?? 0)}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-1">FCFA</p>
            </div>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tabular-nums font-bold text-[#006e2f] bg-[#22c55e]/10 px-2 py-0.5">
                  {formatFCFA(d?.kpis.platformCommission ?? 0)} FCFA
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Commission 5% Novakou
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tabular-nums font-bold text-purple-700 bg-purple-100 px-2 py-0.5">
                  {formatFCFA(d?.kpis.affiliatePayouts ?? 0)} FCFA
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Versés aux affiliés
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 flex flex-col justify-between hover:translate-x-1 transition-transform duration-300">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4">
                Utilisateurs
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight break-all text-zinc-900 tabular-nums">
                {isLoading ? "…" : (d?.kpis.totalUsers ?? 0).toLocaleString("fr-FR")}
              </h2>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="text-[10px] tabular-nums font-bold text-[#006e2f] bg-[#22c55e]/10 px-2 py-0.5">
                +{d?.kpis.newUsersToday ?? 0}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Aujourd&apos;hui</span>
            </div>
          </div>

          <div className="bg-white p-8 flex flex-col justify-between hover:translate-x-1 transition-transform duration-300">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4">
                Produits publiés
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight break-all text-zinc-900 tabular-nums">
                {isLoading ? "…" : (d?.kpis.totalProducts ?? 0).toLocaleString("fr-FR")}
              </h2>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="text-[10px] tabular-nums font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5">
                {d?.kpis.pendingProducts ?? 0} en attente
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Modération</span>
            </div>
          </div>

          <div className="bg-[#22c55e] p-8 flex flex-col justify-between text-[#004b1e]">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest font-bold opacity-80 mb-4">
                Santé plateforme
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight break-all tabular-nums">99.98%</h2>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span className="text-[10px] uppercase tracking-wider font-bold">Nominal</span>
            </div>
          </div>
        </div>

        {/* ── Analytics live (30 derniers jours) ─────────────────────────────── */}
        {charts?.data && (
          <div className="mb-12 space-y-6">
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Revenus 30j (brut)", value: `${formatFCFA(charts.data.totals.grossLast30)} F`, color: "text-[#006e2f]", bg: "bg-[#006e2f]/10", icon: "payments" },
                { label: "Commission plateforme", value: `${formatFCFA(charts.data.totals.commissionLast30)} F`, color: "text-amber-600", bg: "bg-amber-50", icon: "account_balance" },
                { label: "Nouveaux users (7j)", value: String(charts.data.totals.newUsersLast7), color: "text-blue-600", bg: "bg-blue-50", icon: "person_add" },
                { label: "Sessions mentor (30j)", value: String(charts.data.totals.mentorBookingsLast30), color: "text-purple-600", bg: "bg-purple-50", icon: "event_available" },
              ].map((kpi, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.bg}`}>
                    <span className={`material-symbols-outlined text-[22px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {kpi.icon}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-extrabold text-[#191c1e] mt-1 tabular-nums">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* 2-column charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue stacked area */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1">Revenus 30 jours</p>
                    <h3 className="text-lg font-bold text-[#191c1e]">Formations · Produits · Mentors</h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={charts.data.revenueSeries}>
                    <defs>
                      <linearGradient id="gForm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#006e2f" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#006e2f" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gMent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5c647a" }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: "#5c647a" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef0f3", fontSize: 12 }} formatter={(v: number) => `${formatFCFA(v)} F`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="formations" name="Formations" stroke="#006e2f" strokeWidth={2} fill="url(#gForm)" stackId="1" />
                    <Area type="monotone" dataKey="products" name="Produits" stroke="#22c55e" strokeWidth={2} fill="url(#gProd)" stackId="1" />
                    <Area type="monotone" dataKey="mentors" name="Mentors" stroke="#60a5fa" strokeWidth={2} fill="url(#gMent)" stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown pie */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1">Répartition 30j</p>
                <h3 className="text-lg font-bold text-[#191c1e] mb-4">Sources de revenus</h3>
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
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef0f3", fontSize: 12 }} formatter={(v: number) => `${formatFCFA(v)} F`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-xs text-[#5c647a]">Aucune donnée</div>
                )}
                <div className="space-y-1 mt-3">
                  {charts.data.breakdown.map((b) => (
                    <div key={b.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: b.color }} />
                        {b.name}
                      </span>
                      <span className="font-bold text-[#191c1e] tabular-nums">{formatFCFA(b.value)} F</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* New users 7 days */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Acquisition</p>
                  <h3 className="text-lg font-bold text-[#191c1e]">Nouveaux utilisateurs (7 jours)</h3>
                </div>
                <p className="text-sm font-bold text-blue-600 tabular-nums">{charts.data.totals.newUsersLast7} inscrits</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={charts.data.newUsersSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5c647a" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#5c647a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef0f3", fontSize: 12 }} />
                  <Bar dataKey="count" name="Inscriptions" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-12">
            {/* Revenue chart */}
            <div className="bg-white p-8 md:p-10">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-[#006e2f] mb-1 block">
                    Analytics
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900">
                    Vélocité des revenus
                  </h3>
                </div>
                <div className="flex gap-4">
                  <button className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#22c55e] pb-1">
                    6 mois
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="h-80 bg-zinc-50 animate-pulse" />
              ) : chart.length === 0 || maxRev === 1 ? (
                <div className="h-80 flex items-center justify-center text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Aucune donnée
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-80 w-full flex items-end gap-2 px-2 border-l border-b border-zinc-100">
                    {chart.map((m, idx) => {
                      const isLast = idx === chart.length - 1;
                      const h = Math.max((m.revenue / maxRev) * 100, 2);
                      return (
                        <div key={idx} className="flex-1 h-full flex flex-col justify-end group relative">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 whitespace-nowrap z-10">
                            {formatFCFA(m.revenue)} FCFA
                          </div>
                          <div
                            className={`w-full transition-colors ${
                              isLast ? "bg-[#22c55e]" : "bg-zinc-50 group-hover:bg-[#22c55e]/20"
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4">
                    {chart.map((m, i) => (
                      <span key={i} className="text-[10px] tabular-nums text-zinc-400 uppercase flex-1 text-center">
                        {m.month}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Recent transactions */}
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-8 border-l-4 border-[#22c55e] pl-4">
                Transactions récentes
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-[#f3f3f4] animate-pulse" />)}
                </div>
              ) : (d?.recentTransactions ?? []).length === 0 ? (
                <div className="bg-[#f3f3f4] p-10 text-center">
                  <p className="text-sm text-zinc-500">Aucune transaction pour l&apos;instant.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(d?.recentTransactions ?? []).map((tx) => (
                    <div key={tx.id} className="bg-[#f3f3f4] flex items-center justify-between p-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center text-white text-sm font-bold">
                          {tx.user.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">{tx.user}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-1">{tx.product}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-zinc-900 tabular-nums">{formatFCFA(tx.amount)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {tx.type === "formation" ? "Formation" : "Produit"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Actions requises — dark card */}
            <div className="bg-zinc-900 text-white p-8">
              <div className="flex items-center gap-2 mb-8">
                <span className="material-symbols-outlined text-[#ff8b7c]">warning</span>
                <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Actions requises</h3>
              </div>
              <div className="space-y-6">
                <Link
                  href="/admin/produits?status=EN_ATTENTE"
                  className="block border-l border-zinc-700 pl-4 py-1 hover:border-[#22c55e] transition-colors"
                >
                  <p className="text-xs text-zinc-400 tabular-nums mb-1 uppercase">Modération</p>
                  <p className="text-sm font-bold">
                    {(d?.quickStats.pendingFormations ?? 0) + (d?.quickStats.pendingProducts ?? 0)} produits à valider
                  </p>
                </Link>
                <Link
                  href="/admin/signalements"
                  className="block border-l border-zinc-700 pl-4 py-1 hover:border-[#22c55e] transition-colors"
                >
                  <p className="text-xs text-zinc-400 tabular-nums mb-1 uppercase">Litiges</p>
                  <p className="text-sm font-bold">{d?.quickStats.pendingRefunds ?? 0} remboursements en attente</p>
                </Link>
                <Link
                  href="/admin/signalements"
                  className="block border-l border-zinc-700 pl-4 py-1 hover:border-[#22c55e] transition-colors"
                >
                  <p className="text-xs text-zinc-400 tabular-nums mb-1 uppercase">Signalements</p>
                  <p className="text-sm font-bold">{d?.quickStats.pendingReports ?? 0} contenus signalés</p>
                </Link>
              </div>
            </div>

            {/* This month */}
            <div className="bg-[#f3f3f4] p-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-zinc-900 mb-8">
                Ce mois
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Transactions</p>
                  <p className="text-lg font-extrabold tabular-nums tracking-tight break-all text-zinc-900">
                    {(d?.kpis.transactionsThisMonth ?? 0).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="h-px bg-zinc-200" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Revenus</p>
                  <p className="text-2xl font-bold tabular-nums text-[#006e2f]">
                    {formatFCFA(d?.kpis.transactionsThisMonthRevenue ?? 0)}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">FCFA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending approvals */}
        {!isLoading && (d?.pendingItems ?? []).length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-8">
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 border-l-4 border-[#22c55e] pl-4">
                Produits en attente d&apos;approbation
              </h3>
              <Link
                href="/admin/produits?status=EN_ATTENTE"
                className="text-[10px] font-bold text-[#006e2f] uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Tout voir
                <span className="material-symbols-outlined text-xs">arrow_outward</span>
              </Link>
            </div>
            <div className="space-y-3">
              {(d?.pendingItems ?? []).map((p) => (
                <div key={p.id} className="bg-white flex items-center gap-6 p-6 hover:translate-x-1 transition-transform duration-200">
                  <div className="w-14 h-14 bg-zinc-100 flex-shrink-0 overflow-hidden">
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-300">
                          {p.kind === "formation" ? "school" : "book"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{p.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {p.seller}
                      </span>
                      <span className="text-[10px] text-zinc-400">·</span>
                      <span className="text-[10px] tabular-nums text-zinc-400">{timeAgo(p.submittedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-extrabold tabular-nums text-zinc-900">{formatFCFA(p.price)}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{p.type}</p>
                  </div>
                  <div className="flex gap-0 flex-shrink-0">
                    <button
                      onClick={() => approveMutation.mutate({ id: p.id, kind: p.kind, action: "approve" })}
                      disabled={approveMutation.isPending}
                      className="px-5 py-3 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-50"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => approveMutation.mutate({ id: p.id, kind: p.kind, action: "reject" })}
                      disabled={approveMutation.isPending}
                      className="px-5 py-3 bg-zinc-200 text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
