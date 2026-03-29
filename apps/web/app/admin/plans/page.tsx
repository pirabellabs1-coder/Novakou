"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminStore } from "@/store/admin";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";
import { PLAN_RULES, PLAN_FEATURES, PLAN_ORDER, type PlanName } from "@/lib/plans";

const PLAN_KEYS = ["decouverte", "ascension", "sommet", "agence_starter", "empire"] as const;
const PLAN_LABELS: Record<string, string> = { decouverte: "Découverte", ascension: "Ascension", sommet: "Sommet", agence_starter: "Agence Starter", empire: "Empire" };
const PLAN_ICONS: Record<string, string> = { decouverte: "explore", ascension: "trending_up", sommet: "bolt", agence_starter: "apartment", empire: "workspace_premium" };
const PLAN_COLORS: Record<string, string> = { decouverte: "border-slate-500", ascension: "border-amber-500", sommet: "border-primary", agence_starter: "border-blue-500", empire: "border-emerald-500" };
const PLAN_ACCENTS: Record<string, string> = { decouverte: "text-slate-400", ascension: "text-amber-400", sommet: "text-primary", agence_starter: "text-blue-400", empire: "text-emerald-400" };

const SUPPORT_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "prioritaire", label: "Prioritaire" },
  { value: "dedie", label: "Dédié" },
  { value: "vip", label: "VIP dédié" },
];

interface PlanEditValues {
  price: number;
  priceAnnual: number;
  commissionType: string;
  commissionValue: number;
  maxServices: number;
  maxCandidatures: number;
  boostsPerMonth: number;
  scenarioLimit: number;
  certificationLimit: number;
  productiviteAccess: boolean;
  teamLimit: number;
  crmAccess: boolean;
  cloudStorageGB: number;
  apiAccess: boolean;
  supportLevel: string;
  features: string;
}

function getDefaultsForPlan(key: string): PlanEditValues {
  const upper = key.toUpperCase() as PlanName;
  const rules = PLAN_RULES[upper] ?? PLAN_RULES.DECOUVERTE;
  const features = PLAN_FEATURES[upper] ?? [];
  return {
    price: rules.priceMonthly,
    priceAnnual: rules.priceAnnual,
    commissionType: rules.commissionType,
    commissionValue: rules.commissionValue,
    maxServices: isFinite(rules.serviceLimit) ? rules.serviceLimit : -1,
    maxCandidatures: isFinite(rules.applicationLimit) ? rules.applicationLimit : -1,
    boostsPerMonth: rules.boostLimit,
    scenarioLimit: isFinite(rules.scenarioLimit) ? rules.scenarioLimit : -1,
    certificationLimit: isFinite(rules.certificationLimit) ? rules.certificationLimit : -1,
    productiviteAccess: rules.productiviteAccess,
    teamLimit: rules.teamLimit,
    crmAccess: rules.crmAccess,
    cloudStorageGB: rules.cloudStorageGB,
    apiAccess: rules.apiAccess,
    supportLevel: rules.supportLevel,
    features: features.join("\n"),
  };
}

function formatLimitDisplay(v: number): string {
  if (v === -1 || v === 0) return "Illimité";
  return String(v);
}

function PlansSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-neutral-dark rounded-lg animate-pulse" />
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-neutral-dark rounded-xl p-5 border border-border-dark animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-border-dark rounded" />
              <div className="h-6 w-32 bg-border-dark rounded" />
              <div className="ml-auto h-6 w-20 bg-border-dark rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min = -1, step = 1, hint }: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        step={step}
        className="w-full px-3 py-2 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
      />
      {hint && <p className="text-xs text-slate-600 mt-0.5">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn("w-10 h-5 rounded-full transition-colors relative", checked ? "bg-primary" : "bg-slate-600")}
      >
        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", checked ? "left-5" : "left-0.5")} />
      </button>
    </label>
  );
}

export default function AdminPlans() {
  const { config, loading, syncConfig, updateConfig } = useAdminStore();
  const { addToast } = useToastStore();

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<PlanEditValues | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    syncConfig();
  }, [syncConfig]);

  const plans = useMemo(() => {
    if (!config) return [];
    return PLAN_KEYS.map((key) => {
      const adminPlan = config.plans[key];
      const defaults = getDefaultsForPlan(key);
      return {
        key,
        name: PLAN_LABELS[key] ?? key,
        price: adminPlan?.price ?? defaults.price,
        priceAnnual: (adminPlan as Record<string, unknown>)?.priceAnnual as number ?? defaults.priceAnnual,
        commissionType: (adminPlan as Record<string, unknown>)?.commissionType as string ?? defaults.commissionType,
        commissionValue: (adminPlan as Record<string, unknown>)?.commissionValue as number ?? defaults.commissionValue,
        maxServices: adminPlan?.maxServices ?? defaults.maxServices,
        maxCandidatures: adminPlan?.maxCandidatures ?? defaults.maxCandidatures,
        boostsPerMonth: adminPlan?.boostsPerMonth ?? defaults.boostsPerMonth,
        scenarioLimit: (adminPlan as Record<string, unknown>)?.scenarioLimit as number ?? defaults.scenarioLimit,
        certificationLimit: (adminPlan as Record<string, unknown>)?.certificationLimit as number ?? defaults.certificationLimit,
        productiviteAccess: (adminPlan as Record<string, unknown>)?.productiviteAccess as boolean ?? defaults.productiviteAccess,
        teamLimit: (adminPlan as Record<string, unknown>)?.teamLimit as number ?? defaults.teamLimit,
        crmAccess: (adminPlan as Record<string, unknown>)?.crmAccess as boolean ?? defaults.crmAccess,
        cloudStorageGB: (adminPlan as Record<string, unknown>)?.cloudStorageGB as number ?? defaults.cloudStorageGB,
        apiAccess: (adminPlan as Record<string, unknown>)?.apiAccess as boolean ?? defaults.apiAccess,
        supportLevel: (adminPlan as Record<string, unknown>)?.supportLevel as string ?? defaults.supportLevel,
        features: ((adminPlan as Record<string, unknown>)?.features as string[]) ?? defaults.features.split("\n"),
      };
    });
  }, [config]);

  function handleExpand(key: string) {
    if (expandedPlan === key) {
      setExpandedPlan(null);
      setEditValues(null);
      return;
    }
    const plan = plans.find((p) => p.key === key);
    if (!plan) return;
    setExpandedPlan(key);
    setEditValues({
      price: plan.price,
      priceAnnual: plan.priceAnnual,
      commissionType: plan.commissionType,
      commissionValue: plan.commissionValue,
      maxServices: plan.maxServices,
      maxCandidatures: plan.maxCandidatures,
      boostsPerMonth: plan.boostsPerMonth,
      scenarioLimit: plan.scenarioLimit,
      certificationLimit: plan.certificationLimit,
      productiviteAccess: plan.productiviteAccess,
      teamLimit: plan.teamLimit,
      crmAccess: plan.crmAccess,
      cloudStorageGB: plan.cloudStorageGB,
      apiAccess: plan.apiAccess,
      supportLevel: plan.supportLevel,
      features: plan.features.join("\n"),
    });
  }

  function setEdit<K extends keyof PlanEditValues>(field: K, value: PlanEditValues[K]) {
    setEditValues((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSave() {
    if (!expandedPlan || !editValues || !config) return;
    setSaving(true);

    const updatedPlans = {
      ...config.plans,
      [expandedPlan]: {
        ...config.plans[expandedPlan],
        price: editValues.price,
        priceAnnual: editValues.priceAnnual,
        commissionType: editValues.commissionType,
        commissionValue: editValues.commissionValue,
        maxServices: editValues.maxServices,
        maxCandidatures: editValues.maxCandidatures,
        boostsPerMonth: editValues.boostsPerMonth,
        scenarioLimit: editValues.scenarioLimit,
        certificationLimit: editValues.certificationLimit,
        productiviteAccess: editValues.productiviteAccess,
        teamLimit: editValues.teamLimit,
        crmAccess: editValues.crmAccess,
        cloudStorageGB: editValues.cloudStorageGB,
        apiAccess: editValues.apiAccess,
        supportLevel: editValues.supportLevel,
        features: editValues.features.split("\n").filter((f) => f.trim()),
      },
    };
    const updatedCommissions = {
      ...config.commissions,
      [expandedPlan]: editValues.commissionType === "percentage" ? editValues.commissionValue : 0,
    };

    const ok = await updateConfig({ plans: updatedPlans, commissions: updatedCommissions });
    setSaving(false);
    if (ok) {
      addToast("success", `Plan ${PLAN_LABELS[expandedPlan] ?? expandedPlan} mis a jour`);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">workspace_premium</span>
          Plans &amp; Commissions
        </h1>
        <p className="text-xs text-slate-500">Les modifications se propagent sur /tarifs, espace freelance et agence</p>
      </div>

      {/* Plan accordion cards */}
      <div className="space-y-3">
        {plans.map((p) => {
          const isExpanded = expandedPlan === p.key;
          const color = PLAN_COLORS[p.key] || "border-border-dark";
          const accent = PLAN_ACCENTS[p.key] || "text-slate-400";
          const icon = PLAN_ICONS[p.key] || "star";

          return (
            <div key={p.key} className={cn("bg-neutral-dark rounded-xl border-2 overflow-hidden transition-all", color)}>
              {/* Summary header */}
              <button
                onClick={() => handleExpand(p.key)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className={cn("material-symbols-outlined text-2xl", accent)}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg">{p.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{p.price === 0 ? "Gratuit" : `${p.price}\u20AC/mois`}</span>
                    <span className="text-slate-600">|</span>
                    <span>{p.commissionType === "fixed" ? `${p.commissionValue}\u20AC/vente` : `${p.commissionValue}%`}</span>
                    <span className="text-slate-600">|</span>
                    <span>Services: {formatLimitDisplay(p.maxServices)}</span>
                    <span className="text-slate-600">|</span>
                    <span>Boosts: {p.boostsPerMonth}</span>
                    <span className="text-slate-600">|</span>
                    <span>{p.features.length} features</span>
                    {p.teamLimit > 0 && <><span className="text-slate-600">|</span><span>{p.teamLimit} membres</span></>}
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                  expand_more
                </span>
              </button>

              {/* Expanded edit form */}
              {isExpanded && editValues && (
                <div className="border-t border-border-dark p-4 sm:p-5 space-y-5">
                  {/* Pricing */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">payments</span>
                      Tarification
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <NumberInput label="Prix mensuel (EUR)" value={editValues.price} onChange={(v) => setEdit("price", v)} min={0} step={0.01} />
                      <NumberInput label="Prix annuel (EUR)" value={editValues.priceAnnual} onChange={(v) => setEdit("priceAnnual", v)} min={0} step={0.01} />
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Type commission</label>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() => setEdit("commissionType", "percentage")}
                            className={cn("py-2 rounded-lg text-xs font-bold border transition-all", editValues.commissionType === "percentage" ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-500")}
                          >
                            %
                          </button>
                          <button
                            onClick={() => setEdit("commissionType", "fixed")}
                            className={cn("py-2 rounded-lg text-xs font-bold border transition-all", editValues.commissionType === "fixed" ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-500")}
                          >
                            Fixe
                          </button>
                        </div>
                      </div>
                      <NumberInput
                        label={editValues.commissionType === "percentage" ? "Commission (%)" : "Commission (EUR/vente)"}
                        value={editValues.commissionValue}
                        onChange={(v) => setEdit("commissionValue", v)}
                        min={0}
                        step={editValues.commissionType === "fixed" ? 0.5 : 1}
                      />
                    </div>
                  </div>

                  {/* Limits */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">tune</span>
                      Limites <span className="text-xs text-slate-500 font-normal">(-1 = illimité)</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <NumberInput label="Services max" value={editValues.maxServices} onChange={(v) => setEdit("maxServices", v)} hint="-1 = illimité" />
                      <NumberInput label="Candidatures/mois" value={editValues.maxCandidatures} onChange={(v) => setEdit("maxCandidatures", v)} hint="-1 = illimité" />
                      <NumberInput label="Boosts/mois" value={editValues.boostsPerMonth} onChange={(v) => setEdit("boostsPerMonth", v)} min={0} />
                      <NumberInput label="Scénarios auto" value={editValues.scenarioLimit} onChange={(v) => setEdit("scenarioLimit", v)} hint="-1 = illimité" />
                      <NumberInput label="Certifications IA/mois" value={editValues.certificationLimit} onChange={(v) => setEdit("certificationLimit", v)} hint="-1 = illimité" />
                    </div>
                  </div>

                  {/* Access & team */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">lock_open</span>
                      Accès & Équipe
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-3">
                        <Toggle label="Outils productivité" checked={editValues.productiviteAccess} onChange={(v) => setEdit("productiviteAccess", v)} />
                        <Toggle label="CRM clients" checked={editValues.crmAccess} onChange={(v) => setEdit("crmAccess", v)} />
                        <Toggle label="Clés API" checked={editValues.apiAccess} onChange={(v) => setEdit("apiAccess", v)} />
                      </div>
                      <NumberInput label="Membres équipe max" value={editValues.teamLimit} onChange={(v) => setEdit("teamLimit", v)} min={0} hint="0 = non applicable" />
                      <NumberInput label="Stockage cloud (GB)" value={editValues.cloudStorageGB} onChange={(v) => setEdit("cloudStorageGB", v)} min={0} hint="0 = non applicable" />
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Niveau support</label>
                        <select
                          value={editValues.supportLevel}
                          onChange={(e) => setEdit("supportLevel", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
                        >
                          {SUPPORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">checklist</span>
                      Features affichées
                      <span className="text-xs text-slate-500 font-normal">(une par ligne)</span>
                    </h4>
                    <textarea
                      value={editValues.features}
                      onChange={(e) => setEdit("features", e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary resize-y font-mono"
                      placeholder={"Services illimités\nCommission 5%\nSupport prioritaire"}
                    />
                    <p className="text-xs text-slate-600 mt-1">{editValues.features.split("\n").filter((l) => l.trim()).length} features</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => { setExpandedPlan(null); setEditValues(null); }}
                      className="px-5 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-border-dark transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                    </button>
                    <button
                      onClick={() => {
                        const defaults = getDefaultsForPlan(expandedPlan!);
                        setEditValues(defaults);
                      }}
                      className="ml-auto px-4 py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Restaurer les valeurs par défaut
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
