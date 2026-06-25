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
  StCard,
  StPageHeader,
  StButton,
  StStatusPill,
  StKpiCompact,
  StSectionTitle,
  StAvatar,
  ST,
} from "@/components/stitch";

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

const statusBadge: Record<string, { label: string; tone: "green" | "amber" | "rose" }> = {
  completed: { label: "Complété", tone: "green" },
  pending_refund: { label: "Remboursement", tone: "amber" },
  refunded: { label: "Remboursé", tone: "rose" },
};

const STATUS_PILL: Record<string, "TRAITE" | "EN_ATTENTE" | "REFUSE"> = {
  completed: "TRAITE",
  pending_refund: "EN_ATTENTE",
  refunded: "REFUSE",
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 animate-pulse items-center">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: "#eef2ef" }} />
        <div className="space-y-1.5">
          <div className="h-3 rounded w-24" style={{ background: "#eef2ef" }} />
          <div className="h-2 rounded w-16" style={{ background: "#eef2ef" }} />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 rounded w-40" style={{ background: "#eef2ef" }} />
        <div className="h-2 rounded w-24" style={{ background: "#eef2ef" }} />
      </div>
      <div className="h-4 rounded w-20" style={{ background: "#eef2ef" }} />
      <div className="h-5 rounded-full w-16" style={{ background: "#eef2ef" }} />
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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Transactions"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${summary?.total ?? 0} transaction${(summary?.total ?? 0) !== 1 ? "s" : ""} · Historique complet de vos ventes`
          }
          actions={
            <StButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={allTxns.length === 0}
            >
              Exporter CSV
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact
            label="Revenus filtrés"
            value={isLoading ? "…" : `${formatFCFA(filteredRevenue)} FCFA`}
            icon={Wallet}
            tone="green"
          />
          <StKpiCompact
            label={`Transactions · ${filtered.filter((t) => t.status === "completed").length} complétée${filtered.filter((t) => t.status === "completed").length !== 1 ? "s" : ""}`}
            value={filtered.length}
            icon={ShoppingBag}
            tone="blue"
          />
          <StKpiCompact
            label={`Remboursements · ${summary?.refunded ?? 0} remb.`}
            value={isLoading ? "…" : `${formatFCFA(summary?.pendingRevenue ?? 0)} FCFA`}
            icon={Undo2}
            tone="rose"
          />
        </div>

        {/* Revenue trend */}
        <StCard className="!p-[18px_20px] mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <StSectionTitle className="!mb-0">Évolution des revenus</StSectionTitle>
              <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>Tendance 30 jours</p>
            </div>
            <div className="text-right">
              <p className="text-[18px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                {formatFCFA(dailyChart.reduce((s, x) => s + x.amount, 0))} FCFA
              </p>
              <p className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>cumul 30 j</p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-[200px] rounded-xl animate-pulse" style={{ background: "#f3f6f4" }} />
          ) : !hasDailyData ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <LineChart className="w-8 h-8 mx-auto mb-2" style={{ color: "#d6e0da" }} />
                <p className="text-[13px] font-bold" style={{ color: ST.textSecondary }}>Aucune vente sur les 30 derniers jours</p>
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
                <CartesianGrid strokeDasharray="3 3" stroke={ST.divider} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: ST.textFaint, fontWeight: 600 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: ST.textFaint, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${ST.cardBorder}`, fontSize: 12, fontWeight: 600, padding: "8px 12px" }}
                  formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "Revenus"]}
                />
                <Area type="monotone" dataKey="amount" stroke={ST.green} strokeWidth={2.5} fill="url(#txnRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </StCard>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: ST.textMuted }} />
            <input
              type="text"
              placeholder="Rechercher par nom, produit, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-[12px] bg-white text-[13.5px] font-semibold focus:outline-none"
              style={{ color: ST.text, border: "1px solid #dde6e0" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusTabs.map((tab) => {
              const on = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-[12.5px] font-extrabold transition-all"
                  style={on ? { background: ST.gradient, color: "#fff" } : { background: "#fff", color: ST.textSecondary, border: `1px solid ${ST.cardBorder}` }}
                >
                  {tab.label}
                  <span
                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
                    style={on ? { background: "rgba(255,255,255,.25)", color: "#fff" } : { background: "#f1efe8", color: ST.textMuted }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <StCard noPadding>
          <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-3.5" style={{ borderBottom: `1px solid ${ST.divider}` }}>
            {["Acheteur", "Produit", "Montant", "Statut"].map((h) => (
              <span key={h} className="text-[10.5px] font-extrabold uppercase tracking-[.06em]" style={{ color: ST.textMuted }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}>
                  <SkeletonRow />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Receipt size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
              <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>
                {allTxns.length === 0 ? "Aucune vente pour l'instant" : "Aucune transaction trouvée"}
              </h3>
              <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                {allTxns.length === 0
                  ? "Publiez un produit pour commencer à vendre."
                  : "Essayez de modifier vos filtres de recherche."}
              </p>
              {allTxns.length === 0 && (
                <div className="mt-4 flex justify-center">
                  <StButton href="/vendeur/produits/creer">Créer un produit</StButton>
                </div>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((txn, idx) => {
                const date = new Date(txn.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                const time = new Date(txn.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={txn.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 items-center"
                    style={idx ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <StAvatar name={txn.buyerName} size={36} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>{txn.buyerName}</p>
                        {txn.buyerEmail && (
                          <p className="text-[10.5px] font-semibold truncate" style={{ color: ST.textFaint }}>{txn.buyerEmail}</p>
                        )}
                        <p className="text-[10.5px] font-semibold tabular-nums" style={{ color: ST.textFaint }}>{txn.id.slice(0, 12)}…</p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold line-clamp-1" style={{ color: ST.text }}>{txn.productTitle}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>{txn.productType}</span>
                        <span className="text-[10.5px]" style={{ color: ST.textFaint }}>·</span>
                        <span className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>{date} · {time}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[13px] font-extrabold tabular-nums" style={{ color: txn.status === "refunded" ? ST.roseText : ST.green, textDecoration: txn.status === "refunded" ? "line-through" : undefined }}>
                        {txn.status === "refunded" ? "-" : "+"}{formatFCFA(txn.amount)}
                      </p>
                      <p className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>FCFA</p>
                    </div>

                    <div>
                      <StStatusPill status={STATUS_PILL[txn.status] ?? "TRAITE"} label={statusBadge[txn.status]?.label} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
              <p className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                <span className="font-extrabold" style={{ color: ST.text }}>{filtered.length}</span> transaction{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </StCard>
      </main>
    </div>
  );
}
