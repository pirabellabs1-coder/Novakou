"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/dashboard";
import { AnimatedCounter } from "@/components/ui/animated-counter";

// ============================================================
// Types
// ============================================================
interface PaymentMethod {
  id: string;
  type: "visa" | "orange_money" | "paypal" | "sepa" | "wave" | "mtn_momo";
  label: string;
  detail: string;
  icon: string;
  isDefault: boolean;
}

interface HistoryTransaction {
  id: string;
  date: string;
  type: "vente" | "retrait" | "commission" | "remboursement" | "bonus";
  description: string;
  amount: number;
  status: "complete" | "en_attente" | "echoue";
}

// ============================================================
// Demo data
// ============================================================
const DEMO_METHODS: PaymentMethod[] = [];

const DEMO_HISTORY: HistoryTransaction[] = [];

const ADD_METHOD_OPTIONS = [
  { id: "carte", label: "Carte bancaire", icon: "credit_card", description: "Visa, Mastercard" },
  { id: "orange", label: "Orange Money", icon: "phone_android", description: "Afrique francophone" },
  { id: "wave", label: "Wave", icon: "waves", description: "Senegal, Cote d'Ivoire" },
  { id: "mtn", label: "MTN MoMo", icon: "phone_android", description: "Mobile Money MTN" },
  { id: "paypal", label: "PayPal", icon: "account_balance", description: "International" },
  { id: "sepa", label: "Virement SEPA", icon: "account_balance", description: "Europe" },
];

// ============================================================
// Config maps
// ============================================================
const TX_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  vente: { icon: "payments", color: "text-emerald-400 bg-emerald-500/10" },
  retrait: { icon: "arrow_upward", color: "text-blue-400 bg-blue-500/10" },
  commission: { icon: "percent", color: "text-amber-400 bg-amber-500/10" },
  remboursement: { icon: "undo", color: "text-orange-400 bg-orange-500/10" },
  bonus: { icon: "star", color: "text-purple-400 bg-purple-500/10" },
};

const TX_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  complete: { label: "Complete", color: "text-emerald-400 bg-emerald-500/10" },
  en_attente: { label: "En attente", color: "text-amber-400 bg-amber-500/10" },
  echoue: { label: "Echoue", color: "text-red-400 bg-red-500/10" },
};

const METHOD_TYPE_ICONS: Record<string, string> = {
  visa: "credit_card",
  orange_money: "phone_android",
  paypal: "account_balance",
  sepa: "account_balance",
  wave: "waves",
  mtn_momo: "phone_android",
};

// ============================================================
// Component
// ============================================================
export default function PaiementsPage() {
  const addToast = useToastStore((s) => s.addToast);

  // State
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethodId, setWithdrawMethodId] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Balances
  const balanceAvailable = 0;
  const balancePending = 0;
  const balanceTotal = 0;

  // Handlers
  function handleSetDefault(id: string) {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    );
    const method = methods.find((m) => m.id === id);
    addToast("success", `${method?.label} definie comme methode par defaut`);
  }

  function handleRemoveMethod(id: string) {
    const method = methods.find((m) => m.id === id);
    if (method?.isDefault) {
      addToast("error", "Impossible de supprimer la methode par defaut");
      return;
    }
    setMethods((prev) => prev.filter((m) => m.id !== id));
    addToast("success", `${method?.label} supprimee`);
  }

  function handleAddMethod(type: string) {
    const option = ADD_METHOD_OPTIONS.find((o) => o.id === type);
    if (!option) return;
    const newMethod: PaymentMethod = {
      id: "pm-" + Date.now(),
      type: type as PaymentMethod["type"],
      label: option.label,
      detail: "Configuration en attente...",
      icon: option.icon,
      isDefault: false,
    };
    setMethods((prev) => [...prev, newMethod]);
    setShowAddMethod(false);
    addToast("success", `${option.label} ajoutee avec succes`);
  }

  function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (amount <= 0 || amount > balanceAvailable) {
      addToast("error", "Montant invalide ou superieur au solde disponible");
      return;
    }
    const method = methods.find((m) => m.id === withdrawMethodId);
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setShowWithdraw(false);
      setWithdrawAmount("");
      addToast("success", `Retrait de €${amount.toLocaleString("fr-FR")} demande vers ${method?.label ?? "methode"}`);
    }, 1200);
  }

  function handleExportCSV() {
    const header = "Date,Type,Description,Montant,Statut";
    const rows = DEMO_HISTORY.map((tx) =>
      `${tx.date},${tx.type},"${tx.description}",${tx.amount},${tx.status}`
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

  return (
    <div className="max-w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Paiements & Portefeuille</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerez vos methodes de paiement et vos retraits.</p>
          </div>
        </div>
        <button
          onClick={() => setShowWithdraw(!showWithdraw)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
        >
          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
          Demander un retrait
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-background-dark/50 border-2 border-primary/30 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Solde disponible</p>
              <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
            </div>
            <AnimatedCounter value={balanceAvailable} prefix="€" className="text-4xl font-extrabold block" />
            <p className="text-xs text-slate-500 mt-2">Pret a retirer</p>
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">En attente</p>
            <span className="material-symbols-outlined text-amber-400">schedule</span>
          </div>
          <AnimatedCounter value={balancePending} prefix="€" className="text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">En cours de traitement</p>
        </div>

        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total gagne</p>
            <span className="material-symbols-outlined text-emerald-400">trending_up</span>
          </div>
          <AnimatedCounter value={balanceTotal} prefix="€" className="text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">Depuis le debut</p>
        </div>
      </div>

      {/* Withdrawal Form */}
      {showWithdraw && (
        <div className="bg-white dark:bg-background-dark/50 border-2 border-primary/30 rounded-xl p-6 space-y-5 animate-scale-in">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            Demande de retrait
          </h3>

          <div>
            <label className="block text-sm font-semibold mb-2">Montant (€)</label>
            <input
              type="number"
              min={1}
              max={balanceAvailable}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Max: €${balanceAvailable.toLocaleString("fr-FR")}`}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Methode de retrait</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setWithdrawMethodId(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-semibold transition-all",
                    withdrawMethodId === m.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 dark:border-border-dark text-slate-500 dark:text-slate-400 hover:border-primary/30"
                  )}
                >
                  <span className="material-symbols-outlined text-lg">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all"
            >
              {withdrawing && (
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              )}
              {withdrawing ? "Traitement..." : "Confirmer le retrait"}
            </button>
            <button
              onClick={() => setShowWithdraw(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark flex justify-between items-center">
          <h3 className="font-bold text-lg">Methodes de paiement</h3>
          <button
            onClick={() => setShowAddMethod(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-border-dark rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Ajouter une methode
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-border-dark">
          {methods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl text-slate-400">credit_card_off</span>
              </div>
              <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">Aucune methode de paiement</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ajoutez une methode de paiement pour pouvoir effectuer des retraits.</p>
            </div>
          ) : (
            methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  method.type === "visa" ? "bg-blue-500/10 text-blue-400" :
                  method.type === "orange_money" ? "bg-orange-500/10 text-orange-400" :
                  method.type === "paypal" ? "bg-indigo-500/10 text-indigo-400" :
                  method.type === "sepa" ? "bg-emerald-500/10 text-emerald-400" :
                  method.type === "wave" ? "bg-cyan-500/10 text-cyan-400" :
                  "bg-amber-500/10 text-amber-400"
                )}>
                  <span className="material-symbols-outlined text-xl">{METHOD_TYPE_ICONS[method.type] ?? method.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{method.label}</p>
                    {method.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                        Par defaut
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{method.detail}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      title="Definir par defaut"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">star</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMethod(method.id)}
                    title="Supprimer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark flex justify-between items-center">
          <h3 className="font-bold text-lg">Historique des transactions</h3>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-border-dark rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-border-dark">
          {DEMO_HISTORY.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl text-slate-400">receipt_long</span>
              </div>
              <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">Aucune transaction</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vos transactions apparaitront ici une fois que vous aurez effectue des ventes ou des retraits.</p>
            </div>
          ) : (
            DEMO_HISTORY.map((tx) => {
              const typeConf = TX_TYPE_CONFIG[tx.type] ?? TX_TYPE_CONFIG.vente;
              const statusConf = TX_STATUS_CONFIG[tx.status];
              return (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", typeConf.color)}>
                    <span className="material-symbols-outlined">{typeConf.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(tx.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full shrink-0", statusConf?.color)}>
                    {statusConf?.label}
                  </span>
                  <p className={cn(
                    "text-sm font-bold w-24 text-right shrink-0",
                    tx.amount >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  )}>
                    {tx.amount >= 0 ? "+" : ""}€{Math.abs(tx.amount).toLocaleString("fr-FR")}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddMethod(false)} />
          <div className="relative bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Ajouter une methode de paiement</h3>
              <button
                onClick={() => setShowAddMethod(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ADD_METHOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAddMethod(option.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-primary/10 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-xl">{option.icon}</span>
                  </div>
                  <span className="text-sm font-bold">{option.label}</span>
                  <span className="text-[10px] text-slate-500">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
