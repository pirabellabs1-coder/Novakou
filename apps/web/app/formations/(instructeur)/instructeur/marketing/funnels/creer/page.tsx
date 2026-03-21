"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useInstructorFormations, useInstructorProducts, useInstructorMutation, instructorKeys } from "@/lib/formations/hooks";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Loader2,
  Check, Eye, ChevronDown, ChevronUp, AlertCircle,
  Rocket, Layers, FileText, ShoppingCart, Gift, ArrowDown,
  CheckCircle, Heart, Sparkles, MousePointerClick, X,
} from "lucide-react";
import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(
  () => import("@/components/formations/MarkdownEditor"),
  { ssr: false, loading: () => <div className="h-[150px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

// -- Types ------------------------------------------------------------------

type FunnelStepType =
  | "LANDING"
  | "PRODUCT"
  | "CHECKOUT"
  | "UPSELL"
  | "DOWNSELL"
  | "CONFIRMATION"
  | "THANK_YOU";

interface FunnelStepForm {
  id: string;
  type: FunnelStepType;
  title: string;
  headline: string;
  description: string;
  ctaText: string;
  linkedProductId: string | null;
  linkedProductTitle: string | null;
  linkedProductPrice: number | null;
  discountPct: number | null;
  isExpanded: boolean;
}

interface FormErrors {
  name?: string;
  steps?: string;
  general?: string;
}

// -- Constants ---------------------------------------------------------------

const STEP_TYPES: Array<{
  type: FunnelStepType;
  label: string;
  labelFr: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = [
  {
    type: "LANDING",
    label: "Landing",
    labelFr: "Page d'accroche",
    icon: <Rocket className="w-4 h-4" />,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",
    description: "Hero section avec titre accrocheur et CTA",
  },
  {
    type: "PRODUCT",
    label: "Produit",
    labelFr: "Page produit",
    icon: <FileText className="w-4 h-4" />,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50",
    description: "Présentation du produit/formation avec prix",
  },
  {
    type: "CHECKOUT",
    label: "Checkout",
    labelFr: "Paiement",
    icon: <ShoppingCart className="w-4 h-4" />,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50",
    description: "Page de paiement avec formulaire",
  },
  {
    type: "UPSELL",
    label: "Upsell",
    labelFr: "Vente additionnelle",
    icon: <Gift className="w-4 h-4" />,
    color: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50",
    description: "Offre spéciale après l'achat principal",
  },
  {
    type: "DOWNSELL",
    label: "Downsell",
    labelFr: "Offre alternative",
    icon: <ArrowDown className="w-4 h-4" />,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50",
    description: "Alternative moins chère si l'upsell est refusé",
  },
  {
    type: "CONFIRMATION",
    label: "Confirmation",
    labelFr: "Confirmation",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50",
    description: "Récapitulatif de commande",
  },
  {
    type: "THANK_YOU",
    label: "Merci",
    labelFr: "Remerciement",
    icon: <Heart className="w-4 h-4" />,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50",
    description: "Page de remerciement avec prochaines étapes",
  },
];


const WIZARD_STEPS = [
  { label: "Informations", icon: <FileText className="w-4 h-4" /> },
  { label: "Étapes du funnel", icon: <Layers className="w-4 h-4" /> },
  { label: "Aperçu", icon: <Eye className="w-4 h-4" /> },
  { label: "Activer", icon: <Rocket className="w-4 h-4" /> },
];

// -- Component ---------------------------------------------------------------

export default function FunnelBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [wizardStep, setWizardStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<FunnelStepForm[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showStepPicker, setShowStepPicker] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [createdFunnel, setCreatedFunnel] = useState<{ id: string; slug: string } | null>(null);
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>([]);

  // -- Load products via React Query --
  const { data: formationsRaw, isLoading: formationsLoading } = useInstructorFormations();
  const { data: productsRaw, isLoading: prdsLoading } = useInstructorProducts();
  const productsLoading = formationsLoading || prdsLoading;

  const availableProducts: {id: string; title: string; price: number; type: "formation" | "product"}[] = [
    ...((Array.isArray(formationsRaw) ? formationsRaw : []) as { id: string; title?: string; price?: number }[]).map((f) => ({
      id: f.id, title: f.title || "Formation", price: f.price || 0, type: "formation" as const,
    })),
    ...(((productsRaw as { products?: { id: string; title?: string; price?: number }[] } | null)?.products ?? []).map((p) => ({
      id: p.id, title: p.title || "Produit", price: p.price || 0, type: "product" as const,
    }))),
  ];

  // -- Load funnel for editing via React Query --
  const { data: editFunnelData, isLoading: loadingEdit } = useQuery({
    queryKey: ["instructor", "funnel-edit", editId],
    queryFn: () => fetch("/api/marketing/funnels").then((r) => r.json()),
    enabled: !!editId,
    staleTime: 30000,
  });

  const [seededEdit, setSeededEdit] = useState(false);
  useEffect(() => {
    if (!seededEdit && editFunnelData && editId) {
      const funnel = (editFunnelData.funnels || []).find((f: { id: string }) => f.id === editId);
      if (funnel) {
        setName(funnel.name);
        setDescription(funnel.description || "");
        setSteps(
          (funnel.steps || []).map((s: FunnelStepForm) => ({ ...s, isExpanded: false })),
        );
      }
      setSeededEdit(true);
    }
  }, [editFunnelData, editId, seededEdit]);

  // -- Step management --

  const addStep = (type: FunnelStepType, afterIndex?: number) => {
    const stepConfig = STEP_TYPES.find((s) => s.type === type);
    const newStep: FunnelStepForm = {
      id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title: stepConfig?.labelFr || type,
      headline: "",
      description: "",
      ctaText: "",
      linkedProductId: null,
      linkedProductTitle: null,
      linkedProductPrice: null,
      discountPct: null,
      isExpanded: true,
    };

    setSteps((prev) => {
      if (afterIndex !== undefined && afterIndex >= 0) {
        const copy = [...prev];
        copy.splice(afterIndex + 1, 0, newStep);
        return copy;
      }
      return [...prev, newStep];
    });

    setShowStepPicker(false);
    setInsertAfterIndex(null);
    if (stepValidationErrors.length > 0) setStepValidationErrors([]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    if (stepValidationErrors.length > 0) setStepValidationErrors([]);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    setSteps((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];
      return copy;
    });
  };

  const updateStep = (index: number, updates: Partial<FunnelStepForm>) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...updates } : step)),
    );
    if (stepValidationErrors.length > 0) setStepValidationErrors([]);
  };

  const toggleExpand = (index: number) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, isExpanded: !step.isExpanded } : step)),
    );
  };

  // -- Validation --

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim() || name.trim().length < 3) {
      errs.name = "Le nom doit contenir au moins 3 caractères";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    if (steps.length < 2) {
      errs.steps = "Le funnel doit contenir au moins 2 étapes";
    }
    setErrors(errs);

    const perStepErrors: string[] = [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (!s.headline?.trim()) {
        perStepErrors.push(`Étape ${i + 1} : le titre (FR) est requis`);
      }
      if (!s.ctaText?.trim()) {
        perStepErrors.push(`Étape ${i + 1} : le texte CTA (FR) est requis`);
      }
      if (["PRODUCT", "UPSELL", "DOWNSELL"].includes(s.type) && !s.linkedProductId) {
        perStepErrors.push(`Étape ${i + 1} : un produit ou une formation doit être sélectionné`);
      }
    }
    if (perStepErrors.length > 0) {
      setStepValidationErrors(perStepErrors);
      return false;
    }
    setStepValidationErrors([]);

    return Object.keys(errs).length === 0;
  };

  // -- Navigation --

  const goNext = () => {
    if (wizardStep === 0 && !validateStep1()) return;
    if (wizardStep === 1 && !validateStep2()) return;
    setWizardStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => {
    setWizardStep((prev) => Math.max(prev - 1, 0));
  };

  // -- Submit --

  const submitMutation = useInstructorMutation(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/marketing/funnels", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }
      return res.json();
    },
    [instructorKeys.funnels()]
  );

  const submitting = submitMutation.isPending;

  const handleSubmit = (activate: boolean) => {
    setErrors({});

    const payload = {
      ...(editId ? { id: editId } : {}),
      name: name.trim(),
      description: description.trim(),
      isActive: activate,
      steps: steps.map((step) => ({
        type: step.type,
        title: step.title,
        headline: step.headline,
        description: step.description,
        ctaText: step.ctaText,
        linkedProductId: step.linkedProductId,
        linkedProductTitle: step.linkedProductTitle,
        linkedProductPrice: step.linkedProductPrice,
        discountPct: step.discountPct,
      })),
    };

    submitMutation.mutate(payload, {
      onSuccess: (data) => {
        const d = data as { funnel: { id: string; slug: string } };
        setCreatedFunnel({ id: d.funnel.id, slug: d.funnel.slug });
        if (!activate) router.push("/formations/instructeur/marketing/funnels");
      },
      onError: (err) => setErrors({ general: err instanceof Error ? err.message : "Erreur de connexion" }),
    });
  };

  // -- Loading --

  if (loadingEdit) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Chargement du funnel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/formations/instructeur/marketing/funnels"
          className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
            {editId ? "Modifier le funnel" : "Créer un tunnel de vente"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {editId
              ? "Modifiez les étapes et paramètres de votre funnel"
              : "Guidez vos visiteurs vers l'achat avec un parcours optimisé"}
          </p>
        </div>
      </div>

      {/* Wizard progress */}
      <div className="mb-8">
        <div className="flex items-center gap-1">
          {WIZARD_STEPS.map((ws, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (idx < wizardStep) setWizardStep(idx);
                }}
                disabled={idx > wizardStep}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors w-full ${
                  idx === wizardStep
                    ? "bg-primary/10 text-primary"
                    : idx < wizardStep
                      ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                      : "text-slate-400 cursor-not-allowed"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === wizardStep
                      ? "bg-primary text-white"
                      : idx < wizardStep
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  }`}
                >
                  {idx < wizardStep ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <span className="hidden sm:inline">{ws.label}</span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 flex-shrink-0 ${
                    idx < wizardStep
                      ? "bg-green-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {errors.general && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errors.general}
        </div>
      )}

      {/* Step 1: Basic info */}
      {wizardStep === 0 && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nom du funnel *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Ex: Lancement Formation React 2026"
              className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors dark:bg-slate-700 ${
                errors.name
                  ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                  : "border-slate-300 dark:border-slate-600 focus:ring-primary/20"
              }`}
            />
            {errors.name && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif de ce funnel (optionnel)"
              rows={3}
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 resize-none"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Conseils
            </h3>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>Un bon funnel commence par une page d&apos;accroche (landing) et se termine par un remerciement</li>
              <li>Les upsells augmentent la valeur moyenne par client de 20 à 40%</li>
              <li>Proposez un downsell à prix réduit si l&apos;upsell est refusé</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Funnel steps builder */}
      {wizardStep === 1 && (
        <div className="space-y-4">
          {errors.steps && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.steps}
            </div>
          )}

          {/* Steps list */}
          {steps.map((step, index) => (
            <div key={step.id}>
              <StepCard
                step={step}
                index={index}
                totalSteps={steps.length}
                availableProducts={availableProducts}
                productsLoading={productsLoading}
                onUpdate={(updates) => updateStep(index, updates)}
                onRemove={() => removeStep(index)}
                onMoveUp={() => moveStep(index, "up")}
                onMoveDown={() => moveStep(index, "down")}
                onToggleExpand={() => toggleExpand(index)}
              />

              {/* Add between steps */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <button
                    onClick={() => {
                      setInsertAfterIndex(index);
                      setShowStepPicker(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Insérer une étape
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add step button */}
          <button
            onClick={() => {
              setInsertAfterIndex(null);
              setShowStepPicker(true);
            }}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-500 hover:text-primary hover:border-primary/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une étape
          </button>

          {/* Step type picker modal */}
          {showStepPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                  setShowStepPicker(false);
                  setInsertAfterIndex(null);
                }}
              />
              <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100">
                    Choisir le type d&apos;étape
                  </h2>
                  <button
                    onClick={() => {
                      setShowStepPicker(false);
                      setInsertAfterIndex(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {STEP_TYPES.map((st) => (
                    <button
                      key={st.type}
                      onClick={() =>
                        addStep(
                          st.type,
                          insertAfterIndex !== null ? insertAfterIndex : undefined,
                        )
                      }
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm ${st.color}`}
                    >
                      <div className="flex-shrink-0">{st.icon}</div>
                      <div>
                        <p className="text-sm font-bold">{st.labelFr}</p>
                        <p className="text-xs opacity-70">{st.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Per-step validation errors */}
          {stepValidationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-red-600 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Veuillez corriger les erreurs suivantes :
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {stepValidationErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Preview */}
      {wizardStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-1">{name}</h2>
            {description && <p className="text-sm text-slate-500 mb-6">{description}</p>}

            {/* Visual funnel flow */}
            <div className="relative">
              {steps.map((step, index) => {
                const config = STEP_TYPES.find((s) => s.type === step.type);
                const widthPct = 100 - (index * 60) / Math.max(steps.length - 1, 1);

                return (
                  <div key={step.id} className="relative">
                    {/* Connector line */}
                    {index > 0 && (
                      <div className="flex justify-center py-1">
                        <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />
                      </div>
                    )}

                    <div
                      className="mx-auto transition-all duration-300"
                      style={{ width: `${widthPct}%`, minWidth: "280px" }}
                    >
                      <div
                        className={`rounded-xl border-2 p-4 ${config?.color || "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-white/80 dark:bg-slate-900/50 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          {config?.icon}
                          <span className="text-sm font-bold">{step.title}</span>
                        </div>

                        {step.headline && (
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {step.headline}
                          </p>
                        )}

                        {step.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                            {step.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {step.linkedProductTitle && (
                            <span className="text-xs bg-white/60 dark:bg-slate-900/30 px-2 py-0.5 rounded-full font-medium">
                              {step.linkedProductTitle}
                            </span>
                          )}
                          {step.linkedProductPrice && (
                            <span className="text-xs font-bold">
                              {step.discountPct
                                ? `${(step.linkedProductPrice * (1 - step.discountPct / 100)).toFixed(2)}€`
                                : `${step.linkedProductPrice.toFixed(2)}€`}
                              {step.discountPct && (
                                <span className="line-through text-slate-400 ml-1">
                                  {step.linkedProductPrice.toFixed(2)}€
                                </span>
                              )}
                            </span>
                          )}
                          {step.discountPct && (
                            <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                              -{step.discountPct}%
                            </span>
                          )}
                          {step.ctaText && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3" />
                              {step.ctaText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversion estimates */}
            <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-primary" />
                Estimation de conversion
              </h3>
              <div className="space-y-2">
                {steps.map((step, index) => {
                  // Estimate progressive drop-off
                  const baseRate = 100;
                  const dropPerStep = step.type === "UPSELL" || step.type === "DOWNSELL" ? 60 : 40;
                  const estimatedRate = Math.max(
                    baseRate * Math.pow((100 - dropPerStep) / 100, index),
                    2,
                  );

                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500 w-24 truncate">
                        {step.title}
                      </span>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all"
                          style={{ width: `${estimatedRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-12 text-right">
                        {estimatedRate.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                * Estimations basées sur des moyennes sectorielles. Les résultats réels dépendent du contenu et du trafic.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Activate */}
      {wizardStep === 3 && (
        <div className="space-y-6">
          {createdFunnel ? (
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border-2 border-green-200 dark:border-green-800/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-2">
                Funnel activé avec succès !
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Votre tunnel de vente est maintenant en ligne et prêt à convertir.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4 mb-6 inline-block">
                <p className="text-xs text-slate-500 mb-1">Lien de votre funnel</p>
                <p className="text-sm font-mono text-primary break-all">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/formations/f/${createdFunnel.slug}`
                    : `/formations/f/${createdFunnel.slug}`}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href={`/formations/f/${createdFunnel.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Voir le funnel
                </Link>
                <Link
                  href="/formations/instructeur/marketing/funnels"
                  className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Retour aux funnels
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-2">
                Prêt à lancer votre funnel ?
              </h2>
              <p className="text-sm text-slate-500 mb-2">
                <strong>{name}</strong> &middot; {steps.length} étape{steps.length > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
                Vous pouvez activer le funnel immédiatement ou le sauvegarder en brouillon pour le finaliser plus tard.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activation...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Activer maintenant
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sauvegarder en brouillon
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      {wizardStep < 3 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={goBack}
            disabled={wizardStep === 0}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </button>
          <button
            onClick={goNext}
            className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// -- StepCard component -------------------------------------------------------

function StepCard({
  step,
  index,
  totalSteps,
  availableProducts,
  productsLoading,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleExpand,
}: {
  step: FunnelStepForm;
  index: number;
  totalSteps: number;
  availableProducts: {id: string; title: string; price: number; type: "formation" | "product"}[];
  productsLoading: boolean;
  onUpdate: (updates: Partial<FunnelStepForm>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleExpand: () => void;
}) {
  const config = STEP_TYPES.find((s) => s.type === step.type);
  const needsProduct = ["PRODUCT", "UPSELL", "DOWNSELL", "CHECKOUT"].includes(step.type);

  const handleProductSelect = (productId: string) => {
    const product = availableProducts.find((p) => p.id === productId);
    onUpdate({
      linkedProductId: productId || null,
      linkedProductTitle: product?.title || null,
      linkedProductPrice: product?.price || null,
    });
  };

  return (
    <div className={`bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border-2 transition-all ${config?.color || "border-slate-200 dark:border-slate-700"}`}>
      {/* Header (always visible) */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className="p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-600/50 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-3 h-3 text-slate-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === totalSteps - 1}
            className="p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-600/50 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        <span className="w-7 h-7 rounded-full bg-white/80 dark:bg-slate-900/50 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-slate-200/50 dark:border-slate-600/50">
          {index + 1}
        </span>

        <div className="flex-shrink-0">{config?.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 truncate">
              {step.title}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {config?.label}
            </span>
          </div>
          {step.headline && (
            <p className="text-xs text-slate-500 truncate">{step.headline}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${step.isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Expanded content */}
      {step.isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Titre de l&apos;étape
            </label>
            <input
              type="text"
              value={step.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
            />
          </div>

          {/* Headline FR / EN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Titre principal
              </label>
              <input
                type="text"
                value={step.headline}
                onChange={(e) => onUpdate({ headline: e.target.value })}
                placeholder="Titre accrocheur"
                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Description
            </label>
            <MarkdownEditor
              value={step.description}
              onChange={(val) => onUpdate({ description: val })}
              placeholder="Description..."
              height={150}
            />
          </div>

          {/* CTA Text */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Texte du bouton
            </label>
            <input
              type="text"
              value={step.ctaText}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="Ex: Acheter maintenant"
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
            />
          </div>

          {/* Product selection (for relevant step types) */}
          {needsProduct && (
            <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-3 space-y-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Produit / Formation lié(e)
              </label>
              {productsLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Chargement des produits...
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  Aucun produit disponible. Créez une{" "}
                  <Link href="/formations/instructeur/creer" className="underline font-semibold hover:text-amber-700">
                    formation
                  </Link>{" "}
                  ou un{" "}
                  <Link href="/formations/instructeur/produits/creer" className="underline font-semibold hover:text-amber-700">
                    produit
                  </Link>{" "}
                  d&apos;abord.
                </div>
              ) : (
                <select
                  value={step.linkedProductId || ""}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 appearance-none"
                >
                  <option value="">Aucun produit lié</option>
                  {availableProducts.filter((p) => p.type === "formation").length > 0 && (
                    <optgroup label="Formations">
                      {availableProducts.filter((p) => p.type === "formation").map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.price}€)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableProducts.filter((p) => p.type === "product").length > 0 && (
                    <optgroup label="Produits digitaux">
                      {availableProducts.filter((p) => p.type === "product").map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.price}€)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}

              {/* Discount percentage (for UPSELL / DOWNSELL) */}
              {(step.type === "UPSELL" || step.type === "DOWNSELL") && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Réduction (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={step.discountPct ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        discountPct: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="0"
                    className="w-32 text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -- BarChart icon (inline to avoid import issue) ----------------------------

function BarChart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
