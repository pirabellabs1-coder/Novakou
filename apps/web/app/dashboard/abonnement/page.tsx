"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { DEMO_PLANS, INVOICES } from "@/lib/demo-data";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const PLAN_STYLES: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  free: { icon: "person", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-border-dark" },
  pro: { icon: "bolt", color: "text-primary", bg: "bg-primary/10", border: "border-primary" },
  business: { icon: "workspace_premium", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/40" },
};

export default function AbonnementPage() {
  const router = useRouter();
  const { currentPlan, changePlan } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const current = DEMO_PLANS.find((p) => p.id === currentPlan) || DEMO_PLANS[1];
  const style = PLAN_STYLES[currentPlan] || PLAN_STYLES.pro;

  function handleSelectPlan(planId: string) {
    router.push(`/dashboard/abonnement/paiement?plan=${planId}&billing=${billing}`);
  }

  function handleCancelSubscription() {
    setShowCancelConfirm(false);
    changePlan("free");
    addToast("info", "Votre abonnement a ete annule. Vous passerez au plan Gratuit a la fin de la periode.");
  }

  async function handleDownloadPDF(invoice: typeof INVOICES[0]) {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!res.ok) {
        // Fallback: client-side generation
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
        message="Votre plan Pro restera actif jusqu'a la fin de la periode de facturation. Ensuite, votre compte passera automatiquement au plan Gratuit avec les limitations correspondantes."
        confirmLabel="Annuler mon abonnement"
        onConfirm={handleCancelSubscription}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Plans & Abonnement</h2>
        <p className="text-slate-400 mt-1">Gerez votre plan et votre facturation.</p>
      </div>

      {/* Current plan banner */}
      <div className={cn(
        "rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        currentPlan === "free" ? "bg-slate-500/10 border border-border-dark" : "bg-primary"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
            currentPlan === "free" ? "bg-slate-500/20" : "bg-white/20"
          )}>
            <span className={cn("material-symbols-outlined text-2xl",
              currentPlan === "free" ? "text-slate-400" : "text-white"
            )}>{style.icon}</span>
          </div>
          <div>
            <p className={cn("text-xs font-bold", currentPlan === "free" ? "text-slate-500" : "text-white/70")}>Plan actuel</p>
            <p className={cn("text-lg font-extrabold", currentPlan === "free" ? "text-slate-200" : "text-white")}>
              Plan {current.name} {current.price > 0 ? `· €${current.price}/mois` : "· Gratuit"}
            </p>
          </div>
        </div>
        <div className={cn("flex items-center gap-3 text-sm", currentPlan === "free" ? "text-slate-500" : "text-white/70")}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            {currentPlan === "free" ? "Actif" : "Actif · Renouvelle le 1 Avr 2026"}
          </div>
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold">
            {current.commission}% commission
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
          <span className="ml-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">-20%</span>
        </span>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {DEMO_PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const s = PLAN_STYLES[plan.id] || PLAN_STYLES.free;
          const price = billing === "annual" ? Math.round(plan.price * 0.8) : plan.price;
          const isUpgrade = DEMO_PLANS.findIndex((p) => p.id === plan.id) > DEMO_PLANS.findIndex((p) => p.id === currentPlan);

          return (
            <div
              key={plan.id}
              className={cn(
                "bg-background-dark/50 rounded-xl border-2 p-6 relative transition-all hover:border-primary/30",
                isCurrent ? s.border : "border-border-dark",
                plan.id === "pro" && !isCurrent && "border-primary/30"
              )}
            >
              {plan.id === "pro" && (
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

              <h3 className="text-lg font-extrabold mb-0.5">{plan.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{plan.commission}% de commission</p>

              <div className="mb-5">
                <span className="text-3xl font-extrabold">{price > 0 ? `€${price}` : "€0"}</span>
                <span className="text-sm text-slate-500">/mois</span>
                {billing === "annual" && price > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Soit €{price * 12}/an — economisez €{(plan.price - price) * 12}
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="material-symbols-outlined text-sm text-emerald-400 flex-shrink-0 mt-0.5">check</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && handleSelectPlan(plan.id)}
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
                {isCurrent ? "Plan actuel" : isUpgrade ? `Passer au ${plan.name}` : `Revenir au ${plan.name}`}
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
          <span className="text-xs text-slate-500">{INVOICES.length} facture(s)</span>
        </div>
        <div className="divide-y divide-border-dark">
          {INVOICES.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-primary">description</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{inv.description}</p>
                  <p className="text-xs text-slate-500">{inv.id} · {new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  inv.status === "payee" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                )}>
                  {inv.status === "payee" ? "Payee" : "En attente"}
                </span>
                <span className="text-sm font-extrabold w-16 text-right">€{inv.amount.toFixed(2)}</span>
                <button
                  onClick={() => handleDownloadPDF(inv)}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel subscription */}
      {currentPlan !== "free" && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-lg text-red-400">Annuler l&apos;abonnement</h3>
          <p className="text-sm text-slate-400">
            Si vous annulez, votre plan {current.name} reste actif jusqu&apos;a la fin de la periode de facturation.
            Ensuite, votre compte passera automatiquement au plan Gratuit.
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
