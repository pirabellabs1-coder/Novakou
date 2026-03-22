"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useToastStore } from "@/store/toast";
import { useAdminStore } from "@/store/admin";
import { cn } from "@/lib/utils";

const TYPE_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  paiement: { label: "Paiement", cls: "text-emerald-400", icon: "payments" },
  commission: { label: "Commission", cls: "text-blue-400", icon: "account_balance" },
  retrait: { label: "Retrait", cls: "text-orange-400", icon: "account_balance_wallet" },
  remboursement: { label: "Remboursement", cls: "text-red-400", icon: "undo" },
  abonnement: { label: "Abonnement", cls: "text-purple-400", icon: "card_membership" },
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  complete: { label: "Complété", cls: "bg-emerald-500/20 text-emerald-400" },
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400" },
  echoue: { label: "Échoué", cls: "bg-red-500/20 text-red-400" },
  bloque: { label: "Bloqué", cls: "bg-red-500/20 text-red-400" },
};

function StatCardSkeleton() {
  return (
    <div className="bg-neutral-dark rounded-xl p-5 border border-border-dark animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-border-dark mb-3" />
      <div className="h-7 w-24 bg-border-dark rounded mb-2" />
      <div className="h-3 w-20 bg-border-dark rounded mb-1" />
      <div className="h-2.5 w-28 bg-border-dark rounded" />
    </div>
  );
}

function SmallStatSkeleton() {
  return (
    <div className="bg-neutral-dark rounded-xl p-4 border border-border-dark animate-pulse">
      <div className="h-4 w-16 bg-border-dark rounded mb-2" />
      <div className="h-2.5 w-24 bg-border-dark rounded" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b border-border-dark/50">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 bg-border-dark rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function AdminFinances() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const {
    transactions,
    financeSummary,
    loading,
    syncFinances,
    blockTransaction,
    unblockTransaction,
    approveTransaction,
    refreshInterval,
    lastRefreshedAt,
  } = useAdminStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleManualRefresh = useCallback(() => {
    syncFinances();
  }, [syncFinances]);

  useEffect(() => {
    syncFinances();
  }, [syncFinances]);

  // Auto-refresh every refreshInterval ms (default 30s)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      syncFinances();
    }, refreshInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [syncFinances, refreshInterval]);

  const isLoading = loading.finances;

  const filteredTransactions = useMemo(() => {
    let list = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (typeFilter) list = list.filter(t => t.type === typeFilter);
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    return list.map(t => ({
      ...t,
      displayAmount: t.type === "retrait" || t.type === "remboursement" ? -t.amount : t.amount,
    }));
  }, [transactions, typeFilter, statusFilter]);

  async function handleBlock(id: string) {
    setActionLoading(id);
    const ok = await blockTransaction(id);
    setActionLoading(null);
    if (ok) {
      addToast("success", `Transaction ${id} bloquée`);
    } else {
      addToast("warning", "Erreur lors du blocage");
    }
  }

  async function handleUnblock(id: string) {
    setActionLoading(id);
    const ok = await unblockTransaction(id);
    setActionLoading(null);
    if (ok) {
      addToast("success", `Transaction ${id} débloquée`);
    } else {
      addToast("warning", "Erreur lors du déblocage");
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    const ok = await approveTransaction(id);
    setActionLoading(null);
    if (ok) {
      addToast("success", `Transaction ${id} approuvée`);
    } else {
      addToast("warning", "Erreur lors de l'approbation");
    }
  }

  // Use financeSummary or fallback to defaults
  const platformRevenue = financeSummary?.platformRevenue ?? 0;
  const escrowFunds = financeSummary?.escrowFunds ?? 0;
  const pendingWithdrawals = financeSummary?.pendingWithdrawals ?? 0;
  const subscriptionRevenue = financeSummary?.byType?.abonnement ?? 0;
  const totalPayments = financeSummary?.totalPayments ?? 0;
  const totalRefunded = financeSummary?.totalRefunded ?? 0;
  const blockedCount = transactions.filter(t => t.status === "bloque").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">payments</span>
            Finances
          </h1>
          <p className="text-slate-400 text-sm mt-1">Suivi des transactions et revenus de la plateforme.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={loading.finances}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-primary/10 border border-border-dark transition-colors disabled:opacity-50"
            title="Actualiser les données"
          >
            <span className={cn("material-symbols-outlined text-sm", loading.finances && "animate-spin")}>refresh</span>
            Actualiser
          </button>
          {lastRefreshedAt.finances && (
            <span className="text-[10px] text-slate-600 hidden sm:block">
              MAJ {new Date(lastRefreshedAt.finances).toLocaleTimeString("fr-FR")}
            </span>
          )}
          <button onClick={() => addToast("success", "Rapport financier exporté (CSV)")} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            Exporter
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          [
            { label: "Revenus plateforme", value: `${platformRevenue.toLocaleString()} €`, icon: "trending_up", color: "text-emerald-400", bgIcon: "bg-emerald-500/20", sub: "Commissions cumulées" },
            { label: "Fonds en escrow", value: `${escrowFunds.toLocaleString()} €`, icon: "lock", color: "text-blue-400", bgIcon: "bg-blue-500/20", sub: "En attente de libération" },
            { label: "Retraits en attente", value: `${pendingWithdrawals.toLocaleString()} €`, icon: "hourglass_top", color: "text-amber-400", bgIcon: "bg-amber-500/20", sub: "À traiter" },
            { label: "Abonnements", value: `${subscriptionRevenue.toLocaleString()} €`, icon: "card_membership", color: "text-purple-400", bgIcon: "bg-purple-500/20", sub: "Revenus récurrents" },
          ].map(s => (
            <div key={s.label} className="bg-neutral-dark rounded-xl p-5 border border-border-dark">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", s.bgIcon)}>
                <span className={cn("material-symbols-outlined", s.color)}>{s.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{s.sub}</p>
            </div>
          ))
        )}
      </div>

      {/* Extra metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SmallStatSkeleton key={i} />)
        ) : (
          <>
            <div className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
              <p className="text-sm font-bold text-white">&euro;{totalPayments.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Total paiements</p>
            </div>
            <div className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
              <p className="text-sm font-bold text-red-400">&euro;{totalRefunded.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Remboursements</p>
            </div>
            <div className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
              <p className="text-sm font-bold text-white">{transactions.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Total transactions</p>
            </div>
            <div className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
              <p className="text-sm font-bold text-white">{blockedCount}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Bloquées</p>
            </div>
          </>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border-dark bg-neutral-dark text-sm text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary/30">
          <option value="">Tous les types</option>
          <option value="paiement">Paiement</option>
          <option value="commission">Commission</option>
          <option value="retrait">Retrait</option>
          <option value="remboursement">Remboursement</option>
          <option value="abonnement">Abonnement</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border-dark bg-neutral-dark text-sm text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary/30">
          <option value="">Tous les statuts</option>
          <option value="complete">Complété</option>
          <option value="en_attente">En attente</option>
          <option value="bloque">Bloqué</option>
          <option value="echoue">Échoué</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="p-5 border-b border-border-dark flex items-center justify-between">
          <h2 className="font-bold text-white">Transactions ({filteredTransactions.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dark">
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">ID</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Description</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Utilisateur</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Type</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Méthode</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Date</th>
                <th className="px-5 py-3 text-right text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Montant</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Statut</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-slate-500">{t.id}</td>
                    <td className="px-5 py-3 text-sm text-white max-w-[200px] truncate">{t.description || `${t.type} ${t.orderId || ""}`}</td>
                    <td className="px-5 py-3 text-sm text-slate-300">{t.userId}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs font-semibold flex items-center gap-1", TYPE_MAP[t.type]?.cls)}>
                        <span className="material-symbols-outlined text-sm">{TYPE_MAP[t.type]?.icon}</span>
                        {TYPE_MAP[t.type]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{t.method ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">{new Date(t.date).toLocaleDateString("fr-FR")}</td>
                    <td className={cn("px-5 py-3 text-sm font-bold text-right", t.displayAmount > 0 ? "text-emerald-400" : "text-red-400")}>
                      {t.displayAmount > 0 ? "+" : ""}&euro;{Math.abs(t.displayAmount).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_MAP[t.status]?.cls)}>
                        {STATUS_MAP[t.status]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1">
                        {t.status === "en_attente" && (
                          <>
                            <button
                              onClick={() => handleApprove(t.id)}
                              disabled={actionLoading === t.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                              title="Approuver"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            </button>
                            <button
                              onClick={() => handleBlock(t.id)}
                              disabled={actionLoading === t.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title="Bloquer"
                            >
                              <span className="material-symbols-outlined text-lg">block</span>
                            </button>
                          </>
                        )}
                        {t.status === "bloque" && (
                          <button
                            onClick={() => handleUnblock(t.id)}
                            disabled={actionLoading === t.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                            title="Débloquer"
                          >
                            <span className="material-symbols-outlined text-lg">lock_open</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-slate-600">inbox</span>
            <p className="text-slate-500 mt-2">Aucune transaction trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
