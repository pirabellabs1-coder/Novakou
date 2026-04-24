"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

// Les méthodes sont maintenant chargées dynamiquement depuis
// /api/formations/wallet/payout-methods selon le pays du vendeur.

interface PayoutMethodDef {
  id: string;
  label: string;
  icon: string;
  currency: string;
  countries: string[];
  requiredFields: Array<"phone" | "iban" | "bic" | "bank_name" | "account_holder" | "email">;
  placeholder: Record<string, string>;
  minAmount: number;
  processingTime: string;
  category: "mobile_money" | "bank" | "international";
}

const FIELD_LABELS: Record<string, string> = {
  phone: "Numéro de téléphone",
  iban: "IBAN",
  bic: "BIC / SWIFT",
  bank_name: "Nom de la banque",
  account_holder: "Titulaire du compte",
  email: "Email",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    EN_ATTENTE: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
    TRAITE: { label: "Traité", cls: "bg-green-100 text-green-700" },
    REFUSE: { label: "Refusé", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState<"vendor" | "mentor" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Payout methods fetched dynamically from /api/formations/wallet/payout-methods
  const [methods, setMethods] = useState<PayoutMethodDef[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // Withdrawal form state — fields is a Record keyed by field name (phone, iban, etc)
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
      const list = (methodsJson.data?.methods ?? []) as PayoutMethodDef[];
      setMethods(list);
      setUserCountry(methodsJson.data?.userCountry ?? null);
      // Presélectionne la première méthode dispo (en général Wave ou Orange Money selon pays)
      if (list.length > 0 && !method) setMethod(list[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMethod = methods.find((m) => m.id === method);

  function openWithdrawDialog(source: "vendor" | "mentor") {
    if (!data) return;
    const wallet = source === "vendor" ? data.vendor : data.mentor;
    setAmount(wallet?.available ?? 0);
    setShowWithdraw(source);
    setError(null);
  }

  async function handleWithdraw() {
    if (!showWithdraw || submitting || !selectedMethod) return;
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
        accountDetails[f] = val;
      }
    }
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

    try {
      const res = await fetch("/api/formations/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: selectedMethod.id,
          accountDetails,
          source: showWithdraw,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Erreur lors de la demande");
      }
      setShowWithdraw(null);
      setFields({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-xl mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#5c647a]">Erreur de chargement.</p>
      </div>
    );
  }

  const totalAvailable = (data.vendor?.available ?? 0) + (data.mentor?.available ?? 0);

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes revenus & retraits</h1>
        </div>
        <p className="text-sm text-[#5c647a] mb-5">
          Suivez vos gains et demandez vos retraits vers Mobile Money, virement bancaire ou PayPal.
        </p>

        {/* ── 24h escrow info banner ──────────────────────────────────────── */}
        {((data.vendor?.pendingHold ?? 0) > 0 || (data.mentor?.pendingHold ?? 0) > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-5">
            <span className="material-symbols-outlined text-blue-500 text-[18px] mt-0.5">info</span>
            <p className="text-xs text-blue-900">
              Les fonds des ventes récentes sont en attente pendant{" "}
              {data.vendor?.holdPeriodHours ?? data.mentor?.holdPeriodHours ?? 24}h avant d&apos;être disponibles pour retrait.
              Cela permet aux acheteurs de signaler un éventuel problème.
            </p>
          </div>
        )}

        {/* ── Hero card with total available ──────────────────────────────── */}
        <div
          className="rounded-3xl p-7 md:p-10 mb-6 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">
              Total disponible au retrait
            </p>
            <p className="text-4xl md:text-5xl font-extrabold mb-2">
              {fmt(totalAvailable)} <span className="text-2xl font-bold opacity-80">FCFA</span>
            </p>
            <p className="text-sm text-white/80">
              ≈ {Math.round(totalAvailable / 655.957)} EUR · Tous espaces confondus
            </p>
          </div>
        </div>

        {/* ── Wallets grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Vendor wallet */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#006e2f]/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[#006e2f] text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  store
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#191c1e]">Boutique active</p>
                <p className="text-[10px] text-[#5c647a]">Revenus formations + produits</p>
              </div>
            </div>
            {data.vendor ? (
              <>
                <p className="text-2xl font-extrabold text-[#191c1e]">
                  {fmt(data.vendor.available)}
                </p>
                <p className="text-[10px] text-[#5c647a] mb-2">FCFA disponibles (95% net)</p>
                {(data.vendor.pendingHold ?? 0) > 0 && (
                  <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-2 py-1.5 mb-2">
                    <span className="text-[10px] text-orange-700 font-medium">
                      En attente ({data.vendor.holdPeriodHours ?? 24}h)
                    </span>
                    <span className="text-[11px] font-extrabold text-orange-700">
                      {fmt(data.vendor.pendingHold ?? 0)} F
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-[#5c647a] mb-3">
                  <span>Total gagné : {fmt(data.vendor.netEarned ?? data.vendor.totalEarned)}</span>
                  <span>Retiré : {fmt(data.vendor.withdrawn)}</span>
                </div>
                <button
                  disabled={data.vendor.available < 1000}
                  onClick={() => openWithdrawDialog("vendor")}
                  className="w-full py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  Retirer
                </button>
              </>
            ) : (
              <p className="text-xs text-[#5c647a]">
                Aucun profil vendeur. Créez un produit pour commencer à gagner.
              </p>
            )}
          </div>

          {/* Mentor wallet */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-purple-600 text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#191c1e]">Espace Mentor</p>
                <p className="text-[10px] text-[#5c647a]">Séances 1:1</p>
              </div>
            </div>
            {data.mentor ? (
              <>
                <p className="text-2xl font-extrabold text-[#191c1e]">{fmt(data.mentor.available)}</p>
                <p className="text-[10px] text-[#5c647a] mb-2">FCFA disponibles (95% net)</p>
                {(data.mentor.pendingHold ?? 0) > 0 && (
                  <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-2 py-1.5 mb-2">
                    <span className="text-[10px] text-orange-700 font-medium">
                      En attente ({data.mentor.holdPeriodHours ?? 24}h)
                    </span>
                    <span className="text-[11px] font-extrabold text-orange-700">
                      {fmt(data.mentor.pendingHold ?? 0)} F
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-[#5c647a] mb-3">
                  {data.mentor.totalSessions} séance{data.mentor.totalSessions > 1 ? "s" : ""} terminée{data.mentor.totalSessions > 1 ? "s" : ""}
                </p>
                <button
                  disabled={data.mentor.available < 1000}
                  onClick={() => openWithdrawDialog("mentor")}
                  className="w-full py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ background: "linear-gradient(to right, #6b21a8, #a855f7)" }}
                >
                  Retirer
                </button>
              </>
            ) : (
              <p className="text-xs text-[#5c647a]">
                Aucun profil mentor.{" "}
                <Link href="/inscription?role=mentor" className="text-[#006e2f] font-semibold">
                  Devenir mentor
                </Link>
              </p>
            )}
          </div>

          {/* Affiliate wallet */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-amber-600 text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  share
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#191c1e]">Affiliation</p>
                <p className="text-[10px] text-[#5c647a]">Commissions parrainage</p>
              </div>
            </div>
            {data.affiliate ? (
              <>
                <p className="text-2xl font-extrabold text-[#191c1e]">
                  {fmt(data.affiliate.pendingEarnings)}
                </p>
                <p className="text-[10px] text-[#5c647a] mb-3">FCFA en attente</p>
                <p className="text-[10px] text-[#5c647a] mb-3">
                  {data.affiliate.totalConversions} conversion{data.affiliate.totalConversions > 1 ? "s" : ""} ·{" "}
                  Total : {fmt(data.affiliate.totalEarned)} F
                </p>
                <Link
                  href="/affilie/retraits"
                  className="block w-full py-2.5 rounded-xl text-white text-xs font-bold text-center hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(to right, #d97706, #f59e0b)" }}
                >
                  Voir les retraits
                </Link>
              </>
            ) : (
              <p className="text-xs text-[#5c647a]">
                Aucun profil affilié.{" "}
                <Link href="/affiliation" className="text-[#006e2f] font-semibold">
                  Rejoindre
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* ── Withdrawal history ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#191c1e]">Historique des retraits</h2>
          </div>
          {data.vendorWithdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl">history</span>
              <p className="text-sm text-[#5c647a] mt-2">Aucun retrait pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.vendorWithdrawals.map((w) => (
                <div key={w.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#006e2f] text-[18px]">payments</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#191c1e]">{fmt(w.amount)} FCFA</p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-xs text-[#5c647a]">
                      {w.method.replace("_mentor", " (mentor)")} · {fmtDate(w.createdAt)}
                    </p>
                    {w.refusedReason && (
                      <p className="text-[10px] text-red-600 mt-0.5">{w.refusedReason}</p>
                    )}
                  </div>
                  {w.processedAt && (
                    <span className="text-[10px] text-[#5c647a] flex-shrink-0">
                      Traité le {fmtDate(w.processedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Withdraw dialog ───────────────────────────────────────────────── */}
      {showWithdraw && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowWithdraw(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold text-[#191c1e] mb-1">
              Retrait{" "}
              {showWithdraw === "mentor" ? "mentor" : "vendeur"}
            </h2>
            <p className="text-sm text-[#5c647a] mb-5">
              Disponible :{" "}
              <strong>
                {fmt(
                  showWithdraw === "vendor"
                    ? data.vendor?.available ?? 0
                    : data.mentor?.available ?? 0
                )}{" "}
                FCFA
              </strong>
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={1000}
                  max={
                    showWithdraw === "vendor"
                      ? data.vendor?.available ?? 0
                      : data.mentor?.available ?? 0
                  }
                  step={500}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                />
                <p className="text-[10px] text-[#5c647a] mt-1">Minimum : 1 000 FCFA</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                  Méthode de retrait
                  {userCountry && (
                    <span className="text-[10px] font-normal text-[#5c647a] ml-1">
                      (disponibles dans votre pays : {userCountry})
                    </span>
                  )}
                </label>
                {methods.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                    Aucune méthode de retrait disponible pour votre pays. Configurez
                    votre pays dans <strong>Paramètres → Compte</strong>.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setMethod(m.id); setFields({}); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left text-xs transition-colors ${
                          method === m.id
                            ? "border-[#006e2f] bg-[#006e2f]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#006e2f] flex-shrink-0">{m.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#191c1e] truncate">{m.label}</p>
                          <p className="text-[9px] text-[#5c647a] truncate">{m.processingTime}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Champs dynamiques selon la méthode sélectionnée */}
              {selectedMethod && selectedMethod.requiredFields.map((f) => (
                <div key={f}>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                    {FIELD_LABELS[f] || f}
                  </label>
                  <input
                    type={f === "email" ? "email" : f === "phone" ? "tel" : "text"}
                    value={fields[f] ?? ""}
                    onChange={(e) => setFields((prev) => ({ ...prev, [f]: e.target.value }))}
                    placeholder={selectedMethod.placeholder[f] ?? ""}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                </div>
              ))}

              {selectedMethod && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[16px] mt-0.5">
                    schedule
                  </span>
                  <div className="flex-1 text-xs text-blue-900">
                    <p className="font-bold">Délai : {selectedMethod.processingTime}</p>
                    <p className="mt-0.5">
                      Montant min {selectedMethod.minAmount} FCFA · Paiement via Moneroo après validation admin
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowWithdraw(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={submitting || !amount}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Envoi…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      Demander {fmt(amount)} F
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
