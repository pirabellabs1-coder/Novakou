"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

interface PlatformConfig {
  commissionRate: number;
  refundWindowDays: number;
  maxUploadSizeMB: number;
  maxFreeFormationsPerInstructor: number;
  cohortsEnabled: boolean;
  productsEnabled: boolean;
  marketingEnabled: boolean;
}

const DEFAULT_CONFIG: PlatformConfig = {
  commissionRate: 15,
  refundWindowDays: 14,
  maxUploadSizeMB: 100,
  maxFreeFormationsPerInstructor: 3,
  cohortsEnabled: true,
  productsEnabled: true,
  marketingEnabled: true,
};

export default function AdminConfigurationPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/formations/config")
      .then((r) => r.json())
      .then((data) => {
        setConfig({ ...DEFAULT_CONFIG, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.commissionRate < 0 || config.commissionRate > 100) {
      newErrors.commissionRate = "La commission doit \u00eatre entre 0 et 100%";
    }
    if (config.refundWindowDays < 0 || !Number.isInteger(config.refundWindowDays)) {
      newErrors.refundWindowDays = "Doit \u00eatre un nombre entier positif";
    }
    if (config.maxUploadSizeMB < 1) {
      newErrors.maxUploadSizeMB = "Doit \u00eatre au minimum 1 MB";
    }
    if (config.maxFreeFormationsPerInstructor < 0 || !Number.isInteger(config.maxFreeFormationsPerInstructor)) {
      newErrors.maxFreeFormationsPerInstructor = "Doit \u00eatre un nombre entier positif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/formations/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setToast("Configuration sauvegard\u00e9e avec succ\u00e8s");
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast("Erreur lors de la sauvegarde");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Erreur lors de la sauvegarde");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PlatformConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        Configuration de la plateforme
      </h1>

      {/* Section: Finances */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">
                payments
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Finances
              </h2>
              <p className="text-xs text-slate-500">
                Param\u00e8tres de commission et remboursement
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Commission rate */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
              Taux de commission
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={config.commissionRate}
                onChange={(e) =>
                  updateField("commissionRate", parseFloat(e.target.value) || 0)
                }
                className={`w-32 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                  errors.commissionRate
                    ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
            {errors.commissionRate && (
              <p className="text-xs text-red-600 mt-1">{errors.commissionRate}</p>
            )}
          </div>

          {/* Refund window */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
              Fen\u00eatre de remboursement
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={config.refundWindowDays}
                onChange={(e) =>
                  updateField(
                    "refundWindowDays",
                    parseInt(e.target.value) || 0
                  )
                }
                className={`w-32 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                  errors.refundWindowDays
                    ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              />
              <span className="text-sm text-slate-500">jours</span>
            </div>
            {errors.refundWindowDays && (
              <p className="text-xs text-red-600 mt-1">
                {errors.refundWindowDays}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Limits */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">
                tune
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Limites
              </h2>
              <p className="text-xs text-slate-500">
                Restrictions de la plateforme
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Max upload size */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
              Taille max. d&apos;upload
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                value={config.maxUploadSizeMB}
                onChange={(e) =>
                  updateField(
                    "maxUploadSizeMB",
                    parseInt(e.target.value) || 1
                  )
                }
                className={`w-32 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                  errors.maxUploadSizeMB
                    ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              />
              <span className="text-sm text-slate-500">MB</span>
            </div>
            {errors.maxUploadSizeMB && (
              <p className="text-xs text-red-600 mt-1">
                {errors.maxUploadSizeMB}
              </p>
            )}
          </div>

          {/* Max free formations */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
              Formations gratuites max. par instructeur
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={config.maxFreeFormationsPerInstructor}
                onChange={(e) =>
                  updateField(
                    "maxFreeFormationsPerInstructor",
                    parseInt(e.target.value) || 0
                  )
                }
                className={`w-32 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                  errors.maxFreeFormationsPerInstructor
                    ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              />
              <span className="text-sm text-slate-500">formations</span>
            </div>
            {errors.maxFreeFormationsPerInstructor && (
              <p className="text-xs text-red-600 mt-1">
                {errors.maxFreeFormationsPerInstructor}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Features */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">
                toggle_on
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Fonctionnalit\u00e9s
              </h2>
              <p className="text-xs text-slate-500">
                Activer ou d\u00e9sactiver des modules
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Cohorts toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cohortes
              </p>
              <p className="text-xs text-slate-500">
                Permettre aux instructeurs de cr\u00e9er des cohortes
              </p>
            </div>
            <button
              onClick={() => updateField("cohortsEnabled", !config.cohortsEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                config.cohortsEnabled
                  ? "bg-primary"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow transition-transform ${
                  config.cohortsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Products toggle */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Produits num\u00e9riques
              </p>
              <p className="text-xs text-slate-500">
                Permettre la vente de produits num\u00e9riques
              </p>
            </div>
            <button
              onClick={() => updateField("productsEnabled", !config.productsEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                config.productsEnabled
                  ? "bg-primary"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow transition-transform ${
                  config.productsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Marketing toggle */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Marketing
              </p>
              <p className="text-xs text-slate-500">
                Activer les outils de marketing pour les instructeurs
              </p>
            </div>
            <button
              onClick={() =>
                updateField("marketingEnabled", !config.marketingEnabled)
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                config.marketingEnabled
                  ? "bg-primary"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow transition-transform ${
                  config.marketingEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">
            {saving ? "progress_activity" : "save"}
          </span>
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
              toast.includes("succ\u00e8s")
                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {toast.includes("succ\u00e8s") ? "check_circle" : "error"}
            </span>
            <span className="text-sm font-medium">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
