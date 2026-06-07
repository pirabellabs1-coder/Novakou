"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Receipt,
  Download,
  Search,
  ShoppingBag,
  Undo2,
  Wallet,
  LineChart,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaSection,
  KazaEmpty,
} from "@/components/kaza";

type Txn = {
  id: string;
  type: string;
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  productType: string;
  amount: number;
  createdAt: string;
  status: "completed" | "refunded" | "pending_refund";
};

type Summary = {
  total: number;
  completed: number;
  refunded: number;
  totalRevenue: number;
  pendingRevenue: number;
};

type StatusFilter = "all" | "completed" | "refunded" | "pending_refund";

const statusBadge: Record<string, { label: string; variant: "green" | "orange" | "rose" | "slate" }> = {
  completed: { label: "Complété", variant: "green" },
  pending_refund: { label: "Remboursement", variant: "orange" },
  refunded: { label: "Remboursé", variant: "rose" },
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const GRADIENTS = [
  "from-violet-400 to-purple-600",
  "from-blue-400 to-sky-600",
  "from-pink-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-emerald-600",
  "from-indigo-400 to-indigo-600",
  "from-green-400 to-emerald-600",
];

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 animate-pulse items-center">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-2 bg-slate-100 rounded w-16" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-slate-100 rounded w-40" />
        <div className="h-2 bg-slate-100 rounded w-24" />
      </div>
      <div className="h-4 bg-slate-100 rounded w-20" />
      <div className="h-5 bg-slate-100 rounded-full w-16" />
    </div>
  );
}

export default function TransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{ data: Txn[]; summary: Summary }>({
    queryKey: ["vendeur-transactions"],
    queryFn: () => fetch("/api/formations/vendeur/transactions").then((r) => r.json()),
    staleTime: 30_000,
  });

  const allTxns: Txn[] = response?.data ?? [];
  const summary = response?.summary;

  function exportCSV() {
    if (allTxns.length === 0) return;
    const headers = ["Date", "Type", "Produit", "Acheteur", "Email", "Montant", "Statut"];
    const rows = allTxns.map((t) => [
      new Date(t.createdAt).toISOString(),
      t.productType,
      `"${t.productTitle.replace(/"/g, '""')}"`,
      `"${t.buyerName.replace(/"/g, '""')}"`,
      t.buyerEmail,
      Math.round(t.amount),
      t.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `novakou-ventes-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    return allTxns.filter((t) => {
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.buyerName.toLowerCase().includes(q) ||
        t.productTitle.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [allTxns, statusFilter, search]);

  const filteredRevenue = filtered
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  // Build daily chart for last 30 days
  const dailyChart = useMemo(() => {
    const byDay = new Map<string, number>();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }
    for (const t of allTxns) {
      if (t.status !== "completed") continue;
      const key = new Date(t.createdAt).toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + t.amount);
    }
    return Array.from(byDay.entries()).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      amount,
    }));
  }, [allTxns]);

  const hasDailyData = dailyChart.some((d) => d.amount > 0);

  const statusTabs: { label: string; value: StatusFilter; count: number }[] = [
    { label: "Toutes", value: "all", count: allTxns.length },
    { label: "Complétées", value: "completed", count: allTxns.filter((t) => t.status === "completed").length },
    { label: "Remboursement", value: "pending_refund", count: allTxns.filter((t) => t.status === "pending_refund").length },
    { label: "Remboursées", value: "refunded", count: allTxns.filter((t) => t.status === "refunded").length },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto space-y-8">
        <KazaHero
          badge="Pro"
          badgeColor="orange"
          icon={Receipt}
          title="Transactions"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${summary?.total ?? 0} transaction${(summary?.total ?? 0) !== 1 ? "s" : ""} · Historique complet de vos ventes`
          }
          actions={
            <KazaButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={allTxns.length === 0}
            >
              Exporter CSV
            </KazaButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <KazaKpiCard
            label="Revenus filtrés"
            value={isLoading ? "…" : `${formatFCFA(filteredRevenue)} FCFA`}
            delta={`≈ ${Math.round(filteredRevenue / 655.957).toLocaleString("fr-FR")} €`}
            icon={Wallet}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Transactions"
            value={filtered.length}
            delta={`${filtered.filter((t) => t.status === "completed").length} complétée${filtered.filter((t) => t.status === "completed").length !== 1 ? "s" : ""}`}
            icon={ShoppingBag}
            iconColor="sky"
          />
          <KazaKpiCard
            label="Remboursements"
            value={isLoading ? "…" : `${formatFCFA(summary?.pendingRevenue ?? 0)} FCFA`}
            delta={`${summary?.refunded ?? 0} remboursement${(summary?.refunded ?? 0) !== 1 ? "s" : ""}`}
            icon={Undo2}
            iconColor="rose"
          />
        </div>

        {/* Revenue trend */}
        <KazaCard
          title="Évolution des revenus"
          subtitle="Tendance 30 jours"
          action={
            <div className="text-right">
              <p className="text-lg font-extrabold text-emerald-700 tabular-nums">
                {formatFCFA(dailyChart.reduce((s, x) => s + x.amount, 0))} FCFA
              </p>
              <p className="text-[10px] text-slate-500">cumul 30 j</p>
            </div>
          }
        >
          {isLoading ? (
            <div className="h-[200px] bg-slate-50 rounded-xl animate-pulse" />
          ) : !hasDailyData ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <LineChart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Aucune vente sur les 30 derniers jours</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyChart}>
                <defs>
                  <linearGradient id="txnRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5c647a" }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "#5c647a" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #eef0f3", fontSize: 12, padding: "8px 12px" }}
                  formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "Revenus"]}
                />
                <Area type="monotone" dataKey="amount" stroke="#006e2f" strokeWidth={2.5} fill="url(#txnRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </KazaCard>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, produit, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  statusFilter === tab.value
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    statusFilter === tab.value ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <KazaCard noPadding>
          <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-3.5 bg-slate-50 border-b border-slate-100 rounded-t-2xl">
            {["Acheteur", "Produit", "Montant", "Statut"].map((h) => (
              <span key={h} className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-50">
              {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <KazaEmpty
                icon={Receipt}
                title={allTxns.length === 0 ? "Aucune vente pour l'instant" : "Aucune transaction trouvée"}
                description={
                  allTxns.length === 0
                    ? "Publiez un produit pour commencer à vendre."
                    : "Essayez de modifier vos filtres de recherche."
                }
                action={allTxns.length === 0 ? { label: "Créer un produit", href: "/vendeur/produits/creer" } : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((txn, idx) => {
                const sc = statusBadge[txn.status] ?? statusBadge.completed;
                const initials = txn.buyerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const date = new Date(txn.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                const time = new Date(txn.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={txn.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{txn.buyerName}</p>
                        {txn.buyerEmail && (
                          <p className="text-[10px] text-slate-500 truncate">{txn.buyerEmail}</p>
                        )}
                        <p className="text-[10px] text-slate-500 tabular-nums">{txn.id.slice(0, 12)}…</p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{txn.productTitle}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">{txn.productType}</span>
                        <span className="text-[10px] text-slate-500">·</span>
                        <span className="text-[10px] text-slate-500">{date} · {time}</span>
                      </div>
                    </div>

                    <div>
                      <p className={`text-sm font-bold ${txn.status === "refunded" ? "text-rose-500 line-through" : "text-emerald-700"}`}>
                        {txn.status === "refunded" ? "-" : "+"}{formatFCFA(txn.amount)}
                      </p>
                      <p className="text-[10px] text-slate-500">FCFA</p>
                      <p className="text-[10px] text-slate-500">≈ {Math.round(txn.amount / 655.957)} €</p>
                    </div>

                    <div>
                      <KazaBadge variant={sc.variant}>{sc.label}</KazaBadge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{filtered.length}</span> transaction{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </KazaCard>
      </main>
    </div>
  );
}
