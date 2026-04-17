"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";
import {
  WEBHOOK_FIELDS,
  WebhookAction,
  WebhookActionConfig,
  WebhookMethod,
} from "./types";

const BRAND = "#006e2f";

function defaultSelectedFields(): string[] {
  return WEBHOOK_FIELDS.flatMap((g) =>
    g.fields.filter((f) => f.defaultOn).map((f) => f.key)
  );
}

function defaultConfig(): WebhookActionConfig {
  return {
    url: "",
    method: "POST",
    headers: [],
    selectedFields: defaultSelectedFields(),
  };
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ActionWebhookModal({
  action,
  onSave,
  onCancel,
}: {
  action: WebhookAction | null;
  onSave: (action: WebhookAction) => void;
  onCancel: () => void;
}) {
  const [config, setConfig] = useState<WebhookActionConfig>(
    action?.config ?? defaultConfig()
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status?: number; body?: string; error?: string } | null>(null);

  useEffect(() => {
    if (action?.config) setConfig(action.config);
  }, [action]);

  function toggleField(key: string) {
    setConfig((c) => ({
      ...c,
      selectedFields: c.selectedFields.includes(key)
        ? c.selectedFields.filter((k) => k !== key)
        : [...c.selectedFields, key],
    }));
  }

  function addHeader() {
    setConfig((c) => ({ ...c, headers: [...(c.headers ?? []), { key: "", value: "" }] }));
  }

  function updateHeader(idx: number, patch: { key?: string; value?: string }) {
    setConfig((c) => {
      const headers = [...(c.headers ?? [])];
      headers[idx] = { ...headers[idx], ...patch };
      return { ...c, headers };
    });
  }

  function removeHeader(idx: number) {
    setConfig((c) => ({
      ...c,
      headers: (c.headers ?? []).filter((_, i) => i !== idx),
    }));
  }

  async function handleTest() {
    if (!isValidUrl(config.url)) {
      useToastStore.getState().addToast("error", "URL webhook invalide (http ou https requis)");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/formations/vendeur/automatisations/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: config.url,
          method: config.method,
          headers: config.headers,
          selectedFields: config.selectedFields,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      let json: { error?: string; status?: number } = {};
      if (contentType.includes("application/json")) {
        try {
          json = await res.json();
        } catch {
          json = { error: "Réponse serveur invalide" };
        }
      } else {
        json = {
          error:
            res.status === 401
              ? "Vous devez être connecté"
              : res.status === 404
                ? "Endpoint indisponible. Rechargez la page."
                : `Erreur serveur (HTTP ${res.status})`,
        };
      }
      setTestResult(json);
      if (!res.ok || json.error) {
        useToastStore.getState().addToast("error", json.error ?? `Erreur HTTP ${res.status}`);
      } else {
        useToastStore
          .getState()
          .addToast(
            (json.status ?? 0) >= 200 && (json.status ?? 0) < 300 ? "success" : "error",
            `Webhook répondu — ${json.status}`
          );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setTestResult({ error: msg });
      useToastStore.getState().addToast("error", msg);
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    if (!isValidUrl(config.url)) {
      useToastStore.getState().addToast("error", "URL webhook invalide");
      return;
    }
    if (config.selectedFields.length === 0) {
      useToastStore.getState().addToast("error", "Sélectionnez au moins un champ à envoyer");
      return;
    }
    // Sanitize headers
    const headers = (config.headers ?? []).filter(
      (h) => h.key.trim() && !/[\r\n]/.test(h.key) && !/[\r\n]/.test(h.value)
    );
    onSave({
      id: action?.id ?? `webhook-${Date.now()}`,
      type: "WEBHOOK",
      config: { ...config, headers },
    });
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
              <span className="material-symbols-outlined text-[20px]">webhook</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Déclencher un webhook</h2>
              <p className="text-xs text-gray-500">Envoyer les données vers n8n, Make, Zapier…</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* URL + Method */}
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Méthode
              </label>
              <select
                value={config.method}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, method: e.target.value as WebhookMethod }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] bg-white"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                URL du webhook
              </label>
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig((c) => ({ ...c, url: e.target.value }))}
                placeholder="https://hook.eu1.make.com/..."
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#006e2f] font-mono ${
                  config.url && !isValidUrl(config.url) ? "border-red-300" : "border-gray-200"
                }`}
              />
              {config.url && !isValidUrl(config.url) && (
                <p className="text-[10px] text-red-500 mt-1">
                  URL invalide — doit commencer par https:// ou http://
                </p>
              )}
            </div>
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                En-têtes (optionnel)
              </label>
              <button
                onClick={addHeader}
                className="text-xs font-semibold text-[#006e2f] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Ajouter un en-tête
              </button>
            </div>
            {(config.headers ?? []).length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">
                Ex: Authorization: Bearer xxx (pour authentifier vers l'API externe)
              </p>
            ) : (
              <div className="space-y-2">
                {(config.headers ?? []).map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={h.key}
                      onChange={(e) => updateHeader(i, { key: e.target.value })}
                      placeholder="Authorization"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#006e2f]"
                    />
                    <span className="text-gray-400">:</span>
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => updateHeader(i, { value: e.target.value })}
                      placeholder="Bearer xxx"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#006e2f]"
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Données à envoyer dans le payload
            </label>
            <div className="space-y-3">
              {WEBHOOK_FIELDS.map((group) => (
                <div key={group.group} className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                    {group.group}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-gray-100">
                    {group.fields.map((f) => {
                      const checked = config.selectedFields.includes(f.key);
                      return (
                        <label
                          key={f.key}
                          className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleField(f.key)}
                            className="w-4 h-4 rounded accent-[#006e2f]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{f.label}</p>
                            <p className="text-[10px] font-mono text-gray-500">{f.key}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              {config.selectedFields.length} champ{config.selectedFields.length !== 1 ? "s" : ""} sélectionné{config.selectedFields.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Preview payload */}
          <details className="rounded-xl bg-gray-50 border border-gray-200">
            <summary className="px-3 py-2 text-xs font-semibold text-gray-600 cursor-pointer">
              Aperçu du payload JSON
            </summary>
            <pre className="px-3 py-2 text-[11px] font-mono text-gray-700 overflow-x-auto">
              {JSON.stringify(
                config.selectedFields.reduce(
                  (acc, key) => {
                    const parts = key.split(".");
                    let cur: Record<string, unknown> = acc;
                    for (let i = 0; i < parts.length - 1; i++) {
                      cur[parts[i]] = (cur[parts[i]] as Record<string, unknown>) ?? {};
                      cur = cur[parts[i]] as Record<string, unknown>;
                    }
                    cur[parts[parts.length - 1]] = "…";
                    return acc;
                  },
                  {} as Record<string, unknown>
                ),
                null,
                2
              )}
            </pre>
          </details>

          {/* Test result */}
          {testResult && (
            <div
              className={`rounded-xl p-3 border ${
                testResult.error
                  ? "bg-red-50 border-red-200"
                  : testResult.status && testResult.status >= 200 && testResult.status < 300
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <p className="text-xs font-bold text-gray-800 mb-1">
                {testResult.error ? "Erreur" : `Statut HTTP ${testResult.status ?? "?"}`}
              </p>
              {testResult.error && (
                <p className="text-[11px] text-red-600 font-mono">{testResult.error}</p>
              )}
              {testResult.body && (
                <pre className="text-[10px] font-mono text-gray-700 overflow-x-auto max-h-32">
                  {testResult.body}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !isValidUrl(config.url)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006e2f] hover:bg-[#006e2f]/10 px-3 py-2 rounded-xl disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {testing ? "progress_activity" : "bolt"}
            </span>
            {testing ? "Test…" : "Tester le webhook"}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
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
