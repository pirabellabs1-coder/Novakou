"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useServiceWizardStore } from "@/store/service-wizard";

const RichTextEditor = dynamic(
  () => import("../editor/RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] bg-white/5 rounded-xl animate-pulse" /> }
);

const VARIABLES = [
  { key: "{nom_client}", label: "Nom du client", example: "Jean Dupont" },
  { key: "{service}", label: "Nom du service", example: "Création de site web" },
  { key: "{date_livraison}", label: "Date de livraison", example: "15 mars 2026" },
];

const TEMPLATES: Record<string, { label: string; content: Record<string, unknown> }> = {
  design: {
    label: "Design & Graphisme",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Consignes pour votre commande" }] },
        { type: "paragraph", content: [{ type: "text", text: "Bonjour {nom_client}, merci pour votre commande !" }] },
        { type: "paragraph", content: [{ type: "text", text: "Pour démarrer votre projet, j'ai besoin des informations suivantes :" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Nom de votre entreprise / projet" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Couleurs souhaitées (codes hex si possible)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Exemples de designs qui vous plaisent (liens ou images)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Brief détaillé de votre besoin" }] }] },
        ] },
      ],
    },
  },
  dev: {
    label: "Développement",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Informations nécessaires" }] },
        { type: "paragraph", content: [{ type: "text", text: "Bonjour {nom_client}, merci de votre confiance !" }] },
        { type: "paragraph", content: [{ type: "text", text: "Pour bien démarrer, veuillez me fournir :" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Cahier des charges ou description détaillée du projet" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Maquettes ou wireframes (si disponibles)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Accès au serveur / hébergement (si existant)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Contenu textuel et visuels à intégrer" }] }] },
        ] },
      ],
    },
  },
  redaction: {
    label: "Rédaction",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Brief de rédaction" }] },
        { type: "paragraph", content: [{ type: "text", text: "Bonjour {nom_client} !" }] },
        { type: "paragraph", content: [{ type: "text", text: "Pour rédiger un contenu de qualité, j'ai besoin de :" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Sujet principal et mots-clés cibles" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Ton souhaité (professionnel, décontracté, technique...)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Public cible" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Longueur souhaitée (nombre de mots)" }] }] },
        ] },
      ],
    },
  },
};

export function StepInstructions({ role }: { role: string }) {
  const store = useServiceWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleNext() {
    if (store.instructionsRequired && !store.instructionsContent) {
      setErrors({ instructionsContent: "Veuillez rédiger vos consignes ou sélectionnez 'Pas de consignes nécessaires'" });
      return;
    }
    setErrors({});
    store.markStepCompleted(6);
    store.setStep(7);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Ce message sera automatiquement envoyé au client après chaque commande.
      </p>

      {/* Choice */}
      <div className="space-y-3">
        <label
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
            store.instructionsRequired
              ? "bg-primary/5 border-primary/30"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <input
            type="radio"
            name="instructions"
            checked={store.instructionsRequired}
            onChange={() => store.updateField("instructionsRequired", true)}
            className="w-4 h-4 text-primary"
          />
          <div>
            <p className="text-sm font-semibold">Consignes requises</p>
            <p className="text-xs text-slate-400">Le client devra répondre avant que la commande ne démarre</p>
          </div>
        </label>

        <label
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
            !store.instructionsRequired
              ? "bg-primary/5 border-primary/30"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <input
            type="radio"
            name="instructions"
            checked={!store.instructionsRequired}
            onChange={() => {
              store.updateField("instructionsRequired", false);
              setErrors({});
            }}
            className="w-4 h-4 text-primary"
          />
          <div>
            <p className="text-sm font-semibold">Pas de consignes nécessaires</p>
            <p className="text-xs text-slate-400">La commande démarre immédiatement</p>
          </div>
        </label>
      </div>

      {/* Editor & tools */}
      {store.instructionsRequired && (
        <div className="space-y-4">
          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Templates prédéfinis</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => store.updateField("instructionsContent", tpl.content)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variables */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Variables disponibles</p>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <span
                  key={v.key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg text-xs font-mono text-primary cursor-default"
                  title={`Sera remplacé par : ${v.example}`}
                >
                  {v.key}
                </span>
              ))}
            </div>
          </div>

          {/* Editor */}
          <RichTextEditor
            content={store.instructionsContent}
            onChange={(content) => {
              store.updateField("instructionsContent", content);
              setErrors({});
            }}
            placeholder="Rédigez vos consignes ici..."
            minHeight={200}
            simplified
          />
          {errors.instructionsContent && <p className="text-xs text-red-400">{errors.instructionsContent}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-white/5">
        <button onClick={() => store.setStep(5)} className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all">
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
