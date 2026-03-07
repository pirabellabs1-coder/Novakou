"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useServiceWizardStore } from "@/store/service-wizard";
import { WizardSidebar } from "./WizardSidebar";
import { StepTitleCategory } from "./steps/StepTitleCategory";
import { StepPricingDescription } from "./steps/StepPricingDescription";
import { StepPackages } from "./steps/StepPackages";
import { StepExtras } from "./steps/StepExtras";
import { StepExpressDelivery } from "./steps/StepExpressDelivery";
import { StepInstructions } from "./steps/StepInstructions";
import { StepMediaGallery } from "./steps/StepMediaGallery";
import { StepPublish } from "./steps/StepPublish";

interface ServiceWizardProps {
  role: "freelance" | "agency";
}

const TOTAL_STEPS = 8;

const STEP_COMPONENTS: Record<number, React.ComponentType<{ role: string }>> = {
  1: StepTitleCategory,
  2: StepPricingDescription,
  3: StepPackages,
  4: StepExtras,
  5: StepExpressDelivery,
  6: StepInstructions,
  7: StepMediaGallery,
  8: StepPublish,
};

const STEP_TITLES = [
  "",
  "Titre et catégorie",
  "Prix et description",
  "Forfaits",
  "Options supplémentaires",
  "Livraison express",
  "Consignes de réalisation",
  "Galerie médias",
  "Publication",
];

export function ServiceWizard({ role }: ServiceWizardProps) {
  const {
    currentStep,
    setStep,
    completedSteps,
    lastSavedAt,
    isSaving,
    isDirty,
    markSaving,
    markSaved,
  } = useServiceWizardStore();

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save every 30 seconds
  const autoSave = useCallback(async () => {
    const state = useServiceWizardStore.getState();
    if (!state.isDirty) return;

    markSaving(true);
    try {
      await fetch("/api/services/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: state.serviceId,
          draftData: {
            language: state.language,
            title: state.title,
            categoryId: state.categoryId,
            subCategoryId: state.subCategoryId,
            tags: state.tags,
            basePrice: state.basePrice,
            baseDeliveryDays: state.baseDeliveryDays,
            description: state.description,
            packages: state.packages,
            options: state.options,
            expressDelivery: state.expressDelivery,
            instructionsRequired: state.instructionsRequired,
            instructionsContent: state.instructionsContent,
            mainImage: state.mainImage,
            additionalImages: state.additionalImages,
            videoUrl: state.videoUrl,
            completedSteps: state.completedSteps,
            currentStep: state.currentStep,
          },
        }),
      });
      markSaved();
    } catch {
      markSaving(false);
    }
  }, [markSaving, markSaved]);

  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(autoSave, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty, autoSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div className="max-w-full">
      {/* Draft banner */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="material-symbols-outlined text-amber-400 text-sm">edit_note</span>
          <span className="text-xs font-semibold text-amber-400">Service (brouillon)</span>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-slate-500">
          Étape {currentStep} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden lg:block w-[280px] flex-shrink-0">
          <div className="sticky top-4 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <WizardSidebar
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={setStep}
              lastSavedAt={lastSavedAt}
              isSaving={isSaving}
            />
          </div>
        </div>

        {/* Mobile step nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background-dark/95 backdrop-blur-xl border-t border-white/5 px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => {
              const isCompleted = completedSteps.includes(step);
              const isCurrent = currentStep === step;
              return (
                <button
                  key={step}
                  onClick={() => {
                    const canClick = isCompleted || step <= Math.max(...completedSteps, 0) + 1;
                    if (canClick) setStep(step);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                    isCompleted && "bg-emerald-500/20 text-emerald-400",
                    isCurrent && !isCompleted && "bg-primary text-white",
                    !isCurrent && !isCompleted && "bg-white/5 text-slate-500"
                  )}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    step
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 sm:p-8">
            {/* Step title */}
            <h2 className="text-2xl font-bold mb-1">
              {STEP_TITLES[currentStep]}
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              Étape {currentStep} sur {TOTAL_STEPS}
            </p>

            {/* Step content */}
            {StepComponent && <StepComponent role={role} />}
          </div>
        </div>
      </div>
    </div>
  );
}
