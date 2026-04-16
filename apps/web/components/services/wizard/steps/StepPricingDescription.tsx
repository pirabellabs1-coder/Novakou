"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useServiceWizardStore } from "@/store/service-wizard";
import { step2Schema, DELIVERY_DAYS_OPTIONS, COMMISSION_RATES, PRICE_OPTIONS } from "@/lib/validations/service";
import { useDashboardStore } from "@/store/dashboard";
import { normalizePlanName, getCommissionLabel } from "@/lib/plans";

const RichTextEditor = dynamic(
  () => import("../editor/RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[400px] bg-white/5 rounded-xl animate-pulse" /> }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function StepPricingDescription({ role }: { role: string }) {
  const store = useServiceWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rawPlan = useDashboardStore((s) => s.currentPlan);
  const planName = normalizePlanName(rawPlan);
  const commissionRate = COMMISSION_RATES[planName] ?? COMMISSION_RATES.DECOUVERTE ?? 0.12;

  const netAmount = useMemo(() => {
    if (!store.basePrice || store.basePrice < 10) return 0;
    return Math.round(store.basePrice * (1 - commissionRate) * 100) / 100;
  }, [store.basePrice, commissionRate]);

  function handlePrev() {
    store.setStep(1);
  }

  function handleNext() {
    const result = step2Schema.safeParse({
      basePrice: store.basePrice,
      baseDeliveryDays: store.baseDeliveryDays,
      description: store.description,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    store.markStepCompleted(2);
    store.setStep(3);
  }

  return (
    <div className="space-y-8">
      {/* Price and Delivery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Price */}
        <div>
          <label className="block text-sm font-semibold mb-2">Prix de départ</label>
          <select
            value={store.basePrice || 10}
            onChange={(e) => store.updateField("basePrice", Number(e.target.value))}
            className={cn(
              "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
              errors.basePrice ? "border-red-500" : "border-white/10"
            )}
          >
            {PRICE_OPTIONS.map((price) => (
              <option key={price} value={price} className="bg-neutral-900">
                {price} EUR
              </option>
            ))}
          </select>
          {errors.basePrice && <p className="text-xs text-red-400 mt-1">{errors.basePrice}</p>}

          {/* Commission display */}
          {store.basePrice >= 10 && (
            <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <p className="text-sm text-slate-300">
                Pour une commande à <strong>{store.basePrice} EUR</strong>, vous recevrez{" "}
                <strong className="text-emerald-400">{netAmount} EUR</strong>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Commission FreelanceHigh : {getCommissionLabel(planName)} (Plan {planName.charAt(0) + planName.slice(1).toLowerCase()})
              </p>
            </div>
          )}
        </div>

        {/* Delivery days */}
        <div>
          <label className="block text-sm font-semibold mb-2">Délai de livraison</label>
          <select
            value={store.baseDeliveryDays}
            onChange={(e) => store.updateField("baseDeliveryDays", Number(e.target.value))}
            className={cn(
              "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
              errors.baseDeliveryDays ? "border-red-500" : "border-white/10"
            )}
          >
            {DELIVERY_DAYS_OPTIONS.map((days) => (
              <option key={days} value={days} className="bg-neutral-900">
                {days} jour{days > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          {errors.baseDeliveryDays && <p className="text-xs text-red-400 mt-1">{errors.baseDeliveryDays}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-2">Description du service</label>
        <RichTextEditor
          content={store.description}
          onChange={(content) => store.updateField("description", content)}
          placeholder="Décrivez votre service en détail. Expliquez ce que vous proposez, votre méthodologie, vos points forts..."
          minHeight={400}
        />
        {errors.description && <p className="text-xs text-red-400 mt-2">{errors.description}</p>}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-white/5">
        <button
          onClick={handlePrev}
          className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Précédent
        </button>
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Enregistrer et suivant
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
