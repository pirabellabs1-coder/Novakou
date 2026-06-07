"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap,
  Mail,
  Plus,
  Play,
  Pause,
  Pencil,
  Trash2,
  X,
  ShoppingCart,
  GraduationCap,
  Trash,
  BadgeCheck,
  CheckCircle2,
  HelpCircle,
  XCircle,
  UserPlus,
  Tag,
  Clock,
  History,
  PlayCircle,
  Bolt,
  MailCheck,
  Link2Off,
  Briefcase,
  Webhook,
  Network,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import IntegrationModal from "@/components/automations/IntegrationModal";
import { safeFetch } from "@/lib/safe-fetch";
import { confirmAction } from "@/store/confirm";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

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

const TRIGGER_LABELS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  PURCHASE: { label: "Après achat", icon: ShoppingCart, color: "text-emerald-700" },
  ENROLLMENT: { label: "Inscription formation", icon: GraduationCap, color: "text-blue-600" },
  CART_ABANDONED: { label: "Panier abandonné", icon: Trash, color: "text-orange-500" },
  COURSE_COMPLETED: { label: "Cours terminé", icon: BadgeCheck, color: "text-purple-600" },
  LESSON_COMPLETED: { label: "Leçon terminée", icon: CheckCircle2, color: "text-teal-600" },
  QUIZ_PASSED: { label: "Quiz réussi", icon: HelpCircle, color: "text-green-600" },
  QUIZ_FAILED: { label: "Quiz échoué", icon: XCircle, color: "text-rose-500" },
  USER_SIGNUP: { label: "Nouvelle inscription", icon: UserPlus, color: "text-indigo-600" },
  TAG_ADDED: { label: "Tag ajouté", icon: Tag, color: "text-amber-600" },
  INACTIVITY: { label: "Inactivité", icon: Clock, color: "text-slate-500" },
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

const STATUS_VARIANT: Record<string, "green" | "slate" | "orange" | "rose"> = {
  ACTIVE: "green",
  DRAFT: "slate",
  PAUSED: "orange",
  ARCHIVED: "rose",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  PAUSED: "Pausé",
  ARCHIVED: "Archivé",
};

const INTEGRATIONS: { name: string; icon: LucideIcon; bg: string; color: string; desc: string }[] = [
  { name: "Brevo", icon: Mail, bg: "bg-blue-50", color: "text-blue-700", desc: "Email marketing" },
  { name: "Make", icon: Network, bg: "bg-purple-50", color: "text-purple-700", desc: "Automatisations visuelles" },
  { name: "Zapier", icon: Bolt, bg: "bg-orange-50", color: "text-orange-600", desc: "Connectez 5000+ apps" },
  { name: "n8n", icon: Webhook, bg: "bg-rose-50", color: "text-rose-600", desc: "Open source workflows" },
  { name: "ConvertKit", icon: MailCheck, bg: "bg-pink-50", color: "text-pink-600", desc: "Email séquences" },
  { name: "Systeme.io", icon: Briefcase, bg: "bg-teal-50", color: "text-teal-600", desc: "Tout-en-un marketing" },
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
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto space-y-8">
        <KazaHero
          badge="Pro"
          badgeColor="orange"
          icon={Zap}
          title="Automatisations"
          subtitle="Automatisez chaque étape du parcours apprenant"
          actions={
            activeTab === "workflows" ? (
              <KazaButton variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                Nouveau workflow
              </KazaButton>
            ) : undefined
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <KazaKpiCard
            label="Workflows actifs"
            value={isLoading ? "…" : activeWorkflows}
            icon={Zap}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Séquences actives"
            value={isLoading ? "…" : activeSequences}
            icon={MailCheck}
            iconColor="orange"
          />
          <KazaKpiCard
            label="Exécutions totales"
            value={isLoading ? "…" : totalExecutions.toLocaleString("fr-FR")}
            icon={PlayCircle}
            iconColor="sky"
          />
        </div>

        {/* Tabs */}
        <div className="-mx-1 overflow-x-auto">
          <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-xl mx-1">
            {([
              { value: "workflows", label: "Workflows", icon: Zap },
              { value: "sequences", label: "Séquences email", icon: MailCheck },
              { value: "integrations", label: "Intégrations", icon: Network },
            ] as const).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workflows tab */}
        {activeTab === "workflows" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-slate-100 rounded w-40 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))
            ) : workflows.length === 0 ? (
              <KazaEmpty
                icon={Zap}
                title="Aucun workflow"
                description="Créez votre premier workflow pour automatiser vos actions."
                action={{ label: "Créer un workflow", onClick: () => setShowForm(true) }}
              />
            ) : (
              workflows.map((wf) => {
                const trig = TRIGGER_LABELS[wf.triggerType] ?? { label: wf.triggerType, icon: Zap, color: "text-slate-500" };
                const TrigIcon = trig.icon;
                return (
                  <div key={wf.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <TrigIcon className={`w-5 h-5 ${trig.color}`} />
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
                              className="font-bold text-slate-900 text-sm w-full bg-transparent border-b border-emerald-500 focus:outline-none px-1"
                            />
                          ) : (
                            <p className="font-bold text-slate-900 text-sm truncate">{wf.name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">Déclencheur : {trig.label}</span>
                            <span className="text-[10px] text-slate-500">·</span>
                            <span className="text-[10px] text-slate-500">{Array.isArray(wf.actions) ? wf.actions.length : 0} action{Array.isArray(wf.actions) && wf.actions.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <KazaBadge variant={STATUS_VARIANT[wf.status]}>{STATUS_LABELS[wf.status]}</KazaBadge>
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-slate-500">{wf.totalExecutions.toLocaleString("fr-FR")} exécutions</span>
                      </div>
                      {wf.lastExecutedAt && (
                        <div className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs text-slate-500">Dernière : {new Date(wf.lastExecutedAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                      <div className="ml-auto flex items-center gap-1.5">
                        {wf.status === "ACTIVE" ? (
                          <button
                            onClick={() => workflowPatch.mutate({ id: wf.id, patch: { status: "PAUSED" } })}
                            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Pauser
                          </button>
                        ) : (
                          <button
                            onClick={() => workflowPatch.mutate({ id: wf.id, patch: { status: "ACTIVE" } })}
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Activer
                          </button>
                        )}
                        <a
                          href={`/vendeur/automatisations/${wf.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Éditer
                        </a>
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
                          className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              <KazaEmpty
                icon={MailCheck}
                title="Aucune séquence email"
                description="Créez des emails automatiques pour accompagner vos apprenants."
                action={{ label: "Gérer les séquences", href: "/vendeur/marketing/sequences" }}
              />
            ) : (
              sequences.map((seq) => (
                <div key={seq.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <MailCheck className="w-5 h-5 text-orange-500" />
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
                            className="font-bold text-slate-900 text-sm w-full bg-transparent border-b border-emerald-500 focus:outline-none px-1"
                          />
                        ) : (
                          <p className="font-bold text-slate-900 text-sm truncate">{seq.name}</p>
                        )}
                        <p className="text-[10px] text-slate-500">
                          {seq._count.steps} étapes · Déclencheur : {SEQ_TRIGGER_LABELS[seq.trigger] ?? seq.trigger}
                        </p>
                      </div>
                    </div>
                    <KazaBadge variant={seq.isActive ? "green" : "slate"}>
                      {seq.isActive ? "Active" : "Inactive"}
                    </KazaBadge>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-500 flex-wrap">
                    <span>{seq.totalEnrolled.toLocaleString("fr-FR")} abonnés</span>
                    <span>{seq.totalCompleted.toLocaleString("fr-FR")} complétées</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => sequencePatch.mutate({ id: seq.id, patch: { isActive: !seq.isActive } })}
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                          seq.isActive
                            ? "text-amber-700 hover:bg-amber-50"
                            : "text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {seq.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {seq.isActive ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => startEdit(seq)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
                        className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                const Icon = intg.icon;
                return (
                  <div key={intg.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${intg.bg}`}>
                        <Icon className={`w-5 h-5 ${intg.color}`} />
                      </div>
                      <KazaBadge variant={connected ? "green" : "slate"}>
                        {connected ? "Connecté" : "Non connecté"}
                      </KazaBadge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{intg.name}</h3>
                    <p className="text-[11px] text-slate-500 mb-4">{intg.desc}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => providerKey && setIntegrationModal(providerKey)}
                        disabled={!providerKey}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          connected
                            ? "bg-emerald-700 text-white hover:bg-emerald-800"
                            : "border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700"
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
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                        >
                          <Link2Off className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <KazaCard className="mt-6" variant="ghost">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Webhook className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Webhooks Temps Réel</h3>
                  <p className="text-[11px] text-slate-500">Recevez les événements de votre boutique dans n&apos;importe quelle application</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 tabular-nums text-xs text-slate-500 mb-4">
                <span className="text-emerald-700">POST</span> https://votre-app.com/webhook<br />
                <span className="text-slate-500">{"{"} event: &quot;sale.completed&quot;, amount: 25000, ... {"}"}</span>
              </div>
              <KazaButton variant="primary" icon={Plus} href="/vendeur/api-keys">
                Configurer un webhook
              </KazaButton>
            </KazaCard>
          </div>
        )}

        {/* Create workflow modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">Nouveau workflow</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Nom du workflow *</label>
                  <input
                    type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Email de bienvenue après achat"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Déclencheur *</label>
                  <select
                    value={form.triggerType} onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {Object.entries(TRIGGER_LABELS).map(([key, t]) => (
                      <option key={key} value={key}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description (optionnel)</label>
                  <textarea
                    value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez ce que fait ce workflow"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-0.5">Note</p>
                  <p className="text-[11px] text-amber-700">
                    Vous pourrez configurer les actions (envoyer email, ajouter tag, webhook…) après la création du workflow.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <KazaButton variant="ghost" onClick={() => setShowForm(false)} className="flex-1">
                  Annuler
                </KazaButton>
                <KazaButton
                  variant="primary"
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.name || createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? "Création…" : "Créer le workflow"}
                </KazaButton>
              </div>
            </div>
          </div>
        )}

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
      </main>
    </div>
  );
}
