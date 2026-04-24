"use client";

/**
 * Page /admin/retraits
 * L'admin peut retirer la commission plateforme (5% sur chaque vente).
 * Affiche :
 *   - Solde disponible (revenus totaux - déjà retirés - en attente)
 *   - Formulaire de demande (montant + méthode + coordonnées)
 *   - Historique des retraits admin
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/toast";

interface Balance {
  total: number;
  paid: number;
  pending: number;
  available: number;
}
interface Payout {
  id: string;
  amount: number;
  method: string;
  status: string;
  note: string | null;
  processedAt: string | null;
  createdAt: string;
}

const METHODS = [
  { value: "virement", label: "Virement bancaire (IBAN)" },
  { value: "mobile_money", label: "Mobile Money (Wave / Orange / MTN)" },
  { value: "paypal", label: "PayPal" },
  { value: "wise", label: "Wise" },
];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", color: "bg-amber-100 text-amber-800" },
  TRAITE: { label: "Traité", color: "bg-emerald-100 text-emerald-800" },
  REFUSE: { label: "Refusé", color: "bg-rose-100 text-rose-800" },
};

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function AdminRetraitsPage() {
  const toast = useToastStore.getState().addToast;
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Payout[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState("virement");
  const [accountInput, setAccountInput] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/withdrawal");
      const j = await res.json();
      if (!res.ok) {
        const msg = j.error ?? "Chargement impossible";
        toast("error", msg);
        setLoadError(msg);
        // Fallback : solde à zéro pour permettre l'affichage de la page
        setBalance({ total: 0, paid: 0, pending: 0, available: 0 });
        setWithdrawals([]);
        return;
      }
      setBalance(j.data.balance ?? { total: 0, paid: 0, pending: 0, available: 0 });
      setWithdrawals(j.data.withdrawals ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur réseau";
      toast("error", msg);
      setLoadError(msg);
      setBalance({ total: 0, paid: 0, pending: 0, available: 0 });
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const accountPlaceholder: Record<string, string> = {
    virement: "FR76 1234 5678 9012 3456 7890 123",
    mobile_money: "+22997123456",
    paypal: "admin@novakou.com",
    wise: "admin@novakou.com",
  };
  const accountLabel: Record<string, string> = {
    virement: "IBAN",
    mobile_money: "Numéro Mobile Money",
    paypal: "Email PayPal",
    wise: "Email Wise",
  };

  async function submit() {
    if (!amount || amount < 1000) {
      toast("warning", "Montant minimum : 1 000 FCFA");
      return;
    }
    if (!accountInput.trim()) {
      toast("warning", `${accountLabel[method]} requis`);
      return;
    }
    if (balance && amount > balance.available) {
      toast("error", "Montant supérieur au solde disponible");
      return;
    }

    const details: Record<string, string> = {};
    if (method === "virement") details.iban = accountInput.trim();
    else if (method === "mobile_money") details.phone = accountInput.trim();
    else details.email = accountInput.trim();

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method, accountDetails: details, note }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error ?? "Échec");
        return;
      }
      toast("success", "Demande de retrait enregistrée");
      setAmount(0);
      setAccountInput("");
      setNote("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !balance) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] p-8">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded" />
          <div className="h-48 bg-white border border-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-5xl mx-auto">
        <Link
          href="/admin/dashboard"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 mb-6"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Dashboard
        </Link>

        <header className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Financial Ledger
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
            Retraits commission plateforme
          </h1>
          <p className="text-sm text-zinc-500 mt-3">
            Retirer les 5% de commission perçus par Novakou sur chaque vente.
          </p>
        </header>

        {loadError && (
          <div className="mb-6 px-5 py-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 mt-0.5">error</span>
            <div>
              <p className="text-sm font-bold text-rose-900">Impossible de charger les données</p>
              <p className="text-xs text-rose-700 mt-0.5">{loadError}</p>
              <button
                onClick={() => load()}
                className="mt-2 text-xs font-bold text-rose-700 hover:text-rose-900 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Balance KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-zinc-100 mb-10 border border-zinc-100">
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Commissions totales</p>
            <p className="text-lg md:text-xl font-extrabold text-zinc-900 tabular-nums break-all">
              {fmtFCFA(balance.total)}
            </p>
          </div>
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Déjà retirées</p>
            <p className="text-lg md:text-xl font-extrabold text-zinc-700 tabular-nums break-all">
              {fmtFCFA(balance.paid)}
            </p>
          </div>
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">En attente</p>
            <p className="text-lg md:text-xl font-extrabold text-amber-600 tabular-nums break-all">
              {fmtFCFA(balance.pending)}
            </p>
          </div>
          <div className="bg-[#22c55e] p-6 text-[#004b1e]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-3">Disponible</p>
            <p className="text-lg md:text-xl font-extrabold tabular-nums break-all">
              {fmtFCFA(balance.available)}
            </p>
          </div>
        </div>

        {/* Formulaire retrait */}
        <section className="bg-white border border-zinc-100 p-6 md:p-8 mb-10">
          <h2 className="text-base font-extrabold text-zinc-900 mb-5">Nouvelle demande de retrait</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                Montant (FCFA)
              </label>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1000}
                max={balance.available}
                placeholder="1 000 minimum"
                className="w-full px-4 py-3 border border-zinc-200 text-lg font-bold tabular-nums focus:border-[#006e2f] outline-none"
              />
              <button
                type="button"
                onClick={() => setAmount(Math.floor(balance.available))}
                className="text-[10px] font-bold uppercase tracking-wider text-[#006e2f] hover:underline mt-1"
              >
                Maximum : {fmtFCFA(balance.available)}
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                Méthode
              </label>
              <select
                value={method}
                onChange={(e) => { setMethod(e.target.value); setAccountInput(""); }}
                className="w-full px-4 py-3 border border-zinc-200 text-sm focus:border-[#006e2f] outline-none bg-white"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                {accountLabel[method]}
              </label>
              <input
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder={accountPlaceholder[method]}
                className="w-full px-4 py-3 border border-zinc-200 text-sm focus:border-[#006e2f] outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-4 py-3 border border-zinc-200 text-sm focus:border-[#006e2f] outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={submit}
              disabled={submitting || amount < 1000 || !accountInput.trim()}
              className="px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              {submitting ? "Envoi…" : "Demander le retrait"}
            </button>
          </div>
        </section>

        {/* Historique */}
        <section className="bg-white border border-zinc-100">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-base font-extrabold text-zinc-900">Historique ({withdrawals.length})</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {withdrawals.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-zinc-500">
                Aucun retrait effectué pour l&apos;instant.
              </p>
            )}
            {withdrawals.map((w) => {
              const status = STATUS_LABEL[w.status] ?? { label: w.status, color: "bg-gray-100 text-gray-700" };
              return (
                <div key={w.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900">{fmtFCFA(w.amount)}</p>
                    <p className="text-xs text-zinc-500">
                      {w.method} · {new Date(w.createdAt).toLocaleDateString("fr-FR")}
                      {w.note && <> · {w.note}</>}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
