"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toast";

const BRAND = "#3F41C2";
const BORDER = "#E2E8F0";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  title: string;
  slug: string;
  kind: "formation" | "product";
}

interface WorkflowAction {
  id: string;
  type: "SEND_EMAIL" | "ADD_TAG" | "WEBHOOK" | "WAIT" | "ENROLL_SEQUENCE";
  config: Record<string, unknown>;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  actions: WorkflowAction[];
  productId?: string | null;
}

// ─── Trigger options ──────────────────────────────────────────────────────────
const TRIGGER_OPTIONS = [
  { value: "PURCHASE", label: "Vente effectuée", icon: "shopping_cart" },
  { value: "CART_ABANDONED", label: "Panier abandonné", icon: "remove_shopping_cart" },
  { value: "PAYMENT_FAILED", label: "Paiement échoué", icon: "credit_card_off" },
  { value: "ENROLLMENT", label: "Inscription formation", icon: "school" },
  { value: "COURSE_COMPLETED", label: "Cours terminé", icon: "verified" },
  { value: "LESSON_COMPLETED", label: "Leçon terminée", icon: "check_circle" },
  { value: "USER_SIGNUP", label: "Nouvelle inscription", icon: "person_add" },
  { value: "INACTIVITY", label: "Inactivité", icon: "schedule" },
];

// ─── Action options ───────────────────────────────────────────────────────────
const ACTION_OPTIONS = [
  { value: "SEND_EMAIL", label: "Envoyer un email", icon: "mail", color: "#3F41C2" },
  { value: "ADD_TAG", label: "Ajouter un tag", icon: "label", color: "#8b5cf6" },
  { value: "ENROLL_SEQUENCE", label: "Démarrer une séquence", icon: "alt_route", color: "#ec4899" },
  { value: "WEBHOOK", label: "Déclencher un webhook", icon: "webhook", color: "#f59e0b" },
  { value: "WAIT", label: "Attendre un délai", icon: "schedule", color: "#6b7280" },
];

// ─── Product search component ─────────────────────────────────────────────────
function ProductSearch({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (productId: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!value) return setSelected(null);
    // Fetch product by id if value is set but selected is null
    if (value && !selected) {
      fetch(`/api/formations/vendeur/formations?ids=${value}`)
        .then((r) => r.json())
        .then((j) => {
          const found = j.data?.find((p: Product) => p.id === value);
          if (found) setSelected(found);
        })
        .catch(() => null);
    }
  }, [value, selected]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/formations/vendeur/formations?search=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      {selected ? (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px]" style={{ color: BRAND }}>
              inventory_2
            </span>
            <span className="text-sm font-medium text-gray-900 truncate">{selected.title}</span>
          </div>
          <button
            onClick={() => {
              setSelected(null);
              onChange(null);
            }}
            className="text-gray-400 hover:text-red-500"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-gray-400">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder="Rechercher une formation ou un produit…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3F41C2] focus:ring-2 focus:ring-[#3F41C2]/10"
            />
          </div>
          {open && query.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">Recherche…</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">No results found</div>
              ) : (
                results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      onChange(p.id);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                  >
                    <span className="material-symbols-outlined text-[16px] text-gray-400">inventory_2</span>
                    <span className="text-sm text-gray-900 truncate">{p.title}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Action block (in the vertical chain) ─────────────────────────────────────
function ActionBlock({
  action,
  index,
  onUpdate,
  onDelete,
}: {
  action: WorkflowAction;
  index: number;
  onUpdate: (a: WorkflowAction) => void;
  onDelete: () => void;
}) {
  const meta = ACTION_OPTIONS.find((o) => o.value === action.type) ?? ACTION_OPTIONS[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 w-full max-w-md">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}15`, color: meta.color }}
        >
          <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Action {index + 1}</p>
          <p className="text-sm font-bold text-gray-900">{meta.label}</p>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Supprimer"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>

      {/* Config field based on action type */}
      {action.type === "SEND_EMAIL" && (
        <input
          type="text"
          value={(action.config.subject as string) ?? ""}
          onChange={(e) => onUpdate({ ...action, config: { ...action.config, subject: e.target.value } })}
          placeholder="Objet de l'email…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3F41C2]"
        />
      )}
      {action.type === "ADD_TAG" && (
        <input
          type="text"
          value={(action.config.tagName as string) ?? ""}
          onChange={(e) => onUpdate({ ...action, config: { ...action.config, tagName: e.target.value } })}
          placeholder="Nom du tag (ex: vip-client)"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3F41C2]"
        />
      )}
      {action.type === "WEBHOOK" && (
        <input
          type="url"
          value={(action.config.url as string) ?? ""}
          onChange={(e) => onUpdate({ ...action, config: { ...action.config, url: e.target.value } })}
          placeholder="https://example.com/webhook"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3F41C2]"
        />
      )}
      {action.type === "WAIT" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(action.config.hours as number) ?? 1}
            onChange={(e) =>
              onUpdate({ ...action, config: { ...action.config, hours: Number(e.target.value) } })
            }
            min={1}
            className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#3F41C2]"
          />
          <span className="text-sm text-gray-600">heure(s)</span>
        </div>
      )}
      {action.type === "ENROLL_SEQUENCE" && (
        <p className="text-xs text-gray-500 italic">Configurez la séquence à déclencher depuis la liste</p>
      )}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
export default function WorkflowEditorClient({ id }: { id: string }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/vendeur/automatisations/${id}`);
        if (res.ok) {
          const json = await res.json();
          const wf = json.data as Workflow;
          // Ensure actions is an array of WorkflowAction
          if (!Array.isArray(wf.actions)) wf.actions = [];
          setWorkflow(wf);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function updateLocal(patch: Partial<Workflow>) {
    setWorkflow((w) => (w ? { ...w, ...patch } : w));
  }

  function addAction(type: WorkflowAction["type"]) {
    if (!workflow) return;
    const newAction: WorkflowAction = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      config: type === "WAIT" ? { hours: 1 } : {},
    };
    updateLocal({ actions: [...workflow.actions, newAction] });
    setShowActionPicker(false);
  }

  function updateAction(idx: number, newAction: WorkflowAction) {
    if (!workflow) return;
    const updated = [...workflow.actions];
    updated[idx] = newAction;
    updateLocal({ actions: updated });
  }

  function deleteAction(idx: number) {
    if (!workflow) return;
    updateLocal({ actions: workflow.actions.filter((_, i) => i !== idx) });
  }

  async function handleSave() {
    if (!workflow) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/vendeur/automatisations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          triggerType: workflow.triggerType,
          actions: workflow.actions,
        }),
      });
      if (!res.ok) throw new Error("Sauvegarde échouée");
      useToastStore.getState().addToast("success", "Workflow sauvegardé ✓");
    } catch (e) {
      useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!workflow) return;
    const newStatus = workflow.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    const res = await fetch(`/api/formations/vendeur/automatisations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      updateLocal({ status: newStatus });
      useToastStore.getState().addToast("success", newStatus === "ACTIVE" ? "Workflow activé" : "Workflow désactivé");
    }
  }

  if (loading) {
    return (
      <div className="p-12 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-xl mb-4" />
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-gray-600">Workflow introuvable.</p>
        <Link href="/formations/vendeur/automatisations" className="text-[#3F41C2] text-sm mt-3 inline-block">
          ← Retour
        </Link>
      </div>
    );
  }

  const trigger = TRIGGER_OPTIONS.find((t) => t.value === workflow.triggerType) ?? TRIGGER_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "Inter, 'Helvetica Neue', sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/formations/vendeur/automatisations" className="hover:text-[#3F41C2]">
            Automatisations
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-gray-900 font-medium">{workflow.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={workflow.name}
              onChange={(e) => updateLocal({ name: e.target.value })}
              className="text-3xl font-bold text-gray-900 tracking-tight bg-transparent focus:outline-none focus:bg-gray-100 px-2 py-1 -ml-2 rounded-lg w-full"
            />
            <textarea
              value={workflow.description ?? ""}
              onChange={(e) => updateLocal({ description: e.target.value })}
              placeholder="Décrivez ce que fait ce workflow (optionnel)"
              rows={1}
              className="text-sm text-gray-500 mt-1.5 bg-transparent focus:outline-none focus:bg-gray-100 px-2 py-1 -ml-2 rounded-lg w-full resize-none"
            />
          </div>

          {/* Toggle switch */}
          <button
            onClick={toggleActive}
            className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${
              workflow.status === "ACTIVE" ? "" : "bg-gray-200"
            }`}
            style={workflow.status === "ACTIVE" ? { background: BRAND } : {}}
            title={workflow.status === "ACTIVE" ? "Actif — cliquer pour désactiver" : "Désactivé — cliquer pour activer"}
          >
            <span
              className={`inline-block h-5 w-5 bg-white rounded-full shadow transform transition-transform mt-1 ${
                workflow.status === "ACTIVE" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* ── Trigger block ──────────────────────────────────────────── */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl border-2 shadow-sm p-5" style={{ borderColor: BRAND }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: BRAND }}
                >
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND }}>
                    Déclencheur
                  </p>
                  <p className="text-sm font-bold text-gray-900">{trigger.label}</p>
                </div>
              </div>
              <select
                value={workflow.triggerType}
                onChange={(e) => updateLocal({ triggerType: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#3F41C2]"
              >
                {TRIGGER_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Produit relatif (optionnel)
                </label>
                <ProductSearch
                  value={workflow.productId ?? null}
                  onChange={(pid) => updateLocal({ productId: pid })}
                />
              </div>
            </div>
          </div>

          {/* Actions chain */}
          {workflow.actions.map((action, idx) => (
            <div key={action.id} className="flex flex-col items-center w-full">
              {/* Dotted vertical line */}
              <div
                className="w-px h-10 my-1"
                style={{
                  backgroundImage: `linear-gradient(to bottom, ${BRAND}40 50%, transparent 0%)`,
                  backgroundPosition: "right",
                  backgroundSize: "2px 8px",
                  backgroundRepeat: "repeat-y",
                }}
              />
              <ActionBlock
                action={action}
                index={idx}
                onUpdate={(a) => updateAction(idx, a)}
                onDelete={() => deleteAction(idx)}
              />
            </div>
          ))}

          {/* + button */}
          <div className="flex flex-col items-center mt-2">
            <div
              className="w-px h-10 my-1"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${BRAND}40 50%, transparent 0%)`,
                backgroundPosition: "right",
                backgroundSize: "2px 8px",
                backgroundRepeat: "repeat-y",
              }}
            />
            <button
              onClick={() => setShowActionPicker(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
              style={{ background: BRAND }}
              title="Ajouter une action"
            >
              <span className="material-symbols-outlined text-[22px]">add</span>
            </button>
            <p className="text-xs text-gray-400 mt-2">Ajouter une action</p>
          </div>
        </div>
      </div>

      {/* ── Sticky save bar ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            {workflow.actions.length} action{workflow.actions.length !== 1 ? "s" : ""} configurée{workflow.actions.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/formations/vendeur/automatisations"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Annuler
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:-translate-y-0.5 transition-all disabled:opacity-50"
              style={{ background: BRAND, boxShadow: `0 8px 24px ${BRAND}35` }}
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Sauvegarde…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Action picker modal ─────────────────────────────────── */}
      {showActionPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowActionPicker(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Ajouter une action</h2>
              <button
                onClick={() => setShowActionPicker(false)}
                className="text-gray-400 hover:text-gray-900"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2">
              {ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => addAction(opt.value as WorkflowAction["type"])}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-[#3F41C2] hover:bg-[#3F41C2]/5 text-left transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${opt.color}15`, color: opt.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
