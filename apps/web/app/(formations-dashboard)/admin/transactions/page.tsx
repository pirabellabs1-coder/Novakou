"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  Receipt,
  Search,
  Download,
  TrendingUp,
  Wallet,
  Banknote,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Inbox,
  FilterX,
} from "lucide-react";

type Period = "all" | "7d" | "30d" | "90d" | "custom";

type Txn = {
  id: string;
  type: "formation" | "product";
  productTitle: string;
  productType: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  amount: number;
  commission: number;
  netAmount: number;
  createdAt: string;
  status: "completed" | "refunded" | "pending_refund";
};

type Summary = {
  total: number;
  completed: number;
  refunded: number;
  pendingRefund: number;
  totalRevenue: number;
  totalCommission: number;
  totalNetPaid: number;
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "green" | "rose" | "orange" }
> = {
  completed: { label: "Complète", variant: "green" },
  refunded: { label: "Remboursée", variant: "rose" },
  pending_refund: { label: "En cours", variant: "orange" },
};

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<"all" | "formation" | "product">("all");
  const [period, setPeriod] = useState<Period>("all");
  const [customSince, setCustomSince] = useState("");
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{
    data: Txn[];
    summary: Summary | null;
  }>({
    queryKey: ["admin-transactions"],
    queryFn: () =>
      fetch("/api/formations/admin/transactions").then((r) => r.json()),
    staleTime: 15_000,
  });

  const all = response?.data ?? [];
  const summary = response?.summary;

  const cutoff = useMemo(() => {
    if (period === "all") return -Infinity;
    if (period === "custom") {
      if (!customSince) return -Infinity;
      const t = new Date(customSince).getTime();
      return Number.isFinite(t) ? t : -Infinity;
    }
    const map: Record<Exclude<Period, "all" | "custom">, number> = {
      "7d": 7 * 86400_000,
      "30d": 30 * 86400_000,
      "90d": 90 * 86400_000,
    };
    return Date.now() - map[period];
  }, [period, customSince]);

  const filtered = useMemo(() => {
    return all.filter((t) => {
      const matchStatus = status === "all" || t.status === status;
      const matchType = type === "all" || t.type === type;
      const ts = new Date(t.createdAt).getTime();
      const matchPeriod = ts >= cutoff;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.buyerName.toLowerCase().includes(q) ||
        t.buyerEmail.toLowerCase().includes(q) ||
        t.sellerName.toLowerCase().includes(q) ||
        t.productTitle.toLowerCase().includes(q) ||
        t.productType.toLowerCase().includes(q);
      return matchStatus && matchType && matchPeriod && matchSearch;
    });
  }, [all, status, type, cutoff, search]);

  const filtersActive =
    search.trim() !== "" ||
    status !== "all" ||
    type !== "all" ||
    period !== "all" ||
    customSince !== "";

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setType("all");
    setPeriod("all");
    setCustomSince("");
  }

  const tabs = [
    { value: "all", label: "Toutes", count: summary?.total ?? 0 },
    {
      value: "completed",
      label: "Complétées",
      count: summary?.completed ?? 0,
    },
    {
      value: "pending_refund",
      label: "En cours",
      count: summary?.pendingRefund ?? 0,
    },
    {
      value: "refunded",
      label: "Remboursées",
      count: summary?.refunded ?? 0,
    },
  ];

  function exportCSV() {
    if (filtered.length === 0) return;
    const headers = [
      "Date",
      "Type",
      "Produit",
      "Acheteur",
      "Email",
      "Vendeur",
      "Montant",
      "Commission",
      "Net",
      "Statut",
    ];
    const rows = filtered.map((t) => [
      new Date(t.createdAt).toISOString(),
      t.type === "formation" ? "Formation" : t.productType,
      `"${t.productTitle.replace(/"/g, '""')}"`,
      `"${t.buyerName.replace(/"/g, '""')}"`,
      t.buyerEmail,
      `"${t.sellerName.replace(/"/g, '""')}"`,
      Math.round(t.amount),
      Math.round(t.commission),
      Math.round(t.netAmount),
      t.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `novakou-transactions-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto space-y-8">
        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={Receipt}
          title="Transactions"
          subtitle={
            isLoading
              ? "Chargement..."
              : `${summary?.total ?? 0} transactions enregistrées · ${filtered.length} visibles`
          }
          actions={
            <KazaButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={filtered.length === 0}
            >
              Exporter CSV
            </KazaButton>
          }
        />

        {/* KPIs financiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KazaKpiCard
            label="Revenus totaux"
            value={`${formatFCFA(summary?.totalRevenue ?? 0)} F`}
            delta="Toutes transactions"
            deltaTrend="neutral"
            icon={TrendingUp}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Commission (10 %)"
            value={`${formatFCFA(summary?.totalCommission ?? 0)} F`}
            delta="Prélevés Novakou"
            deltaTrend="neutral"
            icon={Wallet}
            iconColor="orange"
          />
          <KazaKpiCard
            label="Versé aux vendeurs (90 %)"
            value={`${formatFCFA(summary?.totalNetPaid ?? 0)} F`}
            delta="Net créateurs"
            deltaTrend="neutral"
            icon={Banknote}
            iconColor="navy"
          />
        </div>

        {/* Filtres */}
        <KazaCard>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Rechercher par acheteur, vendeur, produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatus(tab.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      status === tab.value
                        ? "bg-[#0b2540] text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                        status === tab.value
                          ? "bg-white/15 text-white"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between flex-wrap">
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl">
                {(
                  [
                    { v: "all", l: "Tout type" },
                    { v: "formation", l: "Formations" },
                    { v: "product", l: "Produits" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.v}
                    onClick={() => setType(t.v)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      type === t.v
                        ? "bg-emerald-500 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl">
                  {(
                    [
                      { v: "all", l: "Tout" },
                      { v: "7d", l: "7 j" },
                      { v: "30d", l: "30 j" },
                      { v: "90d", l: "90 j" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.v}
                      onClick={() => {
                        setPeriod(p.v);
                        setCustomSince("");
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        period === p.v
                          ? "bg-[#0b2540] text-white shadow"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {p.l}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Depuis
                  </span>
                  <input
                    type="date"
                    value={customSince}
                    onChange={(e) => {
                      setCustomSince(e.target.value);
                      setPeriod(e.target.value ? "custom" : "all");
                    }}
                    className="text-xs text-slate-900 outline-none bg-transparent"
                  />
                </label>
                {filtersActive && (
                  <KazaButton
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </KazaButton>
                )}
              </div>
            </div>
          </div>
        </KazaCard>

        {/* Table */}
        <KazaCard noPadding>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-5">
              <KazaEmpty
                icon={filtersActive && all.length > 0 ? FilterX : Inbox}
                title={
                  filtersActive && all.length > 0
                    ? "Aucun résultat"
                    : "Aucune transaction"
                }
                description={
                  filtersActive && all.length > 0
                    ? "Aucune transaction ne correspond à vos filtres."
                    : "Aucune transaction enregistrée pour le moment."
                }
                action={
                  filtersActive && all.length > 0
                    ? {
                        label: "Réinitialiser les filtres",
                        onClick: resetFilters,
                      }
                    : undefined
                }
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
                      Produit / Vendeur
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Montant
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Commission
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">Net</th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const sc = STATUS_CONFIG[tx.status];
                    const date = new Date(tx.createdAt).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "short" }
                    );
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                            {tx.buyerName}
                          </p>
                          <p className="text-[10px] text-slate-400 tabular-nums uppercase">
                            {date}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1 max-w-[280px]">
                            {tx.productTitle}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">
                            par {tx.sellerName}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <p
                            className={`text-sm font-extrabold tabular-nums ${tx.status === "refunded" ? "line-through text-slate-400" : "text-slate-900"}`}
                          >
                            {formatFCFA(tx.amount)}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase">
                            FCFA
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <p className="text-sm font-bold tabular-nums text-orange-600">
                            {formatFCFA(tx.commission)}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase">
                            10 %
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <p className="text-sm font-bold tabular-nums text-emerald-700">
                            {formatFCFA(tx.netAmount)}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase">
                            90 %
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <KazaBadge
                            variant={sc.variant}
                            icon={
                              sc.variant === "green"
                                ? CheckCircle
                                : sc.variant === "rose"
                                  ? XCircle
                                  : Clock
                            }
                          >
                            {sc.label}
                          </KazaBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </KazaCard>
      </main>
    </div>
  );
}
