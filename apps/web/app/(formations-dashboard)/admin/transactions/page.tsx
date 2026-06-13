"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StChip,
  ST,
} from "@/components/stitch";
import {
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
  type LucideIcon,
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
  { label: string; tone: "green" | "rose" | "amber"; icon: LucideIcon }
> = {
  completed: { label: "Complète", tone: "green", icon: CheckCircle },
  refunded: { label: "Remboursée", tone: "rose", icon: XCircle },
  pending_refund: { label: "En cours", tone: "amber", icon: Clock },
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
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StPageHeader
          title="Transactions"
          subtitle={
            isLoading
              ? "Chargement..."
              : `${summary?.total ?? 0} transactions enregistrées · ${filtered.length} visibles`
          }
          actions={
            <StButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={filtered.length === 0}
            >
              Exporter CSV
            </StButton>
          }
        />

        {/* KPIs financiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <StKpiCompact
            label="Revenus totaux"
            value={`${formatFCFA(summary?.totalRevenue ?? 0)}`}
            unit="F"
            icon={TrendingUp}
            tone="green"
          />
          <StKpiCompact
            label="Commission (10 %)"
            value={`${formatFCFA(summary?.totalCommission ?? 0)}`}
            unit="F"
            icon={Wallet}
            tone="amber"
          />
          <StKpiCompact
            label="Versé aux vendeurs (90 %)"
            value={`${formatFCFA(summary?.totalNetPaid ?? 0)}`}
            unit="F"
            icon={Banknote}
            tone="green"
          />
        </div>

        {/* Filtres */}
        <StCard>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: ST.textMuted }}
                />
                <input
                  type="text"
                  placeholder="Rechercher par acheteur, vendeur, produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-[13.5px] font-semibold focus:outline-none transition-all"
                  style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
                />
              </div>
              <div className="flex gap-1 p-1 rounded-[13px] flex-wrap" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
                {tabs.map((tab) => {
                  const on = status === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setStatus(tab.value)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                      style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                    >
                      {tab.label}
                      <span className="text-[10px] tabular-nums">· {tab.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between flex-wrap">
              <div className="flex flex-wrap gap-1 p-1 rounded-[13px]" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
                {(
                  [
                    { v: "all", l: "Tout type" },
                    { v: "formation", l: "Formations" },
                    { v: "product", l: "Produits" },
                  ] as const
                ).map((t) => {
                  const on = type === t.v;
                  return (
                    <button
                      key={t.v}
                      onClick={() => setType(t.v)}
                      className="px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors"
                      style={on ? { background: ST.green, color: "#fff" } : { color: ST.textSecondary }}
                    >
                      {t.l}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-wrap gap-1 p-1 rounded-[13px]" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
                  {(
                    [
                      { v: "all", l: "Tout" },
                      { v: "7d", l: "7 j" },
                      { v: "30d", l: "30 j" },
                      { v: "90d", l: "90 j" },
                    ] as const
                  ).map((p) => {
                    const on = period === p.v;
                    return (
                      <button
                        key={p.v}
                        onClick={() => {
                          setPeriod(p.v);
                          setCustomSince("");
                        }}
                        className="px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors"
                        style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                      >
                        {p.l}
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-[12px]" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>
                    Depuis
                  </span>
                  <input
                    type="date"
                    value={customSince}
                    onChange={(e) => {
                      setCustomSince(e.target.value);
                      setPeriod(e.target.value ? "custom" : "all");
                    }}
                    className="text-[12px] outline-none bg-transparent"
                    style={{ color: ST.text }}
                  />
                </label>
                {filtersActive && (
                  <StButton
                    variant="secondary"
                    size="sm"
                    icon={RotateCcw}
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </StButton>
                )}
              </div>
            </div>
          </div>
        </StCard>

        {/* Table */}
        <StCard noPadding>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl"
                  style={{ background: ST.divider }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              {filtersActive && all.length > 0 ? (
                <FilterX size={36} style={{ color: "#d6e0da" }} />
              ) : (
                <Inbox size={36} style={{ color: "#d6e0da" }} />
              )}
              <p className="text-[13.5px] font-extrabold mt-3" style={{ color: ST.text }}>
                {filtersActive && all.length > 0 ? "Aucun résultat" : "Aucune transaction"}
              </p>
              <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                {filtersActive && all.length > 0
                  ? "Aucune transaction ne correspond à vos filtres."
                  : "Aucune transaction enregistrée pour le moment."}
              </p>
              {filtersActive && all.length > 0 && (
                <div className="mt-4">
                  <StButton variant="primary" size="sm" icon={RotateCcw} onClick={resetFilters}>
                    Réinitialiser les filtres
                  </StButton>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      { h: "Acheteur", align: "text-left" },
                      { h: "Produit / Vendeur", align: "text-left" },
                      { h: "Montant", align: "text-right" },
                      { h: "Commission", align: "text-right" },
                      { h: "Net", align: "text-right" },
                      { h: "Statut", align: "text-left" },
                    ].map((c) => (
                      <th
                        key={c.h}
                        className={`text-[10.5px] uppercase font-extrabold px-5 py-3 ${c.align}`}
                        style={{ color: ST.textMuted, letterSpacing: ".06em" }}
                      >
                        {c.h}
                      </th>
                    ))}
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
                      <tr key={tx.id} className="transition-colors hover:bg-[#f7faf8]">
                        <td className="px-5 py-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p className="text-[12.5px] font-extrabold truncate max-w-[200px]" style={{ color: ST.text }}>
                            {tx.buyerName}
                          </p>
                          <p className="text-[10px] tabular-nums uppercase" style={{ color: ST.textFaint }}>
                            {date}
                          </p>
                        </td>
                        <td className="px-5 py-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p className="text-[12.5px] font-bold line-clamp-1 max-w-[280px]" style={{ color: ST.text }}>
                            {tx.productTitle}
                          </p>
                          <p className="text-[10px] font-extrabold uppercase tracking-wide mt-0.5" style={{ color: ST.textFaint }}>
                            par {tx.sellerName}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p
                            className={`text-[12.5px] font-extrabold tabular-nums ${tx.status === "refunded" ? "line-through" : ""}`}
                            style={{ color: tx.status === "refunded" ? ST.textFaint : ST.text }}
                          >
                            {formatFCFA(tx.amount)}
                          </p>
                          <p className="text-[9px] uppercase" style={{ color: ST.textFaint }}>FCFA</p>
                        </td>
                        <td className="px-5 py-3 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p className="text-[12.5px] font-bold tabular-nums" style={{ color: ST.amberText }}>
                            {formatFCFA(tx.commission)}
                          </p>
                          <p className="text-[9px] uppercase" style={{ color: ST.textFaint }}>10 %</p>
                        </td>
                        <td className="px-5 py-3 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p className="text-[12.5px] font-bold tabular-nums" style={{ color: ST.green }}>
                            {formatFCFA(tx.netAmount)}
                          </p>
                          <p className="text-[9px] uppercase" style={{ color: ST.textFaint }}>90 %</p>
                        </td>
                        <td className="px-5 py-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <StChip tone={sc.tone} icon={sc.icon}>{sc.label}</StChip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </StCard>
      </main>
    </div>
  );
}
