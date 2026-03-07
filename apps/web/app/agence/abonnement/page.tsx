"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------
interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  commission: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "gratuit",
    name: "Gratuit",
    priceMonthly: 0,
    priceAnnual: 0,
    commission: "20%",
    features: [
      "3 services actifs",
      "5 candidatures/mois",
      "Pas de boost",
      "Commission 20%",
      "Support email",
      "Pas de certification IA",
      "Pas de clés API",
      "Pas de membres",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 15,
    priceAnnual: 144,
    commission: "15%",
    features: [
      "15 services actifs",
      "20 candidatures/mois",
      "1 boost/mois",
      "Commission 15%",
      "Support prioritaire",
      "Certification IA",
      "Pas de clés API",
      "Pas de membres",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 45,
    priceAnnual: 432,
    commission: "10%",
    features: [
      "Services illimités",
      "Candidatures illimitées",
      "5 boosts/mois",
      "Commission 10%",
      "Support dédié",
      "Certification IA",
      "Clés API incluses",
      "Pas de membres",
    ],
  },
  {
    id: "agence",
    name: "Agence",
    priceMonthly: 99,
    priceAnnual: 950,
    commission: "8%",
    highlight: true,
    features: [
      "Services illimités",
      "Candidatures illimitées",
      "10 boosts/mois",
      "Commission 8%",
      "Support dédié VIP",
      "Certification IA",
      "Clés API incluses",
      "20 membres max",
    ],
  },
];

const CURRENT_PLAN = PLANS.find((p) => p.id === "agence")!;

// Feature comparison rows
const COMPARISON_ROWS = [
  { label: "Services actifs", values: ["3", "15", "Illimité", "Illimité"] },
  { label: "Candidatures/mois", values: ["5", "20", "Illimité", "Illimité"] },
  { label: "Boost publicitaire", values: ["Non", "1/mois", "5/mois", "10/mois"] },
  { label: "Commission", values: ["20%", "15%", "10%", "8%"] },
  { label: "Certification IA", values: ["Non", "Oui", "Oui", "Oui"] },
  { label: "Clés API", values: ["Non", "Non", "Oui", "Oui"] },
  { label: "Membres équipe", values: ["-", "-", "-", "20 max"] },
  { label: "Stockage ressources", values: ["-", "-", "-", "50 GB"] },
  { label: "Support", values: ["Email", "Prioritaire", "Dédié", "Dédié VIP"] },
];

// Invoices
const INVOICES = [
  { id: "FA-2026-03", date: "2026-03-01", amount: 99, status: "payee", method: "Carte Visa ****4829" },
  { id: "FA-2026-02", date: "2026-02-01", amount: 99, status: "payee", method: "Carte Visa ****4829" },
  { id: "FA-2026-01", date: "2026-01-01", amount: 99, status: "payee", method: "Carte Visa ****4829" },
  { id: "FA-2025-12", date: "2025-12-01", amount: 99, status: "payee", method: "Carte Visa ****4829" },
  { id: "FA-2025-11", date: "2025-11-01", amount: 99, status: "payee", method: "Carte Visa ****4829" },
  { id: "FA-2025-10", date: "2025-10-01", amount: 99, status: "payee", method: "Carte Visa ****4829" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AgenceAbonnement() {
  const router = useRouter();
  const [billing, setBilling] = useState<"mensuel" | "annuel">("mensuel");
  const [showCancel, setShowCancel] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { addToast } = useToastStore();

  function getPrice(plan: Plan) {
    if (billing === "annuel") {
      return plan.priceAnnual > 0
        ? `${plan.priceAnnual.toLocaleString("fr-FR")}`
        : "0";
    }
    return plan.priceMonthly.toLocaleString("fr-FR");
  }

  function handleCancelSubscription() {
    addToast("success", "Votre abonnement sera annulé à la fin de la période en cours.");
    setShowCancel(false);
  }

  function handleNavigateToPayment(planId: string) {
    const billingParam = billing === "annuel" ? "annual" : "monthly";
    router.push(`/agence/abonnement/paiement?plan=${planId}&billing=${billingParam}`);
    setShowChangePlan(false);
    setSelectedPlan(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Abonnement</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez votre plan et votre facturation.
          </p>
        </div>
        <button
          onClick={() => setShowChangePlan(true)}
          className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">swap_horiz</span>
          Changer de plan
        </button>
      </div>

      {/* Current plan card */}
      <div className="bg-neutral-dark rounded-xl border border-primary/30 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                card_membership
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  Plan {CURRENT_PLAN.name}
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                  Actif
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Commission réduite à {CURRENT_PLAN.commission} sur toutes les
                transactions
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">
              {CURRENT_PLAN.priceMonthly}
            </p>
            <p className="text-xs text-slate-500">par mois</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            "Services illimités",
            "10 boosts/mois",
            "20 membres max",
            "Support VIP",
            "Certification IA",
            "Clés API",
            "50 GB stockage",
            "Commission 8%",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">
                check_circle
              </span>
              <span className="text-xs text-slate-300">{feat}</span>
            </div>
          ))}
        </div>

        {/* Renewal info */}
        <div className="flex items-center justify-between pt-4 border-t border-border-dark">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Prochain renouvellement
              </p>
              <p className="text-sm font-semibold text-white">1 avril 2026</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Moyen de paiement
              </p>
              <p className="text-sm font-semibold text-white">
                Visa ****4829
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCancel(true)}
            className="text-xs text-red-400 font-semibold hover:text-red-300 transition-colors"
          >
            Annuler l&apos;abonnement
          </button>
        </div>
      </div>

      {/* Usage stats */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Utilisation du plan
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Membres",
              current: 12,
              max: 20,
              unit: "",
              icon: "groups",
              color: "text-primary",
            },
            {
              label: "Stockage",
              current: 69.6,
              max: 50 * 1024,
              unit: "MB / 50 GB",
              icon: "cloud",
              color: "text-blue-400",
              displayValue: "69.6 MB",
              displayMax: "50 GB",
            },
            {
              label: "Services actifs",
              current: 8,
              max: null,
              unit: "/ Illimité",
              icon: "work",
              color: "text-emerald-400",
            },
            {
              label: "Boost ce mois",
              current: 3,
              max: 10,
              unit: "",
              icon: "rocket_launch",
              color: "text-amber-400",
            },
          ].map((stat) => {
            const pct = stat.max
              ? Math.min((stat.current / stat.max) * 100, 100)
              : null;
            return (
              <div
                key={stat.label}
                className="bg-neutral-dark rounded-xl border border-border-dark p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      "material-symbols-outlined text-lg",
                      stat.color
                    )}
                  >
                    {stat.icon}
                  </span>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
                <p className="text-lg font-black text-white mb-1">
                  {stat.label === "Stockage"
                    ? `${stat.current} MB`
                    : stat.current}
                  <span className="text-sm font-normal text-slate-500 ml-1">
                    {stat.max !== null
                      ? stat.label === "Stockage"
                        ? "/ 50 GB"
                        : `/ ${stat.max}`
                      : "/ Illimité"}
                  </span>
                </p>
                {pct !== null && (
                  <div className="h-2 bg-border-dark rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pct > 80 ? "bg-amber-500" : "bg-primary"
                      )}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plans comparison */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Comparer les plans
          </p>
          {/* Billing toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBilling("mensuel")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                billing === "mensuel"
                  ? "bg-primary text-background-dark"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("annuel")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1",
                billing === "annuel"
                  ? "bg-primary text-background-dark"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Annuel
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-neutral-dark rounded-xl border p-4 text-center",
                plan.highlight
                  ? "border-primary/50 ring-1 ring-primary/20"
                  : "border-border-dark"
              )}
            >
              {plan.highlight && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase mb-2 inline-block">
                  Plan actuel
                </span>
              )}
              <p className="text-sm font-bold text-white">{plan.name}</p>
              <p className="text-2xl font-black text-white mt-1">
                {getPrice(plan)}
              </p>
              <p className="text-[10px] text-slate-500 mb-3">
                {billing === "annuel" && plan.priceAnnual > 0
                  ? "/an"
                  : plan.priceMonthly === 0
                  ? ""
                  : "/mois"}
              </p>
              <p className="text-xs text-primary font-semibold">
                Commission {plan.commission}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                <th className="px-5 py-3 text-left font-semibold">
                  Fonctionnalité
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    className={cn(
                      "px-5 py-3 text-center font-semibold",
                      p.highlight ? "text-primary" : ""
                    )}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors"
                >
                  <td className="px-5 py-3 text-sm text-slate-300 font-medium">
                    {row.label}
                  </td>
                  {row.values.map((val, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-5 py-3 text-sm text-center",
                        val === "Non" || val === "-"
                          ? "text-slate-600"
                          : "text-white"
                      )}
                    >
                      {val === "Oui" ? (
                        <span className="material-symbols-outlined text-primary text-base">
                          check
                        </span>
                      ) : val === "Non" ? (
                        <span className="material-symbols-outlined text-slate-600 text-base">
                          close
                        </span>
                      ) : (
                        val
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing history */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Historique de facturation
        </p>
        <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                <th className="px-5 py-3 text-left font-semibold">Facture</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Montant</th>
                <th className="px-5 py-3 text-left font-semibold">
                  Moyen de paiement
                </th>
                <th className="px-5 py-3 text-left font-semibold">Statut</th>
                <th className="px-5 py-3 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors"
                >
                  <td className="px-5 py-3 text-sm font-mono text-primary font-semibold">
                    {inv.id}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {new Date(inv.date).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-white">
                    {inv.amount}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {inv.method}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      Payée
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() =>
                        addToast(
                          "info",
                          `Téléchargement de la facture ${inv.id}`
                        )
                      }
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">
                        download
                      </span>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Cancel modal ---- */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCancel(false)}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-sm text-center">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-3 block">
              warning
            </span>
            <h3 className="text-lg font-bold text-white mb-2">
              Annuler votre abonnement ?
            </h3>
            <p className="text-sm text-slate-400 mb-2">
              Votre plan Agence restera actif jusqu&apos;au{" "}
              <span className="text-white font-semibold">1 avril 2026</span>.
              Après cette date :
            </p>
            <ul className="text-sm text-slate-400 text-left space-y-1 mb-6 pl-4">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">
                  close
                </span>
                Commission passera à 20%
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">
                  close
                </span>
                Membres équipe désactivés
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">
                  close
                </span>
                Services limités à 3
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">
                  close
                </span>
                Stockage réduit
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
              >
                Garder mon plan
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                Confirmer l&apos;annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Change plan modal ---- */}
      {showChangePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowChangePlan(false);
              setSelectedPlan(null);
            }}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              Changer de plan
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Sélectionnez votre nouveau plan. Le changement prendra effet au
              prochain cycle de facturation.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  disabled={plan.id === "agence"}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    plan.id === "agence"
                      ? "border-primary/30 bg-primary/5 opacity-60 cursor-not-allowed"
                      : selectedPlan === plan.id
                      ? "border-primary bg-primary/10"
                      : "border-border-dark hover:border-slate-500"
                  )}
                >
                  <p className="text-sm font-bold text-white">{plan.name}</p>
                  <p className="text-lg font-black text-white mt-1">
                    {plan.priceMonthly}
                    <span className="text-xs font-normal text-slate-500">
                      {plan.priceMonthly > 0 ? "/mois" : ""}
                    </span>
                  </p>
                  <p className="text-[10px] text-primary font-semibold mt-1">
                    Commission {plan.commission}
                  </p>
                  {plan.id === "agence" && (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Plan actuel
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChangePlan(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => selectedPlan && handleNavigateToPayment(selectedPlan)}
                disabled={!selectedPlan}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                  selectedPlan
                    ? "bg-primary text-background-dark hover:brightness-110"
                    : "bg-border-dark text-slate-500 cursor-not-allowed"
                )}
              >
                Continuer vers le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
