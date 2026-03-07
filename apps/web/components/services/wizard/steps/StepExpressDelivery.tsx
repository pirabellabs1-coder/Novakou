"use client";

import { cn } from "@/lib/utils";
import { useServiceWizardStore } from "@/store/service-wizard";

export function StepExpressDelivery({ role }: { role: string }) {
  const store = useServiceWizardStore();
  const { expressDelivery, options, baseDeliveryDays } = store;

  function updateBaseExpress(field: string, value: string | number | boolean) {
    store.updateField("expressDelivery", { ...expressDelivery, [field]: value });
  }

  function getMaxReduction(baseDays: number) {
    return Math.max(baseDays - 1, 0);
  }

  function handleNext() {
    store.markStepCompleted(5);
    store.setStep(6);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Permettez aux clients de payer plus pour une livraison plus rapide.
        <span className="text-slate-500"> (Facultatif)</span>
      </p>

      {/* Table */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5">
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Élément</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Délai normal</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Express</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Réduction</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Prix express</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {/* Base service */}
            <tr className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">Service de base</span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">{baseDeliveryDays} jour{baseDeliveryDays > 1 ? "s" : ""}</td>
              <td className="px-4 py-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expressDelivery.baseExpressEnabled}
                    onChange={(e) => updateBaseExpress("baseExpressEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-checked:bg-primary rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </td>
              <td className="px-4 py-3">
                {expressDelivery.baseExpressEnabled && (
                  <select
                    value={expressDelivery.baseExpressDaysReduction}
                    onChange={(e) => updateBaseExpress("baseExpressDaysReduction", Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  >
                    {Array.from({ length: getMaxReduction(baseDeliveryDays) }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} className="bg-neutral-900">-{d} jour{d > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                )}
              </td>
              <td className="px-4 py-3">
                {expressDelivery.baseExpressEnabled && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={expressDelivery.baseExpressPrice || ""}
                      onChange={(e) => updateBaseExpress("baseExpressPrice", Number(e.target.value))}
                      min={0}
                      className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                      placeholder="10"
                    />
                    <span className="text-xs text-slate-500">EUR</span>
                  </div>
                )}
              </td>
            </tr>

            {/* Options */}
            {options.map((option) => (
              <tr key={option.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <span className="text-sm">{option.title}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  +{option.extraDays} jour{option.extraDays > 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={option.expressEnabled}
                      onChange={(e) => store.updateOption(option.id, { expressEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-checked:bg-primary rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </td>
                <td className="px-4 py-3">
                  {option.expressEnabled && (
                    <select
                      value={option.expressDaysReduction}
                      onChange={(e) => store.updateOption(option.id, { expressDaysReduction: Number(e.target.value) })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                    >
                      {Array.from({ length: getMaxReduction(baseDeliveryDays + option.extraDays) }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d} className="bg-neutral-900">-{d} jour{d > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  {option.expressEnabled && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={option.expressPrice || ""}
                        onChange={(e) => store.updateOption(option.id, { expressPrice: Number(e.target.value) })}
                        min={0}
                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                        placeholder="10"
                      />
                      <span className="text-xs text-slate-500">EUR</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {options.length === 0 && !expressDelivery.baseExpressEnabled && (
          <div className="p-8 text-center text-sm text-slate-500">
            Activez la livraison express pour le service de base ci-dessus.
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">info</span>
        Le délai avec livraison express ne peut pas être inférieur à 1 jour.
      </p>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-white/5">
        <button onClick={() => store.setStep(4)} className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Précédent
        </button>
        <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
          Enregistrer et suivant
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
