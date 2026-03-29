"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toast";
import { useAgencyStore } from "@/store/agency";
import { profileApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  PLAN_ORDER,
  PLAN_VISIBILITY,
  formatLimit,
  normalizePlanName,
  type PlanName,
  type LivePlanConfig,
} from "@/lib/plans";
import { useLivePlans } from "@/lib/use-live-plans";

const agencyPlans = PLAN_ORDER.filter((k) => PLAN_VISIBILITY.agence.includes(k));

// ---------------------------------------------------------------------------
// Plan data — now derived dynamically inside the component via useLivePlans()
// ---------------------------------------------------------------------------
interface Plan {
  id: string;
  key: PlanName;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  commission: string;
  features: string[];
  highlight?: boolean;
}

function getCommLabel(r: LivePlanConfig): string {
  if (r.commissionValue === 0) return "0%";
  if (r.commissionType === "percentage") return `${r.commissionValue}%`;
  return `${r.commissionValue}\u20AC/vente`;
}

const SUPPORT_LABELS: Record<string, string> = { email: "Email", prioritaire: "Prioritaire", dedie: "Dédié", vip: "VIP dédié" };

function buildPlans(livePlans: Record<PlanName, LivePlanConfig>, liveFeatures: Record<PlanName, string[]>): Plan[] {
  return agencyPlans.map((key) => {
    const r = livePlans[key];
    return {
      id: key.toLowerCase(),
      key,
      name: r.name,
      priceMonthly: r.priceMonthly,
      priceAnnual: r.priceAnnual,
      commission: getCommLabel(r),
      features: liveFeatures[key],
      highlight: key === "EMPIRE",
    };
  });
}

function buildComparisonRows(livePlans: Record<PlanName, LivePlanConfig>): { label: string; values: string[] }[] {
  return [
    { label: "Services actifs", values: agencyPlans.map((k) => formatLimit(livePlans[k].serviceLimit)) },
    { label: "Candidatures/mois", values: agencyPlans.map((k) => formatLimit(livePlans[k].applicationLimit)) },
    { label: "Boost publicitaire", values: agencyPlans.map((k) => livePlans[k].boostLimit === 0 ? "Non" : `${livePlans[k].boostLimit}/mois`) },
    { label: "Commission", values: agencyPlans.map((k) => getCommLabel(livePlans[k])) },
    { label: "Certification IA", values: agencyPlans.map((k) => livePlans[k].certificationLimit === 0 ? "Non" : !isFinite(livePlans[k].certificationLimit) ? "Illimité" : `${livePlans[k].certificationLimit}/mois`) },
    { label: "Clés API", values: agencyPlans.map((k) => livePlans[k].apiAccess ? "Oui" : "Non") },
    { label: "Membres équipe", values: agencyPlans.map((k) => livePlans[k].teamLimit > 0 ? `${livePlans[k].teamLimit} max` : "-") },
    { label: "Stockage ressources", values: agencyPlans.map((k) => livePlans[k].cloudStorageGB > 0 ? `${livePlans[k].cloudStorageGB} GB` : "-") },
    { label: "Support", values: agencyPlans.map((k) => SUPPORT_LABELS[livePlans[k].supportLevel] || livePlans[k].supportLevel) },
  ];
}

// ---------------------------------------------------------------------------
// Types for dynamic data
// ---------------------------------------------------------------------------
interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  method: string;
  description?: string;
}

interface SubscriptionData {
  planId: string;
  billing: "monthly" | "annual";
  nextBillingDate: string | null;
  paymentMethod: string | null;
}

function buildPlanLimits(livePlans: Record<PlanName, LivePlanConfig>): Record<string, { members: number | null; storage: number; services: number | null; boosts: number | null }> {
  return Object.fromEntries(
    agencyPlans.map((k) => {
      const r = livePlans[k];
      return [k.toLowerCase(), {
        members: r.teamLimit || 0,
        storage: r.cloudStorageGB,
        services: isFinite(r.serviceLimit) ? r.serviceLimit : null,
        boosts: r.boostLimit > 0 ? r.boostLimit : 0,
      }];
    })
  );
}

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
  const { plans: livePlans, features: liveFeatures } = useLivePlans();

  // Derived data from live plans
  const PLANS = buildPlans(livePlans, liveFeatures);
  const COMPARISON_ROWS = buildComparisonRows(livePlans);
  const PLAN_LIMITS = buildPlanLimits(livePlans);

  // Dynamic data state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Real usage stats from agency store
  const { members, services, syncAll, isLoading: storeLoading } = useAgencyStore();

  // Derive current plan from subscription data, normalize legacy names
  const rawPlanId = subscription?.planId ?? "decouverte";
  const currentPlanKey = normalizePlanName(rawPlanId);
  const currentPlanId = currentPlanKey.toLowerCase();
  const currentPlan = PLANS.find((p) => p.key === currentPlanKey) ?? PLANS[0];
  const limits = PLAN_LIMITS[currentPlanId] ?? PLAN_LIMITS[agencyPlans[0].toLowerCase()];

  // Compute real usage stats
  const membersCount = members.length;
  const activeServicesCount = services.filter((s) => s.status === "actif" || s.status === "active").length;
  const boostedServicesCount = services.filter((s) => s.isBoosted).length;

  // Load subscription & profile data on mount
  const loadSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    try {
      const profile = await profileApi.get();
      // Try to extract subscription info from profile
      const profileAny = profile as unknown as Record<string, unknown>;
      if (profileAny.subscription && typeof profileAny.subscription === "object") {
        const sub = profileAny.subscription as Record<string, unknown>;
        setSubscription({
          planId: (sub.planId as string) ?? (sub.plan as string) ?? "gratuit",
          billing: (sub.billing as "monthly" | "annual") ?? "monthly",
          nextBillingDate: (sub.nextBillingDate as string) ?? null,
          paymentMethod: (sub.paymentMethod as string) ?? null,
        });
      } else if (profileAny.plan && typeof profileAny.plan === "string") {
        setSubscription({
          planId: profileAny.plan as string,
          billing: "monthly",
          nextBillingDate: null,
          paymentMethod: null,
        });
      } else {
        // No subscription data found in profile, default to gratuit
        setSubscription({
          planId: "gratuit",
          billing: "monthly",
          nextBillingDate: null,
          paymentMethod: null,
        });
      }
    } catch {
      // If profile fetch fails, default to gratuit
      setSubscription({
        planId: "gratuit",
        billing: "monthly",
        nextBillingDate: null,
        paymentMethod: null,
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const res = await fetch("/api/billing/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices ?? data ?? []);
      } else {
        // API not available yet -- show empty state
        setInvoices([]);
      }
    } catch {
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
    loadInvoices();
    syncAll();
  }, [loadSubscription, loadInvoices, syncAll]);

  function getPrice(plan: Plan) {
    if (billing === "annuel") {
      return plan.priceAnnual > 0
        ? `${plan.priceAnnual.toLocaleString("fr-FR")}`
        : "0";
    }
    return plan.priceMonthly.toLocaleString("fr-FR");
  }

  function formatRenewalDate(): string {
    if (!subscription?.nextBillingDate) return "\u2014";
    try {
      return new Date(subscription.nextBillingDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "\u2014";
    }
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

  // Show skeleton while loading critical data
  if (subscriptionLoading || storeLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Abonnement</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez votre plan et votre facturation.
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-neutral-dark rounded-xl border border-border-dark p-6 animate-pulse"
            >
              <div className="h-4 bg-border-dark rounded w-1/3 mb-3" />
              <div className="h-3 bg-border-dark rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Abonnement</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez votre plan et votre facturation.
          </p>
        </div>
        <button
          onClick={() => setShowChangePlan(true)}
          className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">swap_horiz</span>
          Changer de plan
        </button>
      </div>

      {/* Current plan card */}
      <div className="bg-neutral-dark rounded-xl border border-primary/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">
                card_membership
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Plan {currentPlan.name}
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                  Actif
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Commission réduite à {currentPlan.commission} sur toutes les
                transactions
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-2xl font-black text-white">
              {currentPlan.priceMonthly > 0
                ? `${currentPlan.priceMonthly}\u00A0\u20AC`
                : "Gratuit"}
            </p>
            {currentPlan.priceMonthly > 0 && (
              <p className="text-xs text-slate-500">par mois</p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
          {currentPlan.features.map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm flex-shrink-0">
                check_circle
              </span>
              <span className="text-xs text-slate-300">{feat}</span>
            </div>
          ))}
        </div>

        {/* Renewal info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border-dark">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Prochain renouvellement
              </p>
              <p className="text-sm font-semibold text-white">
                {formatRenewalDate()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Moyen de paiement
              </p>
              <p className="text-sm font-semibold text-white">
                {subscription?.paymentMethod ?? "\u2014"}
              </p>
            </div>
          </div>
          {currentPlanId !== "gratuit" && (
            <button
              onClick={() => setShowCancel(true)}
              className="text-xs text-red-400 font-semibold hover:text-red-300 transition-colors"
            >
              Annuler l&apos;abonnement
            </button>
          )}
        </div>
      </div>

      {/* Usage stats */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Utilisation du plan
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Membres",
              current: membersCount,
              max: limits.members,
              unit: "",
              icon: "groups",
              color: "text-primary",
            },
            {
              label: "Stockage",
              current: 0,
              max: limits.storage > 0 ? limits.storage * 1024 : null,
              unit: "MB",
              icon: "cloud",
              color: "text-blue-400",
              displayValue: "0 MB",
              displayMax: limits.storage > 0 ? `${limits.storage} GB` : "\u2014",
            },
            {
              label: "Services actifs",
              current: activeServicesCount,
              max: limits.services,
              unit: "",
              icon: "work",
              color: "text-emerald-400",
            },
            {
              label: "Boost ce mois",
              current: boostedServicesCount,
              max: limits.boosts,
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
                    ? (stat as { displayValue?: string }).displayValue ?? `${stat.current} MB`
                    : stat.current}
                  <span className="text-sm font-normal text-slate-500 ml-1">
                    {stat.label === "Stockage"
                      ? `/ ${(stat as { displayMax?: string }).displayMax ?? "\u2014"}`
                      : stat.max !== null && stat.max !== undefined
                      ? `/ ${stat.max}`
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
                -{Math.round((1 - livePlans.AGENCE_STARTER.priceAnnual / (livePlans.AGENCE_STARTER.priceMonthly * 12)) * 100)}%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={cn(
                  "bg-neutral-dark rounded-xl border p-4 text-center",
                  isCurrent
                    ? "border-primary/50 ring-1 ring-primary/20"
                    : "border-border-dark"
                )}
              >
                {isCurrent && (
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
            );
          })}
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
                      p.id === currentPlanId ? "text-primary" : ""
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
          {invoicesLoading ? (
            <div className="px-5 py-8 text-center">
              <div className="inline-block h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-slate-500">Chargement des factures...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">
                receipt_long
              </span>
              <p className="text-sm text-slate-500">Aucune facture</p>
              <p className="text-xs text-slate-600 mt-1">
                Vos factures apparaîtront ici après votre premier paiement.
              </p>
            </div>
          ) : (
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
                {invoices.map((inv) => (
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
                      {inv.amount}\u00A0\u20AC
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">
                      {inv.method || "\u2014"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full",
                          inv.status === "payee"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        )}
                      >
                        {inv.status === "payee" ? "Payée" : "En attente"}
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
          )}
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
              Votre plan {currentPlan.name} restera actif jusqu&apos;au{" "}
              <span className="text-white font-semibold">
                {formatRenewalDate()}
              </span>.
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
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    disabled={isCurrent}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      isCurrent
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
                    {isCurrent && (
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Plan actuel
                      </span>
                    )}
                  </button>
                );
              })}
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
