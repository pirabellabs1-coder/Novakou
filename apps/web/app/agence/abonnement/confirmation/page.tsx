"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------
const PLAN_NAMES: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  business: "Business",
  agence: "Agence",
};

const PLAN_COMMISSIONS: Record<string, string> = {
  free: "20%",
  pro: "15%",
  business: "10%",
  agence: "8%",
};

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------
function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = searchParams.get("plan") || "agence";
  const billing = searchParams.get("billing") || "monthly";
  const amount = searchParams.get("amount") || "0";
  const nextBillingParam = searchParams.get("nextBilling");

  const planName = PLAN_NAMES[planId] || "Agence";
  const commission = PLAN_COMMISSIONS[planId] || "8%";

  // Format next billing date
  let nextBillingDate: string;
  if (nextBillingParam) {
    nextBillingDate = new Date(nextBillingParam).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } else {
    const date = new Date();
    if (billing === "annual") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setDate(date.getDate() + 30);
    }
    nextBillingDate = date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="max-w-lg mx-auto text-center py-10 space-y-8">
      {/* Success icon */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
          <span className="material-symbols-outlined text-5xl text-emerald-400">check_circle</span>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Votre abonnement a été activé !
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Merci pour votre confiance. Profitez de tous les avantages du plan {planName}.
          </p>
        </div>
      </div>

      {/* Plan details card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-left space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">bolt</span>
          </div>
          <div>
            <p className="text-base font-extrabold text-white">Plan {planName}</p>
            <p className="text-xs text-slate-500">Commission réduite à {commission}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Montant payé</span>
            <span className="text-sm font-bold text-white">{amount} EUR</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Période</span>
            <span className="text-sm font-semibold text-white">
              {billing === "annual" ? "Annuel" : "Mensuel"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Prochaine facturation</span>
            <span className="text-sm font-semibold text-emerald-400">{nextBillingDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Statut</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              Actif
            </span>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 text-left">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Prochaines étapes
        </p>
        <ul className="space-y-2.5">
          {[
            { icon: "groups", text: "Invitez vos membres et constituez votre équipe" },
            { icon: "work", text: "Publiez des services sous votre marque agence" },
            { icon: "trending_up", text: "Utilisez le CRM pour gérer vos clients" },
          ].map((item) => (
            <li key={item.icon} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
              </div>
              <span className="text-sm text-slate-400">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => router.push("/agence")}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          Retour au tableau de bord
        </button>
        <button
          onClick={() => router.push("/agence/abonnement")}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">card_membership</span>
          Voir mon abonnement
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense for useSearchParams
// ---------------------------------------------------------------------------
export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-16 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
