"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

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
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{ data: Txn[]; summary: Summary | null }>({
    queryKey: ["admin-transactions"],
    queryFn: () => fetch("/api/formations/admin/transactions").then((r) => r.json()),
    staleTime: 15_000,
  });

  const all = response?.data ?? [];
  const summary = response?.summary;

  const filtered = useMemo(() => {
    return all.filter((t) => {
      const matchStatus = status === "all" || t.status === status;
      const q = search.toLowerCase();
      const matchSearch = !q || t.buyerName.toLowerCase().includes(q) || t.sellerName.toLowerCase().includes(q) || t.productTitle.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [all, status, search]);

  const tabs = [
    { value: "all", label: "Toutes", count: summary?.total ?? 0 },
    { value: "completed", label: "Complétées", count: summary?.completed ?? 0 },
    { value: "pending_refund", label: "En cours", count: summary?.pendingRefund ?? 0 },
    { value: "refunded", label: "Remboursées", count: summary?.refunded ?? 0 },
  ];

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
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Commission (5%)</p>
            <p className="text-xl md:text-2xl font-extrabold tracking-tight text-amber-600 tabular-nums break-all">
              {isLoading ? "…" : formatFCFA(summary?.totalCommission ?? 0)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">FCFA · Prélevés</p>
          </div>
          <div className="bg-[#22c55e] p-8 text-[#004b1e]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-4">Versé aux vendeurs (95%)</p>
            <p className="text-xl md:text-2xl font-extrabold tracking-tight tabular-nums break-all">
              {isLoading ? "…" : formatFCFA(summary?.totalNetPaid ?? 0)}
            </p>
            <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest">FCFA · Créateurs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
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
            <div className="py-24 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucune transaction</p>
              <p className="text-sm text-zinc-500">Aucune transaction ne correspond aux filtres.</p>
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
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest">5%</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums text-[#006e2f]">{formatFCFA(tx.netAmount)}</p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest">95%</p>
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
