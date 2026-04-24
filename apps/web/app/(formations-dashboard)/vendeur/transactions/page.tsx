"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

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

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  completed: { label: "Complété", bg: "bg-[#006e2f]/10", text: "text-[#006e2f]", dot: "bg-[#006e2f]" },
  pending_refund: { label: "Remboursement", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  refunded: { label: "Remboursé", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
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
        <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-2 bg-gray-100 rounded w-16" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-40" />
        <div className="h-2 bg-gray-100 rounded w-24" />
      </div>
      <div className="h-4 bg-gray-100 rounded w-20" />
      <div className="h-5 bg-gray-100 rounded-full w-16" />
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
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
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
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Transactions</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {isLoading ? "Chargement…" : `${summary?.total ?? 0} transaction${(summary?.total ?? 0) !== 1 ? "s" : ""} · Historique complet`}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={allTxns.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px] text-[#5c647a]">download</span>
          Exporter CSV
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Revenus filtrés",
            value: `${formatFCFA(filteredRevenue)} FCFA`,
            sub: `≈ ${Math.round(filteredRevenue / 655.957).toLocaleString("fr-FR")} €`,
            icon: "payments",
            color: "text-[#006e2f]",
            bg: "bg-[#006e2f]/10",
          },
          {
            label: "Transactions",
            value: filtered.length.toString(),
            sub: `${filtered.filter((t) => t.status === "completed").length} complétée${filtered.filter((t) => t.status === "completed").length !== 1 ? "s" : ""}`,
            icon: "receipt_long",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Remboursements",
            value: `${formatFCFA(summary?.pendingRevenue ?? 0)} FCFA`,
            sub: `${summary?.refunded ?? 0} remboursement${(summary?.refunded ?? 0) !== 1 ? "s" : ""}`,
            icon: "undo",
            color: "text-red-500",
            bg: "bg-red-50",
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {kpi.icon}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
            <p className="text-sm font-extrabold text-[#191c1e] mt-0.5 leading-snug">{isLoading ? "…" : kpi.value}</p>
            <p className="text-[10px] text-[#5c647a]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend — last 30 days */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1">Tendance 30 jours</p>
            <h3 className="text-lg font-bold text-[#191c1e]">Évolution des revenus</h3>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-[#006e2f]">
              {formatFCFA(dailyChart.reduce((s, x) => s + x.amount, 0))} FCFA
            </p>
            <p className="text-[10px] text-[#5c647a]">cumul 30 j</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-[200px] bg-gray-50 rounded-xl animate-pulse" />
        ) : !hasDailyData ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[32px] text-gray-300 block mb-2">show_chart</span>
              <p className="text-sm text-[#5c647a]">Aucune vente sur les 30 derniers jours</p>
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
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#5c647a]">search</span>
          <input
            type="text"
            placeholder="Rechercher par nom, produit, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                statusFilter === tab.value
                  ? "text-white shadow-sm"
                  : "bg-white border border-gray-200 text-[#5c647a] hover:border-[#006e2f]/30 hover:text-[#006e2f]"
              }`}
              style={statusFilter === tab.value ? { background: "linear-gradient(to right, #006e2f, #22c55e)" } : {}}
            >
              {tab.label}
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-[#5c647a]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100">
          {["Acheteur", "Produit", "Montant", "Statut"].map((h) => (
            <span key={h} className="text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[40px] text-gray-300 block mb-3">receipt_long</span>
            <p className="font-semibold text-[#191c1e]">
              {allTxns.length === 0 ? "Aucune vente pour l'instant" : "Aucune transaction trouvée"}
            </p>
            <p className="text-sm text-[#5c647a] mt-1">
              {allTxns.length === 0
                ? "Publiez un produit pour commencer à vendre."
                : "Essayez de modifier vos filtres de recherche."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((txn, idx) => {
              const sc = statusConfig[txn.status] ?? statusConfig.completed;
              const initials = txn.buyerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const date = new Date(txn.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
              const time = new Date(txn.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div
                  key={txn.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center"
                >
                  {/* Buyer */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#191c1e] truncate">{txn.buyerName}</p>
                      {txn.buyerEmail && (
                        <p className="text-[10px] text-[#5c647a] truncate">{txn.buyerEmail}</p>
                      )}
                      <p className="text-[10px] text-[#5c647a] tabular-nums">{txn.id.slice(0, 12)}…</p>
                    </div>
                  </div>

                  {/* Product */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#191c1e] line-clamp-1">{txn.productTitle}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#5c647a]">{txn.productType}</span>
                      <span className="text-[10px] text-[#5c647a]">·</span>
                      <span className="text-[10px] text-[#5c647a]">{date} · {time}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <p className={`text-sm font-bold ${txn.status === "refunded" ? "text-red-500 line-through" : "text-[#006e2f]"}`}>
                      {txn.status === "refunded" ? "-" : "+"}{formatFCFA(txn.amount)}
                    </p>
                    <p className="text-[10px] text-[#5c647a]">FCFA</p>
                    <p className="text-[10px] text-[#5c647a]">≈ {Math.round(txn.amount / 655.957)} €</p>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-[#5c647a]">
              <span className="font-semibold text-[#191c1e]">{filtered.length}</span> transaction{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
