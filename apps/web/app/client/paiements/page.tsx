"use client";

import { useEffect, useState } from "react";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "FCFA", symbol: "FCFA", label: "Franc CFA" },
  { code: "EUR", symbol: "EUR", label: "Euro" },
  { code: "USD", symbol: "$", label: "US Dollar" },
];

const PAYMENT_METHODS = [
  { id: "mobile", icon: "smartphone", label: "Mobile Money", description: "Orange Money, MTN MoMo, Wave (Sénégal, Côte d'Ivoire...)", active: true },
  { id: "card", icon: "credit_card", label: "Carte Bancaire", description: "Visa, Mastercard, American Express via Stripe", active: false },
  { id: "bank", icon: "account_balance", label: "Virement Bancaire", description: "SEPA, virement international", active: false },
];

const SAVED_METHODS: { id: string; type: string; icon: string; label: string; detail: string; default: boolean }[] = [];

const TX_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: { label: "Complété", cls: "bg-primary/20 text-primary" },
  complete: { label: "Complété", cls: "bg-primary/20 text-primary" },
  pending: { label: "En attente", cls: "bg-amber-500/20 text-amber-400" },
  refund: { label: "Remboursé", cls: "bg-red-500/20 text-red-400" },
  failed: { label: "Échoué", cls: "bg-red-500/20 text-red-400" },
};

function SkeletonCard() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-border-dark" />
        <div className="h-3 w-28 bg-border-dark rounded" />
      </div>
      <div className="h-7 w-32 bg-border-dark rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="px-5 py-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-border-dark" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 bg-border-dark rounded" />
        <div className="h-2 w-28 bg-border-dark rounded" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-20 bg-border-dark rounded ml-auto" />
        <div className="h-4 w-16 bg-border-dark rounded-full ml-auto" />
      </div>
    </div>
  );
}

const DEPOSIT_METHODS = [
  { id: "card", icon: "credit_card", label: "Carte Bancaire", description: "Visa, Mastercard via Stripe — Instantané" },
  { id: "mobile", icon: "smartphone", label: "Mobile Money", description: "Orange Money, Wave, MTN MoMo" },
  { id: "bank", icon: "account_balance", label: "Virement Bancaire", description: "SEPA — 1 à 3 jours ouvrés" },
];

const DEPOSIT_PRESETS = [10, 25, 50, 100, 250, 500];

export default function ClientPayments() {
  const [currency, setCurrency] = useState("EUR");
  const [activeTab, setActiveTab] = useState<"overview" | "methods" | "invoices" | "deposit">("overview");
  const [selectedMethod, setSelectedMethod] = useState("mobile");
  const [depositMethod, setDepositMethod] = useState("card");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const { addToast } = useToastStore();

  const {
    transactions,
    financeSummary,
    loading,
    syncTransactions,
  } = useClientStore();

  useEffect(() => {
    syncTransactions();
  }, [syncTransactions]);

  const isLoading = loading.transactions;

  const totalSpent = financeSummary?.totalEarned ?? 0;
  const pending = financeSummary?.pending ?? 0;
  const credits = financeSummary?.commissionThisMonth ?? 0;

  const TABS = [
    { key: "overview", label: "Vue d\u2019ensemble", icon: "dashboard" },
    { key: "deposit", label: "Déposer des fonds", icon: "add_circle" },
    { key: "methods", label: "Méthodes de paiement", icon: "payments" },
    { key: "invoices", label: "Factures & Historique", icon: "receipt_long" },
  ] as const;

  function formatAmount(eur: number) {
    if (currency === "FCFA") return `${Math.round(eur * 655.957).toLocaleString("fr-FR")} FCFA`;
    if (currency === "USD") return `$${(eur * 1.08).toFixed(2)}`;
    return `${eur.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} \u20ac`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Paiements & Facturation</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos méthodes de paiement, consultez vos transactions et téléchargez vos factures.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Devise :</span>
          <div className="flex bg-neutral-dark rounded-lg border border-border-dark p-0.5">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  currency === c.code ? "bg-primary text-background-dark shadow" : "text-slate-400 hover:text-white"
                )}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total dépensé</p>
              </div>
              <p className="text-2xl font-black text-white">{formatAmount(totalSpent)}</p>
              {currency === "FCFA" && <p className="text-xs text-slate-500 mt-1">&asymp; {totalSpent.toFixed(2)} EUR</p>}
            </div>
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-400">schedule</span>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">En attente</p>
              </div>
              <p className="text-2xl font-black text-amber-400">{formatAmount(pending)}</p>
            </div>
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">redeem</span>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Crédits FreelanceHigh</p>
              </div>
              <p className="text-2xl font-black text-white">{formatAmount(credits)}</p>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-dark rounded-xl p-1 border border-border-dark">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center",
              activeTab === t.key ? "bg-primary text-background-dark shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Recent Transactions */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
            <div className="px-5 py-4 border-b border-border-dark flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">swap_vert</span>
                Transactions récentes
              </h2>
              <button onClick={() => setActiveTab("invoices")} className="text-sm text-primary font-semibold hover:underline">Tout voir</button>
            </div>
            <div className="divide-y divide-border-dark">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">receipt_long</span>
                  <p className="text-slate-500 text-sm font-semibold">Aucune transaction pour le moment</p>
                </div>
              ) : (
                transactions.slice(0, 4).map(tx => {
                  const methodIcon = tx.method === "mobile" ? "smartphone" : tx.method === "bank" ? "account_balance" : "credit_card";
                  const methodColor = tx.method === "mobile" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-400";
                  const statusInfo = TX_STATUS_MAP[tx.status] || TX_STATUS_MAP.pending;
                  return (
                    <div key={tx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-background-dark/30 transition-colors">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", methodColor.split(" ")[0])}>
                        <span className={cn("material-symbols-outlined", methodColor.split(" ")[1])}>{methodIcon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{tx.description}</p>
                        <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString("fr-FR")}{tx.method ? ` \u00b7 ${tx.method}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatAmount(tx.amount)}</p>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusInfo.cls)}>{statusInfo.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("methods")}
              className="bg-neutral-dark rounded-xl border border-border-dark p-5 text-left hover:border-primary/40 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">add_card</span>
              </div>
              <p className="font-bold text-white">Ajouter une méthode</p>
              <p className="text-xs text-slate-500 mt-1">Carte bancaire, Mobile Money ou virement</p>
            </button>
            <button
              onClick={() => addToast("success", "Rapport de dépenses en cours de génération...")}
              className="bg-neutral-dark rounded-xl border border-border-dark p-5 text-left hover:border-primary/40 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">download</span>
              </div>
              <p className="font-bold text-white">Exporter le rapport</p>
              <p className="text-xs text-slate-500 mt-1">Téléchargez vos dépenses en CSV ou PDF</p>
            </button>
          </div>

          {/* Exchange Rates */}
          <div className="bg-primary/5 rounded-xl border border-primary/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">currency_exchange</span>
              <p className="font-bold text-white text-sm">Taux de change</p>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">sync</span>
                Actualisé il y a 5 min
              </span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <span className="text-slate-400">1 EUR = <span className="text-white font-bold">655,96 FCFA</span></span>
              <span className="text-slate-400">1 EUR = <span className="text-white font-bold">1,08 USD</span></span>
              <span className="text-slate-400">1 EUR = <span className="text-white font-bold">0,85 GBP</span></span>
              <span className="text-slate-400">1 EUR = <span className="text-white font-bold">10,95 MAD</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === "deposit" && (
        <div className="space-y-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Solde actuel</p>
                <p className="text-3xl font-black text-white">{formatAmount(credits)}</p>
              </div>
            </div>
          </div>

          {/* Deposit form */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              Déposer des fonds
            </h2>

            {/* Amount input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Montant à déposer</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-4 bg-background-dark border border-border-dark rounded-xl text-2xl font-bold text-white placeholder:text-slate-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{currency}</span>
              </div>
              {/* Preset amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {DEPOSIT_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(String(amount))}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      depositAmount === String(amount)
                        ? "bg-primary text-background-dark shadow"
                        : "bg-background-dark border border-border-dark text-slate-400 hover:text-white hover:border-primary/30"
                    )}
                  >
                    {amount}€
                  </button>
                ))}
              </div>
            </div>

            {/* Method selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-3">Méthode de paiement</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEPOSIT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setDepositMethod(m.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      depositMethod === m.id
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border-dark bg-background-dark hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-lg">{m.icon}</span>
                      </div>
                      {depositMethod === m.id && (
                        <span className="material-symbols-outlined text-primary ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </div>
                    <p className="font-bold text-white text-sm">{m.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Deposit button */}
            <button
              disabled={!depositAmount || parseFloat(depositAmount) <= 0 || depositLoading}
              onClick={() => {
                setDepositLoading(true);
                // Simulate deposit
                setTimeout(() => {
                  setDepositLoading(false);
                  addToast("success", `Dépôt de ${formatAmount(parseFloat(depositAmount))} initié avec succès via ${DEPOSIT_METHODS.find(m => m.id === depositMethod)?.label}`);
                  setDepositAmount("");
                }, 1500);
              }}
              className="w-full bg-primary text-background-dark text-sm font-bold py-4 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {depositLoading ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  Traitement en cours...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Déposer {depositAmount ? formatAmount(parseFloat(depositAmount)) : "des fonds"}
                </>
              )}
            </button>

            {/* Info */}
            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
              <span className="material-symbols-outlined text-blue-400 text-lg flex-shrink-0">info</span>
              <p className="text-xs text-slate-400">
                Les fonds déposés seront disponibles immédiatement pour les paiements par carte.
                Les virements bancaires peuvent prendre 1 à 3 jours ouvrés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Methods Tab */}
      {activeTab === "methods" && (
        <div className="space-y-6">
          {/* Saved Methods */}
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">credit_card</span>
              Méthodes enregistrées
            </h2>
            <div className="space-y-3">
              {SAVED_METHODS.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">credit_card_off</span>
                  <p className="text-sm">Aucune méthode de paiement enregistrée.</p>
                  <p className="text-xs mt-1">Ajoutez une méthode ci-dessous pour commencer.</p>
                </div>
              ) : (
                SAVED_METHODS.map(m => (
                  <div key={m.id} className="flex items-center gap-4 p-4 bg-neutral-dark rounded-xl border border-border-dark hover:border-primary/30 transition-colors">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", m.type === "mobile" ? "bg-primary/10" : "bg-blue-500/10")}>
                      <span className={cn("material-symbols-outlined", m.type === "mobile" ? "text-primary" : "text-blue-400")}>{m.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{m.label}</p>
                      <p className="text-xs text-slate-500">{m.detail}</p>
                    </div>
                    {m.default && <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Par défaut</span>}
                    <button className="text-slate-500 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add New Method */}
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">add_card</span>
              Ajouter une méthode
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedMethod(pm.id)}
                  className={cn(
                    "p-5 rounded-xl border-2 text-left transition-all",
                    selectedMethod === pm.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border-dark bg-neutral-dark hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">{pm.icon}</span>
                    </div>
                    {selectedMethod === pm.id && (
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                  <p className="font-bold text-white text-sm">{pm.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{pm.description}</p>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="mt-4 bg-neutral-dark rounded-xl border border-border-dark p-5">
              <label className="block text-sm font-semibold text-white mb-2">
                {selectedMethod === "mobile" ? "Numéro de téléphone" : selectedMethod === "card" ? "Numéro de carte" : "IBAN"}
              </label>
              <input
                type="text"
                placeholder={selectedMethod === "mobile" ? "+221 77 123 45 67" : selectedMethod === "card" ? "4242 4242 4242 4242" : "SN08 SN0000000000000000000000"}
                className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex items-center gap-2 mt-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <span className="material-symbols-outlined text-blue-400 text-lg">verified_user</span>
                <p className="text-xs text-slate-400">Vos informations de paiement sont cryptées et sécurisées par protocole SSL/TLS.</p>
              </div>
              <button
                onClick={() => addToast("success", "Méthode de paiement ajoutée")}
                className="mt-4 px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
              >
                Enregistrer la méthode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              Historique des transactions
            </h2>
            <button
              onClick={() => {
                if (transactions.length === 0) {
                  addToast("info", "Aucune transaction à exporter");
                  return;
                }
                const headers = ["Référence", "Date", "Description", "Montant (EUR)", "Statut", "Méthode"];
                const rows = transactions.map(tx => [
                  tx.id,
                  new Date(tx.date).toLocaleDateString("fr-FR"),
                  tx.description,
                  tx.amount.toFixed(2),
                  TX_STATUS_MAP[tx.status]?.label || tx.status,
                  tx.method || "-",
                ]);
                const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                addToast("success", "Export CSV téléchargé");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm font-semibold text-white hover:bg-border-dark transition-colors"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Exporter CSV
            </button>
          </div>

          <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-border-dark">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">receipt_long</span>
                <p className="text-slate-500 font-semibold">Aucune transaction</p>
                <p className="text-slate-600 text-sm mt-1">Vos transactions apparaîtront ici après votre première commande.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                    <th className="px-5 py-3 text-left font-semibold">Référence</th>
                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                    <th className="px-5 py-3 text-left font-semibold">Description</th>
                    <th className="px-5 py-3 text-right font-semibold">Montant</th>
                    <th className="px-5 py-3 text-center font-semibold">Statut</th>
                    <th className="px-5 py-3 text-center font-semibold">Méthode</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const statusInfo = TX_STATUS_MAP[tx.status] || TX_STATUS_MAP.pending;
                    return (
                      <tr key={tx.id} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-mono text-primary font-semibold">{tx.id}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(tx.date).toLocaleDateString("fr-FR")}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-300">{tx.description}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-white text-right">{formatAmount(tx.amount)}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", statusInfo.cls)}>{statusInfo.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-slate-400 capitalize">{tx.method || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Info Note */}
          <p className="text-xs text-slate-500 text-center">
            Une facture PDF est automatiquement générée et envoyée à votre adresse email après chaque paiement validé.
          </p>
        </div>
      )}
    </div>
  );
}
