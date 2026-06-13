// Refonte design "Stitch" — finances mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : query wallet, modal de retrait, escrow/KYC, méthodes.
"use client";

import { useEffect, useState } from "react";
import {
  StCard,
  StPageHeader,
  StButton,
  StKpiCompact,
  StStatusPill,
  StInput,
  ST,
} from "@/components/stitch";
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
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-64 rounded-xl" style={{ background: "#e9efeb" }} />
          <div className="h-44 rounded-[20px]" style={{ background: "#e9efeb" }} />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded-[18px]" style={{ background: "#e9efeb" }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const selectedMethod = METHODS.find((m) => m.code === wMethod);
  const available = wallet?.available ?? 0;

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes finances"
          subtitle="Suivi de vos revenus, commissions et retraits. Commission plateforme : 10%."
          actions={
            <StButton
              onClick={() => setModalOpen(true)}
              disabled={available < 5000}
              icon={Send}
            >
              Demander un retrait
            </StButton>
          }
        />

        {error && (
          <div className="mb-4 rounded-[13px] px-4 py-3 flex items-start gap-2" style={{ background: ST.roseSoft, border: "1px solid #f3d4de" }}>
            <CircleAlert size={18} style={{ color: ST.roseText }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[13px] font-bold" style={{ color: ST.roseText }}>{error}</p>
          </div>
        )}

        {!wallet ? (
          <StCard className="text-center py-12">
            <Wallet size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>Aucune donnée financière</p>
            <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              Vos premiers revenus apparaîtront ici dès qu&apos;une session sera terminée.
            </p>
          </StCard>
        ) : (
          <>
            {/* KYC banner */}
            {kyc && !kyc.verified && (
              <StCard className="mb-4 !p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0"
                    style={kyc.pending ? { background: ST.amberSoft, color: ST.amberText } : { background: ST.roseSoft, color: ST.roseText }}
                  >
                    {kyc.pending ? <Hourglass size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>
                      {kyc.pending ? "Vérification KYC en cours" : "Vérification KYC requise"}
                    </h3>
                    <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                      {kyc.pending
                        ? "Votre demande est en attente de validation admin."
                        : "Vous ne pouvez pas retirer vos gains sans vérifier votre identité."}
                    </p>
                    {!kyc.pending && (
                      <div className="mt-3">
                        <StButton size="sm" href="/kyc" icon={ShieldCheck}>
                          Soumettre ma vérification
                        </StButton>
                      </div>
                    )}
                  </div>
                </div>
              </StCard>
            )}

            {/* 24h escrow info */}
            <div className="mb-4 rounded-[13px] px-4 py-3 flex items-start gap-2.5" style={{ background: "#f1f8fe", border: "1px solid #cfe3f5" }}>
              <Info size={16} style={{ color: ST.blueText }} className="mt-0.5 flex-shrink-0" />
              <p className="text-[12px] font-semibold" style={{ color: "#0c447c" }}>
                Les fonds des séances terminées sont en attente pendant {wallet.holdPeriodHours}h
                avant d&apos;être disponibles pour retrait. Cela permet à l&apos;apprenant de signaler
                un éventuel problème.
              </p>
            </div>

            {/* Hero balance — gradient vert */}
            <div
              className="relative overflow-hidden rounded-[20px] p-6 text-white mb-4"
              style={{ background: ST.gradient }}
            >
              <div aria-hidden className="absolute rounded-full" style={{ right: -50, top: -60, width: 210, height: 210, background: "rgba(255,255,255,.08)" }} />
              <div aria-hidden className="absolute rounded-full" style={{ right: 60, bottom: -90, width: 170, height: 170, background: "rgba(255,255,255,.07)" }} />
              <div className="relative">
                <p className="text-[12.5px] font-extrabold uppercase tracking-[0.04em] opacity-85">
                  Solde disponible
                </p>
                <p className="text-[32px] md:text-[38px] font-extrabold tracking-[-0.02em] mt-1.5 tabular-nums">
                  {fmt(available)} <span className="text-[17px] font-bold opacity-85">FCFA</span>
                </p>
                <p className="text-[11.5px] font-semibold opacity-80 mt-1">≈ {fmt(available / 655.957)} EUR</p>
                <div className="mt-4">
                  <StButton
                    variant="white"
                    icon={Send}
                    disabled={available < 5000}
                    onClick={() => setModalOpen(true)}
                  >
                    Demander un retrait
                  </StButton>
                </div>
                {available < 5000 && (
                  <p className="text-[10.5px] font-semibold opacity-80 mt-2">
                    Retrait disponible à partir de 5 000 FCFA
                  </p>
                )}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-4">
              <StKpiCompact
                label="Gains nets acquis"
                value={`${fmt(wallet.netEarned)} F`}
                icon={TrendingUp}
                tone="green"
              />
              <StKpiCompact
                label="Gains bruts acquis"
                value={`${fmt(wallet.gross)} F`}
                icon={Receipt}
                tone="green"
              />
              <StKpiCompact
                label="En escrow"
                value={`${fmt(wallet.pendingHold)} F`}
                icon={Hourglass}
                tone="amber"
              />
              <StKpiCompact
                label="Retraits en cours"
                value={`${fmt(wallet.withdrawnPending)} F`}
                icon={HandCoins}
                tone="blue"
              />
              <StKpiCompact
                label="Retiré"
                value={`${fmt(wallet.withdrawnTreated)} F`}
                icon={CheckCircle2}
                tone="green"
              />
            </div>

            {(wallet.disputedSessions ?? 0) > 0 && (
              <StCard className="mb-4 !p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: ST.roseSoft, color: ST.roseText }}>
                    <CircleAlert size={20} />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-extrabold" style={{ color: ST.roseText }}>
                      {fmt(wallet.disputedHold ?? 0)} F en dispute
                    </p>
                    <p className="text-[12px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>
                      {wallet.disputedSessions} session(s) en attente de décision admin
                    </p>
                  </div>
                </div>
              </StCard>
            )}

            {/* Withdrawals history */}
            <StCard className="!p-[18px_20px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[15px] font-extrabold" style={{ color: ST.text }}>Historique des retraits</span>
                <span className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>
                  {withdrawals.length} demande{withdrawals.length > 1 ? "s" : ""}
                </span>
              </div>
              {withdrawals.length === 0 ? (
                <div className="py-10 text-center">
                  <Receipt size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
                  <p className="text-[12.5px] font-bold mt-2.5" style={{ color: ST.textSecondary }}>Aucun retrait demandé.</p>
                </div>
              ) : (
                <div>
                  {withdrawals.map((w, i) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 py-3"
                      style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                            {fmt(w.amount)} FCFA
                          </p>
                          <StStatusPill status={w.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold" style={{ color: ST.textMuted }}>
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
                          <p className="text-[11px] font-semibold mt-1" style={{ color: ST.roseText }}>
                            Motif : {w.refusedReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </StCard>
          </>
        )}
      </main>

      {/* Withdrawal modal — re-skin Stitch */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          style={{ fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
        >
          <div
            className="bg-white rounded-[20px] max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
            style={{ border: `1px solid ${ST.cardBorder}`, boxShadow: "0 18px 50px rgba(16,52,32,.18)" }}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              style={{ color: ST.textSecondary }}
            >
              <X size={16} />
            </button>
            <h2 className="text-[17px] font-extrabold tracking-[-0.01em]" style={{ color: ST.text }}>Demander un retrait</h2>
            <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              Solde disponible : <strong style={{ color: ST.text }}>{fmt(available)} FCFA</strong>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Méthode</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = wMethod === m.code;
                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => setWMethod(m.code)}
                        className="flex flex-col items-center gap-1 p-2 rounded-[12px] transition-all"
                        style={{
                          border: isSelected ? `2px solid ${ST.green}` : `2px solid ${ST.cardBorder}`,
                          background: isSelected ? "#f0faf3" : "#fff",
                        }}
                      >
                        <Icon size={16} style={{ color: ST.green }} />
                        <span className="text-[10px] font-extrabold" style={{ color: ST.text }}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <StInput
                label="Montant (FCFA)"
                type="number"
                min={5000}
                max={available}
                step={500}
                value={wAmount}
                onChange={(e) => setWAmount(Number(e.target.value))}
                required
                hint={`Min 5 000 · Max ${fmt(available)}`}
              />

              {selectedMethod?.needs === "phone" && (
                <StInput
                  label="Numéro de téléphone"
                  type="tel"
                  value={wPhone}
                  onChange={(e) => setWPhone(e.target.value)}
                  placeholder="+221 77 123 45 67"
                  required
                />
              )}
              {selectedMethod?.needs === "email" && (
                <StInput
                  label="Email PayPal"
                  type="email"
                  value={wEmail}
                  onChange={(e) => setWEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                />
              )}
              {selectedMethod?.needs === "bank" && (
                <>
                  <StInput
                    label="Titulaire du compte"
                    type="text"
                    value={wHolder}
                    onChange={(e) => setWHolder(e.target.value)}
                    required
                  />
                  <StInput
                    label="IBAN"
                    type="text"
                    value={wIban}
                    onChange={(e) => setWIban(e.target.value)}
                    placeholder="SN08 SN00 …"
                    required
                  />
                </>
              )}

              <StButton type="submit" disabled={submitting} className="w-full">
                {submitting ? "Envoi…" : "Confirmer la demande"}
              </StButton>
              <p className="text-center text-[10.5px] font-semibold" style={{ color: ST.textMuted }}>
                Les retraits sont traités sous 24-72h par l&apos;équipe Novakou.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
