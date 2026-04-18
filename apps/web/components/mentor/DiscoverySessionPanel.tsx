"use client";

/**
 * Drop-in settings panel for the mentor's profile page :
 *   - Toggle discovery session (gratuite 15 min)
 *   - Editor for the pre-session questionnaire (max 10 questions)
 */

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

interface Question {
  id: string;
  label: string;
  type: "text" | "choice";
  required?: boolean;
  options?: string[];
}

interface Config {
  discoveryEnabled: boolean;
  discoveryDurationMinutes: number;
  preSessionQuestions: Question[];
}

function genId() {
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function DiscoverySessionPanel() {
  const toast = useToastStore.getState().addToast;
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/formations/mentor/profile");
      const j = await res.json();
      if (res.ok) {
        setCfg({
          discoveryEnabled: !!j.data.discoveryEnabled,
          discoveryDurationMinutes: j.data.discoveryDurationMinutes ?? 15,
          preSessionQuestions: Array.isArray(j.data.preSessionQuestions) ? j.data.preSessionQuestions : [],
        });
      }
    } catch { /* ignore */ }
  }
  useEffect(() => { load(); }, []);

  async function save(next: Config) {
    setSaving(true);
    try {
      const res = await fetch("/api/formations/mentor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const j = await res.json();
      if (!res.ok) { toast("error", j.error || "Erreur"); return; }
      toast("success", "Réglages sauvegardés ✓");
      setCfg(next);
    } finally { setSaving(false); }
  }

  if (!cfg) return null;

  return (
    <div className="space-y-6">
      {/* Discovery session */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Séance découverte gratuite</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-md">
              Offrez une première prise de contact de 15 min aux apprenants qui hésitent.
              Idéal pour convertir les profils en bas du funnel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => save({ ...cfg, discoveryEnabled: !cfg.discoveryEnabled })}
            disabled={saving}
            className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${cfg.discoveryEnabled ? "bg-emerald-500" : "bg-slate-200"}`}
            aria-pressed={cfg.discoveryEnabled}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${cfg.discoveryEnabled ? "left-[26px]" : "left-0.5"}`}
            />
          </button>
        </div>
        {cfg.discoveryEnabled && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Durée (minutes)</label>
            <input
              type="number" min={5} max={60}
              value={cfg.discoveryDurationMinutes}
              onChange={(e) => setCfg({ ...cfg, discoveryDurationMinutes: Number(e.target.value) })}
              onBlur={() => save(cfg)}
              className="w-32 px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        )}
      </div>

      {/* Pre-session questionnaire */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Questionnaire pré-séance</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-md">
              Posez quelques questions au moment de la réservation pour arriver préparé(e). Max. 10 questions.
            </p>
          </div>
          <button
            onClick={() => {
              const next = [
                ...cfg.preSessionQuestions,
                { id: genId(), label: "", type: "text" as const, required: false },
              ];
              setCfg({ ...cfg, preSessionQuestions: next });
            }}
            disabled={cfg.preSessionQuestions.length >= 10}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Ajouter
          </button>
        </div>

        {cfg.preSessionQuestions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Aucune question configurée. Cliquez sur « Ajouter » pour commencer.
          </p>
        ) : (
          <div className="space-y-3">
            {cfg.preSessionQuestions.map((q, idx) => (
              <div key={q.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-200 text-xs font-bold flex items-center justify-center text-slate-600">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => {
                      const next = [...cfg.preSessionQuestions];
                      next[idx] = { ...q, label: e.target.value };
                      setCfg({ ...cfg, preSessionQuestions: next });
                    }}
                    placeholder="Ex. Quel est votre objectif principal pour cette séance ?"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <button
                    onClick={() => {
                      const next = cfg.preSessionQuestions.filter((_, i) => i !== idx);
                      setCfg({ ...cfg, preSessionQuestions: next });
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 pl-8 text-[11px]">
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const next = [...cfg.preSessionQuestions];
                      next[idx] = { ...q, type: e.target.value as "text" | "choice" };
                      setCfg({ ...cfg, preSessionQuestions: next });
                    }}
                    className="px-2 py-1 rounded border border-slate-200 bg-white"
                  >
                    <option value="text">Texte libre</option>
                    <option value="choice">Choix multiple</option>
                  </select>
                  <label className="inline-flex items-center gap-1 text-slate-700">
                    <input
                      type="checkbox"
                      checked={q.required ?? false}
                      onChange={(e) => {
                        const next = [...cfg.preSessionQuestions];
                        next[idx] = { ...q, required: e.target.checked };
                        setCfg({ ...cfg, preSessionQuestions: next });
                      }}
                    />
                    Requise
                  </label>
                </div>
                {q.type === "choice" && (
                  <div className="pl-8">
                    <input
                      type="text"
                      value={(q.options ?? []).join(" | ")}
                      onChange={(e) => {
                        const next = [...cfg.preSessionQuestions];
                        next[idx] = { ...q, options: e.target.value.split("|").map((s) => s.trim()).filter(Boolean) };
                        setCfg({ ...cfg, preSessionQuestions: next });
                      }}
                      placeholder="Option 1 | Option 2 | Option 3"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 text-[11px] bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Séparez les options par un « | »</p>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => save(cfg)}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              {saving ? "Sauvegarde…" : "Sauvegarder le questionnaire"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
