"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useServiceWizardStore, type PackageFeature, type PackageTier } from "@/store/service-wizard";
import { PRICE_OPTIONS, DELIVERY_DAYS_OPTIONS } from "@/lib/validations/service";

const TIER_KEYS = ["basic", "standard", "premium"] as const;
type TierKey = (typeof TIER_KEYS)[number];

const TIER_CONFIG: Record<TierKey, { label: string; icon: string; color: string; bgColor: string }> = {
  basic: { label: "Basique", icon: "star_outline", color: "text-slate-400", bgColor: "bg-slate-500/10" },
  standard: { label: "Standard", icon: "star_half", color: "text-primary", bgColor: "bg-primary/10" },
  premium: { label: "Premium", icon: "star", color: "text-amber-400", bgColor: "bg-amber-500/10" },
};

export function StepPackages({ role }: { role: string }) {
  const { packages, basePrice, baseDeliveryDays, updateField, markStepCompleted, setStep, markDirty } =
    useServiceWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newFeatureLabel, setNewFeatureLabel] = useState("");

  // Sync basic price from step 2 on first render if unchanged
  const effectivePackages = {
    ...packages,
    basic: {
      ...packages.basic,
      price: packages.basic.price === 10 && basePrice > 10 ? basePrice : packages.basic.price,
    },
    standard: {
      ...packages.standard,
      price: packages.standard.price === 20 && basePrice > 10 ? basePrice * 2 : packages.standard.price,
    },
    premium: {
      ...packages.premium,
      price: packages.premium.price === 30 && basePrice > 10 ? basePrice * 3 : packages.premium.price,
    },
  };

  const updateTier = useCallback(
    (tier: TierKey, updates: Partial<PackageTier>) => {
      updateField("packages", {
        ...packages,
        [tier]: { ...packages[tier], ...updates },
      });
    },
    [packages, updateField]
  );

  const addFeature = useCallback(() => {
    const label = newFeatureLabel.trim();
    if (!label) return;
    const feature: PackageFeature = {
      id: crypto.randomUUID(),
      label,
      includedInBasic: false,
      includedInStandard: true,
      includedInPremium: true,
    };
    updateField("packages", {
      ...packages,
      features: [...packages.features, feature],
    });
    setNewFeatureLabel("");
  }, [newFeatureLabel, packages, updateField]);

  const removeFeature = useCallback(
    (id: string) => {
      updateField("packages", {
        ...packages,
        features: packages.features.filter((f) => f.id !== id),
      });
    },
    [packages, updateField]
  );

  const toggleFeature = useCallback(
    (featureId: string, tier: TierKey) => {
      const fieldKey = `includedIn${tier.charAt(0).toUpperCase()}${tier.slice(1)}` as
        | "includedInBasic"
        | "includedInStandard"
        | "includedInPremium";
      updateField("packages", {
        ...packages,
        features: packages.features.map((f) =>
          f.id === featureId ? { ...f, [fieldKey]: !f[fieldKey] } : f
        ),
      });
    },
    [packages, updateField]
  );

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const tier of TIER_KEYS) {
      const p = packages[tier];
      if (p.price < 5) errs[`${tier}_price`] = "Min. 5 EUR";
      if (p.deliveryDays < 1) errs[`${tier}_days`] = "Min. 1 jour";
    }
    if (packages.basic.price > packages.standard.price) {
      errs.pricing = "Le prix doit être croissant : Basique ≤ Standard ≤ Premium";
    }
    if (packages.standard.price > packages.premium.price) {
      errs.pricing = "Le prix doit être croissant : Basique ≤ Standard ≤ Premium";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    markStepCompleted(3);
    setStep(4);
  }

  return (
    <div className="space-y-8">
      {/* Pricing error */}
      {errors.pricing && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-sm">error</span>
          <span className="text-sm text-red-400">{errors.pricing}</span>
        </div>
      )}

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIER_KEYS.map((tier) => {
          const config = TIER_CONFIG[tier];
          const p = packages[tier];
          return (
            <div
              key={tier}
              className={cn(
                "rounded-2xl border p-5 space-y-5 transition-all",
                tier === "standard"
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                  : "border-white/10 bg-white/[0.02]"
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                  <span className={cn("material-symbols-outlined text-lg", config.color)}>{config.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">{config.label}</h3>
                  {tier === "standard" && (
                    <span className="text-[10px] text-primary font-semibold uppercase">Le plus populaire</span>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Nom du forfait
                </label>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateTier(tier, { name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder={config.label}
                />
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Prix (EUR)
                </label>
                <select
                  value={p.price}
                  onChange={(e) => updateTier(tier, { price: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  {PRICE_OPTIONS.map((price) => (
                    <option key={price} value={price} className="bg-[#1a1f2e] text-white">
                      {price} €
                    </option>
                  ))}
                </select>
                {errors[`${tier}_price`] && (
                  <p className="text-xs text-red-400 mt-1">{errors[`${tier}_price`]}</p>
                )}
              </div>

              {/* Delivery days */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Délai de livraison
                </label>
                <select
                  value={p.deliveryDays}
                  onChange={(e) => updateTier(tier, { deliveryDays: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  {DELIVERY_DAYS_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-[#1a1f2e] text-white">
                      {d} jour{d > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Revisions */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Révisions incluses
                </label>
                <select
                  value={p.revisions}
                  onChange={(e) => updateTier(tier, { revisions: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  {[0, 1, 2, 3, 5, 10, -1].map((r) => (
                    <option key={r} value={r === -1 ? 99 : r} className="bg-[#1a1f2e] text-white">
                      {r === -1 ? "Illimitées" : r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Description courte
                </label>
                <textarea
                  value={p.description}
                  onChange={(e) => updateTier(tier, { description: e.target.value })}
                  rows={2}
                  maxLength={200}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Décrivez ce qui est inclus..."
                />
                <p className="text-[10px] text-slate-500 mt-0.5 text-right">
                  {(p.description || "").length}/200
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">checklist</span>
            Fonctionnalités incluses
          </h3>
          <span className="text-[10px] text-slate-500">{packages.features.length} feature{packages.features.length !== 1 ? "s" : ""}</span>
        </div>

        {packages.features.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase w-1/2">Feature</th>
                  {TIER_KEYS.map((tier) => (
                    <th key={tier} className="text-center py-2 px-3 text-xs font-semibold text-slate-400 uppercase">
                      {TIER_CONFIG[tier].label}
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {packages.features.map((feature) => (
                  <tr key={feature.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-sm">{feature.label}</td>
                    {TIER_KEYS.map((tier) => {
                      const fieldKey = `includedIn${tier.charAt(0).toUpperCase()}${tier.slice(1)}` as
                        | "includedInBasic"
                        | "includedInStandard"
                        | "includedInPremium";
                      return (
                        <td key={tier} className="text-center py-2.5 px-3">
                          <button
                            onClick={() => toggleFeature(feature.id, tier)}
                            className={cn(
                              "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                              feature[fieldKey]
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/5 text-slate-600 hover:text-slate-400"
                            )}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {feature[fieldKey] ? "check" : "close"}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-1">
                      <button
                        onClick={() => removeFeature(feature.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add feature */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newFeatureLabel}
            onChange={(e) => setNewFeatureLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="Ex: Fichier source inclus, Livraison HD, Support 24h..."
          />
          <button
            onClick={addFeature}
            disabled={!newFeatureLabel.trim()}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-bold hover:bg-primary/30 transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Retour
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/20"
        >
          Continuer
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
