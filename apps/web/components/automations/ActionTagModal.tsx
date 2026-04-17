"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";
import { TagAction, TagActionConfig, TagAudienceType } from "./types";

const BRAND = "#006e2f";

type Product = { id: string; title: string; slug?: string; kind?: string };

const AUDIENCE_OPTIONS: Array<{
  value: TagAudienceType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "all",
    label: "Tous les clients",
    description: "Appliquer à l'ensemble de votre audience",
    icon: "groups",
  },
  {
    value: "buyers",
    label: "Acheteurs seulement",
    description: "Clients ayant effectué au moins un achat",
    icon: "shopping_bag",
  },
  {
    value: "prospects",
    label: "Prospects",
    description: "Inscrits qui n'ont encore rien acheté",
    icon: "person_search",
  },
  {
    value: "product_buyers",
    label: "Selon produit acheté",
    description: "Acheteurs d'un ou plusieurs produits spécifiques",
    icon: "inventory_2",
  },
  {
    value: "custom",
    label: "Personnalisé",
    description: "Filtre avancé (décrit en texte libre)",
    icon: "tune",
  },
];

type Step = 1 | 2 | 3;

export default function ActionTagModal({
  action,
  onSave,
  onCancel,
}: {
  action: TagAction | null;
  onSave: (action: TagAction) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [config, setConfig] = useState<TagActionConfig>(
    action?.config ?? {
      tagName: "",
      audienceType: "all",
      productIds: [],
      customFilter: "",
    }
  );

  // Tag autocomplete data
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState(action?.config.tagName ?? "");

  // Product list for step 3
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    // Prefill form if editing existing action
    if (action?.config) {
      setConfig(action.config);
      setTagQuery(action.config.tagName);
    }
  }, [action]);

  useEffect(() => {
    // Fetch existing tag suggestions (best-effort; endpoint optional)
    fetch("/api/formations/vendeur/marketing/tags")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data && Array.isArray(j.data)) {
          setTagSuggestions(j.data.map((t: { name?: string } | string) => (typeof t === "string" ? t : t.name ?? "")).filter(Boolean));
        }
      })
      .catch(() => {
        /* silent */
      });
  }, []);

  useEffect(() => {
    // Lazy load products when user reaches step 3 with product_buyers
    if (step === 3 && config.audienceType === "product_buyers" && products.length === 0) {
      setProductsLoading(true);
      fetch("/api/formations/vendeur/formations?limit=100")
        .then((r) => r.json())
        .then((j) => {
          setProducts(Array.isArray(j.data) ? j.data : []);
        })
        .catch(() => setProducts([]))
        .finally(() => setProductsLoading(false));
    }
  }, [step, config.audienceType, products.length]);

  function goToStep2() {
    if (!tagQuery.trim()) {
      useToastStore.getState().addToast("error", "Nom du tag requis");
      return;
    }
    setConfig((c) => ({ ...c, tagName: tagQuery.trim().toLowerCase().replace(/\s+/g, "-") }));
    setStep(2);
  }

  function chooseAudience(type: TagAudienceType) {
    setConfig((c) => ({ ...c, audienceType: type }));
    if (type === "product_buyers") {
      setStep(3);
    } else if (type === "custom") {
      setStep(3);
    } else {
      // directly save for simple audiences
      commit({ ...config, audienceType: type });
    }
  }

  function toggleProduct(id: string) {
    const current = config.productIds ?? [];
    setConfig((c) => ({
      ...c,
      productIds: current.includes(id)
        ? current.filter((p) => p !== id)
        : [...current, id],
    }));
  }

  function commit(finalConfig: TagActionConfig) {
    if (!finalConfig.tagName.trim()) {
      useToastStore.getState().addToast("error", "Nom du tag requis");
      setStep(1);
      return;
    }
    if (finalConfig.audienceType === "product_buyers" && (!finalConfig.productIds || finalConfig.productIds.length === 0)) {
      useToastStore.getState().addToast("error", "Sélectionnez au moins un produit");
      return;
    }
    onSave({
      id: action?.id ?? `tag-${Date.now()}`,
      type: "ADD_TAG",
      config: finalConfig,
    });
  }

  const matchingSuggestions = tagSuggestions.filter(
    (s) => s && tagQuery && s.toLowerCase().includes(tagQuery.toLowerCase()) && s !== tagQuery
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600">
              <span className="material-symbols-outlined text-[20px]">label</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ajouter un tag</h2>
              <p className="text-xs text-gray-500">Étape {step} sur {config.audienceType === "product_buyers" || config.audienceType === "custom" ? 3 : 2}</p>
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 1: Tag name ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Nom du tag
                </label>
                <input
                  autoFocus
                  type="text"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goToStep2()}
                  placeholder="Ex: premium-client"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Tirets recommandés (pas d'espaces). Exemple: <code className="bg-gray-100 px-1 rounded">vip-client</code>
                </p>
                {matchingSuggestions.length > 0 && (
                  <div className="mt-2 bg-gray-50 rounded-xl p-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 px-1">Tags existants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchingSuggestions.slice(0, 8).map((s) => (
                        <button
                          key={s}
                          onClick={() => setTagQuery(s)}
                          className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-700 hover:border-[#006e2f] hover:text-[#006e2f]"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Audience ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Appliquer le tag <span className="font-mono font-bold text-[#006e2f]">{config.tagName}</span> à quel type de client ?
              </p>
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => chooseAudience(opt.value)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-[#006e2f] hover:bg-[#006e2f]/5 text-left transition-all"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600 flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                    <p className="text-[11px] text-gray-500">{opt.description}</p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 3: Product / Custom ─────────────────────── */}
          {step === 3 && config.audienceType === "product_buyers" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Choisissez les produits dont les acheteurs recevront le tag <span className="font-mono font-bold text-[#006e2f]">{config.tagName}</span> :
              </p>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {productsLoading ? (
                  <p className="p-4 text-center text-sm text-gray-500">Chargement…</p>
                ) : products.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">Aucun produit trouvé</p>
                ) : (
                  products.map((p) => {
                    const checked = (config.productIds ?? []).includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                          className="w-4 h-4 rounded accent-[#006e2f]"
                        />
                        <span className="material-symbols-outlined text-[16px] text-gray-400">inventory_2</span>
                        <span className="text-sm text-gray-900 flex-1 truncate">{p.title}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                {(config.productIds ?? []).length} produit{(config.productIds ?? []).length !== 1 ? "s" : ""} sélectionné{(config.productIds ?? []).length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {step === 3 && config.audienceType === "custom" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Décrivez le filtre personnalisé à appliquer :
              </p>
              <textarea
                rows={4}
                value={config.customFilter ?? ""}
                onChange={(e) => setConfig((c) => ({ ...c, customFilter: e.target.value }))}
                placeholder="Ex: clients ayant dépensé plus de 500€ cette année"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] resize-none"
              />
              <p className="text-[10px] text-amber-600">
                Note : les filtres personnalisés seront appliqués manuellement par l'équipe ou lors d'une future évolution.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Retour
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
            >
              Annuler
            </button>
            {step === 1 && (
              <button
                type="button"
                onClick={goToStep2}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ background: `linear-gradient(to right, ${BRAND}, #22c55e)` }}
              >
                Suivant
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                onClick={() => commit(config)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ background: `linear-gradient(to right, ${BRAND}, #22c55e)` }}
              >
                Confirmer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
