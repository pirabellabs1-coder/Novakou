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
import { PAYOUT_METHODS } from "@/lib/moneroo-payout-methods";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StStatusPill,
  StHeroGradient,
  ST,
} from "@/components/stitch";
import {
  Banknote,
  ArrowLeft,
  AlertTriangle,
  Wallet,
  CheckCircle,
  Clock,
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
  { value: "mobile_money", label: "Mobile Money (versement auto Moneroo)" },
  { value: "virement", label: "Virement bancaire (IBAN) — manuel" },
  { value: "paypal", label: "PayPal — manuel" },
  { value: "wise", label: "Wise — manuel" },
];

// Opérateurs Mobile Money Moneroo (codes exacts du catalogue) pour le versement auto.
const MM_OPERATORS = PAYOUT_METHODS.filter((m) => m.category === "mobile_money").map((m) => ({ value: m.id, label: m.label }));

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function AdminRetraitsPage() {
  const toast = useToastStore.getState().addToast;
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Payout[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState("mobile_money");
  const [monerooMethod, setMonerooMethod] = useState(MM_OPERATORS[0]?.value ?? "");
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
    if (!amount || amount < 100) {
      toast("warning", "Montant minimum : 100 FCFA");
      return;
    }
    if (!accountInput.trim()) {
      toast("warning", `${accountLabel[method]} requis`);
      return;
    }
    if (method === "mobile_money" && !monerooMethod) {
      toast("warning", "Choisissez votre opérateur Mobile Money");
      return;
    }
    if (balance && amount > balance.available) {
      toast("error", "Montant supérieur au solde disponible");
      return;
    }

    const details: Record<string, string> = {};
    if (method === "virement") details.iban = accountInput.trim();
    else if (method === "mobile_money") { details.phone = accountInput.trim(); details.monerooMethod = monerooMethod; }
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
        className="min-h-screen p-8"
        style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
      >
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-64 rounded" style={{ background: ST.divider }} />
          <div className="h-48 rounded-2xl" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-5xl mx-auto space-y-5">
        <StButton variant="secondary" size="sm" icon={ArrowLeft} href="/admin/dashboard">
          Dashboard
        </StButton>

        <StPageHeader
          title="Retraits commission plateforme"
          subtitle="Retirer les 10 % de commission perçus par Novakou sur chaque vente"
        />

        {loadError && (
          <div className="px-5 py-4 rounded-2xl flex items-start gap-3" style={{ background: ST.roseSoft, border: "1px solid #f3cdd9" }}>
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: ST.roseText }} />
            <div className="flex-1">
              <p className="text-[13px] font-extrabold" style={{ color: ST.roseText }}>
                Impossible de charger les données
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: ST.roseText }}>{loadError}</p>
              <button
                onClick={() => load()}
                className="mt-2 text-[12px] font-extrabold underline"
                style={{ color: ST.roseText }}
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Hero solde disponible + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_2fr] gap-3.5">
          <StHeroGradient className="flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-white/80">Solde disponible</span>
              <Wallet size={20} className="text-white/80" />
            </div>
            <div className="text-[28px] md:text-[32px] font-extrabold mt-2 tabular-nums leading-none">
              {new Intl.NumberFormat("fr-FR").format(Math.round(balance.available))}
              <span className="text-[15px] ml-1.5 text-white/75">FCFA</span>
            </div>
            <p className="text-[11.5px] font-semibold text-white/70 mt-3">
              Commission plateforme retirable
            </p>
          </StHeroGradient>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <StKpiCompact
              label="Commissions totales"
              value={fmtFCFA(balance.total)}
              icon={TrendingUp}
              tone="green"
            />
            <StKpiCompact
              label="Déjà retirées"
              value={fmtFCFA(balance.paid)}
              icon={CheckCircle}
              tone="blue"
            />
            <StKpiCompact
              label="En attente"
              value={fmtFCFA(balance.pending)}
              icon={Clock}
              tone="amber"
            />
          </div>
        </div>

        {/* Formulaire */}
        <StCard className="!p-[18px_20px]">
          <h3 className="text-[15px] font-extrabold" style={{ color: ST.text }}>Nouvelle demande de retrait</h3>
          <p className="text-[12px] font-semibold mt-0.5 mb-4" style={{ color: ST.textSecondary }}>
            Renseignez le montant et la méthode de versement
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-extrabold mb-2" style={{ color: ST.textLabel }}>
                Montant (FCFA)
              </label>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={100}
                max={balance.available}
                placeholder="100 minimum"
                className="w-full px-4 py-3 rounded-xl text-[17px] font-extrabold tabular-nums focus:outline-none transition-all"
                style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
              />
              <button
                type="button"
                onClick={() => setAmount(Math.floor(balance.available))}
                className="text-[12px] font-extrabold hover:underline mt-1.5"
                style={{ color: ST.green }}
              >
                Maximum : {fmtFCFA(balance.available)}
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold mb-2" style={{ color: ST.textLabel }}>
                Méthode
              </label>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  setAccountInput("");
                }}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] font-semibold focus:outline-none transition-all"
                style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {method === "mobile_money" && (
              <div className="md:col-span-2">
                <label className="block text-[12px] font-extrabold mb-2" style={{ color: ST.textLabel }}>
                  Opérateur Mobile Money
                </label>
                <select
                  value={monerooMethod}
                  onChange={(e) => setMonerooMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13.5px] font-semibold focus:outline-none transition-all"
                  style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
                >
                  {MM_OPERATORS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <p className="text-[11.5px] mt-1.5" style={{ color: ST.textMuted }}>
                  Versement automatique via Moneroo — tracé et confirmé par webhook.
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-[12px] font-extrabold mb-2" style={{ color: ST.textLabel }}>
                {accountLabel[method]}
              </label>
              <input
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder={accountPlaceholder[method]}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] font-mono focus:outline-none transition-all"
                style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-extrabold mb-2" style={{ color: ST.textLabel }}>
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] font-medium focus:outline-none transition-all resize-none"
                style={{ color: "#33453b", border: "1px solid #dde6e0", background: "#fff" }}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <StButton
              variant="primary"
              size="lg"
              icon={Banknote}
              onClick={submit}
              disabled={submitting || amount < 100 || !accountInput.trim()}
            >
              {submitting ? "Envoi..." : "Demander le retrait"}
            </StButton>
          </div>
        </StCard>

        {/* Historique */}
        <StCard noPadding>
          <div className="px-5 pt-[18px] pb-3">
            <h3 className="text-[15px] font-extrabold" style={{ color: ST.text }}>Historique ({withdrawals.length})</h3>
            <p className="text-[12px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>
              Tous les retraits demandés sur la plateforme
            </p>
          </div>
          {withdrawals.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[13px] font-semibold" style={{ color: ST.textSecondary }}>
                Aucun retrait effectué pour l&apos;instant.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      { h: "Montant", align: "text-left" },
                      { h: "Méthode", align: "text-left" },
                      { h: "Date", align: "text-left" },
                      { h: "Note", align: "text-left" },
                      { h: "Statut", align: "text-right" },
                    ].map((c) => (
                      <th
                        key={c.h}
                        className={`text-[10.5px] uppercase font-extrabold px-5 py-3 ${c.align}`}
                        style={{ color: ST.textMuted, letterSpacing: ".06em" }}
                      >
                        {c.h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="transition-colors hover:bg-[#f7faf8]">
                      <td className="px-5 py-3 text-[12.5px] font-extrabold tabular-nums" style={{ color: ST.text, borderTop: `1px solid ${ST.divider}` }}>
                        {fmtFCFA(w.amount)}
                      </td>
                      <td className="px-5 py-3 uppercase text-[11px] font-bold tracking-wide" style={{ color: ST.textSecondary, borderTop: `1px solid ${ST.divider}` }}>
                        {w.method}
                      </td>
                      <td className="px-5 py-3 text-[12px] tabular-nums" style={{ color: ST.textMuted, borderTop: `1px solid ${ST.divider}` }}>
                        {new Date(w.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3 text-[12px] truncate max-w-[260px]" style={{ color: ST.textMuted, borderTop: `1px solid ${ST.divider}` }}>
                        {w.note ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <StStatusPill status={w.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StCard>
      </main>
    </div>
  );
}
