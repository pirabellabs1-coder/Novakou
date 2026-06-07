// Refonte style KAZA — mentor finances — 2026-06-07
"use client";

import { useEffect, useState } from "react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  Wallet,
  Send,
  ShieldCheck,
  Hourglass,
  CircleAlert,
  X,
  Info,
  Receipt,
  Smartphone,
  Phone,
  Landmark,
  Mail,
  Waves,
  TrendingUp,
  HandCoins,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface MentorWallet {
  mentorId: string;
  totalSessions: number;
  gross: number;
  netEarned: number;
  available: number;
  pendingHold: number;
  pendingGross?: number;
  pendingSessions?: number;
  disputedHold?: number;
  disputedGross?: number;
  disputedSessions?: number;
  holdPeriodHours: number;
  withdrawnPending: number;
  withdrawnTreated: number;
  currency: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  status: "EN_ATTENTE" | "TRAITE" | "REFUSE";
  refusedReason: string | null;
  processedAt: string | null;
  createdAt: string;
}

const METHODS = [
  { code: "orange_money", label: "Orange Money", needs: "phone", icon: Smartphone },
  { code: "wave", label: "Wave", needs: "phone", icon: Waves },
  { code: "mtn", label: "MTN Mobile", needs: "phone", icon: Phone },
  { code: "moov", label: "Moov Money", needs: "phone", icon: Smartphone },
  { code: "bank", label: "Virement bancaire", needs: "bank", icon: Landmark },
  { code: "paypal", label: "PayPal", needs: "email", icon: Mail },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "orange" | "green" | "rose" }> = {
  EN_ATTENTE: { label: "En attente", variant: "orange" },
  TRAITE: { label: "Traité", variant: "green" },
  REFUSE: { label: "Refusé", variant: "rose" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function cleanMethodLabel(method: string): string {
  const cleaned = method.replace(/_mentor$/, "");
  return METHODS.find((m) => m.code === cleaned)?.label ?? cleaned;
}

type KycStatus = { level: number; verified: boolean; pending: boolean; requiredLevel: number };

export default function MentorFinancesPage() {
  const [wallet, setWallet] = useState<MentorWallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [kyc, setKyc] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [wMethod, setWMethod] = useState<string>("orange_money");
  const [wAmount, setWAmount] = useState<number>(10000);
  const [wPhone, setWPhone] = useState<string>("");
  const [wEmail, setWEmail] = useState<string>("");
  const [wIban, setWIban] = useState<string>("");
  const [wHolder, setWHolder] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/wallet");
      if (!res.ok) throw new Error("Erreur chargement");
      const { data } = await res.json();
      setWallet(data.mentor);
      setWithdrawals(data.mentorWithdrawals ?? []);
      setKyc(data.kyc ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const methodDef = METHODS.find((m) => m.code === wMethod);
    if (!methodDef) {
      setError("Méthode inconnue.");
      setSubmitting(false);
      return;
    }

    const accountDetails: Record<string, string> = {};
    if (methodDef.needs === "phone") {
      if (!wPhone.trim()) {
        setError("Téléphone requis.");
        setSubmitting(false);
        return;
      }
      accountDetails.phone = wPhone.trim();
    } else if (methodDef.needs === "email") {
      if (!wEmail.trim()) {
        setError("Email PayPal requis.");
        setSubmitting(false);
        return;
      }
      accountDetails.email = wEmail.trim();
    } else if (methodDef.needs === "bank") {
      if (!wIban.trim() || !wHolder.trim()) {
        setError("IBAN et titulaire requis.");
        setSubmitting(false);
        return;
      }
      accountDetails.iban = wIban.trim();
      accountDetails.holder = wHolder.trim();
    }

    try {
      const res = await fetch("/api/formations/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "mentor",
          amount: wAmount,
          method: wMethod,
          accountDetails,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const selectedMethod = METHODS.find((m) => m.code === wMethod);
  const available = wallet?.available ?? 0;

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Mentor"
        badgeColor="white"
        icon={Wallet}
        title="Mes finances"
        subtitle="Suivi de vos revenus, commissions et retraits. Commission plateforme : 10%."
        actions={
          <KazaButton
            variant="primary"
            onClick={() => setModalOpen(true)}
            disabled={available < 5000}
            icon={Send}
          >
            Demander un retrait
          </KazaButton>
        }
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <CircleAlert className="w-5 h-5 text-rose-500 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {!wallet ? (
        <KazaEmpty
          icon={Wallet}
          title="Aucune donnée financière"
          description="Vos premiers revenus apparaîtront ici dès qu'une session sera terminée."
        />
      ) : (
        <>
          {/* KYC banner */}
          {kyc && !kyc.verified && (
            <div
              className={`rounded-2xl p-5 flex items-start gap-4 border ${
                kyc.pending ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                  kyc.pending ? "bg-amber-500" : "bg-rose-500"
                }`}
              >
                {kyc.pending ? <Hourglass className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#0b2540]">
                  {kyc.pending ? "Vérification KYC en cours" : "Vérification KYC requise"}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {kyc.pending
                    ? "Votre demande est en attente de validation admin."
                    : "Vous ne pouvez pas retirer vos gains sans vérifier votre identité."}
                </p>
                {!kyc.pending && (
                  <KazaButton variant="primary" size="sm" href="/kyc" icon={ShieldCheck} className="mt-3">
                    Soumettre ma vérification
                  </KazaButton>
                )}
              </div>
            </div>
          )}

          {/* 24h escrow info */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <Info className="w-5 h-5 text-sky-500 mt-0.5" />
            <p className="text-xs text-sky-900">
              Les fonds des séances terminées sont en attente pendant {wallet.holdPeriodHours}h
              avant d&apos;être disponibles pour retrait. Cela permet à l&apos;apprenant de signaler
              un éventuel problème.
            </p>
          </div>

          {/* Hero balance */}
          <div
            className="rounded-2xl p-6 text-white shadow-xl"
            style={{ background: "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              Solde disponible
            </p>
            <p className="text-4xl md:text-5xl font-extrabold mt-2 tabular-nums">
              {fmt(available)} <span className="text-xl font-bold">FCFA</span>
            </p>
            <p className="text-xs text-white/70 mt-1">≈ {fmt(available / 655.957)} EUR</p>
            <button
              onClick={() => setModalOpen(true)}
              disabled={available < 5000}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 shadow-md disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              Demander un retrait
            </button>
            {available < 5000 && (
              <p className="text-[10px] text-white/70 mt-2">
                Retrait disponible à partir de 5 000 FCFA
              </p>
            )}
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <KazaKpiCard
              label="Gains nets acquis"
              value={`${fmt(wallet.netEarned)} F`}
              delta={`${wallet.totalSessions} libérée(s)`}
              icon={TrendingUp}
              iconColor="emerald"
            />
            <KazaKpiCard
              label="Gains bruts acquis"
              value={`${fmt(wallet.gross)} F`}
              delta="Après commission 10%"
              icon={Receipt}
              iconColor="navy"
            />
            <KazaKpiCard
              label="En escrow"
              value={`${fmt(wallet.pendingHold)} F`}
              delta={`${wallet.pendingSessions ?? 0} session(s)`}
              icon={Hourglass}
              iconColor="orange"
            />
            <KazaKpiCard
              label="Retraits en cours"
              value={`${fmt(wallet.withdrawnPending)} F`}
              delta="En traitement"
              icon={HandCoins}
              iconColor="violet"
            />
            <KazaKpiCard
              label="Retiré"
              value={`${fmt(wallet.withdrawnTreated)} F`}
              delta="Traités"
              icon={CheckCircle2}
              iconColor="sky"
            />
          </section>

          {(wallet.disputedSessions ?? 0) > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500 flex items-center justify-center text-white flex-shrink-0">
                <CircleAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-700">
                  {fmt(wallet.disputedHold ?? 0)} F en dispute
                </p>
                <p className="text-xs text-rose-600 mt-0.5">
                  {wallet.disputedSessions} session(s) en attente de décision admin
                </p>
              </div>
            </div>
          )}

          {/* Withdrawals history */}
          <KazaCard
            title="Historique des retraits"
            subtitle={`${withdrawals.length} demande${withdrawals.length > 1 ? "s" : ""}`}
            noPadding
          >
            {withdrawals.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">Aucun retrait demandé.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {withdrawals.map((w) => {
                  const s = STATUS_CONFIG[w.status];
                  return (
                    <div key={w.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#0b2540] tabular-nums">
                            {fmt(w.amount)} FCFA
                          </p>
                          <KazaBadge variant={s.variant} size="sm">
                            {s.label}
                          </KazaBadge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>{cleanMethodLabel(w.method)}</span>
                          <span>·</span>
                          <span>Demandé le {fmtDate(w.createdAt)}</span>
                          {w.processedAt && (
                            <>
                              <span>·</span>
                              <span>Traité le {fmtDate(w.processedAt)}</span>
                            </>
                          )}
                        </div>
                        {w.status === "REFUSE" && w.refusedReason && (
                          <p className="text-[11px] text-rose-600 mt-1">
                            Motif : {w.refusedReason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </KazaCard>
        </>
      )}

      {/* Withdrawal modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-extrabold text-[#0b2540]">Demander un retrait</h2>
            <p className="text-xs text-slate-500 mt-1">
              Solde disponible : {fmt(available)} FCFA
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">Méthode</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = wMethod === m.code;
                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => setWMethod(m.code)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-semibold text-[#0b2540]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  min={5000}
                  max={available}
                  step={500}
                  value={wAmount}
                  onChange={(e) => setWAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Min 5 000 · Max {fmt(available)}
                </p>
              </div>

              {selectedMethod?.needs === "phone" && (
                <div>
                  <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={wPhone}
                    onChange={(e) => setWPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                  />
                </div>
              )}
              {selectedMethod?.needs === "email" && (
                <div>
                  <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">
                    Email PayPal
                  </label>
                  <input
                    type="email"
                    value={wEmail}
                    onChange={(e) => setWEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                  />
                </div>
              )}
              {selectedMethod?.needs === "bank" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">
                      Titulaire du compte
                    </label>
                    <input
                      type="text"
                      value={wHolder}
                      onChange={(e) => setWHolder(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">IBAN</label>
                    <input
                      type="text"
                      value={wIban}
                      onChange={(e) => setWIban(e.target.value)}
                      placeholder="SN08 SN00 …"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                    />
                  </div>
                </>
              )}

              <KazaButton
                type="submit"
                variant="primary"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? "Envoi…" : "Confirmer la demande"}
              </KazaButton>
              <p className="text-center text-[10px] text-slate-500">
                Les retraits sont traités sous 24-72h par l&apos;équipe Novakou.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
