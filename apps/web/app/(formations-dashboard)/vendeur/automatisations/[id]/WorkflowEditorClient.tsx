"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Package,
  X,
  Search,
  Check,
  Zap,
  Clock,
  Trash2,
  Plus,
  Loader2,
  Save,
  ShoppingCart,
  CreditCard,
  GraduationCap,
  BadgeCheck,
  CheckCircle2,
  UserPlus,
  Tag,
  Mail,
  Split,
  Webhook,
  type LucideIcon,
} from "lucide-react";
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
interface CatalogItem {
  id: string;
  title: string;
  slug: string;
  kind: "formation" | "product";
  image?: string | null;
  price?: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  actions: WorkflowAction[];
  productId?: string | null;
  triggerConfig?: { productIds?: string[] } | null;
}

// ─── Trigger options ──────────────────────────────────────────────────────────
const TRIGGER_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "PURCHASE", label: "Vente effectuée", icon: ShoppingCart },
  { value: "CART_ABANDONED", label: "Panier abandonné", icon: ShoppingCart },
  { value: "PAYMENT_FAILED", label: "Paiement échoué", icon: CreditCard },
  { value: "ENROLLMENT", label: "Inscription formation", icon: GraduationCap },
  { value: "COURSE_COMPLETED", label: "Cours terminé", icon: BadgeCheck },
  { value: "LESSON_COMPLETED", label: "Leçon terminée", icon: CheckCircle2 },
  { value: "USER_SIGNUP", label: "Nouvelle inscription", icon: UserPlus },
  { value: "INACTIVITY", label: "Inactivité", icon: Clock },
  { value: "TAG_ADDED", label: "Tag ajouté", icon: Tag },
];

// ─── Action picker options ────────────────────────────────────────────────────
const ACTION_OPTIONS: Array<{
  value: ActionType;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  description: string;
}> = [
  {
    value: "SEND_EMAIL",
    label: "Envoyer un email",
    icon: Mail,
    color: "text-[#006e2f]",
    bg: "bg-[#006e2f]/10",
    description: "Email transactionnel avec corps HTML personnalisé",
  },
  {
    value: "ADD_TAG",
    label: "Ajouter un tag",
    icon: Tag,
    color: "text-[#006e2f]",
    bg: "bg-[#006e2f]/10",
    description: "Segmenter le client selon son comportement",
  },
  {
    value: "ENROLL_SEQUENCE",
    label: "Démarrer une séquence",
    icon: Split,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    description: "Inscrire le client à une séquence email",
  },
  {
    value: "WEBHOOK",
    label: "Déclencher un webhook",
    icon: Webhook,
    color: "text-amber-600",
    bg: "bg-amber-100",
    description: "Envoyer les données vers n8n, Make, Zapier…",
  },
  {
    value: "WAIT",
    label: "Attendre un délai",
    icon: Clock,
    color: "text-gray-600",
    bg: "bg-gray-100",
    description: "Pause avant la prochaine action",
  },
];

// ─── Product multi-select dropdown ────────────────────────────────────────────
function ProductMultiSelect({
  values,
  onChange,
}: {
  values: string[];
  onChange: (productIds: string[]) => void;
}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/formations/vendeur/catalog");
        const json = await res.json();
        if (!cancelled) setItems(Array.isArray(json.data) ? json.data : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectedItems = items.filter((i) => values.includes(i.id));
  const filtered = query.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  function toggle(id: string) {
    if (values.includes(id)) onChange(values.filter((v) => v !== id));
    else onChange([...values, id]);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-left hover:border-[#006e2f] transition-colors"
      >
        <Package size={18} className="text-gray-400" />
        <span className="flex-1 text-sm text-gray-900 truncate">
          {selectedItems.length === 0
            ? "Tous mes produits (choisir pour filtrer)"
            : selectedItems.length === 1
              ? selectedItems[0].title
              : `${selectedItems.length} produits sélectionnés`}
        </span>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedItems.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px] font-medium rounded-full bg-[#006e2f]/10 text-[#006e2f]"
            >
              <span className="truncate max-w-[140px]">{p.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(p.id);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#006e2f]/20"
                aria-label={`Retirer ${p.title}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-gray-400 hover:text-red-500 px-2"
          >
            Tout effacer
          </button>
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer…"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#006e2f]"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                {items.length === 0 ? "Aucun produit — créez-en d'abord." : "Aucun résultat"}
              </div>
            ) : (
              filtered.map((p) => {
                const checked = values.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 ${checked ? "bg-[#006e2f]/5" : ""}`}
                  >
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? "bg-[#006e2f] border-[#006e2f]" : "border-gray-300"}`}
                    >
                      {checked && <Check size={12} className="text-white" />}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${p.kind === "formation" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {p.kind === "formation" ? "Formation" : "Produit"}
                    </span>
                    <span className="text-sm text-gray-900 truncate flex-1">{p.title}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
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
          fromName: "Novakou",
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
          triggerConfig: workflow.triggerConfig ?? null,
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
          href="/vendeur/automatisations"
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
          <Link href="/vendeur/automatisations" className="hover:text-[#006e2f]">
            Automatisations
          </Link>
          <ChevronRight size={14} />
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
                  <Zap size={20} />
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
                  Produits concernés (optionnel)
                </label>
                <ProductMultiSelect
                  values={workflow.triggerConfig?.productIds ?? []}
                  onChange={(ids) =>
                    updateLocal({
                      triggerConfig: { ...(workflow.triggerConfig ?? {}), productIds: ids },
                    })
                  }
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Laissez vide pour déclencher le workflow sur toutes les ventes.
                </p>
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
                      <Clock size={20} />
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
                      <Trash2 size={18} />
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
              <Plus size={22} />
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
              href="/vendeur/automatisations"
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
                  <Loader2 size={18} className="animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  <Save size={18} />
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
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2">
              {ACTION_OPTIONS.map((opt) => {
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => openAddAction(opt.value)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-[#006e2f] hover:bg-[#006e2f]/5 text-left transition-all"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.bg} ${opt.color}`}
                    >
                      <OptIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-[11px] text-gray-500">{opt.description}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                );
              })}
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
