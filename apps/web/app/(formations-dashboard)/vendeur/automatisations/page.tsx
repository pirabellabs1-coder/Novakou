"use client";
import { useToastStore } from "@/store/toast";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import IntegrationModal from "@/components/automations/IntegrationModal";
import { safeFetch } from "@/lib/safe-fetch";
import { confirmAction } from "@/store/confirm";

type IntegrationRow = {
  id: string;
  provider: "brevo" | "make" | "zapier" | "n8n" | "convertkit" | "systemeio";
  connected: boolean;
  webhookUrl?: string | null;
  lastSyncAt?: string | null;
};

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  triggerType: string;
  actions: unknown[];
  totalExecutions: number;
  lastExecutedAt: string | null;
  createdAt: string;
  _count: { logs: number };
};

type EmailSequence = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  createdAt: string;
  _count: { steps: number; enrollments: number };
};

const TRIGGER_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  PURCHASE: { label: "Après achat", icon: "shopping_cart", color: "text-[#006e2f]" },
  ENROLLMENT: { label: "Inscription formation", icon: "school", color: "text-blue-600" },
  CART_ABANDONED: { label: "Panier abandonné", icon: "remove_shopping_cart", color: "text-orange-500" },
  COURSE_COMPLETED: { label: "Cours terminé", icon: "verified", color: "text-purple-600" },
  LESSON_COMPLETED: { label: "Leçon terminée", icon: "check_circle", color: "text-teal-600" },
  QUIZ_PASSED: { label: "Quiz réussi", icon: "quiz", color: "text-green-600" },
  QUIZ_FAILED: { label: "Quiz échoué", icon: "cancel", color: "text-red-500" },
  USER_SIGNUP: { label: "Nouvelle inscription", icon: "person_add", color: "text-indigo-600" },
  TAG_ADDED: { label: "Tag ajouté", icon: "label", color: "text-amber-600" },
  INACTIVITY: { label: "Inactivité", icon: "schedule", color: "text-gray-500" },
};

const SEQ_TRIGGER_LABELS: Record<string, string> = {
  PURCHASE: "Après achat",
  ENROLLMENT: "Inscription",
  ABANDONED_CART: "Panier abandonné",
  USER_INACTIVITY: "Inactivité",
  COURSE_COMPLETION: "Cours terminé",
  SIGNUP: "Inscription liste",
  MANUAL: "Manuel",
  TAG_ADDED: "Tag ajouté",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ACTIVE: { bg: "bg-[#006e2f]/10", text: "text-[#006e2f]", dot: "bg-[#006e2f]", label: "Actif" },
  DRAFT: { bg: "bg-gray-100", text: "text-[#5c647a]", dot: "bg-gray-400", label: "Brouillon" },
  PAUSED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "Pausé" },
  ARCHIVED: { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-400", label: "Archivé" },
};

const INTEGRATIONS = [
  { name: "Brevo", icon: "mail", bg: "bg-blue-50", color: "text-blue-700", desc: "Email marketing", connected: false },
  { name: "Make", icon: "hub", bg: "bg-purple-50", color: "text-purple-700", desc: "Automatisations visuelles", connected: false },
  { name: "Zapier", icon: "bolt", bg: "bg-orange-50", color: "text-orange-600", desc: "Connectez 5000+ apps", connected: false },
  { name: "n8n", icon: "account_tree", bg: "bg-red-50", color: "text-red-600", desc: "Open source workflows", connected: false },
  { name: "ConvertKit", icon: "mark_email_read", bg: "bg-pink-50", color: "text-pink-600", desc: "Email séquences", connected: false },
  { name: "Systeme.io", icon: "business_center", bg: "bg-teal-50", color: "text-teal-600", desc: "Tout-en-un marketing", connected: false },
];

type AutoData = { workflows: Workflow[]; sequences: EmailSequence[] };

export default function AutomationsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"workflows" | "sequences" | "integrations">("workflows");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", triggerType: "PURCHASE" });
  const [integrationModal, setIntegrationModal] = useState<IntegrationRow["provider"] | null>(null);

  const { data: integrationsResp } = useQuery<{ data: IntegrationRow[] }>({
    queryKey: ["vendeur-integrations"],
    queryFn: async () => {
      const r = await safeFetch<{ data: IntegrationRow[] }>(
        "/api/formations/vendeur/integrations",
      );
      return r.data ?? { data: [] };
    },
    staleTime: 30_000,
  });
  const integrations = integrationsResp?.data ?? [];
  const byProvider = (p: string) => integrations.find((i) => i.provider === p);

  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(
        `/api/formations/vendeur/integrations?provider=${encodeURIComponent(provider)}`,
        { method: "DELETE" },
      );
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-integrations"] });
      useToastStore.getState().addToast("success", "Intégration déconnectée");
    },
  });

  const { data: response, isLoading } = useQuery<{ data: AutoData }>({
    queryKey: ["vendeur-automatisations"],
    queryFn: () => fetch("/api/formations/vendeur/automatisations").then((r) => r.json()),
    staleTime: 30_000,
  });

  const d = response?.data;
  const workflows = d?.workflows ?? [];
  const sequences = d?.sequences ?? [];

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/formations/vendeur/automatisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, actions: [] }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-automatisations"] });
      useToastStore.getState().addToast("success", "Workflow créé");
      setShowForm(false);
      setForm({ name: "", description: "", triggerType: "PURCHASE" });
    },
  });

  // ── Workflow actions ─────────────────────────────────────────────────
  const workflowPatch = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      fetch(`/api/formations/vendeur/automatisations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-automatisations"] });
    },
  });

  const workflowDelete = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/formations/vendeur/automatisations/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-automatisations"] });
      useToastStore.getState().addToast("success", "Workflow supprimé");
    },
  });

  // ── Sequence actions ─────────────────────────────────────────────────
  const sequencePatch = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      fetch(`/api/formations/vendeur/marketing/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-automatisations"] });
    },
  });

  const sequenceDelete = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/formations/vendeur/marketing/sequences/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-automatisations"] });
      useToastStore.getState().addToast("success", "Séquence supprimée");
    },
  });

  // ── Inline rename state (for workflow / sequence) ────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function startEdit(item: { id: string; name: string }) {
    setEditingId(item.id);
    setEditingName(item.name);
  }
  function commitEdit(kind: "workflow" | "sequence") {
    if (!editingId || !editingName.trim()) { setEditingId(null); return; }
    const mutation = kind === "workflow" ? workflowPatch : sequencePatch;
    mutation.mutate({ id: editingId, patch: { name: editingName.trim() } });
    setEditingId(null);
  }

  const activeWorkflows = workflows.filter((w) => w.status === "ACTIVE").length;
  const activeSequences = sequences.filter((s) => s.isActive).length;
  const totalExecutions = workflows.reduce((s, w) => s + w.totalExecutions, 0);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Automatisations</h1>
          <p className="text-sm text-[#5c647a] mt-1">Automatisez chaque étape du parcours apprenant</p>
        </div>
        {activeTab === "workflows" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nouveau workflow
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Workflows actifs", value: activeWorkflows, icon: "bolt", color: "text-[#006e2f]", bg: "bg-[#006e2f]/10" },
          { label: "Séquences actives", value: activeSequences, icon: "mark_email_read", color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Exécutions totales", value: totalExecutions.toLocaleString("fr-FR"), icon: "play_circle", color: "text-blue-600", bg: "bg-blue-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{kpi.icon}</span>
            </div>
            <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#191c1e] mt-0.5">{isLoading ? "…" : kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([
          { value: "workflows", label: "Workflows", icon: "bolt" },
          { value: "sequences", label: "Séquences email", icon: "mark_email_read" },
          { value: "integrations", label: "Intégrations", icon: "hub" },
        ] as const).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.value ? "bg-white text-[#191c1e] shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workflows tab */}
      {activeTab === "workflows" && (
        <div className="space-y-3">
          {isLoading ? (
            [0, 1].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-40 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                </div>
              </div>
            ))
          ) : workflows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#006e2f]/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <p className="font-semibold text-[#191c1e]">Aucun workflow</p>
              <p className="text-sm text-[#5c647a] mt-1 mb-4">Créez votre premier workflow pour automatiser vos actions</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Créer un workflow
              </button>
            </div>
          ) : (
            workflows.map((wf) => {
              const trig = TRIGGER_LABELS[wf.triggerType] ?? { label: wf.triggerType, icon: "bolt", color: "text-gray-500" };
              const st = STATUS_STYLES[wf.status] ?? STATUS_STYLES.DRAFT;
              return (
                <div key={wf.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                        <span className={`material-symbols-outlined text-[20px] ${trig.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{trig.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingId === wf.id ? (
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => commitEdit("workflow")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit("workflow");
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="font-bold text-[#191c1e] text-sm w-full bg-transparent border-b border-[#006e2f] focus:outline-none px-1"
                          />
                        ) : (
                          <p className="font-bold text-[#191c1e] text-sm truncate">{wf.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#5c647a]">Déclencheur : {trig.label}</span>
                          <span className="text-[10px] text-[#5c647a]">·</span>
                          <span className="text-[10px] text-[#5c647a]">{Array.isArray(wf.actions) ? wf.actions.length : 0} action{Array.isArray(wf.actions) && wf.actions.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#5c647a]">play_circle</span>
                      <span className="text-xs text-[#5c647a]">{wf.totalExecutions.toLocaleString("fr-FR")} exécutions</span>
                    </div>
                    {wf.lastExecutedAt && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#5c647a]">history</span>
                        <span className="text-xs text-[#5c647a]">Dernière : {new Date(wf.lastExecutedAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      {/* Toggle Actif/Brouillon */}
                      {wf.status === "ACTIVE" ? (
                        <button
                          onClick={() => workflowPatch.mutate({ id: wf.id, patch: { status: "PAUSED" } })}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                          title="Mettre en pause"
                        >
                          <span className="material-symbols-outlined text-[14px]">pause</span>
                          Pauser
                        </button>
                      ) : (
                        <button
                          onClick={() => workflowPatch.mutate({ id: wf.id, patch: { status: "ACTIVE" } })}
                          className="flex items-center gap-1 text-xs font-semibold text-[#006e2f] hover:bg-[#006e2f]/10 px-2 py-1 rounded-lg transition-colors"
                          title="Activer ce workflow"
                        >
                          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                          Activer
                        </button>
                      )}
                      {/* Edit in full visual editor */}
                      <a
                        href={`/vendeur/automatisations/${wf.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-[#191c1e] hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                        title="Éditer le workflow"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Éditer
                      </a>
                      {/* Delete */}
                      <button
                        onClick={async () => {
                          const ok = await confirmAction({
                            title: `Supprimer le workflow "${wf.name}" ?`,
                            message: "Cette action est irréversible.",
                            confirmLabel: "Supprimer",
                            confirmVariant: "danger",
                            icon: "delete",
                          });
                          if (ok) workflowDelete.mutate(wf.id);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sequences tab */}
      {activeTab === "sequences" && (
        <div className="space-y-3">
          {sequences.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px] text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
              </div>
              <p className="font-semibold text-[#191c1e]">Aucune séquence email</p>
              <p className="text-sm text-[#5c647a] mt-1 mb-4">Créez des emails automatiques pour accompagner vos apprenants</p>
              <a
                href="/vendeur/marketing/sequences"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                Gérer les séquences
              </a>
            </div>
          ) : (
            sequences.map((seq) => (
              <div key={seq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingId === seq.id ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => commitEdit("sequence")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit("sequence");
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="font-bold text-[#191c1e] text-sm w-full bg-transparent border-b border-[#006e2f] focus:outline-none px-1"
                        />
                      ) : (
                        <p className="font-bold text-[#191c1e] text-sm truncate">{seq.name}</p>
                      )}
                      <p className="text-[10px] text-[#5c647a]">
                        {seq._count.steps} étapes · Déclencheur : {SEQ_TRIGGER_LABELS[seq.trigger] ?? seq.trigger}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${seq.isActive ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a]"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${seq.isActive ? "bg-[#006e2f]" : "bg-gray-300"}`} />
                    {seq.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50 text-xs text-[#5c647a] flex-wrap">
                  <span>{seq.totalEnrolled.toLocaleString("fr-FR")} abonnés</span>
                  <span>{seq.totalCompleted.toLocaleString("fr-FR")} complétées</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {/* Toggle */}
                    <button
                      onClick={() => sequencePatch.mutate({ id: seq.id, patch: { isActive: !seq.isActive } })}
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                        seq.isActive
                          ? "text-amber-700 hover:bg-amber-50"
                          : "text-[#006e2f] hover:bg-[#006e2f]/10"
                      }`}
                      title={seq.isActive ? "Désactiver" : "Activer"}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {seq.isActive ? "pause" : "play_arrow"}
                      </span>
                      {seq.isActive ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      onClick={() => startEdit(seq)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#191c1e] hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                      title="Renommer"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Éditer
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirmAction({
                          title: `Supprimer la séquence "${seq.name}" ?`,
                          message: "Cette action est irréversible.",
                          confirmLabel: "Supprimer",
                          confirmVariant: "danger",
                          icon: "delete",
                        });
                        if (ok) sequenceDelete.mutate(seq.id);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Integrations tab */}
      {activeTab === "integrations" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((intg) => {
              const providerKey = ({
                Brevo: "brevo",
                Make: "make",
                Zapier: "zapier",
                n8n: "n8n",
                ConvertKit: "convertkit",
                "Systeme.io": "systemeio",
              } as Record<string, IntegrationRow["provider"]>)[intg.name];
              const row = providerKey ? byProvider(providerKey) : undefined;
              const connected = !!row?.connected;
              return (
                <div key={intg.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${intg.bg}`}>
                      <span className={`material-symbols-outlined text-[22px] ${intg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{intg.icon}</span>
                    </div>
                    {connected ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006e2f]" />Connecté
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">Non connecté</span>
                    )}
                  </div>
                  <h3 className="font-bold text-[#191c1e] text-sm mb-1">{intg.name}</h3>
                  <p className="text-[11px] text-[#5c647a] mb-4">{intg.desc}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => providerKey && setIntegrationModal(providerKey)}
                      disabled={!providerKey}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                        connected
                          ? "bg-[#006e2f] text-white hover:bg-[#006e2f]/90"
                          : "border border-gray-200 text-[#5c647a] hover:bg-gray-50 hover:border-[#006e2f]/30 hover:text-[#006e2f]"
                      }`}
                    >
                      {connected ? "Reconfigurer" : "Connecter"}
                    </button>
                    {connected && providerKey && (
                      <button
                        onClick={async () => {
                          const ok = await confirmAction({
                            title: `Déconnecter ${intg.name} ?`,
                            message: "L'intégration sera désactivée et les webhooks ne seront plus envoyés.",
                            confirmLabel: "Déconnecter",
                            confirmVariant: "danger",
                            icon: "link_off",
                          });
                          if (ok) {
                            disconnectMutation.mutate(providerKey);
                          }
                        }}
                        disabled={disconnectMutation.isPending}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        title="Déconnecter"
                      >
                        <span className="material-symbols-outlined text-[14px]">link_off</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Webhooks section */}
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-[#191c1e]">webhook</span>
              </div>
              <div>
                <h3 className="font-bold text-[#191c1e] text-sm">Webhooks Temps Réel</h3>
                <p className="text-[11px] text-[#5c647a]">Recevez les événements de votre boutique dans n'importe quelle application</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 tabular-nums text-xs text-[#5c647a] mb-4">
              <span className="text-[#006e2f]">POST</span> https://votre-app.com/webhook<br />
              <span className="text-[#5c647a]">{"{"} event: "sale.completed", amount: 25000, ... {"}"}</span>
            </div>
            <Link
              href="/vendeur/api-keys"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Configurer un webhook
            </Link>
          </div>
        </div>
      )}

      {/* Create workflow modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Nouveau workflow</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Nom du workflow *</label>
                <input
                  type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Email de bienvenue après achat"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Déclencheur *</label>
                <select
                  value={form.triggerType} onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 bg-white"
                >
                  {Object.entries(TRIGGER_LABELS).map(([key, t]) => (
                    <option key={key} value={key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Description (optionnel)</label>
                <textarea
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez ce que fait ce workflow"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 resize-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-0.5">Note</p>
                <p className="text-[11px] text-amber-700">
                  Vous pourrez configurer les actions (envoyer email, ajouter tag, webhook...) après la création du workflow.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || createMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {createMutation.isPending ? "Création…" : "Créer le workflow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration connection modal */}
      {integrationModal && (
        <IntegrationModal
          provider={integrationModal}
          currentWebhook={byProvider(integrationModal)?.webhookUrl ?? null}
          onSave={() => {
            setIntegrationModal(null);
            qc.invalidateQueries({ queryKey: ["vendeur-integrations"] });
          }}
          onClose={() => setIntegrationModal(null)}
        />
      )}
    </div>
  );
}
