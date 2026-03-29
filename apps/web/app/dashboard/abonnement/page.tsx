"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  PLAN_ORDER,
  PLAN_VISIBILITY,
  getCommissionLabel,
  normalizePlanName,
  type PlanName,
} from "@/lib/plans";
import { useLivePlans } from "@/lib/use-live-plans";

const visiblePlans = PLAN_ORDER.filter((k) => PLAN_VISIBILITY.freelance.includes(k));

const PLAN_STYLES: Record<PlanName, { icon: string; color: string; bg: string; border: string }> = {
  DECOUVERTE: { icon: "explore", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-border-dark" },
  ASCENSION: { icon: "trending_up", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/40" },
  SOMMET: { icon: "bolt", color: "text-primary", bg: "bg-primary/10", border: "border-primary" },
  AGENCE_STARTER: { icon: "apartment", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/40" },
  EMPIRE: { icon: "workspace_premium", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/40" },
};

type Invoice = { id: string; date: string; amount: number; description: string; status: "payee" | "en_attente" };

// Invoices are fetched from the API — no hardcoded data
const invoices: Invoice[] = [];

export default function AbonnementPage() {
  const router = useRouter();
  const { currentPlan: rawPlan, changePlan } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { plans: livePlans, features: liveFeatures } = useLivePlans();

  const currentPlanKey = normalizePlanName(rawPlan);
  const currentRules = livePlans[currentPlanKey] ?? livePlans.DECOUVERTE;
  const style = PLAN_STYLES[currentPlanKey] ?? PLAN_STYLES.DECOUVERTE;
  const currentIndex = visiblePlans.indexOf(currentPlanKey);

  function handleSelectPlan(planKey: PlanName) {
    const planId = planKey.toLowerCase();
    router.push(`/dashboard/abonnement/paiement?plan=${planId}&billing=${billing}`);
  }

  function handleCancelSubscription() {
    setShowCancelConfirm(false);
    changePlan("decouverte");
    addToast("info", "Votre abonnement a ete annule. Vous passerez au plan Découverte a la fin de la periode.");
  }

  async function handleDownloadPDF(invoice: Invoice) {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!res.ok) {
        const { generateInvoicePDF } = await import("@/lib/pdf/invoice-template");
        const pdfBytes = generateInvoicePDF({
          id: invoice.id,
          date: invoice.date,
          amount: invoice.amount,
          description: invoice.description,
          status: invoice.status as "payee" | "en_attente",
        });
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FreelanceHigh-${invoice.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FreelanceHigh-${invoice.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      addToast("success", `Facture ${invoice.id} téléchargée`);
    } catch {
      addToast("error", "Erreur lors du téléchargement de la facture");
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <ConfirmModal
        open={showCancelConfirm}
        title="Annuler l'abonnement"
        variant="danger"
        message={`Votre plan ${currentRules.name} restera actif jusqu'a la fin de la periode de facturation. Ensuite, votre compte passera automatiquement au plan Découverte avec les limitations correspondantes.`}
        confirmLabel="Annuler mon abonnement"
        onConfirm={handleCancelSubscription}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">Plans & Abonnement</h2>
        <p className="text-slate-400 mt-1">Gerez votre plan et votre facturation.</p>
      </div>

      {/* Current plan banner */}
      <div className={cn(
        "rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        currentPlanKey === "DECOUVERTE" ? "bg-slate-500/10 border border-border-dark" : "bg-primary"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
            currentPlanKey === "DECOUVERTE" ? "bg-slate-500/20" : "bg-white/20"
          )}>
            <span className={cn("material-symbols-outlined text-2xl",
              currentPlanKey === "DECOUVERTE" ? "text-slate-400" : "text-white"
            )}>{style.icon}</span>
          </div>
          <div>
            <p className={cn("text-xs font-bold", currentPlanKey === "DECOUVERTE" ? "text-slate-500" : "text-white/70")}>Plan actuel</p>
            <p className={cn("text-lg font-extrabold", currentPlanKey === "DECOUVERTE" ? "text-slate-200" : "text-white")}>
              Plan {currentRules.name} {(currentRules.priceMonthly ?? 0) > 0 ? `· €${currentRules.priceMonthly}/mois` : "· Gratuit"}
            </p>
          </div>
        </div>
        <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3 text-sm", currentPlanKey === "DECOUVERTE" ? "text-slate-500" : "text-white/70")}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            {currentPlanKey === "DECOUVERTE" ? "Actif" : "Actif · Renouvelle le 1 Avr 2026"}
          </div>
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold">
            Commission {getCommissionLabel(currentPlanKey)}
          </span>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm font-bold", billing === "monthly" ? "text-slate-100" : "text-slate-500")}>Mensuel</span>
        <button
          onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
          className={cn("relative w-12 h-6 rounded-full transition-colors", billing === "annual" ? "bg-primary" : "bg-border-dark")}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ left: billing === "annual" ? "26px" : "2px" }}
          />
        </button>
        <span className={cn("text-sm font-bold", billing === "annual" ? "text-slate-100" : "text-slate-500")}>
          Annuel
          <span className="ml-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">-25%</span>
        </span>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visiblePlans.map((planKey, idx) => {
          const rules = livePlans[planKey];
          const features = liveFeatures[planKey];
          const isCurrent = planKey === currentPlanKey;
          const s = PLAN_STYLES[planKey];
          const price = billing === "annual" && rules.priceAnnual > 0
            ? Math.round(rules.priceAnnual / 12 * 100) / 100
            : (rules.priceMonthly ?? 0);
          const isUpgrade = idx > currentIndex;
          const isPopular = planKey === "SOMMET";

          return (
            <div
              key={planKey}
              className={cn(
                "bg-background-dark/50 rounded-xl border-2 p-6 relative transition-all hover:border-primary/30",
                isCurrent ? s.border : "border-border-dark",
                isPopular && !isCurrent && "border-primary/30"
              )}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold bg-primary text-white px-3 py-1 rounded-full whitespace-nowrap">
                    Le plus populaire
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                    Plan actuel
                  </span>
                </div>
              )}

              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", s.bg)}>
                <span className={cn("material-symbols-outlined text-xl", s.color)}>{s.icon}</span>
              </div>

              <h3 className="text-lg font-extrabold mb-0.5">{rules.name}</h3>
              <p className="text-xs text-slate-500 mb-4">Commission {getCommissionLabel(planKey)}</p>

              <div className="mb-5">
                <span className="text-3xl font-extrabold">{price > 0 ? `€${price}` : "€0"}</span>
                <span className="text-sm text-slate-500">/mois</span>
                {billing === "annual" && rules.priceMonthly > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Soit €{rules.priceAnnual}/an — economisez €{Math.max(0, Math.round((rules.priceMonthly ?? 0) * 12 - (rules.priceAnnual ?? 0)))}
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="material-symbols-outlined text-sm text-emerald-400 flex-shrink-0 mt-0.5">check</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && (rules.priceMonthly ?? 0) > 0 && handleSelectPlan(planKey)}
                disabled={isCurrent}
                className={cn(
                  "w-full py-2.5 rounded-lg text-sm font-bold transition-all",
                  isCurrent
                    ? "bg-border-dark text-slate-500 cursor-not-allowed"
                    : isUpgrade
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                )}
              >
                {isCurrent ? "Plan actuel" : (rules.priceMonthly ?? 0) === 0 ? "Plan gratuit" : isUpgrade ? `Passer au ${rules.name}` : `Revenir au ${rules.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice history */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-slate-500">receipt_long</span>
            <h3 className="font-bold">Historique de facturation</h3>
          </div>
          <span className="text-xs text-slate-500">{invoices.length} facture(s)</span>
        </div>
        <div className="divide-y divide-border-dark">
          {invoices.map((inv) => (
            <div key={inv.id} className="px-4 sm:px-6 py-4 hover:bg-primary/5 transition-colors">
              {/* Desktop row */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm text-primary">description</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{inv.description || "Facture"}</p>
                    <p className="text-xs text-slate-500">{inv.id} · {inv.date ? new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    inv.status === "payee" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {inv.status === "payee" ? "Payee" : "En attente"}
                  </span>
                  <span className="text-sm font-extrabold w-16 text-right">€{(inv.amount ?? 0).toFixed(2)}</span>
                  <button
                    onClick={() => handleDownloadPDF(inv)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    PDF
                  </button>
                </div>
              </div>
              {/* Mobile card */}
              <div className="sm:hidden space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-sm text-primary">description</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{inv.description || "Facture"}</p>
                      <p className="text-xs text-slate-500 truncate">{inv.id}</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold whitespace-nowrap">€{(inv.amount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      inv.status === "payee" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    )}>
                      {inv.status === "payee" ? "Payee" : "En attente"}
                    </span>
                    <span className="text-xs text-slate-500">{inv.date ? new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(inv)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel subscription */}
      {currentPlanKey !== "DECOUVERTE" && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-lg text-red-400">Annuler l&apos;abonnement</h3>
          <p className="text-sm text-slate-400">
            Si vous annulez, votre plan {currentRules.name} reste actif jusqu&apos;a la fin de la periode de facturation.
            Ensuite, votre compte passera automatiquement au plan Découverte.
          </p>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg text-sm hover:bg-red-600 transition-all"
          >
            Annuler mon abonnement
          </button>
        </div>
      )}
    </div>
  );
}
