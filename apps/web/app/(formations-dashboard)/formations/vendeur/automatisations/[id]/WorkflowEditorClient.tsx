"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/toast";

import type {
  WorkflowAction,
  ActionType,
  EmailAction,
  TagAction,
  SequenceAction,
  WebhookAction,
  WaitAction,
} from "@/components/automations/types";
import { WEBHOOK_FIELDS } from "@/components/automations/types";
import ActionCard from "@/components/automations/ActionCard";
import ActionEmailModal from "@/components/automations/ActionEmailModal";
import ActionTagModal from "@/components/automations/ActionTagModal";
import ActionSequenceModal from "@/components/automations/ActionSequenceModal";
import ActionWebhookModal from "@/components/automations/ActionWebhookModal";

const BRAND = "#006e2f";
const BRAND_SOFT = "#006e2f26";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  title: string;
  slug: string;
  kind: "formation" | "product";
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
  { value: "TAG_ADDED", label: "Tag ajouté", icon: "label" },
];

// ─── Action picker options ────────────────────────────────────────────────────
const ACTION_OPTIONS: Array<{
  value: ActionType;
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}> = [
  {
    value: "SEND_EMAIL",
    label: "Envoyer un email",
    icon: "mail",
    color: "text-[#006e2f]",
    bg: "bg-[#006e2f]/10",
    description: "Email transactionnel avec corps HTML personnalisé",
  },
  {
    value: "ADD_TAG",
    label: "Ajouter un tag",
    icon: "label",
    color: "text-violet-600",
    bg: "bg-violet-100",
    description: "Segmenter le client selon son comportement",
  },
  {
    value: "ENROLL_SEQUENCE",
    label: "Démarrer une séquence",
    icon: "alt_route",
    color: "text-pink-600",
    bg: "bg-pink-100",
    description: "Inscrire le client à une séquence email",
  },
  {
    value: "WEBHOOK",
    label: "Déclencher un webhook",
    icon: "webhook",
    color: "text-amber-600",
    bg: "bg-amber-100",
    description: "Envoyer les données vers n8n, Make, Zapier…",
  },
  {
    value: "WAIT",
    label: "Attendre un délai",
    icon: "schedule",
    color: "text-gray-600",
    bg: "bg-gray-100",
    description: "Pause avant la prochaine action",
  },
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
            />
          </div>
          {open && query.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">Recherche…</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">Aucun résultat</div>
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

// ─── Blank action factory ─────────────────────────────────────────────────────
function blankAction(type: ActionType): WorkflowAction {
  const id = `a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  switch (type) {
    case "SEND_EMAIL":
      return {
        id,
        type: "SEND_EMAIL",
        config: {
          to: "{{customer.email}}",
          subject: "",
          body: "",
          fromName: "FreelanceHigh",
          replyTo: "",
          delayMinutes: 0,
        },
      };
    case "ADD_TAG":
      return {
        id,
        type: "ADD_TAG",
        config: { tagName: "", audienceType: "all", productIds: [] },
      };
    case "ENROLL_SEQUENCE":
      return { id, type: "ENROLL_SEQUENCE", config: { sequenceId: "" } };
    case "WEBHOOK":
      return {
        id,
        type: "WEBHOOK",
        config: {
          url: "",
          method: "POST",
          headers: [],
          selectedFields: WEBHOOK_FIELDS.flatMap((g) =>
            g.fields.filter((f) => f.defaultOn).map((f) => f.key)
          ),
        },
      };
    case "WAIT":
      return { id, type: "WAIT", config: { hours: 1 } };
  }
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
export default function WorkflowEditorClient({ id }: { id: string }) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Picker + editing state
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [editingAction, setEditingAction] = useState<{
    action: WorkflowAction;
    index: number;
    isNew: boolean;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { safeJson } = await import("@/lib/safe-fetch");
        const res = await fetch(`/api/formations/vendeur/automatisations/${id}`);
        const { ok, data } = await safeJson<{ data: Workflow }>(res);
        if (ok && data?.data) {
          const wf = data.data;
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

  function openAddAction(type: ActionType) {
    const newAction = blankAction(type);
    setShowActionPicker(false);
    if (type === "WAIT") {
      // No modal for WAIT — just insert with default
      if (!workflow) return;
      updateLocal({ actions: [...workflow.actions, newAction] });
      return;
    }
    setEditingAction({
      action: newAction,
      index: workflow?.actions.length ?? 0,
      isNew: true,
    });
  }

  function openEditAction(action: WorkflowAction, index: number) {
    setEditingAction({ action, index, isNew: false });
  }

  function saveAction(updated: WorkflowAction) {
    if (!workflow || !editingAction) return;
    const next = [...workflow.actions];
    if (editingAction.isNew) {
      next.push(updated);
    } else {
      next[editingAction.index] = updated;
    }
    updateLocal({ actions: next });
    setEditingAction(null);
  }

  function deleteAction(idx: number) {
    if (!workflow) return;
    updateLocal({ actions: workflow.actions.filter((_, i) => i !== idx) });
  }

  function updateWaitHours(idx: number, hours: number) {
    if (!workflow) return;
    const next = [...workflow.actions];
    const current = next[idx];
    if (current.type === "WAIT") {
      next[idx] = { ...current, config: { hours: Math.max(1, hours) } };
      updateLocal({ actions: next });
    }
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
      useToastStore.getState().addToast("success", "Workflow sauvegardé");
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
      useToastStore
        .getState()
        .addToast("success", newStatus === "ACTIVE" ? "Workflow activé" : "Workflow désactivé");
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
        <Link
          href="/formations/vendeur/automatisations"
          className="text-[#006e2f] text-sm mt-3 inline-block"
        >
          ← Retour
        </Link>
      </div>
    );
  }

  const trigger = TRIGGER_OPTIONS.find((t) => t.value === workflow.triggerType) ?? TRIGGER_OPTIONS[0];

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ fontFamily: "Inter, 'Helvetica Neue', sans-serif" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/formations/vendeur/automatisations" className="hover:text-[#006e2f]">
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

          <button
            onClick={toggleActive}
            className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${
              workflow.status === "ACTIVE" ? "" : "bg-gray-200"
            }`}
            style={workflow.status === "ACTIVE" ? { background: BRAND } : {}}
            title={
              workflow.status === "ACTIVE"
                ? "Actif — cliquer pour désactiver"
                : "Désactivé — cliquer pour activer"
            }
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
            <div
              className="bg-white rounded-2xl border-2 shadow-sm p-5"
              style={{ borderColor: BRAND }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: BRAND }}
                >
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
                <div className="flex-1">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: BRAND }}
                  >
                    Déclencheur
                  </p>
                  <p className="text-sm font-bold text-gray-900">{trigger.label}</p>
                </div>
              </div>
              <select
                value={workflow.triggerType}
                onChange={(e) => updateLocal({ triggerType: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#006e2f]"
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
              <div
                className="w-px h-10 my-1"
                style={{
                  backgroundImage: `linear-gradient(to bottom, ${BRAND_SOFT} 50%, transparent 0%)`,
                  backgroundPosition: "right",
                  backgroundSize: "2px 8px",
                  backgroundRepeat: "repeat-y",
                }}
              />
              {action.type === "WAIT" ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 w-full max-w-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Action {idx + 1} · Attendre
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={action.config.hours}
                          min={1}
                          onChange={(e) => updateWaitHours(idx, Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
                        />
                        <span className="text-sm text-gray-600">heure(s)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAction(idx)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <ActionCard
                  action={action}
                  index={idx}
                  onEdit={() => openEditAction(action, idx)}
                  onDelete={() => deleteAction(idx)}
                />
              )}
            </div>
          ))}

          {/* + button */}
          <div className="flex flex-col items-center mt-2">
            <div
              className="w-px h-10 my-1"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${BRAND_SOFT} 50%, transparent 0%)`,
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
            {workflow.actions.length} action{workflow.actions.length !== 1 ? "s" : ""} configurée
            {workflow.actions.length !== 1 ? "s" : ""}
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
              style={{
                background: `linear-gradient(to right, ${BRAND}, #22c55e)`,
                boxShadow: `0 8px 24px ${BRAND}35`,
              }}
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
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
                  onClick={() => openAddAction(opt.value)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-[#006e2f] hover:bg-[#006e2f]/5 text-left transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.bg} ${opt.color}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-[11px] text-gray-500">{opt.description}</p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-gray-400">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Configuration modals per action type ──────────────────── */}
      {editingAction?.action.type === "SEND_EMAIL" && (
        <ActionEmailModal
          action={editingAction.action as EmailAction}
          onSave={(a) => saveAction(a)}
          onCancel={() => setEditingAction(null)}
        />
      )}
      {editingAction?.action.type === "ADD_TAG" && (
        <ActionTagModal
          action={editingAction.action as TagAction}
          onSave={(a) => saveAction(a)}
          onCancel={() => setEditingAction(null)}
        />
      )}
      {editingAction?.action.type === "ENROLL_SEQUENCE" && (
        <ActionSequenceModal
          action={editingAction.action as SequenceAction}
          onSave={(a) => saveAction(a)}
          onCancel={() => setEditingAction(null)}
        />
      )}
      {editingAction?.action.type === "WEBHOOK" && (
        <ActionWebhookModal
          action={editingAction.action as WebhookAction}
          onSave={(a) => saveAction(a)}
          onCancel={() => setEditingAction(null)}
        />
      )}
    </div>
  );
}
