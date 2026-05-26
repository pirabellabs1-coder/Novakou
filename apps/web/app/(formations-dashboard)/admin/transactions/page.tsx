// Refonte par Sophie Tremblay + Léa Moreau — réunion bureau 2026-05-26 (votes 5 & 6)
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: "Complete", bg: "bg-[#22c55e]", text: "text-[#004b1e]" },
  refunded: { label: "Refunded", bg: "bg-[#ffdad6]", text: "text-[#93000a]" },
  pending_refund: { label: "Pending", bg: "bg-amber-400", text: "text-amber-900" },
};

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<"all" | "formation" | "product">("all");
  const [period, setPeriod] = useState<Period>("all");
  const [customSince, setCustomSince] = useState("");
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{ data: Txn[]; summary: Summary | null }>({
    queryKey: ["admin-transactions"],
    queryFn: () => fetch("/api/formations/admin/transactions").then((r) => r.json()),
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
      const matchSearch = !q
        || t.buyerName.toLowerCase().includes(q)
        || t.buyerEmail.toLowerCase().includes(q)
        || t.sellerName.toLowerCase().includes(q)
        || t.productTitle.toLowerCase().includes(q)
        || t.productType.toLowerCase().includes(q);
      return matchStatus && matchType && matchPeriod && matchSearch;
    });
  }, [all, status, type, cutoff, search]);

  const filtersActive = search.trim() !== "" || status !== "all" || type !== "all" || period !== "all" || customSince !== "";

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setType("all");
    setPeriod("all");
    setCustomSince("");
  }

  const tabs = [
    { value: "all", label: "Toutes", count: summary?.total ?? 0 },
    { value: "completed", label: "Complétées", count: summary?.completed ?? 0 },
    { value: "pending_refund", label: "En cours", count: summary?.pendingRefund ?? 0 },
    { value: "refunded", label: "Remboursées", count: summary?.refunded ?? 0 },
  ];

  function exportCSV() {
    if (filtered.length === 0) return;
    const headers = ["Date", "Type", "Produit", "Acheteur", "Email", "Vendeur", "Montant", "Commission", "Net", "Statut"];
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
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
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
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1920px] mx-auto">
        <header className="mb-12">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Financial Ledger
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">Transactions</h1>
          <p className="text-sm text-zinc-500 mt-3">{isLoading ? "Chargement…" : `${summary?.total ?? 0} transactions enregistrées`}</p>
        </header>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-100 mb-10 border border-zinc-100">
          <div className="bg-white p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Revenus totaux</p>
            <p className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-900 tabular-nums break-all">
              {isLoading ? "…" : formatFCFA(summary?.totalRevenue ?? 0)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">FCFA · Toutes transactions</p>
          </div>
          <div className="bg-white p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Commission (10%)</p>
            <p className="text-xl md:text-2xl font-extrabold tracking-tight text-amber-600 tabular-nums break-all">
              {isLoading ? "…" : formatFCFA(summary?.totalCommission ?? 0)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">FCFA · Prélevés</p>
          </div>
          <div className="bg-[#22c55e] p-8 text-[#004b1e]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-4">Versé aux vendeurs (90%)</p>
            <p className="text-xl md:text-2xl font-extrabold tracking-tight tabular-nums break-all">
              {isLoading ? "…" : formatFCFA(summary?.totalNetPaid ?? 0)}
            </p>
            <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest">FCFA · Créateurs</p>
          </div>
        </div>

        {/* Filters row 1 : search + status */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
            <input
              type="text"
              placeholder="Rechercher par acheteur, vendeur, produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-zinc-100 focus:border-[#22c55e] py-4 pl-12 pr-6 text-sm placeholder:text-zinc-400 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-0 flex-wrap border border-zinc-100 bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`flex items-center gap-2 px-5 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  status === tab.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab.label}
                <span className={`text-[9px] tabular-nums ${status === tab.value ? "text-[#22c55e]" : "text-zinc-400"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters row 2 : type + period + export */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-0 border border-zinc-100 bg-white">
            {([
              { v: "all", l: "Tout" },
              { v: "formation", l: "Formations" },
              { v: "product", l: "Produits" },
            ] as const).map((t) => (
              <button
                key={t.v}
                onClick={() => setType(t.v)}
                className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  type === t.v ? "bg-[#22c55e] text-[#004b1e]" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-wrap gap-0 border border-zinc-100 bg-white">
              {([
                { v: "all", l: "Tout" },
                { v: "7d", l: "7 j" },
                { v: "30d", l: "30 j" },
                { v: "90d", l: "90 j" },
              ] as const).map((p) => (
                <button
                  key={p.v}
                  onClick={() => { setPeriod(p.v); setCustomSince(""); }}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    period === p.v ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {p.l}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 bg-white border border-zinc-100 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Depuis</span>
              <input
                type="date"
                value={customSince}
                onChange={(e) => { setCustomSince(e.target.value); setPeriod(e.target.value ? "custom" : "all"); }}
                className="text-xs text-zinc-900 outline-none bg-transparent"
              />
            </label>
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-[#006e2f] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#005a26] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white">
          <div className="hidden md:grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_0.8fr] gap-6 px-8 py-4 border-b border-zinc-100">
            {["Acheteur", "Produit / Vendeur", "Montant", "Commission", "Net", "Statut"].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div className="p-8 space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#f3f3f4] animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-zinc-400">
                  {filtersActive && all.length > 0 ? "filter_alt_off" : "receipt_long"}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                {filtersActive && all.length > 0 ? "Aucun résultat" : "Aucune transaction"}
              </p>
              <p className="text-sm text-zinc-500 max-w-md">
                {filtersActive && all.length > 0
                  ? "Aucune transaction ne correspond à vos filtres."
                  : "Aucune transaction enregistrée pour le moment."}
              </p>
              {filtersActive && all.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#006e2f] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#005a26] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filtered.map((tx) => {
                const sc = STATUS_CONFIG[tx.status];
                const date = new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                return (
                  <div key={tx.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1fr_0.8fr] gap-6 px-8 py-5 items-center hover:bg-[#f3f3f4] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 truncate">{tx.buyerName}</p>
                      <p className="text-[10px] text-zinc-400 tabular-nums uppercase">{date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{tx.productTitle}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
                        par {tx.sellerName}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm font-extrabold tabular-nums ${tx.status === "refunded" ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                        {formatFCFA(tx.amount)}
                      </p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest">FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums text-amber-600">{formatFCFA(tx.commission)}</p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest">10%</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums text-[#006e2f]">{formatFCFA(tx.netAmount)}</p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest">90%</p>
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
