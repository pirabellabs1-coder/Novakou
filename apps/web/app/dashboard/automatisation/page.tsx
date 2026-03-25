"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import { normalizePlanName, PLAN_RULES, canCreateScenario } from "@/lib/plans";
import type { ApiAutomationTrigger, ApiAutomationCondition, ApiAutomationAction, ApiAutomationScenario } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// UI config (not data)
// ---------------------------------------------------------------------------

const MESSAGE_VARIABLES = [
  { var: "{nom_client}", label: "Nom du client" },
  { var: "{service}", label: "Nom du service" },
  { var: "{montant}", label: "Montant" },
  { var: "{delai}", label: "Delai de livraison" },
  { var: "{date}", label: "Date actuelle" },
];

// Template definitions with trigger/action mappings for pre-fill
const TEMPLATES = [
  { name: "Accueil automatique", desc: "Envoie un message de bienvenue a chaque nouveau client qui vous contacte.", icon: "waving_hand", triggerId: "t2", actionIds: ["a1"], defaultMessage: "Bonjour {nom_client} ! Merci de me contacter. Je suis disponible pour discuter de votre projet. N'hesitez pas a me decrire votre besoin !" },
  { name: "Relance client inactif", desc: "Relance automatiquement les clients qui n'ont pas donne de nouvelles depuis 7 jours.", icon: "notifications_active", triggerId: "t7", actionIds: ["a1"], defaultMessage: "Bonjour {nom_client}, j'espere que tout va bien ! Je voulais prendre de vos nouvelles concernant notre echange. N'hesitez pas a me recontacter si besoin." },
  { name: "Suivi post-livraison", desc: "Envoie un message et un email apres chaque livraison pour demander un avis.", icon: "check_circle", triggerId: "t4", actionIds: ["a1", "a3"], defaultMessage: "Bonjour {nom_client} ! Votre commande pour {service} a ete livree. J'espere que le resultat vous plait. N'hesitez pas a laisser un avis !" },
  { name: "Remerciement avis", desc: "Remercie automatiquement les clients qui laissent un avis positif (4+ etoiles).", icon: "star", triggerId: "t5", actionIds: ["a1"], defaultMessage: "Merci beaucoup {nom_client} pour votre avis ! Votre retour me motive a continuer a donner le meilleur. Au plaisir de retravailler ensemble !" },
  { name: "Confirmation paiement", desc: "Envoie une confirmation automatique a la reception d'un paiement.", icon: "payments", triggerId: "t3", actionIds: ["a1", "a3"], defaultMessage: "Bonjour {nom_client}, votre paiement de {montant} a bien ete recu pour {service}. Je commence le travail immediatement !" },
];

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonScenario() {
  return (
    <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 border-l-4 border-l-primary animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-6 bg-slate-700 rounded-full" />
        <div className="h-4 w-40 bg-slate-700 rounded" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-8 w-48 bg-slate-700/30 rounded-lg" />
        <div className="h-8 w-24 bg-slate-700/30 rounded-lg" />
        <div className="h-8 w-32 bg-slate-700/30 rounded-lg" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-28 bg-slate-700/20 rounded" />
        <div className="h-3 w-20 bg-slate-700/20 rounded" />
      </div>
    </div>
  );
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AutomationPage() {
  const {
    currentPlan, automation, automationLoading, automationHistory,
    syncAutomation, createScenario, updateScenario, duplicateScenario,
    toggleScenario, deleteScenario, syncAutomationHistory,
  } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  const [sideTab, setSideTab] = useState<"scenarios" | "historique" | "modeles">("scenarios");
  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Creator state
  const [creatorStep, setCreatorStep] = useState(0);
  const [scenarioName, setScenarioName] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState<ApiAutomationTrigger | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<{ condition: ApiAutomationCondition; value: string }[]>([]);
  const [selectedActions, setSelectedActions] = useState<{ action: ApiAutomationAction; message?: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    syncAutomation();
  }, [syncAutomation]);

  // Load history when switching to that tab
  useEffect(() => {
    if (sideTab === "historique") syncAutomationHistory();
  }, [sideTab, syncAutomationHistory]);

  const scenarios = automation?.scenarios ?? [];
  const triggers = automation?.triggers ?? [];
  const conditions = automation?.conditions ?? [];
  const actions = automation?.actions ?? [];

  const plan = normalizePlanName(currentPlan);
  const planRules = PLAN_RULES[plan];

  // Plan gate
  if (planRules.scenarioLimit === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-md text-center">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Automatisation Marketing</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Passez en Pro ou Business pour acceder a l&apos;automatisation marketing et automatiser vos reponses, relances et workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/abonnement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-sm">workspace_premium</span>
              Passer Pro - 15 EUR/mois
            </Link>
            <Link href="/dashboard/abonnement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 transition-all">
              Voir tous les plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handlers
  async function handleToggle(id: string) {
    const sc = scenarios.find((s) => s.id === id);
    if (!sc) return;
    const ok = await toggleScenario(id, !sc.active);
    if (ok) addToast("success", sc.active ? "Scenario desactive" : "Scenario active");
  }

  async function handleDelete(id: string) {
    const ok = await deleteScenario(id);
    if (ok) addToast("success", "Scenario supprime");
  }

  async function handleDuplicate(id: string) {
    if (!canCreateScenario(plan, scenarios.length)) {
      addToast("error", `Limite atteinte (${scenarios.length}/${planRules.scenarioLimit} scenarios). Passez au plan superieur.`);
      return;
    }
    const ok = await duplicateScenario(id);
    if (ok) addToast("success", "Scenario duplique");
  }

  function resetCreator() {
    setCreatorStep(0);
    setScenarioName("");
    setSelectedTrigger(null);
    setSelectedConditions([]);
    setSelectedActions([]);
    setShowCreator(false);
    setEditingId(null);
  }

  function handleEdit(scenario: ApiAutomationScenario) {
    setEditingId(scenario.id);
    setScenarioName(scenario.name);
    setSelectedTrigger(scenario.trigger);
    setSelectedConditions(scenario.conditions);
    setSelectedActions(scenario.actions);
    setCreatorStep(0);
    setShowCreator(true);
  }

  function handleUseTemplate(template: typeof TEMPLATES[number]) {
    if (!canCreateScenario(plan, scenarios.length)) {
      addToast("error", `Limite atteinte (${scenarios.length}/${planRules.scenarioLimit} scenarios). Passez au plan superieur.`);
      return;
    }
    const trigger = triggers.find((t) => t.id === template.triggerId);
    if (!trigger) { addToast("error", "Declencheur du modele introuvable"); return; }
    const templateActions = template.actionIds
      .map((aid) => actions.find((a) => a.id === aid))
      .filter(Boolean) as ApiAutomationAction[];
    if (templateActions.length === 0) { addToast("error", "Actions du modele introuvables"); return; }

    setEditingId(null);
    setScenarioName(template.name);
    setSelectedTrigger(trigger);
    setSelectedConditions([]);
    setSelectedActions(templateActions.map((a) => ({ action: a, message: a.hasMessage ? template.defaultMessage : "" })));
    setCreatorStep(4); // Go directly to preview
    setShowCreator(true);
  }

  function handleCreateNew() {
    if (!canCreateScenario(plan, scenarios.length) && !editingId) {
      addToast("error", `Limite atteinte (${scenarios.length}/${planRules.scenarioLimit} scenarios). Passez au plan superieur.`);
      return;
    }
    resetCreator();
    setShowCreator(true);
  }

  async function handleCreateScenario() {
    if (!selectedTrigger || selectedActions.length === 0 || !scenarioName) return;
    setCreating(true);

    const scenarioData = {
      name: scenarioName,
      active: true,
      trigger: selectedTrigger,
      conditions: selectedConditions,
      actions: selectedActions,
    };

    let ok: boolean;
    if (editingId) {
      ok = await updateScenario(editingId, scenarioData);
      if (ok) addToast("success", "Scenario mis a jour !");
    } else {
      ok = await createScenario(scenarioData);
      if (ok) addToast("success", "Scenario cree avec succes !");
    }
    setCreating(false);
    if (ok) {
      resetCreator();
    } else {
      addToast("error", editingId ? "Erreur lors de la mise a jour" : "Erreur lors de la creation du scenario");
    }
  }

  function addCondition(condition: ApiAutomationCondition) {
    if (selectedConditions.find((c) => c.condition.id === condition.id)) return;
    setSelectedConditions((prev) => [...prev, { condition, value: "" }]);
  }

  function removeCondition(id: string) {
    setSelectedConditions((prev) => prev.filter((c) => c.condition.id !== id));
  }

  function updateConditionValue(id: string, value: string) {
    setSelectedConditions((prev) => prev.map((c) => (c.condition.id === id ? { ...c, value } : c)));
  }

  function addAction(action: ApiAutomationAction) {
    setSelectedActions((prev) => [...prev, { action, message: "" }]);
  }

  function removeAction(idx: number) {
    setSelectedActions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateActionMessage(idx: number, message: string) {
    setSelectedActions((prev) => prev.map((a, i) => (i === idx ? { ...a, message } : a)));
  }

  const limitLabel = isFinite(planRules.scenarioLimit)
    ? `${scenarios.length}/${planRules.scenarioLimit}`
    : `${scenarios.length}`;

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 p-6 border-r border-border-dark shrink-0">
        <div className="sticky top-24">
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Menu Automation</h3>
            <nav className="space-y-1">
              {([
                { key: "scenarios" as const, icon: "settings_suggest", label: "Scenarios", count: scenarios.length },
                { key: "historique" as const, icon: "history", label: "Historique" },
                { key: "modeles" as const, icon: "class", label: "Modeles" },
              ]).map((item) => (
                <button key={item.key} onClick={() => setSideTab(item.key)}
                  className={cn("flex items-center gap-3 px-3 py-2 rounded-lg font-semibold w-full text-left transition-colors",
                    sideTab === item.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-primary/5")}>
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                  {item.count !== undefined && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{item.count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Quick stats */}
          <div className="space-y-3 mb-8">
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-slate-500">Scenarios actifs</p>
              <p className="text-xl font-extrabold text-primary">{scenarios.filter((s) => s.active).length}</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-slate-500">Total declenchements</p>
              <p className="text-xl font-extrabold text-primary">{scenarios.reduce((a, s) => a + s.triggerCount, 0)}</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-slate-500">Limite scenarios</p>
              <p className="text-xl font-extrabold text-primary">{limitLabel}</p>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-sm">info</span>
              <span className="text-xs font-bold uppercase">Conseil</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Les reponses automatiques peuvent augmenter votre taux de conversion de 25% en repondant instantanement aux nouveaux clients.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-6 lg:p-10 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="hover:text-primary cursor-pointer">Dashboard</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary font-medium">Automatisation</span>
            </nav>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">Automatisation Marketing</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Creez des scenarios automatises pour gagner du temps et professionnaliser vos echanges.
            </p>
          </div>
          <button onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">add</span>
            Creer un scenario
          </button>
        </div>

        {/* Scenario Creator Modal */}
        {showCreator && (
          <div className="mb-10 bg-white dark:bg-neutral-dark border border-primary/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">magic_button</span>
                {editingId ? "Modifier le scenario" : "Nouveau scenario"}
              </h2>
              <button onClick={resetCreator} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {["Nom", "Déclencheur", "Conditions", "Actions", "Aperçu"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <button onClick={() => setCreatorStep(i)}
                    className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                      creatorStep === i ? "bg-primary text-white" : creatorStep > i ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-border-dark text-slate-400")}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                      {creatorStep > i ? "\u2713" : i + 1}
                    </span>
                    <span className="hidden sm:inline">{step}</span>
                  </button>
                  {i < 4 && <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>}
                </div>
              ))}
            </div>

            {/* Step 0: Name */}
            {creatorStep === 0 && (
              <div className="max-w-lg">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Nom du scenario</label>
                <input type="text" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Ex: Accueil des nouveaux clients"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <button onClick={() => scenarioName && setCreatorStep(1)} disabled={!scenarioName}
                  className="mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40">
                  Suivant
                </button>
              </div>
            )}

            {/* Step 1: Trigger */}
            {creatorStep === 1 && (
              <div>
                <p className="text-sm text-slate-500 mb-4">Choisissez l&apos;evenement qui declenchera le scenario :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {triggers.map((trigger) => (
                    <button key={trigger.id} onClick={() => setSelectedTrigger(trigger)}
                      className={cn("flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                        selectedTrigger?.id === trigger.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-slate-200 dark:border-border-dark hover:border-primary/30")}>
                      <span className="material-symbols-outlined text-primary text-xl">{trigger.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{trigger.label}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{trigger.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCreatorStep(0)} className="px-4 py-2 border border-slate-200 dark:border-border-dark rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-border-dark transition-all">Retour</button>
                  <button onClick={() => selectedTrigger && setCreatorStep(2)} disabled={!selectedTrigger}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40">Suivant</button>
                </div>
              </div>
            )}

            {/* Step 2: Conditions (optional) */}
            {creatorStep === 2 && (
              <div>
                <p className="text-sm text-slate-500 mb-4">Ajoutez des conditions (optionnel) :</p>
                {selectedConditions.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {selectedConditions.map((sc) => (
                      <div key={sc.condition.id} className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="material-symbols-outlined text-primary">{sc.condition.icon}</span>
                        <span className="text-sm font-medium flex-1">{sc.condition.label}</span>
                        {sc.condition.valueType === "select" && sc.condition.options ? (
                          <select value={sc.value} onChange={(e) => updateConditionValue(sc.condition.id, e.target.value)}
                            className="text-sm p-1.5 rounded-lg border border-primary/20 bg-white dark:bg-background-dark outline-none">
                            <option value="">Choisir...</option>
                            {sc.condition.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input type={sc.condition.valueType === "number" ? "number" : "text"} value={sc.value}
                            onChange={(e) => updateConditionValue(sc.condition.id, e.target.value)} placeholder="Valeur..."
                            className="w-32 text-sm p-1.5 rounded-lg border border-primary/20 bg-white dark:bg-background-dark outline-none" />
                        )}
                        <button onClick={() => removeCondition(sc.condition.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {conditions.filter((c) => !selectedConditions.find((sc) => sc.condition.id === c.id)).map((condition) => (
                    <button key={condition.id} onClick={() => addCondition(condition)}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary/30 text-left transition-all text-sm">
                      <span className="material-symbols-outlined text-slate-400 text-lg">add_circle</span>
                      <span className="material-symbols-outlined text-primary text-sm">{condition.icon}</span>
                      {condition.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCreatorStep(1)} className="px-4 py-2 border border-slate-200 dark:border-border-dark rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-border-dark transition-all">Retour</button>
                  <button onClick={() => setCreatorStep(3)} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all">
                    Suivant {selectedConditions.length === 0 && "(sans conditions)"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Actions */}
            {creatorStep === 3 && (
              <div>
                <p className="text-sm text-slate-500 mb-4">Choisissez les actions a executer :</p>
                {selectedActions.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {selectedActions.map((sa, idx) => (
                      <div key={idx} className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{idx + 1}</span>
                            <span className="material-symbols-outlined text-primary">{sa.action.icon}</span>
                            <span className="text-sm font-bold">{sa.action.label}</span>
                          </div>
                          <button onClick={() => removeAction(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                        {sa.action.hasMessage && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {MESSAGE_VARIABLES.map((v) => (
                                <button key={v.var} onClick={() => updateActionMessage(idx, (sa.message || "") + v.var)}
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary/20 transition-colors" title={v.label}>
                                  {v.var}
                                </button>
                              ))}
                            </div>
                            <textarea value={sa.message || ""} onChange={(e) => updateActionMessage(idx, e.target.value)}
                              placeholder="Redigez votre message... Utilisez les variables ci-dessus."
                              className="w-full p-3 rounded-lg border border-primary/20 bg-white dark:bg-background-dark text-sm outline-none focus:ring-1 focus:ring-primary resize-none" rows={3} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {actions.map((action) => (
                    <button key={action.id} onClick={() => addAction(action)}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary/30 text-left transition-all text-sm">
                      <span className="material-symbols-outlined text-slate-400 text-lg">add_circle</span>
                      <span className="material-symbols-outlined text-primary text-sm">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCreatorStep(2)} className="px-4 py-2 border border-slate-200 dark:border-border-dark rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-border-dark transition-all">Retour</button>
                  <button onClick={() => selectedActions.length > 0 && setCreatorStep(4)} disabled={selectedActions.length === 0}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40">Aperçu</button>
                </div>
              </div>
            )}

            {/* Step 4: Preview */}
            {creatorStep === 4 && (
              <div>
                <div className="bg-slate-50 dark:bg-background-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark mb-6">
                  <h3 className="font-bold text-lg mb-4">{scenarioName}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-blue-500">{selectedTrigger?.icon}</span>
                      </div>
                      <div className="flex-1 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-0.5">Declencheur</p>
                        <p className="text-sm font-medium">{selectedTrigger?.label}</p>
                      </div>
                    </div>
                    {(selectedConditions.length > 0 || selectedActions.length > 0) && (
                      <div className="flex justify-center"><span className="material-symbols-outlined text-slate-300">arrow_downward</span></div>
                    )}
                    {selectedConditions.length > 0 && (
                      <>
                        {selectedConditions.map((sc) => (
                          <div key={sc.condition.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-amber-500">{sc.condition.icon}</span>
                            </div>
                            <div className="flex-1 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                              <p className="text-[10px] font-bold text-amber-500 uppercase mb-0.5">Condition</p>
                              <p className="text-sm font-medium">{sc.condition.label}: <span className="text-primary font-bold">{sc.value || "Non defini"}</span></p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center"><span className="material-symbols-outlined text-slate-300">arrow_downward</span></div>
                      </>
                    )}
                    {selectedActions.map((sa, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-emerald-500">{sa.action.icon}</span>
                          </div>
                          <div className="flex-1 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase mb-0.5">Action {idx + 1}</p>
                            <p className="text-sm font-medium">{sa.action.label}</p>
                            {sa.message && (
                              <p className="text-xs text-slate-500 mt-1 italic border-l-2 border-emerald-500/20 pl-2">{sa.message}</p>
                            )}
                          </div>
                        </div>
                        {idx < selectedActions.length - 1 && (
                          <div className="flex justify-center mt-2"><span className="material-symbols-outlined text-slate-300 text-sm">arrow_downward</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCreatorStep(3)} className="px-4 py-2 border border-slate-200 dark:border-border-dark rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-border-dark transition-all">Modifier</button>
                  <button onClick={handleCreateScenario} disabled={creating}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50">
                    {creating ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">check</span>}
                    {creating ? "En cours..." : editingId ? "Sauvegarder" : "Activer le scenario"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scenarios list */}
        {sideTab === "scenarios" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_tree</span>
              Vos scenarios ({scenarios.length})
            </h3>

            {automationLoading ? (
              <>
                <SkeletonScenario />
                <SkeletonScenario />
                <SkeletonScenario />
              </>
            ) : scenarios.length > 0 ? (
              scenarios.map((scenario) => (
                <div key={scenario.id} className="bg-white dark:bg-primary/5 p-5 rounded-xl border border-slate-200 dark:border-primary/10 shadow-sm border-l-4 border-l-primary">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <button onClick={() => handleToggle(scenario.id)}
                          className={cn("relative w-10 h-6 rounded-full transition-colors", scenario.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
                          <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", scenario.active ? "left-[18px]" : "left-0.5")} />
                        </button>
                        <h4 className="font-bold text-sm">{scenario.name}</h4>
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                          scenario.active ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400")}>
                          {scenario.active ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/5 rounded-lg border border-blue-500/10">
                          <span className="material-symbols-outlined text-blue-500 text-sm">{scenario.trigger.icon}</span>
                          <span className="font-medium text-blue-700 dark:text-blue-400">{scenario.trigger.label}</span>
                        </div>
                        {scenario.conditions.length > 0 && (
                          <>
                            <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/5 rounded-lg border border-amber-500/10">
                              <span className="material-symbols-outlined text-amber-500 text-sm">filter_alt</span>
                              <span className="font-medium text-amber-700 dark:text-amber-400">{scenario.conditions.length} condition{scenario.conditions.length > 1 ? "s" : ""}</span>
                            </div>
                          </>
                        )}
                        <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                          <span className="material-symbols-outlined text-emerald-500 text-sm">{scenario.actions[0]?.action.icon}</span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">{scenario.actions.length} action{scenario.actions.length > 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">bolt</span>
                          {scenario.triggerCount} declenchements
                        </span>
                        {scenario.lastTriggered && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            Dernier: {scenario.lastTriggered}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">calendar_today</span>
                          Cree le {scenario.createdAt}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEdit(scenario)} className="p-2 hover:bg-primary/10 rounded-lg text-slate-400 hover:text-primary transition-colors" title="Modifier">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDuplicate(scenario.id)} className="p-2 hover:bg-primary/10 rounded-lg text-slate-400 hover:text-primary transition-colors" title="Dupliquer">
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                      </button>
                      <button onClick={() => handleDelete(scenario.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Supprimer">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-slate-500">
                <span className="material-symbols-outlined text-5xl mb-4 block">settings_suggest</span>
                <p className="text-lg font-bold mb-2">Aucun scenario</p>
                <p className="text-sm mb-6">Creez votre premier scenario d&apos;automatisation pour gagner du temps.</p>
                <button onClick={handleCreateNew}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all">
                  Creer un scenario
                </button>
              </div>
            )}
          </div>
        )}

        {/* Historique tab — real data from API */}
        {sideTab === "historique" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Historique des declenchements
            </h3>
            {automationHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <span className="material-symbols-outlined text-5xl mb-4 block">history</span>
                <p className="text-lg font-bold mb-2">Aucun historique</p>
                <p className="text-sm">Les declenchements de vos scenarios apparaitront ici.</p>
              </div>
            ) : (
              automationHistory.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 p-4 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">bolt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{entry.scenarioName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{entry.action}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">{entry.badge}</span>
                    <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(entry.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modeles tab — with "Utiliser" buttons */}
        {sideTab === "modeles" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">class</span>
              Modeles de scenarios
            </h3>
            <p className="text-sm text-slate-500 mb-4">Utilisez un modele pre-configure pour demarrer rapidement.</p>
            {TEMPLATES.map((template, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">{template.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{template.desc}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-blue-500">bolt</span>
                      {triggers.find((t) => t.id === template.triggerId)?.label || template.triggerId}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-emerald-500">flash_on</span>
                      {template.actionIds.length} action{template.actionIds.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleUseTemplate(template)}
                  className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-lg hover:bg-primary/20 transition-colors shrink-0">
                  Utiliser
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
