"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminStore } from "@/store/admin";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";

const PLAN_KEYS = ["gratuit", "pro", "business", "agence"] as const;
const PLAN_LABELS: Record<string, string> = { gratuit: "Gratuit", pro: "Pro", business: "Business", agence: "Agence" };
const PLAN_COLORS = ["border-slate-500", "border-primary", "border-blue-500", "border-purple-500"];

function PlansSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-neutral-dark rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-neutral-dark rounded-xl p-5 border border-border-dark animate-pulse">
            <div className="h-5 w-24 bg-border-dark rounded mb-3" />
            <div className="h-8 w-32 bg-border-dark rounded mb-4" />
            <div className="space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 w-20 bg-border-dark rounded" />
                  <div className="h-4 w-12 bg-border-dark rounded" />
                </div>
              ))}
            </div>
            <div className="h-9 w-full bg-border-dark rounded-lg mt-4" />
          </div>
        ))}
      </div>
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
        <div className="h-6 w-48 bg-border-dark rounded" />
      </div>
    </div>
  );
}

export default function AdminPlans() {
  const { config, loading, syncConfig, updateConfig } = useAdminStore();
  const { addToast } = useToastStore();

  const [editPlan, setEditPlan] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    commissionType: string;
    commissionValue: number;
    price: number;
    maxServices: number;
    maxCandidatures: number;
    boostsPerMonth: number;
  }>({ commissionType: "percentage", commissionValue: 0, price: 0, maxServices: 0, maxCandidatures: 0, boostsPerMonth: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    syncConfig();
  }, [syncConfig]);

  const plans = useMemo(() => {
    if (!config) return [];
    return PLAN_KEYS.map((key) => {
      const plan = config.plans[key];
      const commissionType = (plan as Record<string, unknown>)?.commissionType as string || "percentage";
      const commissionValue = (plan as Record<string, unknown>)?.commissionValue as number ?? config.commissions[key] ?? 0;
      return {
        key,
        name: PLAN_LABELS[key] ?? key,
        price: plan?.price ?? 0,
        commissionType,
        commissionValue,
        maxServices: plan?.maxServices ?? 0,
        maxCandidatures: plan?.maxCandidatures ?? 0,
        boostsPerMonth: plan?.boostsPerMonth ?? 0,
      };
    });
  }, [config]);

  function handleEditPlan(key: string) {
    const plan = plans.find((p) => p.key === key);
    if (!plan) return;
    setEditPlan(key);
    setEditValues({
      commissionType: plan.commissionType,
      commissionValue: plan.commissionValue,
      price: plan.price,
      maxServices: plan.maxServices,
      maxCandidatures: plan.maxCandidatures,
      boostsPerMonth: plan.boostsPerMonth,
    });
  }

  async function handleSave() {
    if (editPlan === null || !config) return;
    setSaving(true);

    const updatedPlans = {
      ...config.plans,
      [editPlan]: {
        ...config.plans[editPlan],
        price: editValues.price,
        commissionType: editValues.commissionType,
        commissionValue: editValues.commissionValue,
        maxServices: editValues.maxServices,
        maxCandidatures: editValues.maxCandidatures,
        boostsPerMonth: editValues.boostsPerMonth,
      },
    };
    const updatedCommissions = {
      ...config.commissions,
      [editPlan]: editValues.commissionType === "percentage" ? editValues.commissionValue : 0,
    };

    const ok = await updateConfig({ plans: updatedPlans, commissions: updatedCommissions });
    setSaving(false);
    if (ok) {
      addToast("success", `Plan ${PLAN_LABELS[editPlan] ?? editPlan} mis a jour`);
      setEditPlan(null);
    } else {
      addToast("error", "Erreur lors de la mise a jour du plan");
    }
  }

  if (loading.config) return <PlansSkeleton />;

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <span className="material-symbols-outlined text-5xl mb-3">error_outline</span>
        <p className="font-medium">Impossible de charger la configuration</p>
        <button onClick={() => syncConfig()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">workspace_premium</span>
        Plans &amp; Commissions
      </h1>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((p, i) => (
          <div key={p.key} className={cn("bg-neutral-dark rounded-xl p-5 border-2", PLAN_COLORS[i] || "border-border-dark")}>
            <h3 className="font-bold text-lg text-white">{p.name}</h3>
            <p className="text-2xl font-bold mt-2 text-white">
              {p.price === 0 ? "Gratuit" : `\u20AC${p.price}/mois`}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Commission</span>
                <span className="font-bold text-white">
                  {p.commissionType === "fixed" ? `${p.commissionValue}\u20AC/vente` : `${p.commissionValue}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Services</span>
                <span className="font-bold text-white">{p.maxServices === 0 || p.maxServices === -1 ? "Illimit\u00e9" : p.maxServices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Candidatures/mois</span>
                <span className="font-bold text-white">{p.maxCandidatures === 0 || p.maxCandidatures === -1 ? "Illimit\u00e9" : p.maxCandidatures}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Boosts/mois</span>
                <span className="font-bold text-primary">{p.boostsPerMonth}</span>
              </div>
            </div>
            <button
              onClick={() => handleEditPlan(p.key)}
              className="w-full mt-4 py-2 border border-border-dark rounded-lg text-xs font-semibold text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              Modifier
            </button>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editPlan !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditPlan(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark">
            <h3 className="font-bold text-lg text-white mb-4">
              Modifier le plan {PLAN_LABELS[editPlan] ?? editPlan}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Prix (EUR/mois)
                </label>
                <input
                  type="number"
                  value={editValues.price}
                  onChange={(e) => setEditValues((v) => ({ ...v, price: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Type de commission
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => setEditValues((v) => ({ ...v, commissionType: "percentage" }))}
                    className={cn("py-2 rounded-lg text-sm font-bold border-2 transition-all", editValues.commissionType === "percentage" ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-400")}
                  >
                    Pourcentage (%)
                  </button>
                  <button
                    onClick={() => setEditValues((v) => ({ ...v, commissionType: "fixed" }))}
                    className={cn("py-2 rounded-lg text-sm font-bold border-2 transition-all", editValues.commissionType === "fixed" ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-400")}
                  >
                    Fixe (EUR/vente)
                  </button>
                </div>
                <input
                  type="number"
                  value={editValues.commissionValue}
                  onChange={(e) => setEditValues((v) => ({ ...v, commissionValue: Number(e.target.value) }))}
                  min={0}
                  max={editValues.commissionType === "percentage" ? 50 : 100}
                  step={editValues.commissionType === "fixed" ? 0.5 : 1}
                  placeholder={editValues.commissionType === "percentage" ? "Ex: 12" : "Ex: 1"}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {editValues.commissionType === "percentage" ? `${editValues.commissionValue}% preleve sur chaque vente` : `${editValues.commissionValue}\u20AC preleve par vente`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Services max (0 = illimite)
                </label>
                <input
                  type="number"
                  value={editValues.maxServices}
                  onChange={(e) => setEditValues((v) => ({ ...v, maxServices: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Candidatures/mois max (0 = illimite)
                </label>
                <input
                  type="number"
                  value={editValues.maxCandidatures}
                  onChange={(e) => setEditValues((v) => ({ ...v, maxCandidatures: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Boosts/mois
                </label>
                <input
                  type="number"
                  value={editValues.boostsPerMonth}
                  onChange={(e) => setEditValues((v) => ({ ...v, boostsPerMonth: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditPlan(null)}
                className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-border-dark transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
