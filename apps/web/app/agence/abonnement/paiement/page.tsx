"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------
interface PlanInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualMonthly: number;
  commission: string;
}

const PLANS: Record<string, PlanInfo> = {
  free: { id: "free", name: "Gratuit", monthlyPrice: 0, annualPrice: 0, annualMonthly: 0, commission: "20%" },
  pro: { id: "pro", name: "Pro", monthlyPrice: 15, annualPrice: 144, annualMonthly: 12, commission: "15%" },
  business: { id: "business", name: "Business", monthlyPrice: 45, annualPrice: 432, annualMonthly: 36, commission: "10%" },
  agence: { id: "agence", name: "Agence", monthlyPrice: 99, annualPrice: 948, annualMonthly: 79, commission: "8%" },
};

// ---------------------------------------------------------------------------
// Payment methods
// ---------------------------------------------------------------------------
interface PaymentMethod {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  disabled?: boolean;
  disabledReason?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "balance", label: "Solde plateforme", sublabel: "Solde : 0,00 EUR", icon: "account_balance_wallet", disabled: true, disabledReason: "Solde insuffisant" },
  { id: "card", label: "Carte bancaire", sublabel: "Visa / Mastercard", icon: "credit_card" },
  { id: "mobile_money", label: "Mobile Money", sublabel: "Orange Money, Wave, MTN MoMo", icon: "smartphone" },
  { id: "paypal", label: "PayPal", sublabel: "Paiement securise", icon: "account_balance" },
  { id: "bank_transfer", label: "Virement bancaire", sublabel: "SEPA / Virement international", icon: "account_balance" },
];

// ---------------------------------------------------------------------------
// Inner component that uses useSearchParams
// ---------------------------------------------------------------------------
function PaiementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = searchParams.get("plan") || "agence";
  const billingParam = searchParams.get("billing") as "monthly" | "annual" | null;
  const billing = billingParam === "annual" ? "annual" : "monthly";

  const plan = PLANS[planId] || PLANS.agence;
  const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const monthlyEquivalent = billing === "annual" ? plan.annualMonthly : plan.monthlyPrice;
  const savings = billing === "annual" ? (plan.monthlyPrice * 12) - plan.annualPrice : 0;

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = useCallback(async () => {
    if (!selectedMethod || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          billing,
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Une erreur est survenue lors du paiement.");
        setLoading(false);
        return;
      }

      // Redirect to agence confirmation
      const params = new URLSearchParams({
        plan: plan.id,
        billing,
        amount: price.toString(),
        nextBilling: data.nextBillingDate || "",
      });
      router.push(`/agence/abonnement/confirmation?${params.toString()}`);
    } catch {
      setError("Erreur de connexion. Veuillez reessayer.");
      setLoading(false);
    }
  }, [selectedMethod, loading, plan.id, billing, price, router]);

  // Free plan — no payment needed
  if (plan.id === "free") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-400">check</span>
        </div>
        <h2 className="text-xl font-extrabold text-white mb-2">Plan Gratuit</h2>
        <p className="text-sm text-slate-400 mb-6">
          Le plan Gratuit ne necessite aucun paiement. Vous pouvez l&apos;activer directement.
        </p>
        <button
          onClick={() => router.push("/agence/abonnement")}
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 transition-all"
        >
          Retour aux plans
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/agence/abonnement")}
          className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/[0.06] transition-colors"
        >
          <span className="material-symbols-outlined text-lg text-slate-400">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Paiement</h2>
          <p className="text-sm text-slate-400">Finalisez votre abonnement au plan {plan.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — Payment methods */}
        <div className="lg:col-span-3 space-y-5">
          {/* Payment method selection */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">payments</span>
              Methode de paiement
            </h3>
            <div className="space-y-2.5">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => !method.disabled && setSelectedMethod(method.id)}
                  disabled={method.disabled}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    method.disabled
                      ? "border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed"
                      : selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  )}
                >
                  {/* Radio indicator */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      method.disabled
                        ? "border-white/10"
                        : selectedMethod === method.id
                        ? "border-primary"
                        : "border-white/20"
                    )}
                  >
                    {selectedMethod === method.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedMethod === method.id
                        ? "bg-primary/20"
                        : "bg-white/[0.05]"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-xl",
                        selectedMethod === method.id ? "text-primary" : "text-slate-400"
                      )}
                    >
                      {method.icon}
                    </span>
                  </div>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{method.label}</p>
                    {method.sublabel && (
                      <p className="text-xs text-slate-500 mt-0.5">{method.sublabel}</p>
                    )}
                    {method.disabled && method.disabledReason && (
                      <p className="text-xs text-amber-400 mt-0.5">{method.disabledReason}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-400 text-lg flex-shrink-0 mt-0.5">error</span>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Security notice */}
          <div className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <span className="material-symbols-outlined text-emerald-400 text-lg flex-shrink-0 mt-0.5">verified_user</span>
            <div>
              <p className="text-xs font-semibold text-slate-300">Paiement securise</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Vos informations de paiement sont chiffrees et protegees. Aucune donnee bancaire n&apos;est stockee sur nos serveurs.
              </p>
            </div>
          </div>
        </div>

        {/* Right column — Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 sticky top-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">receipt_long</span>
              Recapitulatif
            </h3>

            {/* Plan details */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-base">bolt</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Plan {plan.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Commission {plan.commission}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              {/* Billing period */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Periode</span>
                <span className="text-white font-semibold">
                  {billing === "annual" ? "Annuel" : "Mensuel"}
                </span>
              </div>

              {/* Monthly price */}
              {billing === "annual" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Prix mensuel</span>
                  <span className="text-slate-500 line-through">{plan.monthlyPrice} EUR/mois</span>
                </div>
              )}

              {/* Equivalent monthly */}
              {billing === "annual" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Equivalent mensuel</span>
                  <span className="text-emerald-400 font-semibold">{monthlyEquivalent} EUR/mois</span>
                </div>
              )}

              {/* Savings */}
              {billing === "annual" && savings > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Economie</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                    -{savings} EUR/an
                  </span>
                </div>
              )}

              <div className="h-px bg-white/10" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Total</span>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-white">{price} EUR</p>
                  <p className="text-[10px] text-slate-500">
                    {billing === "annual" ? "facture annuellement" : "facture mensuellement"}
                  </p>
                </div>
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || loading}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                !selectedMethod || loading
                  ? "bg-white/10 text-slate-500 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
              )}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Traitement en cours...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">lock</span>
                  Payer {price} EUR
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">
              En procedant au paiement, vous acceptez les{" "}
              <span className="text-primary cursor-pointer hover:underline">
                conditions generales d&apos;utilisation
              </span>{" "}
              et la{" "}
              <span className="text-primary cursor-pointer hover:underline">
                politique de confidentialite
              </span>{" "}
              de FreelanceHigh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense for useSearchParams
// ---------------------------------------------------------------------------
export default function PaiementPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-16 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <PaiementContent />
    </Suspense>
  );
}
