"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, title: "Titre et catégorie", icon: "title" },
  { number: 2, title: "Prix et description", icon: "sell" },
  { number: 3, title: "Forfaits", icon: "view_column" },
  { number: 4, title: "Options supplémentaires", icon: "add_shopping_cart" },
  { number: 5, title: "Livraison express", icon: "bolt" },
  { number: 6, title: "Consignes", icon: "assignment" },
  { number: 7, title: "Galerie médias", icon: "photo_library" },
  { number: 8, title: "Publication", icon: "publish" },
];

const HELP_TIPS: Record<number, { title: string; tips: string[] }> = {
  1: {
    title: "Titre & Catégorie",
    tips: [
      "Un bon titre commence par une action précise",
      "Choisissez la catégorie la plus pertinente",
      "Les tags aident les clients à vous trouver",
    ],
  },
  2: {
    title: "Prix & Description",
    tips: [
      "Fixez un prix compétitif pour votre marché",
      "Une description détaillée rassure les clients",
      "Utilisez des listes pour structurer votre offre",
    ],
  },
  3: {
    title: "Forfaits",
    tips: [
      "3 forfaits permettent de toucher tous les budgets",
      "Le forfait Standard est le plus commandé",
      "Ajoutez des features pour différencier les offres",
    ],
  },
  4: {
    title: "Options",
    tips: [
      "Les options augmentent le panier moyen",
      "Marquez l'option la plus populaire comme recommandée",
    ],
  },
  5: {
    title: "Livraison express",
    tips: [
      "Les clients urgents paieront un supplément",
      "Ne promettez que des délais tenables",
    ],
  },
  6: {
    title: "Consignes",
    tips: [
      "Demandez toutes les infos nécessaires dès le départ",
      "Utilisez les variables pour personnaliser",
    ],
  },
  7: {
    title: "Galerie",
    tips: [
      "Une image attrayante augmente les clics de 40%",
      "Format recommandé : 1260 × 708px (16:9)",
    ],
  },
  8: {
    title: "Publication",
    tips: [
      "Relisez votre service avant de publier",
      "La modération prend généralement moins de 24h",
    ],
  },
};

interface WizardSidebarProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  lastSavedAt: string | null;
  isSaving: boolean;
}

export function WizardSidebar({
  currentStep,
  completedSteps,
  onStepClick,
  lastSavedAt,
  isSaving,
}: WizardSidebarProps) {
  const help = HELP_TIPS[currentStep] || HELP_TIPS[1];

  function formatSavedTime(iso: string | null) {
    if (!iso) return null;
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 10) return "Sauvegardé il y a quelques secondes";
    if (diff < 60) return `Sauvegardé il y a ${diff}s`;
    if (diff < 3600) return `Sauvegardé il y a ${Math.floor(diff / 60)} min`;
    return `Sauvegardé il y a ${Math.floor(diff / 3600)}h`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Steps */}
      <nav className="flex-1 py-4 space-y-1">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          const canClick = isCompleted || step.number <= Math.max(...completedSteps, 0) + 1;

          return (
            <button
              key={step.number}
              onClick={() => canClick && onStepClick(step.number)}
              disabled={!canClick}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                isCurrent && "bg-primary/10 border border-primary/30",
                !isCurrent && canClick && "hover:bg-white/5 cursor-pointer",
                !canClick && "opacity-40 cursor-not-allowed"
              )}
            >
              {/* Status indicator */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all",
                  isCompleted && "bg-emerald-500/20 text-emerald-400",
                  isCurrent && !isCompleted && "bg-primary/20 text-primary",
                  !isCurrent && !isCompleted && "bg-white/5 text-slate-500"
                )}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  step.number
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold truncate",
                    isCurrent && "text-primary",
                    isCompleted && !isCurrent && "text-emerald-400",
                    !isCurrent && !isCompleted && "text-slate-400"
                  )}
                >
                  {step.title}
                </p>
              </div>

              {/* Step icon */}
              <span
                className={cn(
                  "material-symbols-outlined text-lg flex-shrink-0",
                  isCurrent && "text-primary",
                  isCompleted && !isCurrent && "text-emerald-400/50",
                  !isCurrent && !isCompleted && "text-slate-600"
                )}
              >
                {step.icon}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Save indicator */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs">
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-sm text-amber-400 animate-spin">sync</span>
              <span className="text-amber-400">Sauvegarde en cours...</span>
            </>
          ) : lastSavedAt ? (
            <>
              <span className="material-symbols-outlined text-sm text-emerald-400">cloud_done</span>
              <span className="text-slate-400">{formatSavedTime(lastSavedAt)}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm text-slate-500">cloud_off</span>
              <span className="text-slate-500">Pas encore sauvegardé</span>
            </>
          )}
        </div>
      </div>

      {/* Help section */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-lg">help</span>
            <h4 className="text-sm font-bold text-primary">Besoin d&apos;aide ?</h4>
          </div>
          <ul className="space-y-1.5">
            {help.tips.map((tip, i) => (
              <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                <span className="material-symbols-outlined text-primary/40 text-xs mt-0.5 flex-shrink-0">arrow_right</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
