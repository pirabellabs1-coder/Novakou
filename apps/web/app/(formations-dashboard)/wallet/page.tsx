// Refonte design "Stitch" — maquette Google Stitch validée par Lissanon
// (stich/novakou_revenus_retraits.html), vert Novakou officiel — 2026-06-10.
// Logique préservée : queries wallet + payout-methods, mutation de retrait,
// modal Mobile Money dynamique, wallets vendeur / mentor / affilié.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  Brain,
  Clock,
  Download,
  History,
  Info,
  Send,
  Share2,
  AlertCircle,
} from "lucide-react";
import {
  StCard,
  StPageHeader,
  StButton,
  StStatusPill,
  StInput,
  ST,
} from "@/components/stitch";
import { shortMethodLabel, getAvailablePayoutMethods, isPayoutCountryDisabled, PAYOUT_DISABLED_MESSAGE } from "@/lib/payments/payout-catalog";
import { COUNTRIES } from "@/lib/countries";
import { MIN_WITHDRAWAL_XOF } from "@/lib/payments/payout-catalog";
import { UnifiedPaymentScreen } from "@/components/formations/UnifiedPaymentScreen";
import { getOperator } from "@/lib/payments/registry";

interface VendorWallet {
  instructeurId: string;
  totalEarned: number;
  withdrawn: number;
  available: number;
  // New 24h escrow fields
  gross?: number;
  netEarned?: number;
  pendingHold?: number;
  holdPeriodHours?: number;
  withdrawnPending?: number;
  withdrawnTreated?: number;
  currency: string;
}

interface MentorWallet {
  mentorId: string;
  totalSessions: number;
  gross: number;
  netEarned?: number;
  available: number;
  pendingHold?: number;
  holdPeriodHours?: number;
  withdrawnPending?: number;
  withdrawnTreated?: number;
  currency: string;
}

interface AffiliateWallet {
  id: string;
  affiliateCode: string;
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  status: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
  refusedReason: string | null;
}

interface WalletData {
  vendor: VendorWallet | null;
  vendorWithdrawals: Withdrawal[];
  mentor: MentorWallet | null;
  affiliate: AffiliateWallet | null;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

// Les méthodes sont chargées dynamiquement depuis
// /api/formations/wallet/payout-methods selon le pays du vendeur.

interface PayoutMethodDef {
  id: string;
  label: string;
  icon: string;
  currency: string;
  countries: string[];
  requiredFields: Array<"msisdn" | "account_number">;
  placeholder: Record<string, string>;
  minAmount: number;
  processingTime: string;
  category: "mobile_money";
}

const FIELD_LABELS: Record<string, string> = {
  msisdn: "Numéro Mobile Money",
  account_number: "Numéro de compte",
};

// Normalise un numéro au format msisdn international : chiffres seuls, sans +
function normalizeMsisdn(phone: string): string {
  return phone.replace(/\D/g, "");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** Couleur de marque + initiale pour le carré 38px de la méthode (maquette : Wave = bleu #19b5ec "W"). */

/** Note affichée en bout de ligne dans l'historique (maquette). */
function withdrawalNote(w: Withdrawal): string {
  if (w.status === "REFUSE") return w.refusedReason ?? "Refusé";
  if (w.status === "TRAITE") return w.processedAt ? `Traité le ${fmtDate(w.processedAt)}` : "Traité";
  return "Versement prévu sous 24 h";
}

/** Libellé méthode pour l'historique — "Wave · Mentor" si retrait mentor. */
function withdrawalMethodLabel(method: string): string {
  const isMentor = method.endsWith("_mentor");
  const base = method.replace(/_mentor$/, "");
  return shortMethodLabel(base) + (isMentor ? " · Mentor" : "");
}

// Pays couverts par au moins une méthode de retrait (sélecteur pays, comme au checkout).

// Résout un pays (nom OU code) → code ISO-2 (le profil stocke souvent le nom).
function toCountryCode(v: string | null | undefined): string {
  const raw = (v ?? "").trim();
  if (!raw) return "";
  const up = raw.toUpperCase();
  if (up.length === 2 && COUNTRIES.some((c) => c.code === up)) return up;
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return COUNTRIES.find((c) => norm(c.name) === norm(raw))?.code ?? "";
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * Source du retrait : portefeuille vendeur ou mentor. Ce n'est plus l'état
   * d'ouverture d'une fenêtre — le formulaire est toujours affiché, il n'y a
   * plus de clic à faire pour le voir.
   */
  const [showWithdraw, setShowWithdraw] = useState<"vendor" | "mentor">("vendor");
  const [error, setError] = useState<string | null>(null);

  // Payout methods fetched dynamically from /api/formations/wallet/payout-methods
  const [methods, setMethods] = useState<PayoutMethodDef[]>([]);
  // Pays choisi pour le retrait (par défaut le pays du profil) → filtre les méthodes.
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  // Withdrawal form state — fields is a Record keyed by field name (phone, iban, etc)
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // Confirmation OTP par e-mail (sécurité retrait)
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  async function sendWithdrawalOtp() {
    setSendingOtp(true);
    setError(null);
    try {
      const res = await fetch("/api/formations/wallet/withdrawal-otp", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Envoi du code échoué");
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi du code échoué");
    } finally {
      setSendingOtp(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const [walletRes, methodsRes] = await Promise.all([
        fetch("/api/formations/wallet"),
        fetch("/api/formations/wallet/payout-methods"),
      ]);
      const walletJson = await walletRes.json();
      setData(walletJson.data ?? null);

      const methodsJson = await methodsRes.json();
      // Pays par défaut = celui du profil, simple pré-sélection dans l'écran.
      setSelectedCountry(toCountryCode(methodsJson.data?.userCountry ?? null));
      // On garde TOUS les moyens versables, pas seulement ceux du pays du
      // profil : le vendeur peut retirer vers un autre pays, et la résolution
      // du moyen choisi doit alors aboutir. Filtrée par pays, cette liste
      // renvoyait « introuvable » et le bouton de retrait ne faisait rien.
      setMethods(getAvailablePayoutMethods(null) as PayoutMethodDef[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMethod = methods.find((m) => m.id === method);
  // Pays de retrait pas encore ouvert (SN / CM / CI) → bloque la demande.
  const countryDisabled = isPayoutCountryDisabled(selectedCountry);

  // Changement de pays → recalcule les méthodes disponibles (comme au checkout).

  /** Bascule la source du retrait et pré-remplit le montant disponible. */
  function openWithdrawDialog(source: "vendor" | "mentor") {
    if (!data) return;
    const wallet = source === "vendor" ? data.vendor : data.mentor;
    setAmount(wallet?.available ?? 0);
    setShowWithdraw(source);
    setError(null);
    // Le formulaire est plus bas dans la page : on y amène la personne plutôt
    // que de la laisser chercher ce qui vient de changer.
    document.getElementById("formulaire-retrait")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleWithdraw() {
    if (!showWithdraw || submitting || !selectedMethod) return;
    if (isPayoutCountryDisabled(selectedCountry)) {
      setError(PAYOUT_DISABLED_MESSAGE);
      return;
    }
    setSubmitting(true);
    setError(null);

    // Valide que tous les champs requis sont remplis
    const accountDetails: Record<string, string> = {};
    const missing: string[] = [];
    for (const f of selectedMethod.requiredFields) {
      const val = (fields[f] ?? "").trim();
      if (!val) {
        missing.push(FIELD_LABELS[f] || f);
      } else {
        // Pour msisdn, on normalise en digits only
        accountDetails[f] = f === "msisdn" ? normalizeMsisdn(val) : val;
      }
    }
    // Pays du retrait → visible par l'admin dans les coordonnées.
    if (selectedCountry) accountDetails.country = selectedCountry;
    if (missing.length > 0) {
      setError(`Champs requis : ${missing.join(", ")}`);
      setSubmitting(false);
      return;
    }
    if (amount < selectedMethod.minAmount) {
      setError(`Montant minimum pour ${selectedMethod.label} : ${selectedMethod.minAmount} FCFA`);
      setSubmitting(false);
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Saisissez le code de confirmation reçu par e-mail.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/formations/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: selectedMethod.id,
          accountDetails,
          source: showWithdraw,
          otp: otp.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Erreur lors de la demande");
      }
      setAmount(0);
      setFields({});
      setOtp("");
      setOtpSent(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  /** Export CSV de l'historique des retraits. */
  function exportCsv() {
    if (!data || data.vendorWithdrawals.length === 0) return;
    const rows = [
      ["Date", "Méthode", "Montant (FCFA)", "Statut", "Note"],
      ...data.vendorWithdrawals.map((w) => [
        fmtDate(w.createdAt),
        withdrawalMethodLabel(w.method),
        String(Math.round(w.amount)),
        w.status,
        withdrawalNote(w),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    // ﻿ = BOM pour qu'Excel ouvre le CSV en UTF-8
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "retraits-novakou.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="max-w-[1400px] mx-auto px-5 md:px-7 py-6 md:py-7 animate-pulse">
          <div className="h-8 w-64 rounded-xl mb-5" style={{ background: "#e9efeb" }} />
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5 mb-4">
            <div className="h-[230px] rounded-[20px]" style={{ background: "#e9efeb" }} />
            <div className="flex flex-col gap-3.5">
              <div className="h-[120px] rounded-[18px]" style={{ background: "#e9efeb" }} />
              <div className="h-[96px] rounded-[18px]" style={{ background: "#e9efeb" }} />
            </div>
          </div>
          <div className="h-64 rounded-[18px]" style={{ background: "#e9efeb" }} />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-8 text-center" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <p className="text-[13px] font-semibold" style={{ color: ST.textSecondary }}>Erreur de chargement.</p>
      </div>
    );
  }

  const totalAvailable = (data.vendor?.available ?? 0) + (data.mentor?.available ?? 0);

  // MentorWallet utilise `gross`/`netEarned` au lieu de `totalEarned`,
  // et `withdrawnPending`+`withdrawnTreated` au lieu de `withdrawn`.
  const totalEntrees = (data.vendor?.netEarned ?? data.vendor?.totalEarned ?? 0) +
    (data.mentor?.netEarned ?? data.mentor?.gross ?? 0) +
    (data.affiliate?.totalEarned ?? 0);
  const totalPending = (data.vendor?.pendingHold ?? 0) + (data.mentor?.pendingHold ?? 0);

  // Source du bouton "Retirer mes fonds" du hero : vendeur prioritaire, mentor sinon.
  const heroSource: "vendor" | "mentor" | null = data.vendor ? "vendor" : data.mentor ? "mentor" : null;
  const heroAvailable = heroSource === "vendor" ? data.vendor!.available : heroSource === "mentor" ? data.mentor!.available : 0;


  // Ces trois lignes décrivent ce qui se passe VRAIMENT. Elles annonçaient un
  // « contrôle de sécurité » qui n'existe plus — le versement est automatique —
  // et des « frais 1 % » que rien ne prélève dans le code, alors que l'écran
  // affilié affiche « Frais : 0 FCFA » juste à côté.
  const howSteps: [string, string][] = [
    ["Choisissez et demandez", `Votre pays, votre moyen, votre numéro — dès ${fmt(MIN_WITHDRAWAL_XOF)} FCFA`],
    ["Confirmez par e-mail", "Un code à six chiffres, pour que personne d'autre ne retire à votre place"],
    ["Recevez vos fonds", "Versement automatique sur votre Mobile Money · sans frais"],
  ];

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="max-w-[1400px] mx-auto px-5 md:px-7 py-6 md:py-7">
        <StPageHeader
          title="Revenus & retraits"
          subtitle="Votre argent, disponible quand vous le voulez — directement sur Mobile Money."
        />

        {/* ── Bandeau escrow 24h (logique préservée) ── */}
        {totalPending > 0 && (
          <div
            className="flex items-start gap-2.5 rounded-[13px] px-4 py-3 mb-4"
            style={{ background: "#f1f8fe", border: "1px solid #cfe3f5" }}
          >
            <Info size={16} style={{ color: ST.blueText }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[12px] font-semibold" style={{ color: "#0c447c" }}>
              Les fonds des ventes récentes sont en attente pendant{" "}
              {data.vendor?.holdPeriodHours ?? data.mentor?.holdPeriodHours ?? 24}h avant d&apos;être disponibles pour retrait.
              Cela permet aux acheteurs de signaler un éventuel problème.
            </p>
          </div>
        )}

        {/* ── Grille hero 1.55fr / 1fr (maquette) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5 mb-4">
          {/* Hero gradient vert — solde disponible */}
          <div
            className="relative overflow-hidden rounded-[20px] p-6 md:px-[26px] text-white"
            style={{ background: ST.gradient }}
          >
            <div aria-hidden className="absolute rounded-full" style={{ right: -50, top: -60, width: 210, height: 210, background: "rgba(255,255,255,.08)" }} />
            <div aria-hidden className="absolute rounded-full" style={{ right: 60, bottom: -90, width: 170, height: 170, background: "rgba(255,255,255,.07)" }} />
            <div className="relative">
              <div className="text-[12.5px] font-extrabold uppercase tracking-[0.04em] opacity-85">
                Solde disponible
              </div>
              <div className="text-[32px] md:text-[38px] font-extrabold tracking-[-0.02em] mt-1.5 mb-[18px] tabular-nums">
                {fmt(totalAvailable)} <span className="text-[17px] font-bold opacity-85">FCFA</span>
              </div>
              <div className="flex flex-wrap gap-y-3 mb-[22px]">
                <div className="pr-[26px]">
                  <div className="text-[11px] font-bold opacity-80">En attente de validation</div>
                  <div className="text-[16.5px] font-extrabold tabular-nums">{fmt(totalPending)} FCFA</div>
                </div>
                <div className="pl-[26px]" style={{ borderLeft: "1px solid rgba(255,255,255,.25)" }}>
                  <div className="text-[11px] font-bold opacity-80">Total gagné depuis le début</div>
                  <div className="text-[16.5px] font-extrabold tabular-nums">{fmt(totalEntrees)} FCFA</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <StButton
                  variant="white"
                  icon={ArrowDown}
                  disabled={!heroSource || heroAvailable < MIN_WITHDRAWAL_XOF}
                  onClick={() => heroSource && openWithdrawDialog(heroSource)}
                >
                  Retirer mes fonds
                </StButton>
                {heroSource && heroAvailable < MIN_WITHDRAWAL_XOF && (
                  // Un bouton grisé sans explication laisse le vendeur croire
                  // que le retrait est cassé. On dit ce qui manque.
                  <p className="w-full text-[12px] font-bold opacity-90 mt-1">
                    Retrait possible à partir de {fmt(MIN_WITHDRAWAL_XOF)} FCFA — il vous
                    manque {fmt(MIN_WITHDRAWAL_XOF - heroAvailable)} FCFA.
                  </p>
                )}
                <Link
                  href="/vendeur/transactions"
                  className="inline-flex items-center justify-center font-extrabold text-[13.5px] rounded-[12px] px-4 py-2.5 text-white transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,.45)" }}
                >
                  Voir le relevé
                </Link>
              </div>
            </div>
          </div>

          {/* Colonne droite : méthode de retrait + comment ça marche */}
          <div className="flex flex-col gap-3.5">
            {/* Le retrait, EN DIRECT sur la page.
                Il vivait dans une fenêtre modale, derrière un « moyen par
                défaut » enregistré dans les paramètres — un réglage qui ne
                pilotait plus rien, puisque le retrait redemande tout. On
                choisit désormais son pays et son moyen ici, exactement comme
                à l'achat, sans clic préalable et sans réglage à gérer. */}
            <div id="formulaire-retrait">
            <StCard className="!p-[17px_19px]">
              <h2 className="text-[17px] font-extrabold tracking-[-0.01em]" style={{ color: ST.text }}>
                Retrait {showWithdraw === "mentor" ? "mentor" : "vendeur"}
              </h2>
              <p className="text-[12.5px] font-semibold mt-0.5 mb-5" style={{ color: ST.textSecondary }}>
                Disponible :{" "}
                <strong style={{ color: ST.text }}>
                  {fmt(
                    showWithdraw === "vendor"
                      ? data.vendor?.available ?? 0
                      : data.mentor?.available ?? 0
                  )}{" "}
                  FCFA
                </strong>
              </p>

              {error && (
                <div
                  className="mb-4 rounded-[13px] px-3.5 py-3 flex items-start gap-2"
                  style={{ background: ST.roseSoft, border: "1px solid #f3d4de" }}
                >
                  <AlertCircle size={16} style={{ color: ST.roseText }} className="mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] font-bold" style={{ color: ST.roseText }}>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Choix du pays, du moyen et du numéro : EXACTEMENT le composant
                    de l'écran de paiement, en sens « versement ». Un second écran
                    aurait divergé du premier au premier correctif — ici les deux
                    ne peuvent pas se contredire, c'est le même code. */}
                <UnifiedPaymentScreen
                  direction="payout"
                  embedded
                  hideSubmit
                  amount={amount}
                  defaultCountry={selectedCountry || null}
                  onPay={() => {}}
                  onSelectionChange={(sel) => {
                    if (!sel) { setMethod(""); setFields({}); return; }
                    setMethod(sel.operator);
                    setFields(sel.phone ? { msisdn: sel.phone } : {});
                    // Le pays vient du moyen retenu : c'est la seule source qui ne
                    // peut pas se désynchroniser de ce que le vendeur a cliqué.
                    const pays = getOperator(sel.operator)?.country;
                    if (pays) setSelectedCountry(pays.toUpperCase());
                  }}
                />

                <StInput
                  label="Montant (FCFA)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={MIN_WITHDRAWAL_XOF}
                  max={
                    showWithdraw === "vendor"
                      ? data.vendor?.available ?? 0
                      : data.mentor?.available ?? 0
                  }
                  step={500}
                  hint={`Minimum : ${fmt(MIN_WITHDRAWAL_XOF)} FCFA`}
                />

                {selectedMethod && (
                  <div
                    className="rounded-[13px] p-3 flex items-start gap-2.5"
                    style={{ background: "#f1f8fe", border: "1px solid #cfe3f5" }}
                  >
                    <Clock size={15} style={{ color: ST.blueText }} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-[12px]" style={{ color: "#0c447c" }}>
                      <p className="font-extrabold">Délai : {selectedMethod.processingTime}</p>
                      <p className="font-semibold mt-0.5">
                        Montant min {fmt(selectedMethod.minAmount)} FCFA · Versement automatique, sans validation admin
                      </p>
                    </div>
                  </div>
                )}

                {/* Confirmation par e-mail (sécurité) */}
                <div className="rounded-xl border p-3" style={{ borderColor: ST.cardBorder, background: ST.bg }}>
                  <p className="text-[12px] font-extrabold mb-2" style={{ color: ST.text }}>
                    Confirmation par e-mail
                  </p>
                  {!otpSent ? (
                    <StButton
                      variant="secondary"
                      className="w-full"
                      disabled={sendingOtp || countryDisabled}
                      onClick={sendWithdrawalOtp}
                    >
                      {sendingOtp ? "Envoi du code…" : "Recevoir le code par e-mail"}
                    </StButton>
                  ) : (
                    <>
                      <input
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Code à 6 chiffres"
                        className="w-full rounded-lg border px-3 py-2.5 text-center text-lg font-extrabold tracking-[0.4em] tabular-nums outline-none"
                        style={{ borderColor: ST.cardBorder, color: ST.text }}
                      />
                      <button
                        onClick={sendWithdrawalOtp}
                        disabled={sendingOtp}
                        className="mt-1.5 text-[11px] font-bold hover:underline"
                        style={{ color: ST.green }}
                      >
                        {sendingOtp ? "Renvoi…" : "Renvoyer le code"}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <StButton
                    className="flex-1"
                    icon={Send}
                    disabled={submitting || !amount || otp.trim().length !== 6 || countryDisabled}
                    onClick={handleWithdraw}
                  >
                    {submitting ? "Envoi…" : `Demander ${fmt(amount)} FCFA`}
                  </StButton>
                </div>
              </div>
            </StCard>
            </div>

            <StCard className="!p-[17px_19px]">
              <div className="text-[13.5px] font-extrabold mb-[11px]" style={{ color: ST.text }}>
                Comment ça marche ?
              </div>
              <div className="flex flex-col gap-[9px]">
                {howSteps.map(([title, sub], i) => (
                  <div key={title} className="flex gap-[11px] items-start">
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 mt-[1px]"
                      style={{ background: ST.greenSoft, color: ST.green }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-[12px] font-extrabold" style={{ color: ST.text }}>{title}</div>
                      <div className="text-[11px] font-semibold" style={{ color: "#7d9486" }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </StCard>
          </div>
        </div>

        {/* ── Wallets secondaires : mentor + affiliation (logique préservée) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
          {/* Mentor wallet */}
          <StCard className="!p-[17px_19px]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: ST.blueSoft, color: ST.blueText }}>
                <Brain size={19} />
              </div>
              <div>
                <div className="text-[13px] font-extrabold" style={{ color: ST.text }}>Espace Mentor</div>
                <div className="text-[11px] font-semibold" style={{ color: ST.textMuted }}>Séances 1:1</div>
              </div>
            </div>
            {data.mentor ? (
              <>
                <div className="text-[19px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                  {fmt(data.mentor.available)} <span className="text-[12px]" style={{ color: ST.textMuted }}>FCFA disponibles (90 % net)</span>
                </div>
                <div className="text-[11.5px] font-bold mt-1 mb-3" style={{ color: ST.textSecondary }}>
                  {(data.mentor.pendingHold ?? 0) > 0 && (
                    <>En attente ({data.mentor.holdPeriodHours ?? 24} h) : {fmt(data.mentor.pendingHold ?? 0)} FCFA · </>
                  )}
                  {data.mentor.totalSessions} séance{data.mentor.totalSessions > 1 ? "s" : ""} terminée{data.mentor.totalSessions > 1 ? "s" : ""}
                </div>
                <StButton
                  size="sm"
                  variant="ghost-green"
                  icon={ArrowDown}
                  disabled={data.mentor.available < MIN_WITHDRAWAL_XOF}
                  onClick={() => openWithdrawDialog("mentor")}
                >
                  Retirer mes gains mentor
                </StButton>
              </>
            ) : (
              <p className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                Aucun profil mentor.{" "}
                <Link href="/inscription?role=mentor" className="font-extrabold hover:underline" style={{ color: ST.green }}>
                  Devenir mentor
                </Link>
              </p>
            )}
          </StCard>

          {/* Affiliate wallet */}
          <StCard className="!p-[17px_19px]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: ST.amberSoft, color: ST.amberText }}>
                <Share2 size={19} />
              </div>
              <div>
                <div className="text-[13px] font-extrabold" style={{ color: ST.text }}>Affiliation</div>
                <div className="text-[11px] font-semibold" style={{ color: ST.textMuted }}>Commissions parrainage</div>
              </div>
            </div>
            {data.affiliate ? (
              <>
                <div className="text-[19px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                  {fmt(data.affiliate.pendingEarnings)} <span className="text-[12px]" style={{ color: ST.textMuted }}>FCFA en attente</span>
                </div>
                <div className="text-[11.5px] font-bold mt-1 mb-3" style={{ color: ST.textSecondary }}>
                  {data.affiliate.totalConversions} conversion{data.affiliate.totalConversions > 1 ? "s" : ""} ·{" "}
                  Total : {fmt(data.affiliate.totalEarned)} FCFA
                </div>
                <StButton size="sm" variant="ghost-green" href="/affilie/retraits">
                  Voir les retraits
                </StButton>
              </>
            ) : (
              <p className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                Aucun profil affilié.{" "}
                <Link href="/affiliation" className="font-extrabold hover:underline" style={{ color: ST.green }}>
                  Rejoindre
                </Link>
              </p>
            )}
          </StCard>
        </div>

        {/* ── Historique des retraits (pleine largeur, maquette) ── */}
        <StCard className="!p-[18px_20px]">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[15px] font-extrabold" style={{ color: ST.text }}>Historique des retraits</span>
            {data.vendorWithdrawals.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1 text-[12px] font-extrabold hover:underline"
                style={{ color: ST.green }}
              >
                <Download size={13} />
                Exporter CSV
              </button>
            )}
          </div>
          {data.vendorWithdrawals.length === 0 ? (
            <div className="py-10 text-center">
              <History size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
              <p className="text-[12.5px] font-bold mt-2.5" style={{ color: ST.textSecondary }}>
                Aucun retrait pour l&apos;instant.
              </p>
              <p className="text-[11.5px] font-semibold mt-1" style={{ color: ST.textMuted }}>
                Vos demandes de retrait apparaîtront ici.
              </p>
            </div>
          ) : (
            <div>
              {data.vendorWithdrawals.map((w, i) => (
                <div
                  key={w.id}
                  className="grid grid-cols-2 md:grid-cols-[1.1fr_1.7fr_1fr_1.1fr_1.4fr] gap-x-2.5 gap-y-1 md:items-center py-3"
                  style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                >
                  <span className="text-[12.5px] font-extrabold" style={{ color: ST.text }}>
                    {fmtDate(w.createdAt)}
                  </span>
                  <span className="text-[12px] font-bold text-right md:text-left truncate" style={{ color: ST.textSecondary }}>
                    {withdrawalMethodLabel(w.method)}
                  </span>
                  <span className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                    {fmt(w.amount)} <span className="text-[10.5px]" style={{ color: ST.textFaint }}>FCFA</span>
                  </span>
                  <span className="justify-self-end md:justify-self-start">
                    <StStatusPill status={w.status} />
                  </span>
                  <span className="col-span-2 md:col-span-1 text-[11.5px] font-semibold md:text-right" style={{ color: ST.textMuted }}>
                    {withdrawalNote(w)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </StCard>
      </main>

    </div>
  );
}
