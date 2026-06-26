"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ST, StPageHeader, StCard, StButton, StChip } from "@/components/stitch";
import { ArrowLeft, Bot, Play, Check, X, AlertTriangle, Loader2, BarChart3, SlidersHorizontal, Save, Activity, Radio, Zap, Clock } from "lucide-react";

interface ConfigField {
  key: string; label: string; type: "number" | "text" | "textarea";
  default: number | string; hint?: string; min?: number; max?: number; suffix?: string;
}
interface AgentRow {
  key: string; name: string; emoji: string; description: string;
  capabilities: string[]; cadence: string; needsLlm: boolean;
  enabled: boolean; autonomy: string; lastRunAt: string | null; pending: number;
  configSchema: ConfigField[]; config: Record<string, string | number>;
}
interface ActionRow {
  id: string; agentKey: string; type: string; status: string; risk: string;
  title: string; reasoning: string | null; createdAt: string;
}
interface Live {
  activeAgents: number; totalAgents: number; runsToday: number; actionsToday: number;
  pending: number; lastRunAt: string | null; nextRunAt: string | null; serverTime: string;
}
interface FeedEv {
  kind: "run" | "action"; id: string; emoji: string; agentName: string; at: string;
  status: string; summary?: string | null; title?: string;
}

const AUTONOMY_LABEL: Record<string, string> = {
  mixed: "Mixte (auto + validation)", approval: "Validation totale", auto: "Full auto", off: "Désactivé",
};

function timeAgo(d: string | null): string {
  if (!d) return "jamais";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}
function countdown(iso: string | null, nowMs: number): string {
  if (!iso) return "—";
  let s = Math.max(0, Math.floor((new Date(iso).getTime() - nowMs) / 1000));
  const m = Math.floor(s / 60); s = s % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [llm, setLlm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [feed, setFeed] = useState<FeedEv[]>([]);
  const [nowMs, setNowMs] = useState<number>(0);

  const load = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/formations/admin/agents"),
      fetch("/api/formations/admin/agents/activity?limit=6"),
    ]);
    if (r1.ok) {
      const j = await r1.json();
      setAgents(j.agents ?? []);
      setActions(j.actions ?? []);
      setLlm(!!j.llmConfigured);
      setLive(j.live ?? null);
    }
    if (r2.ok) {
      const j = await r2.json();
      setFeed(j.events ?? []);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  // Polling « centrale » : rafraîchit l'état toutes les 8 s.
  useEffect(() => {
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);
  // Tic chaque seconde pour le compte à rebours.
  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function patchAgent(key: string, body: Record<string, unknown>) {
    setBusy(key);
    await fetch("/api/formations/admin/agents", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...body }),
    }).catch(() => null);
    await load(); setBusy(null);
  }
  async function runNow(key: string) {
    setBusy(key);
    await fetch("/api/formations/admin/agents/run", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent: key }),
    }).catch(() => null);
    await load(); setBusy(null);
  }
  function toggleConfig(a: AgentRow) {
    if (configOpen === a.key) { setConfigOpen(null); return; }
    setDraft({ ...a.config });
    setConfigOpen(a.key);
    setSaved(null);
  }
  async function saveConfig(key: string) {
    setBusy(key);
    await fetch("/api/formations/admin/agents", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, config: draft }),
    }).catch(() => null);
    await load();
    setBusy(null);
    setSaved(key);
    setTimeout(() => setSaved((s) => (s === key ? null : s)), 2500);
  }
  async function decide(id: string, decision: "approve" | "reject") {
    setBusy(id);
    await fetch("/api/formations/admin/agents/actions", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId: id, decision }),
    }).catch(() => null);
    await load(); setBusy(null);
  }

  const proposed = actions.filter((a) => a.status === "proposed");

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1100px] mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold mb-3 hover:underline" style={{ color: ST.green }}>
          <ArrowLeft size={15} /> Tableau de bord
        </Link>
        <StPageHeader
          title="Agents IA"
          subtitle="Vos employés virtuels — ils travaillent côté serveur, 24/7, même quand vous êtes déconnecté."
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/admin/agents/activite"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold px-3.5 py-2 rounded-[12px] border"
                style={{ borderColor: ST.cardBorder, color: ST.green, background: "#fff" }}
              >
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: ST.green }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ST.green }} /></span>
                Activité en direct
              </Link>
              <Link
                href="/admin/agents/analytics"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold px-3.5 py-2 rounded-[12px] border"
                style={{ borderColor: ST.cardBorder, color: ST.green, background: "#fff" }}
              >
                <BarChart3 size={15} /> Statistiques
              </Link>
            </div>
          }
        />

        {/* ───────── CENTRALE (poste de commande, en direct) ───────── */}
        <div
          className="rounded-[18px] p-5 mb-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#06231a,#0c3a26 60%,#0a5132)", color: "#fff" }}
        >
          {/* halo animé */}
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#34d399,transparent 70%)" }} />
          <div className="flex items-start justify-between gap-3 relative">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: "#34d399" }} />
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "#34d399" }} />
                </span>
                <span className="text-[12px] font-extrabold uppercase tracking-[0.14em]" style={{ color: "#9ef0c4" }}>
                  Centrale · en service 24/7
                </span>
              </div>
              <h2 className="text-[19px] font-extrabold mt-1.5 flex items-center gap-2">
                <Radio size={18} className="animate-pulse" style={{ color: "#34d399" }} />
                {live ? `${live.activeAgents}/${live.totalAgents} agents tournent en boucle` : "Initialisation…"}
              </h2>
              <p className="text-[12.5px] mt-1" style={{ color: "#bfe8d2" }}>
                Cycle automatique toutes les heures · dernier passage {timeAgo(live?.lastRunAt ?? null)}
              </p>
            </div>
            {/* compte à rebours prochain cycle */}
            <div className="text-right flex-shrink-0">
              <p className="text-[10.5px] font-bold uppercase tracking-wide flex items-center justify-end gap-1" style={{ color: "#9ef0c4" }}>
                <Clock size={12} /> Prochain cycle
              </p>
              <p className="text-[30px] font-extrabold tabular-nums leading-none mt-1" style={{ color: "#fff" }}>
                {countdown(live?.nextRunAt ?? null, nowMs)}
              </p>
            </div>
          </div>

          {/* compteurs live */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 relative">
            {[
              { icon: Bot, label: "Agents actifs", val: live ? `${live.activeAgents}` : "—" },
              { icon: Play, label: "Exécutions (24 h)", val: live ? `${live.runsToday}` : "—" },
              { icon: Zap, label: "Actions (24 h)", val: live ? `${live.actionsToday}` : "—" },
              { icon: AlertTriangle, label: "À valider", val: live ? `${live.pending}` : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-[13px] px-3 py-2.5" style={{ background: "rgba(255,255,255,0.09)" }}>
                <p className="text-[10.5px] font-bold flex items-center gap-1" style={{ color: "#bfe8d2" }}>
                  <s.icon size={12} /> {s.label}
                </p>
                <p className="text-[22px] font-extrabold tabular-nums mt-0.5">{s.val}</p>
              </div>
            ))}
          </div>

          {/* mini-flux en direct */}
          <div className="mt-4 relative">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "#9ef0c4" }}>
                <Activity size={13} /> Flux en direct
              </p>
              <Link href="/admin/agents/activite" className="text-[11px] font-bold underline" style={{ color: "#9ef0c4" }}>
                Tout voir →
              </Link>
            </div>
            <div className="space-y-1">
              {feed.length === 0 ? (
                <p className="text-[12px]" style={{ color: "#bfe8d2" }}>En attente du premier passage des agents…</p>
              ) : feed.slice(0, 5).map((e) => (
                <div key={`${e.kind}-${e.id}`} className="flex items-center gap-2 text-[12px] rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <span className="text-[14px] leading-none">{e.emoji}</span>
                  <span className="font-bold" style={{ color: "#fff" }}>{e.agentName.split("—")[0].trim()}</span>
                  <span className="truncate flex-1" style={{ color: "#cdeeda" }}>{e.kind === "run" ? (e.summary || "exécution") : e.title}</span>
                  <span className="whitespace-nowrap" style={{ color: "#8fd3ac" }}>{timeAgo(e.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!llm && (
          <div className="rounded-[14px] p-4 mb-5 flex items-start gap-3" style={{ background: ST.amberSoft }}>
            <AlertTriangle size={18} style={{ color: ST.amberText }} className="flex-shrink-0 mt-0.5" />
            <div className="text-[13px]" style={{ color: ST.amberText }}>
              <strong>Mode règles actif</strong> — les agents fonctionnent sans IA (rapports, alertes, modération par mots-clés, relances : tout marche déjà).
              Pour les réponses rédigées et l'analyse fine, ajoutez une clé IA serveur gratuite (Groq ou Gemini) dans les variables d'environnement (<code>GROQ_API_KEY</code>).
            </div>
          </div>
        )}

        {/* Agents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-7">
          {loading ? (
            [0, 1, 2, 3].map((i) => <StCard key={i}><div className="h-28 animate-pulse" /></StCard>)
          ) : agents.map((a) => (
            <StCard key={a.key}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-[28px] leading-none">{a.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-[15px]" style={{ color: ST.text }}>{a.name}</p>
                    <p className="text-[12.5px] mt-0.5" style={{ color: ST.textSecondary }}>{a.description}</p>
                    <p className="text-[11px] font-bold mt-1.5 inline-flex items-center gap-1.5">
                      {a.enabled ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: ST.green }} />
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ST.green }} />
                          </span>
                          <span style={{ color: ST.green }}>En activité</span>
                          <span style={{ color: ST.textMuted }}>· prochain cycle {countdown(live?.nextRunAt ?? null, nowMs)}</span>
                        </>
                      ) : (
                        <span style={{ color: ST.textMuted }}>⏸ En veille</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => patchAgent(a.key, { enabled: !a.enabled })}
                  disabled={busy === a.key}
                  className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
                  style={{ background: a.enabled ? ST.green : "#cbd5d0" }}
                  aria-label={a.enabled ? "Désactiver" : "Activer"}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: a.enabled ? "22px" : "2px" }} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {a.capabilities.map((c) => (
                  <span key={c} className="text-[10.5px] font-bold px-2 py-1 rounded-full" style={{ background: ST.greenSoft, color: ST.greenDark }}>{c}</span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                <div className="flex items-center gap-2">
                  <select
                    value={a.autonomy}
                    onChange={(e) => patchAgent(a.key, { autonomy: e.target.value })}
                    disabled={busy === a.key || !a.enabled}
                    className="text-[11.5px] font-bold rounded-lg px-2 py-1.5 border bg-white"
                    style={{ borderColor: ST.cardBorder, color: ST.text }}
                  >
                    {Object.entries(AUTONOMY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {a.pending > 0 && <StChip tone="amber">{a.pending} à valider</StChip>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: ST.textMuted }}>{timeAgo(a.lastRunAt)}</span>
                  <button
                    onClick={() => toggleConfig(a)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg border"
                    style={{ borderColor: ST.cardBorder, color: configOpen === a.key ? ST.green : ST.textSecondary, background: "#fff" }}
                    aria-expanded={configOpen === a.key}
                  >
                    <SlidersHorizontal size={13} /> Régler
                  </button>
                  <button
                    onClick={() => runNow(a.key)}
                    disabled={busy === a.key || !a.enabled}
                    className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-2.5 py-1.5 rounded-lg disabled:opacity-40"
                    style={{ background: ST.green, color: "#fff" }}
                  >
                    {busy === a.key ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Lancer
                  </button>
                </div>
              </div>

              {/* Panneau d'entraînement / réglages */}
              {configOpen === a.key && (
                <div className="mt-3 pt-3 space-y-3" style={{ borderTop: `1px dashed ${ST.divider}` }}>
                  <p className="text-[11.5px] font-bold flex items-center gap-1.5" style={{ color: ST.textSecondary }}>
                    <SlidersHorizontal size={13} style={{ color: ST.green }} /> Entraînement de l'agent
                  </p>
                  {a.configSchema.map((f) => (
                    <div key={f.key}>
                      <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>
                        {f.label}{f.suffix ? <span style={{ color: ST.textMuted }}> ({f.suffix})</span> : null}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          value={String(draft[f.key] ?? "")}
                          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          rows={3}
                          placeholder={f.hint}
                          className="w-full text-[12.5px] rounded-lg px-2.5 py-2 border resize-y"
                          style={{ borderColor: ST.cardBorder, color: ST.text }}
                        />
                      ) : (
                        <input
                          type={f.type === "number" ? "number" : "text"}
                          value={String(draft[f.key] ?? "")}
                          min={f.min}
                          max={f.max}
                          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          className="w-full text-[12.5px] rounded-lg px-2.5 py-2 border"
                          style={{ borderColor: ST.cardBorder, color: ST.text }}
                        />
                      )}
                      {f.hint && f.type !== "textarea" && <p className="text-[10.5px] mt-1" style={{ color: ST.textMuted }}>{f.hint}</p>}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => saveConfig(a.key)}
                      disabled={busy === a.key}
                      className="inline-flex items-center gap-1.5 text-[12px] font-extrabold px-3.5 py-2 rounded-lg text-white disabled:opacity-40"
                      style={{ background: ST.green }}
                    >
                      {busy === a.key ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer
                    </button>
                    <button
                      onClick={() => setDraft({ ...Object.fromEntries(a.configSchema.map((f) => [f.key, f.default])) })}
                      className="text-[12px] font-bold px-3 py-2 rounded-lg border"
                      style={{ borderColor: ST.cardBorder, color: ST.textSecondary }}
                    >
                      Valeurs par défaut
                    </button>
                    {saved === a.key && <span className="text-[11.5px] font-bold" style={{ color: ST.green }}>✓ Enregistré</span>}
                  </div>
                </div>
              )}
            </StCard>
          ))}
        </div>

        {/* File d'actions à valider */}
        <h2 className="text-[16px] font-extrabold mb-3 flex items-center gap-2" style={{ color: ST.text }}>
          <Bot size={18} style={{ color: ST.green }} /> Actions proposées ({proposed.length})
        </h2>
        {proposed.length === 0 ? (
          <StCard><p className="text-[13px]" style={{ color: ST.textMuted }}>Aucune action en attente de validation. Les agents activés vous proposeront ici les décisions sensibles.</p></StCard>
        ) : (
          <div className="space-y-2.5">
            {proposed.map((a) => (
              <StCard key={a.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StChip tone={a.risk === "low" ? "green" : "amber"}>{a.agentKey}</StChip>
                      <span className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: ST.textMuted }}>{a.type}</span>
                    </div>
                    <p className="font-bold text-[13.5px]" style={{ color: ST.text }}>{a.title}</p>
                    {a.reasoning && <p className="text-[12px] mt-1" style={{ color: ST.textSecondary }}>{a.reasoning}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => decide(a.id, "approve")} disabled={busy === a.id} className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: ST.green }}>
                      <Check size={13} /> Valider
                    </button>
                    <button onClick={() => decide(a.id, "reject")} disabled={busy === a.id} className="inline-flex items-center gap-1 text-[11.5px] font-bold px-3 py-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: ST.cardBorder, color: ST.roseText }}>
                      <X size={13} /> Rejeter
                    </button>
                  </div>
                </div>
              </StCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
