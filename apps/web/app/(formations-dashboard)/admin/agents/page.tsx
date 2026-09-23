"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { Bot, Power, Clock, CheckCircle2, XCircle, AlertTriangle, PlayCircle } from "lucide-react";

type ConfigField = { key: string; label: string; type: "number" | "text" | "textarea"; default: number | string; hint?: string; min?: number; max?: number; suffix?: string };

type AgentVue = {
  key: string;
  name: string;
  emoji: string;
  description: string;
  capabilities: string[];
  cadence: string;
  enabled: boolean;
  autonomy: string;
  lastRunAt: string | null;
  configSchema: ConfigField[];
  config: Record<string, string | number>;
};

type Action = {
  id: string;
  agentKey: string;
  status: string;
  type: string;
  title: string;
  reasoning: string | null;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  executedAt: string | null;
};

type Run = {
  agentKey: string;
  status: string;
  summary: string | null;
  itemsProcessed: number;
  actionsCreated: number;
  tokensUsed: number;
  startedAt: string;
  finishedAt: string | null;
};

type ApiResponse = {
  agents: AgentVue[];
  actions: Action[];
  runs: Run[];
  llmConfigured: boolean;
  live: {
    totalAgents: number;
    activeAgents: number;
    lastRunAt: string | null;
    nextRunAt: string;
    serverTime: string;
  };
};

function relatif(iso: string | null): string {
  if (!iso) return "jamais";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

function futurRelatif(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const min = Math.max(0, Math.round(ms / 60_000));
  if (min < 1) return "dans moins d'une minute";
  return `dans ${min} min`;
}

export default function AgentsPage() {
  const qc = useQueryClient();
  const toast = useToastStore.getState().addToast;

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["admin-agents"],
    queryFn: () => fetch("/api/formations/admin/agents").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/formations/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Erreur");
        return j;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agents"] });
    },
    onError: (e: Error) => toast("error", e.message),
  });

  const runNow = useMutation({
    mutationFn: () => fetch("/api/formations/admin/agents/run", { method: "POST" }).then(async (r) => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      return j;
    }),
    onSuccess: () => {
      toast("success", "Exécution lancée. Actualisation dans quelques secondes…");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["admin-agents"] }), 3000);
    },
    onError: (e: Error) => toast("error", e.message),
  });

  const tousActifs = useMemo(() => (data?.agents ?? []).every((a) => a.enabled), [data]);
  const auMoinsUn = useMemo(() => (data?.agents ?? []).some((a) => a.enabled), [data]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="h-8 w-64 bg-slate-100 animate-pulse rounded" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* ── Entête + interrupteur global ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Bot size={22} className="text-emerald-700" />
              <h1 className="text-xl font-extrabold text-slate-900">Agents IA</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              Deux agents autonomes vérifient les dossiers KYC et les fiches produit sans intervention.
              Ils tournent toutes les 15 minutes, décident (approuvent ou refusent avec un motif envoyé à la personne)
              et vous laissent voir leur travail depuis cet écran.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => patch.mutate({ setAllEnabled: !tousActifs })}
              disabled={patch.isPending}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                tousActifs
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Power size={16} />
              {tousActifs ? "Tout désactiver" : "Tout activer"}
            </button>
            <button
              onClick={() => runNow.mutate()}
              disabled={runNow.isPending || !auMoinsUn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PlayCircle size={16} />
              Exécuter maintenant
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat label="Agents actifs" value={`${data.live.activeAgents} / ${data.live.totalAgents}`} />
          <Stat label="Dernier passage" value={relatif(data.live.lastRunAt)} />
          <Stat label="Prochain passage" value={futurRelatif(data.live.nextRunAt)} />
          <Stat label="IA configurée" value={data.llmConfigured ? "oui" : "non"} tone={data.llmConfigured ? "ok" : "warn"} />
        </div>

        {!data.llmConfigured && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p><strong>OPENROUTER_API_KEY manquante.</strong> Les agents ne peuvent pas appeler le modèle de vision : ils passent, mais ne décident rien.</p>
          </div>
        )}
      </div>

      {/* ── Un bloc par agent ────────────────────────────────────────────── */}
      {data.agents.map((a) => (
        <AgentBloc
          key={a.key}
          agent={a}
          actions={data.actions.filter((x) => x.agentKey === a.key)}
          runs={data.runs.filter((r) => r.agentKey === a.key)}
          onToggle={(enabled) => patch.mutate({ key: a.key, enabled })}
          onSaveConfig={(config) => patch.mutate({ key: a.key, config })}
          saving={patch.isPending}
        />
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className={`rounded-xl border p-3 ${tone === "warn" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-base font-extrabold mt-0.5 ${tone === "warn" ? "text-amber-900" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function AgentBloc({
  agent,
  actions,
  runs,
  onToggle,
  onSaveConfig,
  saving,
}: {
  agent: AgentVue;
  actions: Action[];
  runs: Run[];
  onToggle: (enabled: boolean) => void;
  onSaveConfig: (config: Record<string, string | number>) => void;
  saving: boolean;
}) {
  const [conf, setConf] = useState<Record<string, string | number>>(agent.config);
  useEffect(() => setConf(agent.config), [agent.config]);

  const modifie = useMemo(
    () => JSON.stringify(conf) !== JSON.stringify(agent.config),
    [conf, agent.config],
  );

  const dernier = runs[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="text-2xl leading-none">{agent.emoji}</div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900">{agent.name}</h2>
              <p className="text-sm text-slate-600 mt-1">{agent.description}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {agent.capabilities.map((c) => (
                  <li key={c} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={agent.enabled}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <span className="w-11 h-6 rounded-full bg-slate-200 relative transition-colors peer-checked:bg-emerald-600">
              <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </span>
            <span className={`text-xs font-bold ${agent.enabled ? "text-emerald-700" : "text-slate-500"}`}>
              {agent.enabled ? "Actif" : "Arrêté"}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <Stat label="Cadence" value={agent.cadence} />
          <Stat label="Dernier passage" value={relatif(agent.lastRunAt)} />
          <Stat label="Dernier résumé" value={dernier?.summary || "—"} />
        </div>
      </div>

      {/* ── Réglages « entraînement » ─────────────────────────────────── */}
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">Réglages</h3>
        <div className="grid grid-cols-1 gap-3">
          {agent.configSchema.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  value={String(conf[f.key] ?? "")}
                  onChange={(e) => setConf({ ...conf, [f.key]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-y"
                  placeholder={f.hint}
                />
              ) : f.type === "number" ? (
                <input
                  type="number"
                  value={String(conf[f.key] ?? "")}
                  min={f.min}
                  max={f.max}
                  onChange={(e) => setConf({ ...conf, [f.key]: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={String(conf[f.key] ?? "")}
                  onChange={(e) => setConf({ ...conf, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              )}
              {f.hint && <p className="text-[11px] text-slate-500 mt-1">{f.hint}{f.suffix ? ` (${f.suffix})` : ""}</p>}
            </div>
          ))}
        </div>
        {modifie && (
          <div className="mt-3">
            <button
              onClick={() => onSaveConfig(conf)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40"
            >
              Enregistrer les réglages
            </button>
          </div>
        )}
      </div>

      {/* ── Décisions récentes ────────────────────────────────────────── */}
      <div className="p-5">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">Décisions récentes ({actions.length})</h3>
        {actions.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Aucune décision sur les 7 derniers jours.</p>
        ) : (
          <ul className="space-y-2">
            {actions.slice(0, 20).map((a) => (
              <li key={a.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-start gap-2">
                  <IconeDecision status={a.status} title={a.title} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900">{a.title}</div>
                    {a.reasoning && (
                      <div className="text-xs text-slate-600 mt-1 whitespace-pre-line line-clamp-3">{a.reasoning}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                      <Clock size={11} />
                      <span>{relatif(a.createdAt)}</span>
                      {a.targetType && a.targetId && (
                        <span className="font-mono">· {a.targetType}:{a.targetId.slice(0, 10)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function IconeDecision({ status, title }: { status: string; title: string }) {
  const refus = /refus/i.test(title);
  if (status === "auto_executed" && refus) return <XCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />;
  if (status === "auto_executed") return <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />;
  if (status === "failed") return <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />;
  return <Clock size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />;
}
