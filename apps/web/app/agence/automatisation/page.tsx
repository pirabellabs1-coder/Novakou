"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";
import { profileApi } from "@/lib/api-client";

// ============================================================
// Types
// ============================================================

interface Trigger {
  id: string;
  icon: string;
  label: string;
  category: string;
}

interface Condition {
  id: string;
  icon: string;
  label: string;
  valueType: "number" | "select" | "text";
  options?: string[];
}

interface Action {
  id: string;
  icon: string;
  label: string;
  hasMessage?: boolean;
}

interface Scenario {
  id: string;
  name: string;
  active: boolean;
  trigger: Trigger;
  conditions: { condition: Condition; value: string }[];
  actions: { action: Action; message?: string }[];
  triggerCount: number;
  lastTriggered?: string;
  createdAt: string;
}

interface HistoryEntry {
  scenario: string;
  action: string;
  time: string;
  badge: string;
}

// ============================================================
// Available triggers, conditions, actions (config, not demo data)
// ============================================================

const TRIGGERS: Trigger[] = [
  { id: "t1", icon: "chat_bubble", label: "Nouveau message reçu", category: "Messages" },
  { id: "t2", icon: "person_add", label: "Nouveau client qui contacte", category: "Messages" },
  { id: "t3", icon: "shopping_cart", label: "Commande passée", category: "Commandes" },
  { id: "t4", icon: "check_circle", label: "Commande livrée", category: "Commandes" },
  { id: "t5", icon: "star", label: "Avis laissé", category: "Avis" },
  { id: "t6", icon: "visibility", label: "Page agence visitée X fois", category: "Agence" },
  { id: "t7", icon: "request_quote", label: "Proposition reçue", category: "Commandes" },
  { id: "t8", icon: "cancel", label: "Commande annulée", category: "Commandes" },
  { id: "t9", icon: "payments", label: "Paiement reçu", category: "Finances" },
  { id: "t10", icon: "timer_off", label: "Délai de réponse dépassé", category: "Messages" },
  { id: "t11", icon: "person_off", label: "Client inactif depuis X jours", category: "Clients" },
  { id: "t12", icon: "assignment_ind", label: "Membre assigné à une commande", category: "Équipe" },
  { id: "t13", icon: "group_add", label: "Équipe membre rejoint", category: "Équipe" },
  { id: "t14", icon: "group_remove", label: "Membre quitte l'équipe", category: "Équipe" },
  { id: "t15", icon: "trending_up", label: "Objectif CA mensuel atteint", category: "Finances" },
  { id: "t16", icon: "work", label: "Nouveau projet agence créé", category: "Projets" },
];

const CONDITIONS: Condition[] = [
  { id: "c1", icon: "euro", label: "Budget supérieur à", valueType: "number" },
  { id: "c2", icon: "category", label: "Catégorie", valueType: "select", options: ["Design", "Développement", "Marketing", "Rédaction", "Vidéo"] },
  { id: "c3", icon: "fiber_new", label: "Client est nouveau", valueType: "select", options: ["Oui", "Non"] },
  { id: "c4", icon: "repeat", label: "Client est récurrent", valueType: "select", options: ["Oui", "Non"] },
  { id: "c5", icon: "star", label: "Note supérieure à", valueType: "number" },
  { id: "c6", icon: "schedule", label: "Heure entre", valueType: "text" },
  { id: "c7", icon: "calendar_today", label: "Jour de la semaine", valueType: "select", options: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] },
  { id: "c8", icon: "public", label: "Pays", valueType: "select", options: ["France", "Senegal", "Cote d'Ivoire", "Cameroun", "Belgique", "Canada", "Autre"] },
  { id: "c9", icon: "search", label: "Mot-clé contient", valueType: "text" },
  { id: "c10", icon: "shopping_cart", label: "Montant commande supérieur à", valueType: "number" },
  { id: "c11", icon: "badge", label: "Rôle du membre", valueType: "select", options: ["Manager", "Freelance", "Commercial", "Propriétaire"] },
];

const ACTIONS: Action[] = [
  { id: "a1", icon: "send", label: "Envoyer un message automatique", hasMessage: true },
  { id: "a2", icon: "local_offer", label: "Envoyer une offre personnalisée", hasMessage: true },
  { id: "a3", icon: "confirmation_number", label: "Envoyer un code promo", hasMessage: true },
  { id: "a4", icon: "priority_high", label: "Marquer conversation prioritaire" },
  { id: "a5", icon: "notifications_active", label: "Notifier l'équipe" },
  { id: "a6", icon: "label", label: "Ajouter un tag au client" },
  { id: "a7", icon: "email", label: "Envoyer un email de suivi", hasMessage: true },
  { id: "a8", icon: "alarm", label: "Planifier un rappel" },
  { id: "a9", icon: "assignment_ind", label: "Assigner à un membre", hasMessage: false },
  { id: "a10", icon: "campaign", label: "Notifier le manager", hasMessage: true },
];

const MESSAGE_VARIABLES = [
  { var: "{nom_client}", label: "Nom du client" },
  { var: "{service}", label: "Nom du service" },
  { var: "{montant}", label: "Montant" },
  { var: "{delai}", label: "Délai de livraison" },
  { var: "{date}", label: "Date actuelle" },
  { var: "{nom_agence}", label: "Nom de l'agence" },
  { var: "{membre}", label: "Nom du membre assigné" },
];

// ============================================================
// Plan check type
// ============================================================

type PlanTier = "gratuit" | "pro" | "business" | "agence";

// ============================================================
// Page Component
// ============================================================

export default function AgenceAutomationPage() {
  const { members } = useAgencyStore();

  // Plan detection from profileApi
  const [currentPlan, setCurrentPlan] = useState<PlanTier | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  // Scenarios fetched from API on mount
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);

  // History fetched from API
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // UI state
  const [sideTab, setSideTab] = useState<"scenarios" | "historique" | "modeles">("scenarios");
  const [showCreator, setShowCreator] = useState(false);

  // Creator state
  const [creatorStep, setCreatorStep] = useState(0);
  const [scenarioName, setScenarioName] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<{ condition: Condition; value: string }[]>([]);
  const [selectedActions, setSelectedActions] = useState<{ action: Action; message?: string }[]>([]);

  // ============================================================
  // Load plan from profile API
  // ============================================================
  const loadPlan = useCallback(async () => {
    setPlanLoading(true);
    try {
      const profile = await profileApi.get();
      const profileAny = profile as unknown as Record<string, unknown>;
      let planId: PlanTier = "gratuit";
      if (profileAny.subscription && typeof profileAny.subscription === "object") {
        const sub = profileAny.subscription as Record<string, unknown>;
        const raw = (sub.planId as string) ?? (sub.plan as string) ?? "gratuit";
        if (["gratuit", "pro", "business", "agence"].includes(raw)) {
          planId = raw as PlanTier;
        }
      } else if (profileAny.plan && typeof profileAny.plan === "string") {
        const raw = profileAny.plan;
        if (["gratuit", "pro", "business", "agence"].includes(raw)) {
          planId = raw as PlanTier;
        }
      }
      setCurrentPlan(planId);
    } catch {
      // Fallback: allow access (assume pro to not block in dev)
      setCurrentPlan("pro");
    } finally {
      setPlanLoading(false);
    }
  }, []);

  // ============================================================
  // Load scenarios from API
  // ============================================================
  const loadScenarios = useCallback(async () => {
    setScenariosLoading(true);
    try {
      const res = await fetch("/api/agency/automation/scenarios");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setScenarios(data);
        } else if (data.scenarios && Array.isArray(data.scenarios)) {
          setScenarios(data.scenarios);
        }
      }
      // If not ok, keep empty array
    } catch {
      // API not available yet — start with empty
    } finally {
      setScenariosLoading(false);
    }
  }, []);

  // ============================================================
  // Load history from API
  // ============================================================
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/automation/history");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHistory(data);
        } else if (data.history && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      }
    } catch {
      // API not available — keep empty
    }
  }, []);

  useEffect(() => {
    loadPlan();
    loadScenarios();
    loadHistory();
  }, [loadPlan, loadScenarios, loadHistory]);

  // ============================================================
  // Plan gate — loading
  // ============================================================
  if (planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Plan gate — gratuit blocked
  // ============================================================
  if (currentPlan === "gratuit") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-md text-center">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3">
            Automatisation Marketing
          </h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Passez en Pro, Business ou Agence pour accéder à l&apos;automatisation marketing et automatiser vos réponses, relances et workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/agence/abonnement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-sm">workspace_premium</span>
              Passer Pro - 15 EUR/mois
            </Link>
            <Link
              href="/agence/abonnement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 transition-all"
            >
              Voir tous les plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Handlers
  // ============================================================

  function handleToggle(id: string) {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  function handleDelete(id: string) {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }

  function handleDuplicate(id: string) {
    setScenarios((prev) => {
      const source = prev.find((s) => s.id === id);
      if (!source) return prev;
      const copy: Scenario = {
        ...source,
        id: `sc-${Date.now()}`,
        name: `${source.name} (copie)`,
        active: false,
        triggerCount: 0,
        lastTriggered: undefined,
        createdAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      };
      return [...prev, copy];
    });
  }

  function resetCreator() {
    setCreatorStep(0);
    setScenarioName("");
    setSelectedTrigger(null);
    setSelectedConditions([]);
    setSelectedActions([]);
    setShowCreator(false);
  }

  function handleCreateScenario() {
    if (!selectedTrigger || selectedActions.length === 0 || !scenarioName) return;
    const newScenario: Scenario = {
      id: `sc-${Date.now()}`,
      name: scenarioName,
      active: true,
      trigger: selectedTrigger,
      conditions: selectedConditions,
      actions: selectedActions,
      triggerCount: 0,
      createdAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
    };
    setScenarios((prev) => [...prev, newScenario]);
    resetCreator();
  }

  function addCondition(condition: Condition) {
    if (selectedConditions.find((c) => c.condition.id === condition.id)) return;
    setSelectedConditions((prev) => [...prev, { condition, value: "" }]);
  }

  function removeCondition(id: string) {
    setSelectedConditions((prev) => prev.filter((c) => c.condition.id !== id));
  }

  function updateConditionValue(id: string, value: string) {
    setSelectedConditions((prev) =>
      prev.map((c) => (c.condition.id === id ? { ...c, value } : c))
    );
  }

  function addAction(action: Action) {
    setSelectedActions((prev) => [...prev, { action, message: "" }]);
  }

  function removeAction(idx: number) {
    setSelectedActions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateActionMessage(idx: number, message: string) {
    setSelectedActions((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, message } : a))
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 p-6 border-r border-border-dark shrink-0">
        <div className="sticky top-24">
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Menu Automation
            </h3>
            <nav className="space-y-1">
              {([
                { key: "scenarios" as const, icon: "settings_suggest", label: "Scénarios", count: scenarios.length },
                { key: "historique" as const, icon: "history", label: "Historique" },
                { key: "modeles" as const, icon: "class", label: "Modèles" },
              ]).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSideTab(item.key)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg font-semibold w-full text-left transition-colors",
                    sideTab === item.key ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-primary/5 hover:text-slate-300"
                  )}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                  {item.count !== undefined && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Quick stats */}
          <div className="space-y-3 mb-8">
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-slate-500">Scénarios actifs</p>
              <p className="text-xl font-extrabold text-primary">{scenarios.filter((s) => s.active).length}</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-slate-500">Total déclenchements</p>
              <p className="text-xl font-extrabold text-primary">{scenarios.reduce((a, s) => a + s.triggerCount, 0)}</p>
            </div>
            {members.length > 0 && (
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs text-slate-500">Membres équipe</p>
                <p className="text-xl font-extrabold text-primary">{members.length}</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-sm">info</span>
              <span className="text-xs font-bold uppercase">Conseil</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Les réponses automatiques peuvent augmenter votre taux de conversion de 25% en répondant instantanément aux nouveaux clients.
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
              <Link href="/agence" className="hover:text-primary cursor-pointer">Agence</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary font-medium">Automatisation</span>
            </nav>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mb-2">Automatisation Marketing</h1>
            <p className="text-slate-400">
              Créez des scénarios automatisés pour gagner du temps et professionnaliser les échanges de votre agence.
            </p>
          </div>
          <button
            onClick={() => { resetCreator(); setShowCreator(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">add</span>
            Créer un scénario
          </button>
        </div>

        {/* ============================================================ */}
        {/* Scenario Creator Modal                                       */}
        {/* ============================================================ */}
        {showCreator && (
          <div className="mb-10 bg-neutral-dark border border-primary/20 rounded-2xl p-6 shadow-xl">
            {/* Creator header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary">magic_button</span>
                Nouveau scénario
              </h2>
              <button onClick={resetCreator} className="p-2 rounded-lg hover:bg-border-dark transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {["Nom", "Déclencheur", "Conditions", "Actions", "Aperçu"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <button
                    onClick={() => setCreatorStep(i)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                      creatorStep === i
                        ? "bg-primary text-white"
                        : creatorStep > i
                        ? "bg-primary/10 text-primary"
                        : "bg-border-dark text-slate-500"
                    )}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                      {creatorStep > i ? "\u2713" : i + 1}
                    </span>
                    <span className="hidden sm:inline">{step}</span>
                  </button>
                  {i < 4 && <span className="material-symbols-outlined text-xs text-slate-600">chevron_right</span>}
                </div>
              ))}
            </div>

            {/* Step 0: Name */}
            {creatorStep === 0 && (
              <div className="max-w-lg">
                <label className="text-sm font-bold text-slate-300 mb-2 block">
                  Nom du scénario
                </label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Ex: Accueil des nouveaux clients"
                  className="w-full p-3 rounded-xl border border-border-dark bg-background-dark text-sm text-white outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-600"
                />
                <button
                  onClick={() => scenarioName && setCreatorStep(1)}
                  disabled={!scenarioName}
                  className="mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            )}

            {/* Step 1: Trigger */}
            {creatorStep === 1 && (
              <div>
                <p className="text-sm text-slate-400 mb-4">Choisissez l&apos;événement qui déclenchera le scénario :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TRIGGERS.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => setSelectedTrigger(trigger)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                        selectedTrigger?.id === trigger.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border-dark hover:border-primary/30"
                      )}
                    >
                      <span className="material-symbols-outlined text-primary text-xl">{trigger.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{trigger.label}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{trigger.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCreatorStep(0)} className="px-4 py-2 border border-border-dark rounded-xl text-sm font-bold text-slate-300 hover:bg-border-dark transition-all">
                    Retour
                  </button>
                  <button
                    onClick={() => selectedTrigger && setCreatorStep(2)}
                    disabled={!selectedTrigger}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Conditions (optional) */}
            {creatorStep === 2 && (
              <div>
                <p className="text-sm text-slate-400 mb-4">Ajoutez des conditions (optionnel) :</p>

                {/* Selected conditions */}
                {selectedConditions.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {selectedConditions.map((sc) => (
                      <div key={sc.condition.id} className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="material-symbols-outlined text-primary">{sc.condition.icon}</span>
                        <span className="text-sm font-medium text-white flex-1">{sc.condition.label}</span>
                        {sc.condition.valueType === "select" && sc.condition.options ? (
                          <select
                            value={sc.value}
                            onChange={(e) => updateConditionValue(sc.condition.id, e.target.value)}
                            className="text-sm p-1.5 rounded-lg border border-primary/20 bg-background-dark text-white outline-none"
                          >
                            <option value="">Choisir...</option>
                            {sc.condition.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={sc.condition.valueType === "number" ? "number" : "text"}
                            value={sc.value}
                            onChange={(e) => updateConditionValue(sc.condition.id, e.target.value)}
                            placeholder="Valeur..."
                            className="w-32 text-sm p-1.5 rounded-lg border border-primary/20 bg-background-dark text-white outline-none placeholder:text-slate-600"
                          />
                        )}
                        <button onClick={() => removeCondition(sc.condition.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITIONS.filter((c) => !selectedConditions.find((sc) => sc.condition.id === c.id)).map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => addCondition(condition)}
                      className="flex items-center gap-2 p-3 rounded-xl border border-border-dark hover:border-primary/30 text-left transition-all text-sm text-slate-300"
                    >
                      <span className="material-symbols-outlined text-slate-500 text-lg">add_circle</span>
                      <span className="material-symbols-outlined text-primary text-sm">{condition.icon}</span>
                      {condition.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCreatorStep(1)} className="px-4 py-2 border border-border-dark rounded-xl text-sm font-bold text-slate-300 hover:bg-border-dark transition-all">
                    Retour
                  </button>
                  <button onClick={() => setCreatorStep(3)} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all">
                    Suivant {selectedConditions.length === 0 && "(sans conditions)"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Actions */}
            {creatorStep === 3 && (
              <div>
                <p className="text-sm text-slate-400 mb-4">Choisissez les actions à exécuter :</p>

                {/* Selected actions */}
                {selectedActions.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {selectedActions.map((sa, idx) => (
                      <div key={idx} className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="material-symbols-outlined text-primary">{sa.action.icon}</span>
                            <span className="text-sm font-bold text-white">{sa.action.label}</span>
                          </div>
                          <button onClick={() => removeAction(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                        {sa.action.hasMessage && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {MESSAGE_VARIABLES.map((v) => (
                                <button
                                  key={v.var}
                                  onClick={() => updateActionMessage(idx, (sa.message || "") + v.var)}
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary/20 transition-colors"
                                  title={v.label}
                                >
                                  {v.var}
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={sa.message || ""}
                              onChange={(e) => updateActionMessage(idx, e.target.value)}
                              placeholder="Rédigez votre message... Utilisez les variables ci-dessus."
                              className="w-full p-3 rounded-lg border border-primary/20 bg-background-dark text-sm text-white outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-slate-600"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Available actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => addAction(action)}
                      className="flex items-center gap-2 p-3 rounded-xl border border-border-dark hover:border-primary/30 text-left transition-all text-sm text-slate-300"
                    >
                      <span className="material-symbols-outlined text-slate-500 text-lg">add_circle</span>
                      <span className="material-symbols-outlined text-primary text-sm">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCreatorStep(2)} className="px-4 py-2 border border-border-dark rounded-xl text-sm font-bold text-slate-300 hover:bg-border-dark transition-all">
                    Retour
                  </button>
                  <button
                    onClick={() => selectedActions.length > 0 && setCreatorStep(4)}
                    disabled={selectedActions.length === 0}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    Aperçu
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Preview */}
            {creatorStep === 4 && (
              <div>
                <div className="bg-background-dark p-6 rounded-xl border border-border-dark mb-6">
                  <h3 className="font-bold text-lg text-white mb-4">{scenarioName}</h3>

                  {/* Visual flow */}
                  <div className="space-y-4">
                    {/* Trigger */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-blue-500">{selectedTrigger?.icon}</span>
                      </div>
                      <div className="flex-1 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-0.5">Déclencheur</p>
                        <p className="text-sm font-medium text-white">{selectedTrigger?.label}</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    {(selectedConditions.length > 0 || selectedActions.length > 0) && (
                      <div className="flex justify-center">
                        <span className="material-symbols-outlined text-slate-600">arrow_downward</span>
                      </div>
                    )}

                    {/* Conditions */}
                    {selectedConditions.length > 0 && (
                      <>
                        {selectedConditions.map((sc) => (
                          <div key={sc.condition.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-amber-500">{sc.condition.icon}</span>
                            </div>
                            <div className="flex-1 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                              <p className="text-[10px] font-bold text-amber-500 uppercase mb-0.5">Condition</p>
                              <p className="text-sm font-medium text-white">{sc.condition.label}: <span className="text-primary font-bold">{sc.value || "Non défini"}</span></p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center">
                          <span className="material-symbols-outlined text-slate-600">arrow_downward</span>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    {selectedActions.map((sa, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-emerald-500">{sa.action.icon}</span>
                          </div>
                          <div className="flex-1 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase mb-0.5">Action {idx + 1}</p>
                            <p className="text-sm font-medium text-white">{sa.action.label}</p>
                            {sa.message && (
                              <p className="text-xs text-slate-400 mt-1 italic border-l-2 border-emerald-500/20 pl-2">
                                {sa.message}
                              </p>
                            )}
                          </div>
                        </div>
                        {idx < selectedActions.length - 1 && (
                          <div className="flex justify-center mt-2">
                            <span className="material-symbols-outlined text-slate-600 text-sm">arrow_downward</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCreatorStep(3)} className="px-4 py-2 border border-border-dark rounded-xl text-sm font-bold text-slate-300 hover:bg-border-dark transition-all">
                    Modifier
                  </button>
                  <button
                    onClick={handleCreateScenario}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Activer le scénario
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* Scenarios list                                                */}
        {/* ============================================================ */}
        {sideTab === "scenarios" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">account_tree</span>
              Vos scénarios ({scenarios.length})
            </h3>

            {scenariosLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Chargement des scénarios...</p>
                </div>
              </div>
            ) : (
              <>
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="bg-primary/5 p-5 rounded-xl border border-primary/10 shadow-sm border-l-4 border-l-primary"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={() => handleToggle(scenario.id)}
                            className={cn(
                              "relative w-10 h-6 rounded-full transition-colors",
                              scenario.active ? "bg-emerald-500" : "bg-slate-600"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                              scenario.active ? "left-[18px]" : "left-0.5"
                            )} />
                          </button>
                          <h4 className="font-bold text-sm text-white">{scenario.name}</h4>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                            scenario.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"
                          )}>
                            {scenario.active ? "Actif" : "Inactif"}
                          </span>
                        </div>

                        {/* Flow summary */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/5 rounded-lg border border-blue-500/10">
                            <span className="material-symbols-outlined text-blue-500 text-sm">{scenario.trigger.icon}</span>
                            <span className="font-medium text-blue-400">{scenario.trigger.label}</span>
                          </div>
                          {scenario.conditions.length > 0 && (
                            <>
                              <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward</span>
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/5 rounded-lg border border-amber-500/10">
                                <span className="material-symbols-outlined text-amber-500 text-sm">filter_alt</span>
                                <span className="font-medium text-amber-400">{scenario.conditions.length} condition{scenario.conditions.length > 1 ? "s" : ""}</span>
                              </div>
                            </>
                          )}
                          <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward</span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                            <span className="material-symbols-outlined text-emerald-500 text-sm">{scenario.actions[0]?.action.icon}</span>
                            <span className="font-medium text-emerald-400">{scenario.actions.length} action{scenario.actions.length > 1 ? "s" : ""}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">bolt</span>
                            {scenario.triggerCount} déclenchements
                          </span>
                          {scenario.lastTriggered && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              Dernier : {scenario.lastTriggered}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            Créé le {scenario.createdAt}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <button className="p-2 hover:bg-primary/10 rounded-lg text-slate-500 hover:text-primary transition-colors" title="Modifier">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDuplicate(scenario.id)}
                          className="p-2 hover:bg-primary/10 rounded-lg text-slate-500 hover:text-primary transition-colors"
                          title="Dupliquer"
                        >
                          <span className="material-symbols-outlined text-lg">content_copy</span>
                        </button>
                        <button
                          onClick={() => handleDelete(scenario.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {scenarios.length === 0 && (
                  <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl mb-4 block text-slate-600">settings_suggest</span>
                    <p className="text-lg font-bold text-white mb-2">Aucun scénario d&apos;automatisation</p>
                    <p className="text-sm text-slate-400 mb-6">Créez votre premier scénario pour automatiser vos actions.</p>
                    <button
                      onClick={() => { resetCreator(); setShowCreator(true); }}
                      className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all"
                    >
                      Créer un scénario
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* Historique tab                                                */}
        {/* ============================================================ */}
        {sideTab === "historique" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">history</span>
              Historique des déclenchements
            </h3>
            {history.length > 0 ? (
              history.map((entry, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-neutral-dark rounded-xl border border-border-dark">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">bolt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{entry.scenario}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{entry.action}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">
                      {entry.badge}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{entry.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl mb-4 block text-slate-600">history</span>
                <p className="text-lg font-bold text-white mb-2">Aucun historique</p>
                <p className="text-sm text-slate-400">Les déclenchements de vos scénarios apparaîtront ici.</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* Modeles tab                                                   */}
        {/* ============================================================ */}
        {sideTab === "modeles" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">class</span>
              Modèles de scénarios
            </h3>
            <p className="text-sm text-slate-400 mb-4">Utilisez un modèle pré-configuré pour démarrer rapidement.</p>
            {[
              { name: "Accueil automatique", desc: "Envoie un message de bienvenue à chaque nouveau client qui contacte votre agence.", icon: "waving_hand", trigger: "Nouveau client", actions: 1 },
              { name: "Relance client inactif", desc: "Relance automatiquement les clients qui n'ont pas donné de nouvelles depuis 7 jours.", icon: "notifications_active", trigger: "Inactivité 7j", actions: 1 },
              { name: "Suivi post-livraison", desc: "Envoie un message et un email après chaque livraison pour demander un avis.", icon: "check_circle", trigger: "Commande livrée", actions: 2 },
              { name: "Remerciement avis", desc: "Remercie automatiquement les clients qui laissent un avis positif (4+ étoiles).", icon: "star", trigger: "Avis >= 4 étoiles", actions: 1 },
              { name: "Confirmation paiement", desc: "Envoie une confirmation automatique à la réception d'un paiement.", icon: "payments", trigger: "Paiement reçu", actions: 2 },
              { name: "Notification assignation membre", desc: "Notifie automatiquement un membre de l'équipe lorsqu'il est assigné à une commande.", icon: "assignment_ind", trigger: "Membre assigné", actions: 1 },
              { name: "Bienvenue nouveau membre", desc: "Envoie un message de bienvenue lorsqu'un nouveau membre rejoint l'équipe.", icon: "group_add", trigger: "Membre rejoint", actions: 1 },
            ].map((template, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-neutral-dark rounded-xl border border-border-dark hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">{template.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-white mb-1">{template.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{template.desc}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-blue-500">bolt</span>
                      {template.trigger}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-emerald-500">flash_on</span>
                      {template.actions} action{template.actions > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    resetCreator();
                    setScenarioName(template.name);
                    setShowCreator(true);
                  }}
                  className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-lg hover:bg-primary/20 transition-colors shrink-0"
                >
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
