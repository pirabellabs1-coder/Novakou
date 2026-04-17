"use client";

import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import { useToastStore } from "@/store/toast";
import { EmailAction, EmailActionConfig, TEMPLATE_VARIABLES } from "./types";
import DraggableVariableBadge from "./DraggableVariableBadge";

const BRAND = "#006e2f";

const DELAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Immédiatement" },
  { value: 15, label: "Après 15 minutes" },
  { value: 60, label: "Après 1 heure" },
  { value: 60 * 24, label: "Après 1 jour" },
  { value: 60 * 24 * 3, label: "Après 3 jours" },
  { value: 60 * 24 * 7, label: "Après 7 jours" },
];

function defaultConfig(): EmailActionConfig {
  return {
    to: "{{customer.email}}",
    subject: "",
    body: "",
    fromName: "Novakou",
    replyTo: "",
    delayMinutes: 0,
  };
}

export default function ActionEmailModal({
  action,
  onSave,
  onCancel,
}: {
  action: EmailAction | null;
  onSave: (action: EmailAction) => void;
  onCancel: () => void;
}) {
  const [config, setConfig] = useState<EmailActionConfig>(
    action?.config ?? defaultConfig()
  );
  const [testing, setTesting] = useState(false);
  const [showVars, setShowVars] = useState(false);

  useEffect(() => {
    if (action?.config) setConfig(action.config);
  }, [action]);

  function patch<K extends keyof EmailActionConfig>(key: K, value: EmailActionConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function handleTest() {
    if (!config.subject.trim() || !config.body.trim()) {
      useToastStore.getState().addToast("error", "Sujet et corps requis pour tester");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/formations/vendeur/automatisations/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: config.subject,
          body: config.body,
          fromName: config.fromName,
          replyTo: config.replyTo,
        }),
      });

      // Parser proprement la réponse (gérer HTML 404/500 sans crash)
      const contentType = res.headers.get("content-type") ?? "";
      let json: { error?: string; to?: string } = {};
      if (contentType.includes("application/json")) {
        try {
          json = await res.json();
        } catch {
          json = { error: "Réponse serveur invalide" };
        }
      } else {
        json = {
          error: res.status === 401
            ? "Vous devez être connecté pour envoyer un test"
            : res.status === 404
              ? "Endpoint indisponible. Rechargez la page."
              : `Erreur serveur (HTTP ${res.status})`,
        };
      }

      if (!res.ok || json.error) {
        useToastStore.getState().addToast("error", json.error ?? `Erreur HTTP ${res.status}`);
      } else {
        useToastStore
          .getState()
          .addToast("success", `Email de test envoyé à ${json.to ?? "votre adresse"}`);
      }
    } catch (err) {
      useToastStore
        .getState()
        .addToast("error", err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    if (!config.subject.trim()) {
      useToastStore.getState().addToast("error", "Objet de l'email requis");
      return;
    }
    if (!config.body.trim() || config.body === "<p></p>") {
      useToastStore.getState().addToast("error", "Corps de l'email requis");
      return;
    }
    onSave({
      id: action?.id ?? `email-${Date.now()}`,
      type: "SEND_EMAIL",
      config,
    });
  }

  function insertVariable(token: string) {
    patch("subject", (config.subject ?? "") + token);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: BRAND }}
            >
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Envoyer un email</h2>
              <p className="text-xs text-gray-500">Configurez l'email automatique</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* To / From / Reply-to */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Destinataire
              </label>
              <input
                type="text"
                value={config.to}
                onChange={(e) => patch("to", e.target.value)}
                placeholder="{{customer.email}}"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Utilisez <code className="bg-gray-100 px-1 rounded">{`{{customer.email}}`}</code> pour envoyer au client concerné
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Délai d'envoi
              </label>
              <select
                value={config.delayMinutes ?? 0}
                onChange={(e) => patch("delayMinutes", Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] bg-white"
              >
                {DELAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Nom expéditeur
              </label>
              <input
                type="text"
                value={config.fromName ?? ""}
                onChange={(e) => patch("fromName", e.target.value)}
                placeholder="Novakou"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Email de réponse
              </label>
              <input
                type="email"
                value={config.replyTo ?? ""}
                onChange={(e) => patch("replyTo", e.target.value)}
                placeholder="support@votre-domaine.com"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Objet de l'email
            </label>
            <input
              type="text"
              value={config.subject}
              onChange={(e) => patch("subject", e.target.value)}
              placeholder="Bienvenue {{customer.firstName}} !"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
            />
          </div>

          {/* Variables helper */}
          <div>
            <button
              type="button"
              onClick={() => setShowVars((s) => !s)}
              className="text-xs font-semibold text-[#006e2f] flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[14px]">data_object</span>
              {showVars ? "Masquer" : "Afficher"} les variables dynamiques
            </button>
            {showVars && (
              <div className="mt-2 bg-[#006e2f]/5 border border-[#006e2f]/20 rounded-xl p-3">
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <DraggableVariableBadge
                      key={v.token}
                      token={v.token}
                      label={v.label}
                      onInsert={insertVariable}
                    />
                  ))}
                </div>
                <p className="w-full text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    drag_pan
                  </span>
                  Glissez-déposez dans l&apos;objet ou le corps, ou cliquez pour insérer dans l&apos;objet.
                </p>
              </div>
            )}
          </div>

          {/* Rich body */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Corps du message
            </label>
            <RichTextEditor
              value={config.body}
              onChange={(html) => patch("body", html)}
              placeholder="Bonjour {{customer.firstName}}, ..."
              minHeight={280}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006e2f] hover:bg-[#006e2f]/10 px-3 py-2 rounded-xl disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {testing ? "progress_activity" : "send"}
            </span>
            {testing ? "Envoi…" : "Envoyer un test"}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90"
              style={{ background: `linear-gradient(to right, ${BRAND}, #22c55e)` }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
