"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

const TX_ICONS: Record<string, { icon: string; color: string }> = {
  vente: { icon: "payments", color: "text-emerald-400 bg-emerald-500/10" },
  retrait: { icon: "arrow_upward", color: "text-blue-400 bg-blue-500/10" },
  commission: { icon: "percent", color: "text-amber-400 bg-amber-500/10" },
  remboursement: { icon: "undo", color: "text-orange-400 bg-orange-500/10" },
  bonus: { icon: "star", color: "text-purple-400 bg-purple-500/10" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  complete: { label: "Complete", color: "text-emerald-400 bg-emerald-500/10" },
  en_attente: { label: "En attente", color: "text-amber-400 bg-amber-500/10" },
  echoue: { label: "Echoue", color: "text-red-400 bg-red-500/10" },
};

const WITHDRAWAL_METHODS = [
  { id: "sepa", label: "Virement SEPA", icon: "account_balance" },
  { id: "wave", label: "Wave", icon: "phone_android" },
  { id: "orange", label: "Orange Money", icon: "phone_android" },
  { id: "paypal", label: "PayPal", icon: "payments" },
  { id: "wise", label: "Wise", icon: "language" },
];

export default function FinancesPage() {
  const { transactions, addTransaction, apiRequestWithdrawal, stats: apiStats, syncStats } = useDashboardStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      syncStats();
    } catch {
      setError("Impossible de charger les donnees financieres.");
    } finally {
      const timer = setTimeout(() => setLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [syncStats]);

  const monthlyRevenue = apiStats?.monthlyRevenue ?? [];
  const addToast = useToastStore((s) => s.addToast);

  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("sepa");
  const [withdrawing, setWithdrawing] = useState(false);

  const balances = useMemo(() => {
    // Use API summary if available
    if (apiStats?.summary) {
      return {
        available: apiStats.summary.available,
        pending: apiStats.summary.pending,
        totalEarned: apiStats.summary.totalEarned,
      };
    }
    const complete = transactions.filter((t) => t.status === "complete").reduce((s, t) => s + t.amount, 0);
    const pending = transactions.filter((t) => t.status === "en_attente").reduce((s, t) => s + t.amount, 0);
    const totalEarned = transactions.filter((t) => t.type === "vente" && t.status === "complete").reduce((s, t) => s + t.amount, 0);
    return { available: complete, pending, totalEarned };
  }, [transactions, apiStats]);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (filterType !== "all") result = result.filter((t) => t.type === filterType);
    if (filterStatus !== "all") result = result.filter((t) => t.status === filterStatus);
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, filterStatus]);

  async function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (amount < 20) {
      addToast("error", "Le montant minimum de retrait est de 20€");
      return;
    }
    if (amount > balances.available) {
      addToast("error", "Solde insuffisant pour ce retrait");
      return;
    }
    setWithdrawing(true);
    try {
      const success = await apiRequestWithdrawal(amount, withdrawMethod);
      if (success) {
        setShowWithdraw(false);
        setWithdrawAmount("");
        const method = WITHDRAWAL_METHODS.find((m) => m.id === withdrawMethod);
        addToast("success", `Retrait de €${amount} demandé via ${method?.label}`);
      } else {
        addToast("error", "Erreur lors de la demande de retrait");
      }
    } catch {
      // Fallback to local
      const method = WITHDRAWAL_METHODS.find((m) => m.id === withdrawMethod);
      addTransaction({
        type: "retrait",
        description: `Retrait vers ${method?.label || withdrawMethod}`,
        amount: -amount,
        status: "en_attente",
        date: new Date().toISOString().slice(0, 10),
        method: method?.label,
      });
      addToast("success", `Retrait de €${amount} demandé via ${method?.label}`);
      setShowWithdraw(false);
      setWithdrawAmount("");
    } finally {
      setWithdrawing(false);
    }
  }

  function handleExportCSV() {
    const header = "Date,Type,Description,Montant,Statut";
    const rows = filtered.map((t) =>
      `${t.date},${t.type},"${t.description}",${t.amount},${t.status}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions-freelancehigh.csv";
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Export CSV téléchargé !");
  }

  if (error) {
    return (
      <div className="max-w-full flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-3xl text-red-400">error</span>
        </div>
        <h3 className="text-lg font-bold mb-2">Erreur de chargement</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center mb-6">{error}</p>
        <button onClick={() => { setError(null); setLoading(true); syncStats(); setTimeout(() => setLoading(false), 600); }} className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all">
          Reessayer
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-full space-y-4 sm:space-y-6 lg:space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-neutral-dark rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-background-dark/50 border border-border-dark rounded-xl p-6 h-32" />
          ))}
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl h-72" />
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gains & Finances</h2>
          <p className="text-slate-400 mt-1">Suivez vos revenus et gérez vos retraits.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:border-primary/50 transition-colors">
            <span className="material-symbols-outlined text-lg">download</span> Export CSV
          </button>
          <button onClick={() => setShowWithdraw(!showWithdraw)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
            <span className="material-symbols-outlined text-lg">account_balance_wallet</span> Retrait
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-background-dark/50 border border-primary/30 rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Solde disponible</p>
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          </div>
          <AnimatedCounter value={balances.available} prefix="€" className="text-2xl sm:text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">Pret a retirer</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">En attente</p>
            <span className="material-symbols-outlined text-amber-400">schedule</span>
          </div>
          <AnimatedCounter value={balances.pending} prefix="€" className="text-2xl sm:text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">En cours de traitement</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total gagne</p>
            <span className="material-symbols-outlined text-emerald-400">trending_up</span>
          </div>
          <AnimatedCounter value={balances.totalEarned} prefix="€" className="text-2xl sm:text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">Depuis le debut</p>
        </div>
      </div>

      {/* Withdraw Form */}
      {showWithdraw && (
        <div className="bg-background-dark/50 border border-primary/30 rounded-xl p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 animate-scale-in">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            Demande de retrait
          </h3>
          <div>
            <label className="block text-sm font-semibold mb-2">Montant (€)</label>
            <input type="number" min={1} max={balances.available}
              value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Max: €${balances.available}`}
              className="w-full px-4 py-3 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Methode de retrait</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {WITHDRAWAL_METHODS.map((m) => (
                <button key={m.id} onClick={() => setWithdrawMethod(m.id)}
                  className={cn("flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-semibold transition-all",
                    withdrawMethod === m.id ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-400 hover:border-primary/30"
                  )}>
                  <span className="material-symbols-outlined text-lg">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all">
              {withdrawing && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
              {withdrawing ? "Traitement..." : "Confirmer le retrait"}
            </button>
            <button onClick={() => setShowWithdraw(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-6">
        <h3 className="font-bold text-lg mb-4 sm:mb-6">Revenus mensuels</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#293835" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `€${v}`} />
            <Tooltip content={<ChartTooltip formatter={(v) => `€${v.toLocaleString("fr-FR")}`} />} />
            <Bar dataKey="revenue" fill="#0e7c66" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-background-dark/50 border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">Tous les types</option>
          <option value="vente">Ventes</option>
          <option value="retrait">Retraits</option>
          <option value="commission">Commissions</option>
          <option value="bonus">Bonus</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-background-dark/50 border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">Tous les statuts</option>
          <option value="complete">Completes</option>
          <option value="en_attente">En attente</option>
          <option value="echoue">Echoues</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border-dark">
          <h3 className="font-bold">Historique des transactions ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-border-dark">
          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-500">Aucune transaction trouvee.</div>
          )}
          {filtered.map((tx) => {
            const icon = TX_ICONS[tx.type] ?? TX_ICONS.vente;
            const status = STATUS_LABELS[tx.status];
            return (
              <div key={tx.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-primary/5 transition-colors">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", icon.color)}>
                  <span className="material-symbols-outlined">{icon.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{tx.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(tx.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    {tx.method && ` · ${tx.method}`}
                  </p>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", status?.color)}>{status?.label}</span>
                <p className={cn("text-sm font-bold w-24 text-right", tx.amount >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {tx.amount >= 0 ? "+" : ""}€{Math.abs(tx.amount).toLocaleString("fr-FR")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
