"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ST, StPageHeader, StCard, StButton, StChip } from "@/components/stitch";
import { ArrowLeft, Bot, Play, Check, X, AlertTriangle, Loader2, BarChart3 } from "lucide-react";

interface AgentRow {
  key: string; name: string; emoji: string; description: string;
  capabilities: string[]; cadence: string; needsLlm: boolean;
  enabled: boolean; autonomy: string; lastRunAt: string | null; pending: number;
}
interface ActionRow {
  id: string; agentKey: string; type: string; status: string; risk: string;
  title: string; reasoning: string | null; createdAt: string;
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

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [llm, setLlm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/formations/admin/agents");
    if (res.ok) {
      const j = await res.json();
      setAgents(j.agents ?? []);
      setActions(j.actions ?? []);
      setLlm(!!j.llmConfigured);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

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
            <Link
              href="/admin/agents/analytics"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold px-3.5 py-2 rounded-[12px] border"
              style={{ borderColor: ST.cardBorder, color: ST.green, background: "#fff" }}
            >
              <BarChart3 size={15} /> Statistiques
            </Link>
          }
        />

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
                    onClick={() => runNow(a.key)}
                    disabled={busy === a.key || !a.enabled}
                    className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-2.5 py-1.5 rounded-lg disabled:opacity-40"
                    style={{ background: ST.green, color: "#fff" }}
                  >
                    {busy === a.key ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Lancer
                  </button>
                </div>
              </div>
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
