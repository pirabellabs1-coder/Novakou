"use client";

/**
 * IntegrationModal — Modale de connexion à un provider d'intégration.
 *
 * Chaque provider a un flux différent :
 *   - Brevo / ConvertKit / Systeme.io → clé API (texte)
 *   - Make / Zapier / n8n → URL de webhook (on leur donne un webhook à coller
 *     dans leur plateforme, OU on reçoit leur webhook pour envoyer des événements)
 *
 * Pour MVP simple : l'utilisateur colle une URL de webhook de son instance
 * Make/Zapier/n8n. Nous enverrons les événements de la boutique à cette URL.
 */

import { useState } from "react";
import { useToastStore } from "@/store/toast";

type Provider = "brevo" | "make" | "zapier" | "n8n" | "convertkit" | "systemeio";

const PROVIDER_CONFIGS: Record<
  Provider,
  {
    name: string;
    icon: string;
    type: "apiKey" | "webhook";
    helpUrl: string;
    helpText: string;
    placeholder: string;
  }
> = {
  brevo: {
    name: "Brevo",
    icon: "mail",
    type: "apiKey",
    helpUrl: "https://app.brevo.com/settings/keys/api",
    helpText: "Connectez-vous à Brevo → Profil → SMTP & API → Clé API",
    placeholder: "xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  convertkit: {
    name: "ConvertKit",
    icon: "mark_email_read",
    type: "apiKey",
    helpUrl: "https://app.convertkit.com/account_settings/advanced_settings",
    helpText: "ConvertKit → Account Settings → Advanced → API Key",
    placeholder: "V4_clé_api_convertkit",
  },
  systemeio: {
    name: "Systeme.io",
    icon: "business_center",
    type: "apiKey",
    helpUrl: "https://systeme.io/profile/api",
    helpText: "Systeme.io → Profil → Clé API publique",
    placeholder: "Votre clé API Systeme.io",
  },
  make: {
    name: "Make",
    icon: "hub",
    type: "webhook",
    helpUrl: "https://www.make.com/en/help/tools/webhooks",
    helpText:
      "Créez un scénario Make avec un trigger 'Webhooks > Custom webhook', copiez l'URL puis collez-la ici.",
    placeholder: "https://hook.eu1.make.com/xxxxxxxxxxxxxxxx",
  },
  zapier: {
    name: "Zapier",
    icon: "bolt",
    type: "webhook",
    helpUrl: "https://zapier.com/apps/webhook/integrations",
    helpText:
      "Créez un Zap avec 'Webhooks by Zapier > Catch Hook', copiez l'URL du Zap et collez-la ici.",
    placeholder: "https://hooks.zapier.com/hooks/catch/xxx/yyy/",
  },
  n8n: {
    name: "n8n",
    icon: "account_tree",
    type: "webhook",
    helpUrl: "https://docs.n8n.io/integrations/core-nodes/n8n-nodes-base.webhook/",
    helpText:
      "Dans n8n, ajoutez un node Webhook, copiez son URL puis collez-la ici.",
    placeholder: "https://votre-n8n.com/webhook/xxxxxxxx",
  },
};

export default function IntegrationModal({
  provider,
  currentWebhook,
  onSave,
  onClose,
}: {
  provider: Provider;
  currentWebhook?: string | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const cfg = PROVIDER_CONFIGS[provider];
  const [value, setValue] = useState<string>(
    cfg.type === "webhook" ? (currentWebhook ?? "") : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!value.trim()) {
      setError(
        cfg.type === "apiKey" ? "La clé API est requise" : "L'URL webhook est requise",
      );
      return;
    }
    if (cfg.type === "webhook" && !/^https?:\/\//i.test(value.trim())) {
      setError("L'URL doit commencer par http:// ou https://");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/formations/vendeur/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          ...(cfg.type === "apiKey" ? { apiKey: value.trim() } : {}),
          ...(cfg.type === "webhook" ? { webhookUrl: value.trim() } : {}),
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      let json: { error?: string } = {};
      if (contentType.includes("application/json")) {
        try { json = await res.json(); } catch { json = { error: "Réponse invalide" }; }
      }
      if (!res.ok || json.error) {
        setError(json.error ?? `Erreur HTTP ${res.status}`);
        return;
      }
      useToastStore.getState().addToast("success", `${cfg.name} connecté avec succès`);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006e2f]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-[#006e2f]">
                {cfg.icon}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connecter {cfg.name}</h2>
              <p className="text-xs text-gray-500">
                {cfg.type === "apiKey" ? "Clé API requise" : "URL Webhook requise"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Comment obtenir {cfg.type === "apiKey" ? "votre clé API" : "votre URL webhook"} ?
            </p>
            <p>{cfg.helpText}</p>
            <a
              href={cfg.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 font-semibold hover:underline"
            >
              Ouvrir la documentation
              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </a>
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              {cfg.type === "apiKey" ? "Clé API" : "URL du webhook"}
            </label>
            <input
              type={cfg.type === "apiKey" ? "password" : "url"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={cfg.placeholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
              autoFocus
            />
            {cfg.type === "apiKey" && (
              <p className="text-[10px] text-gray-500 mt-1">
                🔒 Votre clé est stockée en sécurité et jamais partagée.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[14px] mt-0.5">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !value.trim()}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            {saving ? (
              <span className="material-symbols-outlined text-[14px] animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
            )}
            {saving ? "Connexion..." : "Connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
