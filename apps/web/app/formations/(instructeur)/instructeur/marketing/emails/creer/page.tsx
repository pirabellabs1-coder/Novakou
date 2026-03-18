"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail, ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2,
  Clock, ShoppingCart, UserPlus, Tag, BookOpen, AlertCircle,
  ChevronUp, ChevronDown,
  Save, Play, Timer, GitBranch, TagIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(
  () => import("@/components/formations/MarkdownEditor"),
  { ssr: false, loading: () => <div className="h-[200px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

// ── Types ──────────────────────────────────────────────────────────────────

type StepType = "EMAIL" | "DELAY" | "CONDITION" | "TAG_ACTION";

interface SequenceStep {
  id: string;
  stepType: StepType;
  // EMAIL
  subjectFr: string;
  subjectEn: string;
  bodyFr: string;
  bodyEn: string;
  // DELAY
  delayMinutes: number;
  // CONDITION
  conditionField: string;
  conditionOp: string;
  conditionValue: string;
  // TAG_ACTION
  tagAction: string;
  tagName: string;
}

type TriggerType =
  | "PURCHASE"
  | "ENROLLMENT"
  | "ABANDONED_CART"
  | "USER_INACTIVITY"
  | "COURSE_COMPLETION"
  | "SIGNUP"
  | "TAG_ADDED";

interface FormData {
  name: string;
  description: string;
  trigger: TriggerType | "";
  triggerConfig: Record<string, unknown>;
  steps: SequenceStep[];
  isActive: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TRIGGERS: {
  value: TriggerType;
  label: string;
  labelEn: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  hasConfig?: boolean;
  configLabel?: string;
}[] = [
  {
    value: "PURCHASE",
    label: "Apres un achat",
    labelEn: "After purchase",
    description: "Declenchee quand un apprenant achete une formation ou un produit.",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-400",
  },
  {
    value: "ENROLLMENT",
    label: "Apres une inscription",
    labelEn: "After enrollment",
    description: "Declenchee quand un utilisateur s'inscrit a une formation (gratuite ou payante).",
    icon: <BookOpen className="w-6 h-6" />,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400",
  },
  {
    value: "ABANDONED_CART",
    label: "Panier abandonne",
    labelEn: "Cart abandoned",
    description: "Declenchee quand un utilisateur ajoute un produit au panier sans finaliser l'achat.",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-400",
  },
  {
    value: "USER_INACTIVITY",
    label: "Utilisateur inactif",
    labelEn: "User inactive",
    description: "Declenchee apres X jours d'inactivite d'un utilisateur.",
    icon: <Clock className="w-6 h-6" />,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:border-orange-400",
    hasConfig: true,
    configLabel: "Nombre de jours d'inactivite",
  },
  {
    value: "COURSE_COMPLETION",
    label: "Formation terminee",
    labelEn: "Course completed",
    description: "Declenchee quand un apprenant termine 100% d'une formation.",
    icon: <Check className="w-6 h-6" />,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-400",
  },
  {
    value: "SIGNUP",
    label: "Nouvel inscrit",
    labelEn: "New signup",
    description: "Declenchee des qu'un nouvel utilisateur cree son compte.",
    icon: <UserPlus className="w-6 h-6" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400",
  },
  {
    value: "TAG_ADDED",
    label: "Tag ajoute",
    labelEn: "Tag added",
    description: "Declenchee quand un tag specifique est ajoute a un utilisateur.",
    icon: <Tag className="w-6 h-6" />,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 hover:border-rose-400",
    hasConfig: true,
    configLabel: "Nom du tag",
  },
];

const DELAY_PRESETS = [
  { label: "1 heure", labelEn: "1 hour", minutes: 60 },
  { label: "6 heures", labelEn: "6 hours", minutes: 360 },
  { label: "1 jour", labelEn: "1 day", minutes: 1440 },
  { label: "3 jours", labelEn: "3 days", minutes: 4320 },
  { label: "7 jours", labelEn: "7 days", minutes: 10080 },
];

const TEMPLATE_VARIABLES = [
  { key: "{user_name}", label: "Nom de l'utilisateur", labelEn: "User name" },
  { key: "{product_name}", label: "Nom du produit", labelEn: "Product name" },
  { key: "{course_title}", label: "Titre de la formation", labelEn: "Course title" },
  { key: "{course_progress}", label: "Progression (%)", labelEn: "Progress (%)" },
];

const CONDITION_FIELDS = [
  { value: "has_purchased", label: "A deja achete", labelEn: "Has purchased" },
  { value: "course_progress", label: "Progression formation (%)", labelEn: "Course progress (%)" },
  { value: "total_orders", label: "Nombre de commandes", labelEn: "Total orders" },
  { value: "days_since_signup", label: "Jours depuis inscription", labelEn: "Days since signup" },
  { value: "tag", label: "Possede le tag", labelEn: "Has tag" },
];

const CONDITION_OPS = [
  { value: "eq", label: "egal a", labelEn: "equals" },
  { value: "neq", label: "different de", labelEn: "not equals" },
  { value: "gt", label: "superieur a", labelEn: "greater than" },
  { value: "gte", label: "superieur ou egal a", labelEn: "greater or equal" },
  { value: "lt", label: "inferieur a", labelEn: "less than" },
  { value: "lte", label: "inferieur ou egal a", labelEn: "less or equal" },
  { value: "contains", label: "contient", labelEn: "contains" },
  { value: "exists", label: "existe", labelEn: "exists" },
];

function createEmptyStep(stepType: StepType): SequenceStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stepType,
    subjectFr: "",
    subjectEn: "",
    bodyFr: "",
    bodyEn: "",
    delayMinutes: stepType === "DELAY" ? 1440 : 0,
    conditionField: "",
    conditionOp: "eq",
    conditionValue: "",
    tagAction: "add",
    tagName: "",
  };
}

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(0)}h`;
  const days = Math.floor(minutes / 1440);
  const remainHours = Math.floor((minutes % 1440) / 60);
  if (remainHours === 0) return `${days}j`;
  return `${days}j ${remainHours}h`;
}

const STEP_TYPE_META: Record<
  StepType,
  { label: string; labelEn: string; icon: React.ReactNode; color: string; bg: string }
> = {
  EMAIL: {
    label: "Email",
    labelEn: "Email",
    icon: <Mail className="w-4 h-4" />,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
  },
  DELAY: {
    label: "Delai",
    labelEn: "Delay",
    icon: <Timer className="w-4 h-4" />,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  },
  CONDITION: {
    label: "Condition",
    labelEn: "Condition",
    icon: <GitBranch className="w-4 h-4" />,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  },
  TAG_ACTION: {
    label: "Action tag",
    labelEn: "Tag action",
    icon: <TagIcon className="w-4 h-4" />,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function CreateEmailSequencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    trigger: "",
    triggerConfig: {},
    steps: [],
    isActive: false,
  });

  const WIZARD_STEPS = [
    { label: "Informations", labelEn: "Info" },
    { label: "Declencheur", labelEn: "Trigger" },
    { label: "Etapes", labelEn: "Steps" },
    { label: "Finalisation", labelEn: "Review" },
  ];

  // ── Load sequence for editing ──

  useEffect(() => {
    if (!editId) return;
    setLoadingEdit(true);
    fetch(`/api/marketing/sequences?id=${editId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sequence) {
          const seq = data.sequence;
          setForm({
            name: seq.name || "",
            description: seq.description || "",
            trigger: seq.trigger || "",
            triggerConfig: seq.triggerConfig || {},
            isActive: seq.isActive ?? false,
            steps: (seq.steps || []).map((s: Record<string, unknown>) => ({
              id: (s.id as string) || createEmptyStep("EMAIL").id,
              stepType: (s.stepType as StepType) || "EMAIL",
              subjectFr: (s.subjectFr as string) || "",
              subjectEn: (s.subjectEn as string) || "",
              bodyFr: (s.bodyFr as string) || "",
              bodyEn: (s.bodyEn as string) || "",
              delayMinutes: (s.delayMinutes as number) || 0,
              conditionField: (s.conditionField as string) || "",
              conditionOp: (s.conditionOp as string) || "eq",
              conditionValue: (s.conditionValue as string) || "",
              tagAction: (s.tagAction as string) || "add",
              tagName: (s.tagName as string) || "",
            })),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEdit(false));
  }, [editId]);

  // ── Field update helper ──

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const updateStep = (stepId: string, updates: Partial<SequenceStep>) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    }));
  };

  // ── Step management ──

  const addStep = (stepType: StepType) => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, createEmptyStep(stepType)],
    }));
  };

  const removeStep = (stepId: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
    }));
  };

  const moveStepUp = (index: number) => {
    if (index <= 0) return;
    setForm((prev) => {
      const newSteps = [...prev.steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      return { ...prev, steps: newSteps };
    });
  };

  const moveStepDown = (index: number) => {
    setForm((prev) => {
      if (index >= prev.steps.length - 1) return prev;
      const newSteps = [...prev.steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      return { ...prev, steps: newSteps };
    });
  };

  // ── Insert variable in body ──

  const insertVariable = (stepId: string, field: "bodyFr" | "bodyEn", variable: string) => {
    const step = form.steps.find((s) => s.id === stepId);
    if (!step) return;
    updateStep(stepId, { [field]: step[field] + variable });
  };

  // ── Validation ──

  const validateStep = (wizardStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (wizardStep === 0) {
      if (!form.name.trim() || form.name.trim().length < 2) {
        newErrors.name = "Le nom est requis (min 2 caracteres)";
      }
    }

    if (wizardStep === 1) {
      if (!form.trigger) {
        newErrors.trigger = "Selectionnez un declencheur";
      }
      if (form.trigger === "USER_INACTIVITY") {
        const days = form.triggerConfig.inactivityDays;
        if (!days || (typeof days === "number" && days < 1)) {
          newErrors.triggerConfig = "Specifiez le nombre de jours d'inactivite";
        }
      }
      if (form.trigger === "TAG_ADDED") {
        const tagName = form.triggerConfig.tagName;
        if (!tagName || (typeof tagName === "string" && tagName.trim() === "")) {
          newErrors.triggerConfig = "Specifiez le nom du tag";
        }
      }
    }

    if (wizardStep === 2) {
      if (form.steps.length === 0) {
        newErrors.steps = "Ajoutez au moins une etape";
      }
      // Validate each step
      for (let i = 0; i < form.steps.length; i++) {
        const step = form.steps[i];
        if (step.stepType === "EMAIL" && !step.subjectFr.trim()) {
          newErrors[`step_${i}_subject`] = `Etape ${i + 1}: le sujet (FR) est requis`;
        }
        if (step.stepType === "DELAY" && step.delayMinutes < 1) {
          newErrors[`step_${i}_delay`] = `Etape ${i + 1}: le delai doit etre superieur a 0`;
        }
        if (step.stepType === "TAG_ACTION" && !step.tagName.trim()) {
          newErrors[`step_${i}_tag`] = `Etape ${i + 1}: le nom du tag est requis`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ── Save ──

  const handleSave = async (activate: boolean) => {
    if (!validateStep(2)) {
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(editId ? { id: editId } : {}),
        name: form.name.trim(),
        description: form.description,
        trigger: form.trigger,
        triggerConfig: form.triggerConfig,
        isActive: activate,
        steps: form.steps.map((s) => {
          const base: Record<string, unknown> = { stepType: s.stepType };

          if (s.stepType === "EMAIL") {
            base.subjectFr = s.subjectFr;
            base.subjectEn = s.subjectEn || undefined;
            base.bodyFr = s.bodyFr;
            base.bodyEn = s.bodyEn || undefined;
          }
          if (s.stepType === "DELAY") {
            base.delayMinutes = s.delayMinutes;
          }
          if (s.stepType === "CONDITION") {
            base.conditionField = s.conditionField;
            base.conditionOp = s.conditionOp;
            base.conditionValue = s.conditionValue;
          }
          if (s.stepType === "TAG_ACTION") {
            base.tagAction = s.tagAction;
            base.tagName = s.tagName;
          }
          return base;
        }),
      };

      const res = await fetch("/api/marketing/sequences", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/formations/instructeur/marketing/emails");
      } else {
        const data = await res.json();
        setErrors({ general: data.error || "Erreur lors de l'enregistrement" });
      }
    } catch {
      setErrors({ general: "Erreur de connexion" });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──

  if (loadingEdit) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Get selected trigger info ──

  const selectedTrigger = TRIGGERS.find((t) => t.value === form.trigger);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/formations/instructeur/marketing/emails"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux sequences
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100 flex items-center gap-2">
          <Mail className="w-6 h-6 text-violet-500" />
          {editId ? "Modifier la sequence" : "Nouvelle sequence email"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {editId
            ? "Modifiez les parametres et les etapes de votre sequence"
            : "Creez une sequence d'emails automatises en 4 etapes"}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {WIZARD_STEPS.map((ws, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => {
                  // Only allow going back or to completed steps
                  if (idx <= currentStep) setCurrentStep(idx);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  idx === currentStep
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
                    : idx < currentStep
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {idx < currentStep ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="hidden sm:inline">{ws.label}</span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full ${
                    idx < currentStep ? "bg-violet-400" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errors.general}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: Basic Info */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 0 && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-1">Informations de base</h2>
            <p className="text-sm text-slate-500">Donnez un nom et une description a votre sequence.</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nom de la sequence *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="ex: Sequence d'accueil"
              className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors dark:bg-slate-700 ${
                errors.name
                  ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                  : "border-slate-300 dark:border-slate-600 focus:ring-violet-500/20"
              }`}
            />
            {errors.name && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Decrivez l'objectif de cette sequence..."
              rows={3}
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700 resize-none"
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: Trigger Selection */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-1">Declencheur</h2>
            <p className="text-sm text-slate-500 mb-6">
              Choisissez l'evenement qui declenche l'envoi de la sequence.
            </p>

            {errors.trigger && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.trigger}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRIGGERS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    updateForm("trigger", t.value);
                    // Reset triggerConfig when changing trigger
                    updateForm("triggerConfig", {});
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    form.trigger === t.value
                      ? `${t.bg} ring-2 ring-offset-1 ring-violet-500/30`
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${t.color} mt-0.5`}>{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">
                        {t.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                    {form.trigger === t.value && (
                      <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Trigger config */}
            {selectedTrigger?.hasConfig && (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/30 rounded-xl">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {selectedTrigger.configLabel}
                </label>

                {form.trigger === "USER_INACTIVITY" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={
                        typeof form.triggerConfig.inactivityDays === "number"
                          ? form.triggerConfig.inactivityDays
                          : ""
                      }
                      onChange={(e) =>
                        updateForm("triggerConfig", {
                          ...form.triggerConfig,
                          inactivityDays: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="7"
                      className="w-24 text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700"
                    />
                    <span className="text-sm text-slate-500">jours</span>
                  </div>
                )}

                {form.trigger === "TAG_ADDED" && (
                  <input
                    type="text"
                    value={
                      typeof form.triggerConfig.tagName === "string"
                        ? form.triggerConfig.tagName
                        : ""
                    }
                    onChange={(e) =>
                      updateForm("triggerConfig", {
                        ...form.triggerConfig,
                        tagName: e.target.value,
                      })
                    }
                    placeholder="ex: vip_customer"
                    className="w-full max-w-xs text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700"
                  />
                )}

                {errors.triggerConfig && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    {errors.triggerConfig}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: Sequence Builder */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100">Etapes de la sequence</h2>
                <p className="text-sm text-slate-500">
                  Construisez votre sequence en ajoutant des emails, des delais, des conditions et des actions.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {form.steps.length} etape{form.steps.length > 1 ? "s" : ""}
              </span>
            </div>

            {errors.steps && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.steps}
              </div>
            )}

            {/* Steps list */}
            <div className="space-y-0">
              {form.steps.map((step, idx) => {
                const meta = STEP_TYPE_META[step.stepType];
                const stepErrors = Object.entries(errors)
                  .filter(([k]) => k.startsWith(`step_${idx}_`))
                  .map(([, v]) => v);

                return (
                  <div key={step.id}>
                    {/* Connector line */}
                    {idx > 0 && (
                      <div className="flex justify-center py-1">
                        <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />
                      </div>
                    )}

                    {/* Step card */}
                    <div className={`border rounded-xl overflow-hidden ${meta.bg}`}>
                      {/* Step header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
                        <div className={`${meta.color}`}>{meta.icon}</div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 flex-1">
                          {meta.label}
                          {step.stepType === "DELAY" && step.delayMinutes > 0 && (
                            <span className="text-slate-400 font-normal ml-2">
                              — {formatDelay(step.delayMinutes)}
                            </span>
                          )}
                          {step.stepType === "EMAIL" && step.subjectFr && (
                            <span className="text-slate-400 font-normal ml-2 truncate">
                              — {step.subjectFr}
                            </span>
                          )}
                        </span>

                        {/* Reorder + Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveStepUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-slate-600/50 transition-colors disabled:opacity-30"
                            title="Monter"
                          >
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => moveStepDown(idx)}
                            disabled={idx === form.steps.length - 1}
                            className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-slate-600/50 transition-colors disabled:opacity-30"
                            title="Descendre"
                          >
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => removeStep(step.id)}
                            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Step body */}
                      <div className="p-4 bg-white/60 dark:bg-slate-800/60">
                        {/* Errors for this step */}
                        {stepErrors.length > 0 && (
                          <div className="mb-3 space-y-1">
                            {stepErrors.map((err, eIdx) => (
                              <p key={eIdx} className="flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="w-3 h-3" />
                                {err}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* EMAIL step */}
                        {step.stepType === "EMAIL" && (
                          <div className="space-y-4">
                            {/* Subject FR */}
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Sujet (FR) *
                              </label>
                              <input
                                type="text"
                                value={step.subjectFr}
                                onChange={(e) => updateStep(step.id, { subjectFr: e.target.value })}
                                placeholder="ex: Bienvenue ! Voici comment bien demarrer"
                                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700"
                              />
                            </div>

                            {/* Subject EN */}
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Sujet (EN)
                              </label>
                              <input
                                type="text"
                                value={step.subjectEn}
                                onChange={(e) => updateStep(step.id, { subjectEn: e.target.value })}
                                placeholder="ex: Welcome! Here's how to get started"
                                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700"
                              />
                            </div>

                            {/* Body FR */}
                            <div>
                              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                Contenu (FR)
                              </label>
                              <MarkdownEditor
                                value={step.bodyFr}
                                onChange={(val) => updateStep(step.id, { bodyFr: val })}
                                placeholder="Bonjour {user_name}, ..."
                                height={200}
                                variables={TEMPLATE_VARIABLES.map((v) => ({ key: v.key, label: v.label }))}
                              />
                            </div>

                            {/* Body EN */}
                            <div>
                              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                Contenu (EN)
                              </label>
                              <MarkdownEditor
                                value={step.bodyEn}
                                onChange={(val) => updateStep(step.id, { bodyEn: val })}
                                placeholder="Hello {user_name}, ..."
                                height={200}
                                variables={TEMPLATE_VARIABLES.map((v) => ({ key: v.key, label: v.labelEn }))}
                              />
                            </div>
                          </div>
                        )}

                        {/* DELAY step */}
                        {step.stepType === "DELAY" && (
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                              Duree du delai
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {DELAY_PRESETS.map((preset) => (
                                <button
                                  key={preset.minutes}
                                  type="button"
                                  onClick={() => updateStep(step.id, { delayMinutes: preset.minutes })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                    step.delayMinutes === preset.minutes
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Personnalise :</span>
                              <input
                                type="number"
                                min={1}
                                value={step.delayMinutes}
                                onChange={(e) =>
                                  updateStep(step.id, {
                                    delayMinutes: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-24 text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700"
                              />
                              <span className="text-xs text-slate-500">minutes ({formatDelay(step.delayMinutes)})</span>
                            </div>
                          </div>
                        )}

                        {/* CONDITION step */}
                        {step.stepType === "CONDITION" && (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                              Si la condition n'est pas remplie, la sequence s'arrete pour cet utilisateur.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Champ
                                </label>
                                <select
                                  value={step.conditionField}
                                  onChange={(e) =>
                                    updateStep(step.id, { conditionField: e.target.value })
                                  }
                                  className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700 appearance-none"
                                >
                                  <option value="">Selectionnez...</option>
                                  {CONDITION_FIELDS.map((f) => (
                                    <option key={f.value} value={f.value}>
                                      {f.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Operateur
                                </label>
                                <select
                                  value={step.conditionOp}
                                  onChange={(e) =>
                                    updateStep(step.id, { conditionOp: e.target.value })
                                  }
                                  className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700 appearance-none"
                                >
                                  {CONDITION_OPS.map((op) => (
                                    <option key={op.value} value={op.value}>
                                      {op.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Valeur
                                </label>
                                <input
                                  type="text"
                                  value={step.conditionValue}
                                  onChange={(e) =>
                                    updateStep(step.id, { conditionValue: e.target.value })
                                  }
                                  placeholder="ex: false, 30, true"
                                  className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAG_ACTION step */}
                        {step.stepType === "TAG_ACTION" && (
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Action
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateStep(step.id, { tagAction: "add" })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                      step.tagAction === "add"
                                        ? "bg-green-600 text-white border-green-600"
                                        : "bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                                    }`}
                                  >
                                    + Ajouter
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateStep(step.id, { tagAction: "remove" })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                      step.tagAction === "remove"
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                                    }`}
                                  >
                                    - Retirer
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Nom du tag *
                                </label>
                                <input
                                  type="text"
                                  value={step.tagName}
                                  onChange={(e) =>
                                    updateStep(step.id, { tagName: e.target.value })
                                  }
                                  placeholder="ex: onboarding_completed"
                                  className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add step buttons */}
            <div className="mt-6">
              {form.steps.length > 0 && (
                <div className="flex justify-center py-2">
                  <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                {(Object.entries(STEP_TYPE_META) as [StepType, typeof STEP_TYPE_META[StepType]][]).map(
                  ([type, meta]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addStep(type)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed text-xs font-semibold transition-all hover:border-solid ${meta.color} border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {meta.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 4: Review & Activate */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-4">
              Recapitulatif de la sequence
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nom</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">{form.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Declencheur</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">
                  {selectedTrigger?.label || form.trigger}
                </p>
              </div>
              {form.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{form.description}</p>
                </div>
              )}
              {form.trigger === "USER_INACTIVITY" && form.triggerConfig.inactivityDays && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Jours d'inactivite
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">
                    {String(form.triggerConfig.inactivityDays)} jours
                  </p>
                </div>
              )}
              {form.trigger === "TAG_ADDED" && form.triggerConfig.tagName && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tag</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 font-mono">
                    {String(form.triggerConfig.tagName)}
                  </p>
                </div>
              )}
            </div>

            {/* Steps preview */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {form.steps.length} etape{form.steps.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-0">
                {form.steps.map((step, idx) => {
                  const meta = STEP_TYPE_META[step.stepType];
                  return (
                    <div key={step.id}>
                      {idx > 0 && (
                        <div className="flex justify-center py-1">
                          <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700" />
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/30">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg.split(" ").slice(0, 2).join(" ")}`}
                        >
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white dark:text-slate-100">
                            {meta.label}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {step.stepType === "EMAIL" && (step.subjectFr || "Sans sujet")}
                            {step.stepType === "DELAY" && formatDelay(step.delayMinutes)}
                            {step.stepType === "CONDITION" &&
                              `${step.conditionField} ${step.conditionOp} ${step.conditionValue}`}
                            {step.stepType === "TAG_ACTION" &&
                              `${step.tagAction === "add" ? "Ajouter" : "Retirer"} "${step.tagName}"`}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">#{idx + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-3">Que souhaitez-vous faire ?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer comme brouillon
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Activer la sequence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Navigation */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep < 3 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Precedent
          </button>
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors text-sm shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
