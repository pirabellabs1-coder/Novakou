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
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StKpiCompact,
  ST,
} from "@/components/stitch";

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
  // Clé alignée sur l'enum Prisma AutomationTriggerType (USER_INACTIVE), sinon
  // la création échoue en 500 sur la colonne enum.
  USER_INACTIVE: { label: "Inactivité", icon: Clock, color: "text-slate-500" },
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

const STATUS_VARIANT: Record<string, "green" | "neutral" | "amber" | "rose"> = {
  ACTIVE: "green",
  DRAFT: "neutral",
  PAUSED: "amber",
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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StPageHeader
          title="Automatisations"
          subtitle="Automatisez chaque étape du parcours apprenant"
          actions={
            activeTab === "workflows" ? (
              <StButton icon={Plus} onClick={() => setShowForm(true)}>
                Nouveau workflow
              </StButton>
            ) : undefined
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact
            label="Workflows actifs"
            value={isLoading ? "…" : activeWorkflows}
            icon={Zap}
            tone="green"
          />
          <StKpiCompact
            label="Séquences actives"
            value={isLoading ? "…" : activeSequences}
            icon={MailCheck}
            tone="amber"
          />
          <StKpiCompact
            label="Exécutions totales"
            value={isLoading ? "…" : totalExecutions.toLocaleString("fr-FR")}
            icon={PlayCircle}
            tone="blue"
          />
        </div>

        {/* Tabs */}
        <div className="-mx-1 overflow-x-auto mb-4">
          <div className="inline-flex gap-1 bg-white p-1 rounded-[13px] mx-1" style={{ border: `1px solid ${ST.cardBorder}` }}>
            {([
              { value: "workflows", label: "Workflows", icon: Zap },
              { value: "sequences", label: "Séquences email", icon: MailCheck },
              { value: "integrations", label: "Intégrations", icon: Network },
            ] as const).map((tab) => {
              const TabIcon = tab.icon;
              const on = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                  style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
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
                <StCard key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px]" style={{ background: "#eef2ef" }} />
                    <div className="flex-1">
                      <div className="h-4 rounded w-40 mb-1" style={{ background: "#eef2ef" }} />
                      <div className="h-3 rounded w-24" style={{ background: "#eef2ef" }} />
                    </div>
                  </div>
                </StCard>
              ))
            ) : workflows.length === 0 ? (
              <StCard className="text-center py-12">
                <Zap size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
                <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>Aucun workflow</h3>
                <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                  Créez votre premier workflow pour automatiser vos actions.
                </p>
                <div className="mt-4 flex justify-center">
                  <StButton onClick={() => setShowForm(true)} icon={Plus}>Créer un workflow</StButton>
                </div>
              </StCard>
            ) : (
              workflows.map((wf) => {
                const trig = TRIGGER_LABELS[wf.triggerType] ?? { label: wf.triggerType, icon: Zap, color: "text-slate-500" };
                const TrigIcon = trig.icon;
                return (
                  <StCard key={wf.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: ST.greenSoft }}>
                          <TrigIcon className="w-5 h-5" style={{ color: ST.green }} />
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
                              className="font-extrabold text-[13px] w-full bg-transparent focus:outline-none px-1"
                              style={{ color: ST.text, borderBottom: `1px solid ${ST.greenBright}` }}
                            />
                          ) : (
                            <p className="font-extrabold text-[13px] truncate" style={{ color: ST.text }}>{wf.name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>Déclencheur : {trig.label}</span>
                            <span className="text-[10.5px]" style={{ color: ST.textFaint }}>·</span>
                            <span className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>{Array.isArray(wf.actions) ? wf.actions.length : 0} action{Array.isArray(wf.actions) && wf.actions.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <StChip tone={STATUS_VARIANT[wf.status]}>{STATUS_LABELS[wf.status]}</StChip>
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-3 flex-wrap" style={{ borderTop: `1px solid ${ST.divider}` }}>
                      <div className="flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5" style={{ color: ST.textMuted }} />
                        <span className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>{wf.totalExecutions.toLocaleString("fr-FR")} exécutions</span>
                      </div>
                      {wf.lastExecutedAt && (
                        <div className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" style={{ color: ST.textMuted }} />
                          <span className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>Dernière : {new Date(wf.lastExecutedAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                      <div className="ml-auto flex items-center gap-1.5">
                        {wf.status === "ACTIVE" ? (
                          <button
                            onClick={() => workflowPatch.mutate({ id: wf.id, patch: { status: "PAUSED" } })}
                            className="flex items-center gap-1 text-[12px] font-extrabold hover:bg-[#fdf3df] px-2 py-1 rounded-lg transition-colors"
                            style={{ color: ST.amberText }}
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Pauser
                          </button>
                        ) : (
                          <button
                            onClick={() => workflowPatch.mutate({ id: wf.id, patch: { status: "ACTIVE" } })}
                            className="flex items-center gap-1 text-[12px] font-extrabold hover:bg-[#e6f5eb] px-2 py-1 rounded-lg transition-colors"
                            style={{ color: ST.green }}
                          >
                            <Play className="w-3.5 h-3.5" />
                            Activer
                          </button>
                        )}
                        <a
                          href={`/vendeur/automatisations/${wf.id}`}
                          className="flex items-center gap-1 text-[12px] font-extrabold hover:bg-black/5 px-2 py-1 rounded-lg transition-colors"
                          style={{ color: ST.text }}
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
                          className="flex items-center gap-1 text-[12px] font-extrabold hover:bg-[#fceef2] px-2 py-1 rounded-lg transition-colors"
                          style={{ color: ST.roseText }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </StCard>
                );
              })
            )}
          </div>
        )}

        {/* Sequences tab */}
        {activeTab === "sequences" && (
          <div className="space-y-3">
            {sequences.length === 0 ? (
              <StCard className="text-center py-12">
                <MailCheck size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
                <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>Aucune séquence email</h3>
                <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                  Créez des emails automatiques pour accompagner vos apprenants.
                </p>
                <div className="mt-4 flex justify-center">
                  <StButton href="/vendeur/marketing/sequences">Gérer les séquences</StButton>
                </div>
              </StCard>
            ) : (
              sequences.map((seq) => (
                <StCard key={seq.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: ST.amberSoft }}>
                        <MailCheck className="w-5 h-5" style={{ color: ST.amberText }} />
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
                            className="font-extrabold text-[13px] w-full bg-transparent focus:outline-none px-1"
                            style={{ color: ST.text, borderBottom: `1px solid ${ST.greenBright}` }}
                          />
                        ) : (
                          <p className="font-extrabold text-[13px] truncate" style={{ color: ST.text }}>{seq.name}</p>
                        )}
                        <p className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>
                          {seq._count.steps} étapes · Déclencheur : {SEQ_TRIGGER_LABELS[seq.trigger] ?? seq.trigger}
                        </p>
                      </div>
                    </div>
                    <StChip tone={seq.isActive ? "green" : "neutral"}>
                      {seq.isActive ? "Active" : "Inactive"}
                    </StChip>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 text-[12px] font-semibold flex-wrap" style={{ borderTop: `1px solid ${ST.divider}`, color: ST.textSecondary }}>
                    <span>{seq.totalEnrolled.toLocaleString("fr-FR")} abonnés</span>
                    <span>{seq.totalCompleted.toLocaleString("fr-FR")} complétées</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => sequencePatch.mutate({ id: seq.id, patch: { isActive: !seq.isActive } })}
                        className="flex items-center gap-1 text-[12px] font-extrabold px-2 py-1 rounded-lg transition-colors"
                        style={seq.isActive ? { color: ST.amberText } : { color: ST.green }}
                      >
                        {seq.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {seq.isActive ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => startEdit(seq)}
                        className="flex items-center gap-1 text-[12px] font-extrabold hover:bg-black/5 px-2 py-1 rounded-lg transition-colors"
                        style={{ color: ST.text }}
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
                        className="flex items-center gap-1 text-[12px] font-extrabold hover:bg-[#fceef2] px-2 py-1 rounded-lg transition-colors"
                        style={{ color: ST.roseText }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </StCard>
              ))
            )}
          </div>
        )}

        {/* Integrations tab */}
        {activeTab === "integrations" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                  <StCard key={intg.name}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${intg.bg}`}>
                        <Icon className={`w-5 h-5 ${intg.color}`} />
                      </div>
                      <StChip tone={connected ? "green" : "neutral"}>
                        {connected ? "Connecté" : "Non connecté"}
                      </StChip>
                    </div>
                    <h3 className="font-extrabold text-[13.5px] mb-1" style={{ color: ST.text }}>{intg.name}</h3>
                    <p className="text-[11.5px] font-semibold mb-4" style={{ color: ST.textSecondary }}>{intg.desc}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => providerKey && setIntegrationModal(providerKey)}
                        disabled={!providerKey}
                        className="flex-1 py-2 rounded-[10px] text-[12px] font-extrabold transition-all"
                        style={connected ? { background: ST.green, color: "#fff" } : { border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
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
                          className="px-3 py-2 rounded-[10px] text-[12px] font-extrabold disabled:opacity-50"
                          style={{ background: ST.roseSoft, color: ST.roseText }}
                        >
                          <Link2Off className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </StCard>
                );
              })}
            </div>

            <StCard className="mt-4" style={{ background: "#f6f9f7" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[12px] bg-white shadow-sm flex items-center justify-center">
                  <Webhook className="w-5 h-5" style={{ color: ST.text }} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[13.5px]" style={{ color: ST.text }}>Webhooks Temps Réel</h3>
                  <p className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>Recevez les événements de votre boutique dans n&apos;importe quelle application</p>
                </div>
              </div>
              <div className="bg-white rounded-[12px] p-4 tabular-nums text-[12px] font-semibold mb-4" style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}>
                <span style={{ color: ST.green }}>POST</span> https://votre-app.com/webhook<br />
                <span style={{ color: ST.textMuted }}>{"{"} event: &quot;sale.completed&quot;, amount: 25000, ... {"}"}</span>
              </div>
              <StButton icon={Plus} href="/vendeur/api-keys">
                Configurer un webhook
              </StButton>
            </StCard>
          </div>
        )}

        {/* Create workflow modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6" style={{ border: `1px solid ${ST.cardBorder}` }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[17px] font-extrabold" style={{ color: ST.text }}>Nouveau workflow</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-[10px] hover:bg-black/5">
                  <X className="w-5 h-5" style={{ color: ST.textSecondary }} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Nom du workflow *</label>
                  <input
                    type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Email de bienvenue après achat"
                    className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Déclencheur *</label>
                  <select
                    value={form.triggerType} onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value }))}
                    className="w-full rounded-[12px] px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none bg-white"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  >
                    {Object.entries(TRIGGER_LABELS).map(([key, t]) => (
                      <option key={key} value={key}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Description (optionnel)</label>
                  <textarea
                    value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez ce que fait ce workflow"
                    rows={2}
                    className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-medium focus:outline-none resize-none"
                    style={{ color: "#33453b", border: "1px solid #dde6e0" }}
                  />
                </div>
                <div className="rounded-[12px] p-3" style={{ background: ST.amberSoft, border: "1px solid #f3e2bd" }}>
                  <p className="text-[12px] font-extrabold mb-0.5" style={{ color: "#633806" }}>Note</p>
                  <p className="text-[11px] font-semibold" style={{ color: "#854f0b" }}>
                    Vous pourrez configurer les actions (envoyer email, ajouter tag, webhook…) après la création du workflow.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <StButton variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
                  Annuler
                </StButton>
                <StButton
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.name || createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? "Création…" : "Créer le workflow"}
                </StButton>
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
