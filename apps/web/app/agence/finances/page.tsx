"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/dashboard";

// ── Constants ──

const WITHDRAWAL_METHODS: { id: string; label: string; icon: string }[] = [
  { id: "sepa", label: "Virement SEPA", icon: "account_balance" },
  { id: "paypal", label: "PayPal", icon: "payments" },
  { id: "wave", label: "Wave", icon: "phone_android" },
  { id: "orange", label: "Orange Money", icon: "phone_android" },
  { id: "mtn", label: "MTN", icon: "phone_android" },
];

const TX_TYPE_META: Record<string, { icon: string; color: string }> = {
  vente: { icon: "payments", color: "text-emerald-400 bg-emerald-500/10" },
  retrait: { icon: "arrow_upward", color: "text-blue-400 bg-blue-500/10" },
  commission: { icon: "percent", color: "text-amber-400 bg-amber-500/10" },
  remboursement: { icon: "undo", color: "text-orange-400 bg-orange-500/10" },
  bonus: { icon: "star", color: "text-purple-400 bg-purple-500/10" },
};

const TX_STATUS_META: Record<string, { label: string; cls: string }> = {
  complete: { label: "Complete", cls: "bg-emerald-500/20 text-emerald-400" },
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400" },
  echoue: { label: "Echoue", cls: "bg-red-500/20 text-red-400" },
};

const MIN_WITHDRAWAL = 20;
const COMMISSION_RATE = 0.1;

// ── Helpers ──

function fmtEur(value: number | null | undefined): string {
  return `${(value ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00A0\u20AC`;
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Component ──

export default function AgenceFinances() {
  const {
    financeSummary,
    transactions,
    stats,
    isLoading,
    syncFinances,
    syncStats,
    requestWithdrawal,
  } = useAgencyStore();

  const { addToast } = useToastStore();

  // Modal state
  const [showRetrait, setShowRetrait] = useState(false);
  const [retraitAmount, setRetraitAmount] = useState("");
  const [retraitMethod, setRetraitMethod] = useState(WITHDRAWAL_METHODS[0].id);
  const [submitting, setSubmitting] = useState(false);

  // Sync on mount
  useEffect(() => {
    syncFinances();
    syncStats();
  }, [syncFinances, syncStats]);

  // Derived data
  const monthlyRevenue = stats?.monthlyRevenue ?? [];

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  );

  // ── Withdrawal handler ──

  const handleWithdrawal = useCallback(async () => {
    const amount = Number(retraitAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      addToast("error", `Le montant minimum de retrait est de ${MIN_WITHDRAWAL}\u00A0\u20AC`);
      return;
    }
    const available = financeSummary?.available ?? 0;
    if (amount > available) {
      addToast("error", "Solde insuffisant pour ce retrait");
      return;
    }

    setSubmitting(true);
    try {
      const method = WITHDRAWAL_METHODS.find((m) => m.id === retraitMethod);
      const success = await requestWithdrawal(amount, retraitMethod);
      if (success) {
        addToast("success", `Retrait de ${fmtEur(amount)} demande via ${method?.label ?? retraitMethod}`);
        setShowRetrait(false);
        setRetraitAmount("");
      } else {
        addToast("error", "Erreur lors de la demande de retrait");
      }
    } catch {
      addToast("error", "Erreur lors de la demande de retrait");
    } finally {
      setSubmitting(false);
    }
  }, [retraitAmount, retraitMethod, financeSummary, requestWithdrawal, addToast]);

  // ── CSV export ──

  const handleExportCSV = useCallback(() => {
    if (sortedTransactions.length === 0) {
      addToast("info", "Aucune transaction a exporter");
      return;
    }
    const header = "Date,Type,Description,Montant,Commission (10%),Net,Statut";
    const rows = sortedTransactions.map((t) => {
      const commission = Math.abs(t.amount) * COMMISSION_RATE;
      const net = Math.abs(t.amount) - commission;
      return `${t.date},${t.type},"${t.description}",${t.amount},${commission.toFixed(2)},${net.toFixed(2)},${t.status}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-agence-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Export CSV téléchargé");
  }, [sortedTransactions, addToast]);

  // ── Metric cards ──

  const metrics = [
    {
      label: "Solde disponible",
      value: fmtEur(financeSummary?.available),
      icon: "account_balance_wallet",
      color: "text-emerald-400",
      borderColor: "border-emerald-500/30",
    },
    {
      label: "En attente",
      value: fmtEur(financeSummary?.pending),
      icon: "schedule",
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
    },
    {
      label: "CA total",
      value: fmtEur(financeSummary?.totalEarned),
      icon: "trending_up",
      color: "text-primary",
      borderColor: "border-primary/30",
    },
    {
      label: "Commission ce mois",
      value: fmtEur(financeSummary?.commissionThisMonth),
      icon: "percent",
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
    },
  ];

  // ── Loading skeleton ──

  if (isLoading && !financeSummary && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Finances</h1>
            <p className="text-slate-400 text-sm mt-1">Chargement des données financières...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-4 animate-pulse">
              <div className="h-6 bg-background-dark/50 rounded w-20 mb-2" />
              <div className="h-3 bg-background-dark/50 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse h-64" />
        <div className="bg-neutral-dark rounded-xl border border-border-dark animate-pulse h-48" />
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Finances</h1>
          <p className="text-slate-400 text-sm mt-1">Revenus, transactions et retraits de l&apos;agence.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-neutral-dark border border-border-dark text-sm font-semibold text-slate-300 rounded-xl hover:border-primary/50 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            CSV
          </button>
          <button
            onClick={() => setShowRetrait(true)}
            className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">account_balance</span>
            Retrait
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={cn(
              "bg-neutral-dark rounded-xl border p-4 flex items-center gap-3",
              m.borderColor,
            )}
          >
            <span className={cn("material-symbols-outlined text-xl", m.color)}>{m.icon}</span>
            <div>
              <p className="text-xl font-black text-white">{m.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue BarChart */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
        <h2 className="font-bold text-white mb-4">CA Mensuel (12 mois)</h2>
        {monthlyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyRevenue} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#293835" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}\u00A0\u20AC`}
              />
              <Tooltip content={<ChartTooltip formatter={(v) => fmtEur(v)} />} cursor={{ fill: "rgba(14,124,102,0.1)" }} />
              <Bar
                dataKey="revenue"
                fill="#0e7c66"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
            <p className="text-sm">Aucune donnée de revenus disponible</p>
          </div>
        )}
      </div>

      {/* Transaction History Table */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-border-dark flex items-center justify-between">
          <h2 className="font-bold text-white">
            Historique des transactions
            {sortedTransactions.length > 0 && (
              <span className="text-slate-500 font-normal text-sm ml-2">
                ({sortedTransactions.length})
              </span>
            )}
          </h2>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
            <p className="text-sm font-semibold">Aucune transaction</p>
            <p className="text-xs text-slate-600 mt-1">Les transactions apparaitront ici une fois les premieres commandes traitees.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                  <th className="px-5 py-3 text-left font-semibold">Type</th>
                  <th className="px-5 py-3 text-left font-semibold">Description</th>
                  <th className="px-5 py-3 text-right font-semibold">Montant</th>
                  <th className="px-5 py-3 text-right font-semibold">Commission (10%)</th>
                  <th className="px-5 py-3 text-right font-semibold">Net</th>
                  <th className="px-5 py-3 text-left font-semibold">Date</th>
                  <th className="px-5 py-3 text-left font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((tx) => {
                  const typeMeta = TX_TYPE_META[tx.type] ?? TX_TYPE_META.vente;
                  const statusMeta = TX_STATUS_META[tx.status];
                  const absAmount = Math.abs(tx.amount);
                  const commission = absAmount * COMMISSION_RATE;
                  const net = absAmount - commission;

                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors"
                    >
                      {/* Type */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm", typeMeta.color)}>
                            <span className="material-symbols-outlined text-base">{typeMeta.icon}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-300 capitalize">{tx.type}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3">
                        <p className="text-sm text-white truncate max-w-[200px]">{tx.description}</p>
                        {tx.method && (
                          <p className="text-xs text-slate-500 mt-0.5">{tx.method}</p>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="px-5 py-3 text-right">
                        <span className={cn("text-sm font-bold", tx.amount >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {tx.amount >= 0 ? "+" : "-"}{fmtEur(absAmount)}
                        </span>
                      </td>

                      {/* Commission */}
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm text-amber-400">{fmtEur(commission)}</span>
                      </td>

                      {/* Net */}
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-semibold text-white">{fmtEur(net)}</span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3">
                        <span className="text-sm text-slate-400">{fmtDate(tx.date)}</span>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                            statusMeta?.cls ?? "bg-slate-500/20 text-slate-400",
                          )}
                        >
                          {statusMeta?.label ?? tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showRetrait && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setShowRetrait(false)}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance</span>
              Demande de retrait
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Solde disponible : {fmtEur(financeSummary?.available)}
            </p>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Montant (min {MIN_WITHDRAWAL}\u00A0\u20AC)
                </label>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL}
                  step="0.01"
                  placeholder="0.00"
                  value={retraitAmount}
                  onChange={(e) => setRetraitAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Methode de retrait
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {WITHDRAWAL_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setRetraitMethod(m.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all",
                        retraitMethod === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border-dark text-slate-400 hover:border-primary/30",
                      )}
                    >
                      <span className="material-symbols-outlined text-base">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRetrait(false); setRetraitAmount(""); }}
                  disabled={submitting}
                  className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={submitting || !retraitAmount}
                  className="flex-1 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  )}
                  {submitting ? "Traitement..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
