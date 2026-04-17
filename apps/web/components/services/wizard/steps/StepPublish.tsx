/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useServiceWizardStore } from "@/store/service-wizard";
import { useDashboardStore } from "@/store/dashboard";
import { COMMISSION_RATES } from "@/lib/validations/service";
import { normalizePlanName, getCommissionLabel } from "@/lib/plans";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

interface ChecklistItem {
  label: string;
  done: boolean;
  required: boolean;
  step: number;
}

function getMarkdownText(content: Record<string, unknown> | null): string {
  if (!content) return "";
  if (content.type === "markdown" && typeof content.text === "string") return content.text;
  // Handle Tiptap JSON format (type: "doc")
  if (content.type === "doc" && Array.isArray(content.content)) {
    return (content.content as Array<{ content?: Array<{ text?: string }> }>)
      .map(node => (node.content || []).map(c => c.text || "").join(""))
      .join("\n");
  }
  // Handle plain string stored as object
  if (typeof content === "string") return content;
  return "";
}

export function StepPublish({ role }: { role: string }) {
  const store = useServiceWizardStore();
  const apiCreateService = useDashboardStore((s) => s.apiCreateService);
  const rawPlan = useDashboardStore((s) => s.currentPlan);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const planName = normalizePlanName(rawPlan);
  const commissionRate = COMMISSION_RATES[planName] ?? COMMISSION_RATES.DECOUVERTE ?? 0.12;
  const netAmount = store.basePrice >= 10
    ? Math.round(store.basePrice * (1 - commissionRate) * 100) / 100
    : 0;

  const descriptionText = getMarkdownText(store.description as Record<string, unknown> | null);

  const checklist: ChecklistItem[] = [
    { label: "Titre renseigné", done: store.title.length >= 10, required: true, step: 1 },
    { label: "Catégorie choisie", done: !!store.categoryId && !!store.subCategoryId, required: true, step: 1 },
    { label: "Tags ajoutés", done: store.tags.length >= 1, required: true, step: 1 },
    { label: "Prix défini", done: store.basePrice >= 10, required: true, step: 2 },
    { label: "Description complète", done: descriptionText.trim().length >= 20, required: true, step: 2 },
    { label: "Image principale uploadée", done: !!store.mainImage, required: false, step: 7 },
    { label: "Options supplémentaires", done: store.options.length > 0, required: false, step: 3 },
    { label: "Livraison express", done: store.expressDelivery.baseExpressEnabled, required: false, step: 4 },
    { label: "Consignes configurées", done: store.instructionsRequired ? !!store.instructionsContent : true, required: false, step: 5 },
    { label: "Vidéo ajoutée", done: !!store.videoUrl, required: false, step: 7 },
  ];

  const requiredDone = checklist.filter((c) => c.required).every((c) => c.done);
  const totalDone = checklist.filter((c) => c.done).length;

  const isEditMode = !!store.serviceId;

  async function handlePublish() {
    if (!requiredDone) return;

    setPublishing(true);
    setPublishError("");

    const payload = {
      language: store.language,
      title: store.title,
      categoryId: store.categoryId,
      subCategoryId: store.subCategoryId,
      tags: store.tags,
      basePrice: store.basePrice,
      baseDeliveryDays: store.baseDeliveryDays,
      description: store.description,
      descriptionText,
      options: store.options,
      baseExpressEnabled: store.expressDelivery.baseExpressEnabled,
      baseExpressPrice: store.expressDelivery.baseExpressPrice,
      baseExpressDaysReduction: store.expressDelivery.baseExpressDaysReduction,
      instructionsRequired: store.instructionsRequired,
      instructionsContent: store.instructionsContent,
      mainImage: store.mainImage ? { url: store.mainImage.url } : null,
      additionalImages: store.additionalImages.map((img: { url: string }) => ({ url: img.url })),
      videoUrl: store.videoUrl,
      packages: store.packages,
    };

    try {
      if (isEditMode) {
        // Update existing service via PATCH
        const res = await fetch(`/api/services/${store.serviceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setPublishError(err.error || "Erreur lors de la modification.");
          return;
        }
        setPublished(true);
        store.reset();
      } else {
        // Create new service
        const serviceId = await apiCreateService(payload);
        if (!serviceId) {
          setPublishError("Erreur lors de la publication. Veuillez réessayer.");
          return;
        }
        setPublished(true);
        store.reset();
      }
    } catch {
      setPublishError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveDraft() {
    store.markSaving(true);
    try {
      await fetch("/api/services/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: store.serviceId,
          draftData: {
            language: store.language,
            title: store.title,
            categoryId: store.categoryId,
            subCategoryId: store.subCategoryId,
            tags: store.tags,
            basePrice: store.basePrice,
            baseDeliveryDays: store.baseDeliveryDays,
            description: store.description,
            options: store.options,
            expressDelivery: store.expressDelivery,
            instructionsRequired: store.instructionsRequired,
            instructionsContent: store.instructionsContent,
            mainImage: store.mainImage,
            additionalImages: store.additionalImages,
            videoUrl: store.videoUrl,
            completedSteps: store.completedSteps,
            currentStep: store.currentStep,
          },
        }),
      });
      store.markSaved();
    } catch {
      store.markSaving(false);
    }
  }

  // Published success view
  if (published) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Votre service a été soumis !</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Il est en attente de validation par notre équipe. Vous serez notifié dès son approbation.
          </p>
        </div>
        <a
          href={role === "agency" ? "/agence/services" : "/dashboard/services"}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voir mes services
        </a>
      </div>
    );
  }

  // Full preview mode
  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">preview</span>
            Prévisualisation du service
          </h3>
          <button
            onClick={() => setShowPreview(false)}
            className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour
          </button>
        </div>

        {/* Service preview card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          {/* Header image */}
          {store.mainImage ? (
            <div className="relative aspect-[16/7] bg-white/5">
              <img
                src={store.mainImage.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/7] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-primary/30">image</span>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold">
                {store.title ? `Je vais ${store.title}` : "Titre du service"}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">category</span>
                  {store.categoryId || "Catégorie"}
                </span>
                <span>•</span>
                <span>{store.language.toUpperCase()}</span>
              </div>
            </div>

            {/* Tags */}
            {store.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {store.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Pricing — 3 forfaits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["basic", "standard", "premium"] as const).map((tier) => {
                const pkg = store.packages[tier];
                const isPopular = tier === "standard";
                return (
                  <div
                    key={tier}
                    className={cn(
                      "rounded-xl p-5 text-center relative flex flex-col",
                      isPopular
                        ? "bg-primary/10 border-2 border-primary/30 ring-1 ring-primary/20"
                        : "bg-white/5 border border-white/10"
                    )}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">
                        Le plus populaire
                      </span>
                    )}
                    <p className={cn("text-xs font-semibold mb-2", isPopular ? "text-primary" : "text-slate-400")}>
                      {pkg.name || tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </p>
                    <p className="text-2xl font-bold text-white mb-1">{pkg.price} <span className="text-sm font-normal text-slate-400">EUR</span></p>
                    <p className="text-xs text-slate-500 mb-3">
                      {pkg.deliveryDays} jour{pkg.deliveryDays > 1 ? "s" : ""} · {pkg.revisions >= 99 ? "Révisions illimitées" : `${pkg.revisions} révision${pkg.revisions > 1 ? "s" : ""}`}
                    </p>
                    {pkg.description && (
                      <p className="text-xs text-slate-400 mb-4 flex-1">{pkg.description}</p>
                    )}
                    <button
                      disabled
                      className={cn(
                        "w-full py-2.5 rounded-lg text-sm font-bold transition-all cursor-not-allowed",
                        isPopular
                          ? "bg-primary/80 text-white"
                          : "bg-white/10 text-slate-300"
                      )}
                    >
                      Commander
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Features table */}
            {store.packages.features.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Fonctionnalité</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Basique</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-primary uppercase">Standard</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.packages.features.map((feature) => (
                      <tr key={feature.id} className="border-b border-white/5">
                        <td className="py-2 px-3 text-sm text-slate-300">{feature.label}</td>
                        {(["Basic", "Standard", "Premium"] as const).map((t) => {
                          const key = `includedIn${t}` as "includedInBasic" | "includedInStandard" | "includedInPremium";
                          return (
                            <td key={t} className="text-center py-2 px-3">
                              <span className={cn("material-symbols-outlined text-sm", feature[key] ? "text-emerald-400" : "text-slate-600")}>
                                {feature[key] ? "check" : "close"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">description</span>
                Description
              </h4>
              <div className="prose prose-invert prose-sm max-w-none bg-white/[0.02] rounded-xl p-4 border border-white/5">
                {descriptionText ? (
                  <ReactMarkdown>{descriptionText}</ReactMarkdown>
                ) : (
                  <p className="text-slate-500 italic">Pas de description</p>
                )}
              </div>
            </div>

            {/* Options */}
            {store.options.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">tune</span>
                  Options supplémentaires
                </h4>
                <div className="space-y-2">
                  {store.options.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                      <span className="text-sm">{opt.title}</span>
                      <span className="text-sm font-bold text-primary">+{opt.extraPrice} EUR</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Express */}
            {store.expressDelivery.baseExpressEnabled && (
              <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-amber-400">bolt</span>
                <div>
                  <p className="text-sm font-semibold">Livraison express disponible</p>
                  <p className="text-xs text-slate-400">
                    +{store.expressDelivery.baseExpressPrice} EUR · -{store.expressDelivery.baseExpressDaysReduction} jour(s)
                  </p>
                </div>
              </div>
            )}

            {/* Commission info */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
              <p className="text-sm text-slate-300">
                Commission Novakou : <strong>{getCommissionLabel(planName)}</strong> (Plan {planName.charAt(0) + planName.slice(1).toLowerCase()})
              </p>
              {netAmount > 0 && (
                <p className="text-sm mt-1">
                  Vous recevrez <strong className="text-emerald-400">{netAmount} EUR</strong> par commande basique
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Back to publish */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowPreview(false)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Retour à la publication
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Preview button */}
      <button
        onClick={() => setShowPreview(true)}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary/20 transition-all"
      >
        <span className="material-symbols-outlined text-lg">preview</span>
        Prévisualiser mon service avant publication
      </button>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Service</p>
          <p className="text-sm font-semibold mb-1">
            {store.title ? `Je vais ${store.title}` : "—"}
          </p>
          <p className="text-xs text-slate-400">Langue : {store.language.toUpperCase()}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tarification</p>
          <p className="text-sm font-semibold mb-1">{store.basePrice} EUR</p>
          <p className="text-xs text-slate-400">
            Délai : {store.baseDeliveryDays} jour{store.baseDeliveryDays > 1 ? "s" : ""}
            {netAmount > 0 && (
              <span className="text-emerald-400 ml-2">Net: {netAmount} EUR</span>
            )}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Options</p>
          <p className="text-sm font-semibold mb-1">
            {store.options.length} option{store.options.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-slate-400">
            Express : {store.expressDelivery.baseExpressEnabled ? "Activé" : "Désactivé"}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Médias</p>
          <div className="flex items-center gap-3">
            {store.mainImage ? (
              <img
                src={store.mainImage.url}
                alt=""
                className="w-16 h-10 object-cover rounded-lg border border-white/10"
              />
            ) : (
              <div className="w-16 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-500 text-sm">image</span>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">
                {store.additionalImages.length} image{store.additionalImages.length !== 1 ? "s" : ""} supp.
              </p>
              <p className="text-xs text-slate-400">
                Vidéo : {store.videoUrl ? "Oui" : "Non"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Checklist avant publication</h3>
          <span className="text-xs text-slate-400">
            {totalDone}/{checklist.length} complétés
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl divide-y divide-white/5">
          {checklist.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "material-symbols-outlined text-lg",
                    item.done ? "text-emerald-400" : "text-slate-600"
                  )}
                >
                  {item.done ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span className={cn("text-sm", item.done ? "text-slate-200" : "text-slate-400")}>
                  {item.label}
                  {!item.required && (
                    <span className="text-xs text-slate-500 ml-1">(facultatif)</span>
                  )}
                </span>
              </div>
              {!item.done && (
                <button
                  onClick={() => store.setStep(item.step)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Compléter
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${(totalDone / checklist.length) * 100}%` }}
        />
      </div>

      {/* Error */}
      {publishError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {publishError}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
        <button
          onClick={() => store.setStep(7)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Précédent
        </button>

        <div className="flex-1" />

        <button
          onClick={handleSaveDraft}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-lg">save</span>
          Sauvegarder en brouillon
        </button>

        <button
          onClick={handlePublish}
          disabled={!requiredDone || publishing}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all",
            requiredDone && !publishing
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          )}
        >
          {publishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publication...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
              Publier mon service
            </>
          )}
        </button>
      </div>

      {!requiredDone && (
        <p className="text-xs text-amber-400 flex items-center gap-1.5 justify-center">
          <span className="material-symbols-outlined text-sm">info</span>
          Complétez tous les éléments requis avant de publier.
        </p>
      )}
    </div>
  );
}
