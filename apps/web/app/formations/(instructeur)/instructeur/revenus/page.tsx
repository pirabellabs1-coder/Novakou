"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign, TrendingUp, Clock, Download,
  ArrowDownCircle, CheckCircle, AlertCircle, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface Revenue {
  totalEarned: number;
  available: number;
  pending: number;
  withdrawn: number;
  transactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    description: string;
    formation?: { titleFr: string; titleEn: string };
  }[];
  monthlyRevenue: { month: string; gross: number; net: number }[];
  withdrawals: {
    id: string;
    amount: number;
    method: string;
    status: string;
    requestedAt: string;
  }[];
}

interface WithdrawForm {
  amount: string;
  method: string;
  details: string;
}

const WITHDRAW_METHODS = [
  "Virement IBAN",
  "PayPal",
  "Wave",
  "Orange Money",
  "MTN Mobile Money",
];

export default function InstructeurRevenusPage() {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({ amount: "", method: WITHDRAW_METHODS[0], details: "" });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated") return;
    fetch("/api/instructeur/revenus").then((r) => r.json()).then((d) => { setRevenue(d); setLoading(false); }).catch(() => setLoading(false));
  }, [status, router]);

  const requestWithdrawal = async () => {
    setWithdrawError("");
    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount < 20) {
      setWithdrawError(fr ? "Montant minimum : 20€" : "Minimum amount: €20");
      return;
    }
    if (amount > (revenue?.available ?? 0)) {
      setWithdrawError(fr ? "Solde insuffisant" : "Insufficient balance");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/instructeur/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: withdrawForm.method, details: withdrawForm.details }),
      });
      if (res.ok) {
        setWithdrawSuccess(true);
        setTimeout(() => { setShowWithdrawModal(false); setWithdrawSuccess(false); }, 2000);
      } else {
        const d = await res.json();
        setWithdrawError(d.error ?? (fr ? "Erreur" : "Error"));
      }
    } catch { setWithdrawError(fr ? "Erreur réseau" : "Network error"); }
    finally { setWithdrawing(false); }
  };

  const statusLabel = (s: string) => ({
    PENDING: fr ? "En attente" : "Pending",
    PROCESSING: fr ? "En cours" : "Processing",
    COMPLETED: fr ? "Complété" : "Completed",
    FAILED: fr ? "Échoué" : "Failed",
  }[s] ?? s);

  const statusColor = (s: string) => ({
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{fr ? "Revenus & Finances" : "Revenue & Finances"}</h1>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!revenue?.available || revenue.available < 20}
          className="flex items-center gap-2 bg-primary text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
        >
          <ArrowDownCircle className="w-4 h-4" />
          {fr ? "Demander un retrait" : "Request withdrawal"}
        </button>
      </div>

      {/* Nav */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-neutral-dark border dark:border-border-dark rounded-xl p-1 w-fit">
        {(["dashboard", "mes-formations", "apprenants", "revenus", "statistiques"] as const).map((path) => (
          <Link
            key={path}
            href={`/formations/instructeur/${path}`}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              path === "revenus" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {path === "dashboard" ? "Dashboard"
              : path === "mes-formations" ? (fr ? "Formations" : "Courses")
              : path === "apprenants" ? (fr ? "Apprenants" : "Students")
              : path === "revenus" ? (fr ? "Revenus" : "Revenue")
              : (fr ? "Statistiques" : "Stats")}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: fr ? "Total gagné" : "Total earned", value: `${(revenue?.totalEarned ?? 0).toFixed(2)}€`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: fr ? "Disponible" : "Available", value: `${(revenue?.available ?? 0).toFixed(2)}€`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: fr ? "En attente (30j)" : "Pending (30d)", value: `${(revenue?.pending ?? 0).toFixed(2)}€`, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: fr ? "Retiré" : "Withdrawn", value: `${(revenue?.withdrawn ?? 0).toFixed(2)}€`, icon: ArrowDownCircle, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Commission info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
        <strong>{fr ? "Commission :" : "Commission:"}</strong>{" "}
        {fr
          ? "FreelanceHigh prélève 30% de chaque vente. Vous recevez 70% net."
          : "FreelanceHigh takes 30% of each sale. You receive 70% net."}
      </div>

      {/* Revenue chart */}
      {revenue?.monthlyRevenue && revenue.monthlyRevenue.length > 0 && (
        <div className="bg-white dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-6 mb-6">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{fr ? "Revenus mensuels" : "Monthly revenue"}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenue.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip content={<ChartTooltip formatter={(v, name) => `${v}€ ${name === "gross" ? (fr ? "Brut" : "Gross") : (fr ? "Net (70%)" : "Net (70%)")}`} />} />
              <Bar dataKey="gross" fill="#e5e7eb" name="gross" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" fill="#6C2BD9" name="net" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white dark:bg-neutral-dark rounded-xl border dark:border-border-dark mb-6">
        <div className="p-5 border-b dark:border-border-dark flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{fr ? "Transactions récentes" : "Recent transactions"}</h2>
          <button className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
        <div className="divide-y">
          {(revenue?.transactions ?? []).slice(0, 20).map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 p-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                tx.type === "SALE" ? "bg-green-100" : "bg-purple-100"
              }`}>
                {tx.type === "SALE" ? <DollarSign className="w-4 h-4 text-green-600" /> : <ArrowDownCircle className="w-4 h-4 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                <p className="text-xs text-slate-500">
                  {new Date(tx.createdAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold text-sm ${tx.type === "WITHDRAWAL" ? "text-red-600" : "text-green-600"}`}>
                  {tx.type === "WITHDRAWAL" ? "-" : "+"}{tx.amount.toFixed(2)}€
                </p>
              </div>
            </div>
          ))}
          {(!revenue?.transactions || revenue.transactions.length === 0) && (
            <p className="text-center text-slate-400 text-sm py-8">
              {fr ? "Aucune transaction" : "No transactions yet"}
            </p>
          )}
        </div>
      </div>

      {/* Withdrawal history */}
      {revenue?.withdrawals && revenue.withdrawals.length > 0 && (
        <div className="bg-white dark:bg-neutral-dark rounded-xl border dark:border-border-dark">
          <div className="p-5 border-b dark:border-border-dark">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{fr ? "Historique des retraits" : "Withdrawal history"}</h2>
          </div>
          <div className="divide-y">
            {revenue.withdrawals.map((w) => (
              <div key={w.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{w.method}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(w.requestedAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(w.status)}`}>
                  {statusLabel(w.status)}
                </span>
                <span className="font-bold text-slate-900">{w.amount.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative bg-white dark:bg-neutral-dark rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              {fr ? "Demander un retrait" : "Request withdrawal"}
            </h2>

            {withdrawSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-900">{fr ? "Demande envoyée !" : "Request sent!"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {fr ? "Montant (min. 20€)" : "Amount (min. €20)"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="20"
                      max={revenue?.available ?? 0}
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {fr ? `Disponible : ${(revenue?.available ?? 0).toFixed(2)}€` : `Available: €${(revenue?.available ?? 0).toFixed(2)}`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {fr ? "Méthode de retrait" : "Withdrawal method"}
                  </label>
                  <select
                    value={withdrawForm.method}
                    onChange={(e) => setWithdrawForm((p) => ({ ...p, method: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {WITHDRAW_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {fr ? "Coordonnées bancaires / Numéro" : "Bank details / Number"}
                  </label>
                  <input
                    type="text"
                    value={withdrawForm.details}
                    onChange={(e) => setWithdrawForm((p) => ({ ...p, details: e.target.value }))}
                    placeholder={fr ? "IBAN, email PayPal, numéro..." : "IBAN, PayPal email, number..."}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {withdrawError && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {withdrawError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowWithdrawModal(false)} className="flex-1 border border-slate-300 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                    {fr ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    onClick={requestWithdrawal}
                    disabled={withdrawing}
                    className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                  >
                    {withdrawing ? "..." : (fr ? "Confirmer" : "Confirm")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
