"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MentorWallet {
  mentorId: string;
  totalSessions: number;        // sessions RELEASED
  gross: number;                // brut acquis
  netEarned: number;            // net acquis (90%)
  available: number;            // retirable (net - retraits)
  pendingHold: number;          // net HELD (en escrow)
  pendingGross?: number;
  pendingSessions?: number;
  disputedHold?: number;        // net DISPUTED
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

// ─── Constants ────────────────────────────────────────────────────────────────
const METHODS = [
  { code: "orange_money", label: "Orange Money", needs: "phone", icon: "phone_iphone" },
  { code: "wave",         label: "Wave",         needs: "phone", icon: "waves" },
  { code: "mtn",          label: "MTN Mobile",   needs: "phone", icon: "smartphone" },
  { code: "moov",         label: "Moov Money",   needs: "phone", icon: "phone_android" },
  { code: "bank",         label: "Virement bancaire", needs: "bank", icon: "account_balance" },
  { code: "paypal",       label: "PayPal",       needs: "email", icon: "mail" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  TRAITE:     { label: "Traité",     cls: "bg-green-50 text-green-700 border-green-200" },
  REFUSE:     { label: "Refusé",     cls: "bg-red-50 text-red-600 border-red-200" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function cleanMethodLabel(method: string): string {
  const cleaned = method.replace(/_mentor$/, "");
  return METHODS.find((m) => m.code === cleaned)?.label ?? cleaned;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type KycStatus = { level: number; verified: boolean; pending: boolean; requiredLevel: number };

export default function MentorFinancesPage() {
  const [wallet, setWallet] = useState<MentorWallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [kyc, setKyc] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Withdrawal modal state
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
      if (!wPhone.trim()) { setError("Téléphone requis."); setSubmitting(false); return; }
      accountDetails.phone = wPhone.trim();
    } else if (methodDef.needs === "email") {
      if (!wEmail.trim()) { setError("Email PayPal requis."); setSubmitting(false); return; }
      accountDetails.email = wEmail.trim();
    } else if (methodDef.needs === "bank") {
      if (!wIban.trim() || !wHolder.trim()) { setError("IBAN et titulaire requis."); setSubmitting(false); return; }
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
      <div className="min-h-screen bg-[#f7f9fb] p-6">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
          <div className="h-36 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const selectedMethod = METHODS.find((m) => m.code === wMethod);
  const available = wallet?.available ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/mentor/dashboard" className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="text-sm font-bold text-[#191c1e] flex-1">Finances</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191c1e]">Mes finances</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Suivi de vos revenus, commissions et retraits. Commission plateforme : 10 %.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!wallet ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl">payments</span>
            <p className="text-sm text-[#5c647a] mt-3">Aucune donnée financière pour l&apos;instant.</p>
          </div>
        ) : (
          <>
            {/* KYC banner — obligatoire pour retrait */}
            {kyc && !kyc.verified && (
              <div className={`rounded-2xl p-5 flex items-start gap-4 border ${kyc.pending ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kyc.pending ? "bg-amber-500" : "bg-red-500"}`}>
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {kyc.pending ? "hourglass_top" : "warning"}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#191c1e]">
                    {kyc.pending ? "Vérification KYC en cours" : "Vérification KYC requise"}
                  </h3>
                  <p className="text-sm text-[#5c647a] mt-1">
                    {kyc.pending
                      ? "Votre demande est en attente de validation admin. Vous recevrez une notification dès la décision."
                      : "Vous ne pouvez pas retirer vos gains sans vérifier votre identité. Soumettez une pièce d'identité pour validation."}
                  </p>
                  {!kyc.pending && (
                    <a
                      href="/kyc"
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-white text-xs font-bold"
                      style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                    >
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      Soumettre ma vérification
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 24h escrow info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-500 text-[18px] mt-0.5">info</span>
              <p className="text-xs text-blue-900">
                Les fonds des séances terminées sont en attente pendant {wallet.holdPeriodHours}h avant d&apos;être disponibles pour retrait. Cela permet à l&apos;apprenant de signaler un éventuel problème.
              </p>
            </div>

            {/* Hero balance */}
            <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}>
              <p className="text-xs font-semibold uppercase opacity-80">Solde disponible</p>
              <p className="text-4xl font-extrabold mt-2">{fmt(available)} <span className="text-xl font-bold">FCFA</span></p>
              <p className="text-xs opacity-80 mt-1">
                ≈ {fmt(available / 655.957)} EUR
              </p>
              <button
                onClick={() => setModalOpen(true)}
                disabled={available < 5000}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#006e2f] text-sm font-bold hover:bg-white/90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">send_money</span>
                Demander un retrait
              </button>
              {available < 5000 && (
                <p className="text-[10px] opacity-80 mt-2">Retrait disponible à partir de 5 000 FCFA</p>
              )}
            </div>

            {/* Stats grid — semantique claire :
                 • Gains acquis (RELEASED)  = sessions terminees + escrow libere (>24h)
                 • En escrow (HELD)         = paye mais pas encore libere (sessions a venir ou <24h)
                 • En dispute (DISPUTED)    = annulation en attente de decision admin
                 • Retraits                 = demandes de payout
            */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[11px] text-[#5c647a] font-medium">Gains nets acquis</p>
                <p className="text-xl font-extrabold text-[#006e2f] mt-1">{fmt(wallet.netEarned)} F</p>
                <p className="text-[10px] text-[#5c647a] mt-0.5">{wallet.totalSessions} séance{wallet.totalSessions > 1 ? "s" : ""} libérée{wallet.totalSessions > 1 ? "s" : ""}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[11px] text-[#5c647a] font-medium">Gains bruts acquis</p>
                <p className="text-xl font-extrabold text-[#191c1e] mt-1">{fmt(wallet.gross)} F</p>
                <p className="text-[10px] text-[#5c647a] mt-0.5">Après commission 10%</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[11px] text-[#5c647a] font-medium">En escrow (bloqué)</p>
                <p className="text-xl font-extrabold text-orange-500 mt-1">{fmt(wallet.pendingHold)} F</p>
                <p className="text-[10px] text-[#5c647a] mt-0.5">
                  {wallet.pendingSessions ?? 0} session{(wallet.pendingSessions ?? 0) > 1 ? "s" : ""} · libéré 24h après la fin
                </p>
              </div>
              {(wallet.disputedSessions ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-red-200 p-4">
                  <p className="text-[11px] text-red-600 font-medium">En dispute</p>
                  <p className="text-xl font-extrabold text-red-600 mt-1">{fmt(wallet.disputedHold ?? 0)} F</p>
                  <p className="text-[10px] text-[#5c647a] mt-0.5">
                    {wallet.disputedSessions} en attente admin
                  </p>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[11px] text-[#5c647a] font-medium">Retraits en cours</p>
                <p className="text-xl font-extrabold text-amber-600 mt-1">{fmt(wallet.withdrawnPending)} F</p>
                <p className="text-[10px] text-[#5c647a] mt-0.5">En traitement</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[11px] text-[#5c647a] font-medium">Retiré</p>
                <p className="text-xl font-extrabold text-blue-600 mt-1">{fmt(wallet.withdrawnTreated)} F</p>
                <p className="text-[10px] text-[#5c647a] mt-0.5">Retraits traités</p>
              </div>
            </div>

            {/* Withdrawals history */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#191c1e]">Historique des retraits</h3>
                <span className="text-xs text-[#5c647a]">{withdrawals.length} demande{withdrawals.length > 1 ? "s" : ""}</span>
              </div>

              {withdrawals.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-gray-300 text-4xl">receipt_long</span>
                  <p className="text-sm text-[#5c647a] mt-2">Aucun retrait demandé.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {withdrawals.map((w) => {
                    const s = STATUS_CONFIG[w.status];
                    return (
                      <div key={w.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[#191c1e]">{fmt(w.amount)} FCFA</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>
                              {s.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5c647a]">
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
                            <p className="text-[11px] text-red-600 mt-1">Motif : {w.refusedReason}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Withdrawal modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <h2 className="text-lg font-extrabold text-[#191c1e]">Demander un retrait</h2>
            <p className="text-xs text-[#5c647a] mt-1">Solde disponible : {fmt(available)} FCFA</p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Méthode</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => setWMethod(m.code)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        wMethod === m.code
                          ? "border-[#006e2f] bg-[#006e2f]/5"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#006e2f]">{m.icon}</span>
                      <span className="text-[10px] font-semibold text-[#191c1e]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Montant (FCFA)</label>
                <input
                  type="number"
                  min={5000}
                  max={available}
                  step={500}
                  value={wAmount}
                  onChange={(e) => setWAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                />
                <p className="text-[10px] text-[#5c647a] mt-1">Min 5 000 · Max {fmt(available)}</p>
              </div>

              {selectedMethod?.needs === "phone" && (
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Numéro de téléphone</label>
                  <input
                    type="tel"
                    value={wPhone}
                    onChange={(e) => setWPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                </div>
              )}
              {selectedMethod?.needs === "email" && (
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Email PayPal</label>
                  <input
                    type="email"
                    value={wEmail}
                    onChange={(e) => setWEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                </div>
              )}
              {selectedMethod?.needs === "bank" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Titulaire du compte</label>
                    <input
                      type="text"
                      value={wHolder}
                      onChange={(e) => setWHolder(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">IBAN</label>
                    <input
                      type="text"
                      value={wIban}
                      onChange={(e) => setWIban(e.target.value)}
                      placeholder="SN08 SN00 …"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {submitting ? "Envoi…" : "Confirmer la demande"}
              </button>
              <p className="text-center text-[10px] text-[#5c647a]">
                Les retraits sont traités sous 24-72h par l&apos;équipe Novakou.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
