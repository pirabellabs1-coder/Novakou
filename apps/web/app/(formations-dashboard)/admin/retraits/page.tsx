"use client";

/**
 * Page /admin/retraits
 * L'admin peut retirer la commission plateforme (10% sur chaque vente).
 * Affiche :
 *   - Solde disponible (revenus totaux - déjà retirés - en attente)
 *   - Formulaire de demande (montant + méthode + coordonnées)
 *   - Historique des retraits admin
 */

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
} from "@/components/kaza";
import {
  Banknote,
  ArrowLeft,
  AlertTriangle,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react";

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

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "orange" | "green" | "rose" }
> = {
  EN_ATTENTE: { label: "En attente", variant: "orange" },
  TRAITE: { label: "Traité", variant: "green" },
  REFUSE: { label: "Refusé", variant: "rose" },
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
        setBalance({ total: 0, paid: 0, pending: 0, available: 0 });
        setWithdrawals([]);
        return;
      }
      setBalance(
        j.data.balance ?? { total: 0, paid: 0, pending: 0, available: 0 }
      );
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

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

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
      <div
        className="min-h-screen bg-slate-50 p-8"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      >
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="h-48 bg-white border border-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-5xl mx-auto space-y-8">
        <KazaButton variant="ghost" size="sm" icon={ArrowLeft} href="/admin/dashboard">
          Dashboard
        </KazaButton>

        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={Banknote}
          title="Retraits commission plateforme"
          subtitle="Retirer les 10 % de commission perçus par Novakou sur chaque vente"
        />

        {loadError && (
          <div className="px-5 py-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-900">
                Impossible de charger les données
              </p>
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

        {/* KPIs solde */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KazaKpiCard
            label="Commissions totales"
            value={fmtFCFA(balance.total)}
            icon={TrendingUp}
            iconColor="navy"
          />
          <KazaKpiCard
            label="Déjà retirées"
            value={fmtFCFA(balance.paid)}
            icon={CheckCircle}
            iconColor="sky"
          />
          <KazaKpiCard
            label="En attente"
            value={fmtFCFA(balance.pending)}
            icon={Clock}
            iconColor="orange"
          />
          <KazaKpiCard
            label="Disponible"
            value={fmtFCFA(balance.available)}
            icon={Wallet}
            iconColor="emerald"
          />
        </div>

        {/* Formulaire */}
        <KazaCard
          title="Nouvelle demande de retrait"
          subtitle="Renseignez le montant et la méthode de versement"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Montant (FCFA)
              </label>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1000}
                max={balance.available}
                placeholder="1 000 minimum"
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-lg font-bold tabular-nums focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setAmount(Math.floor(balance.available))}
                className="text-xs font-bold text-emerald-600 hover:underline mt-1.5"
              >
                Maximum : {fmtFCFA(balance.available)}
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Méthode
              </label>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  setAccountInput("");
                }}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm focus:outline-none transition-all"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {accountLabel[method]}
              </label>
              <input
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder={accountPlaceholder[method]}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm font-mono focus:outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <KazaButton
              variant="primary"
              size="lg"
              icon={Banknote}
              onClick={submit}
              disabled={submitting || amount < 1000 || !accountInput.trim()}
            >
              {submitting ? "Envoi..." : "Demander le retrait"}
            </KazaButton>
          </div>
        </KazaCard>

        {/* Historique */}
        <KazaCard
          title={`Historique (${withdrawals.length})`}
          subtitle="Tous les retraits demandés sur la plateforme"
          noPadding
        >
          {withdrawals.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">
                Aucun retrait effectué pour l'instant.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-5 py-3 text-left font-semibold">
                      Montant
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Méthode
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                    <th className="px-5 py-3 text-left font-semibold">Note</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => {
                    const status =
                      STATUS_LABEL[w.status] ?? {
                        label: w.status,
                        variant: "slate" as const,
                      };
                    return (
                      <tr
                        key={w.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3 font-bold text-slate-900 tabular-nums">
                          {fmtFCFA(w.amount)}
                        </td>
                        <td className="px-5 py-3 text-slate-700 uppercase text-xs tracking-wide">
                          {w.method}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs tabular-nums">
                          {new Date(w.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs truncate max-w-[260px]">
                          {w.note ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <KazaBadge
                            variant={status.variant}
                            icon={
                              status.variant === "green"
                                ? CheckCircle
                                : status.variant === "rose"
                                  ? XCircle
                                  : Clock
                            }
                          >
                            {status.label}
                          </KazaBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </KazaCard>
      </main>
    </div>
  );
}
