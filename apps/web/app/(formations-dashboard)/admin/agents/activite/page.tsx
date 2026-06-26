"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ST, StPageHeader, StCard, StChip } from "@/components/stitch";
import { ArrowLeft, Play, Check, X, AlertTriangle, FileText, Zap, Pause } from "lucide-react";

interface Ev {
  kind: "run" | "action";
  id: string; agentKey: string; emoji: string; agentName: string;
  at: string; createdAt: string; status: string;
  summary?: string | null; itemsProcessed?: number; actionsCreated?: number; tokensUsed?: number; error?: string | null; durationMs?: number | null;
  type?: string; risk?: string; title?: string; reasoning?: string | null; draft?: string | null; targetType?: string | null;
}

const ACTION_STATUS: Record<string, { label: string; tone: "green" | "amber" | "rose" | "slate" }> = {
  proposed: { label: "À valider", tone: "amber" },
  approved: { label: "Validée", tone: "green" },
  rejected: { label: "Rejetée", tone: "rose" },
  auto_executed: { label: "Auto-exécutée", tone: "green" },
  executed: { label: "Exécutée", tone: "green" },
  failed: { label: "Échec", tone: "rose" },
};

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 5) return "à l'instant";
  if (s < 60) return `il y a ${s} s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}
function clock(d: string): string {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AgentsActivityPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [live, setLive] = useState(true);
  const [agent, setAgent] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const known = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const res = await fetch(`/api/formations/admin/agents/activity?limit=150${agent ? `&agent=${agent}` : ""}`);
    if (res.ok) {
      const j = await res.json();
      const list: Ev[] = j.events ?? [];
      // Repère les nouveautés pour un petit effet « flash »
      const fresh = new Set<string>();
      for (const e of list) {
        const key = `${e.kind}:${e.id}:${e.status}`;
        if (known.current.size && !known.current.has(key)) fresh.add(e.id);
      }
      known.current = new Set(list.map((e) => `${e.kind}:${e.id}:${e.status}`));
      setEvents(list);
      if (fresh.size) {
        setFlash(fresh);
        setTimeout(() => setFlash(new Set()), 2000);
      }
    }
    setLoading(false);
  }, [agent]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(load, 7000);
    return () => clearInterval(id);
  }, [live, load]);

  const agents = Array.from(new Map(events.map((e) => [e.agentKey, { key: e.agentKey, emoji: e.emoji, name: e.agentName }])).values());

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[920px] mx-auto">
        <Link href="/admin/agents" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold mb-3 hover:underline" style={{ color: ST.green }}>
          <ArrowLeft size={15} /> Agents IA
        </Link>
        <StPageHeader
          title="Activité en direct"
          subtitle="Tout ce que vos agents font, en temps réel : chaque exécution et chaque action."
          actions={
            <button
              onClick={() => setLive((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold px-3.5 py-2 rounded-[12px] border"
              style={{ borderColor: ST.cardBorder, color: live ? ST.green : ST.textSecondary, background: "#fff" }}
            >
              {live ? <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: ST.green }} /><span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: ST.green }} /></span> : <Pause size={14} />}
              {live ? "En direct" : "En pause"}
            </button>
          }
        />

        {/* Filtre par agent */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setAgent("")} className="text-[11.5px] font-bold px-3 py-1.5 rounded-full border" style={{ borderColor: agent === "" ? ST.green : ST.cardBorder, color: agent === "" ? ST.green : ST.textSecondary, background: agent === "" ? ST.greenSoft : "#fff" }}>Tous</button>
          {agents.map((a) => (
            <button key={a.key} onClick={() => setAgent(a.key)} className="text-[11.5px] font-bold px-3 py-1.5 rounded-full border inline-flex items-center gap-1" style={{ borderColor: agent === a.key ? ST.green : ST.cardBorder, color: agent === a.key ? ST.green : ST.textSecondary, background: agent === a.key ? ST.greenSoft : "#fff" }}>
              <span>{a.emoji}</span> {a.name.split("—")[0].trim()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <StCard key={i}><div className="h-12 animate-pulse" /></StCard>)}</div>
        ) : events.length === 0 ? (
          <StCard><p className="text-[13px]" style={{ color: ST.textMuted }}>Aucune activité pour l'instant. Lancez un agent depuis la page Agents, ou attendez le prochain passage automatique (chaque heure).</p></StCard>
        ) : (
          <div className="relative pl-5">
            {/* ligne verticale de timeline */}
            <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: ST.divider }} />
            <div className="space-y-2">
              {events.map((e) => {
                const isRun = e.kind === "run";
                const aStat = e.status ? ACTION_STATUS[e.status] : undefined;
                const dotColor = isRun
                  ? (e.status === "error" ? ST.roseText : ST.green)
                  : (aStat?.tone === "rose" ? ST.roseText : aStat?.tone === "amber" ? ST.amberText : ST.green);
                const isOpen = open === e.id;
                const detail = e.draft || e.reasoning;
                return (
                  <div key={`${e.kind}-${e.id}`} className="relative">
                    <span className="absolute -left-[18px] top-3.5 w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ background: dotColor }} />
                    <div
                      className="rounded-[14px] border transition-shadow"
                      style={{ borderColor: ST.cardBorder, background: "#fff", boxShadow: flash.has(e.id) ? `0 0 0 2px ${ST.green}55` : "none" }}
                    >
                      <button
                        onClick={() => detail && setOpen(isOpen ? null : e.id)}
                        className="w-full text-left px-3.5 py-2.5 flex items-start gap-2.5"
                        style={{ cursor: detail ? "pointer" : "default" }}
                      >
                        <span className="text-[18px] leading-none mt-0.5">{e.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1" style={{ color: isRun ? ST.textMuted : dotColor }}>
                              {isRun ? <><Play size={10} /> Exécution</> : <><Zap size={10} /> Action</>}
                            </span>
                            <span className="text-[12px] font-bold" style={{ color: ST.text }}>{e.agentName.split("—")[0].trim()}</span>
                            {isRun && e.status === "error" && <StChip tone="rose">erreur</StChip>}
                            {!isRun && aStat && <StChip tone={aStat.tone === "slate" ? "amber" : aStat.tone}>{aStat.label}</StChip>}
                            {!isRun && e.risk === "sensitive" && <StChip tone="amber">sensible</StChip>}
                          </div>
                          <p className="text-[13px] mt-1" style={{ color: ST.text }}>
                            {isRun ? (e.summary || "Exécution terminée") : e.title}
                          </p>
                          {isRun && (
                            <p className="text-[11px] mt-0.5" style={{ color: ST.textMuted }}>
                              {e.itemsProcessed ?? 0} traité(s) · {e.actionsCreated ?? 0} action(s)
                              {e.tokensUsed ? ` · ${e.tokensUsed} tokens IA` : ""}
                              {e.durationMs != null ? ` · ${(e.durationMs / 1000).toFixed(1)} s` : ""}
                            </p>
                          )}
                          {isRun && e.error && <p className="text-[11px] mt-0.5" style={{ color: ST.roseText }}>{e.error.slice(0, 200)}</p>}
                        </div>
                        <span className="text-[10.5px] whitespace-nowrap mt-0.5" style={{ color: ST.textMuted }} title={clock(e.createdAt)}>{timeAgo(e.at)}</span>
                      </button>
                      {isOpen && detail && (
                        <div className="px-3.5 pb-3 -mt-1">
                          <div className="rounded-[10px] p-3 text-[12.5px] whitespace-pre-wrap" style={{ background: ST.bg, color: ST.textSecondary, borderTop: `1px dashed ${ST.divider}` }}>
                            {e.draft && <p className="text-[10.5px] font-bold mb-1 inline-flex items-center gap-1" style={{ color: ST.green }}><FileText size={11} /> Brouillon rédigé par l'IA</p>}
                            {detail}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!live && (
          <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: ST.amberText }}>
            <AlertTriangle size={14} /> Rafraîchissement automatique en pause — cliquez « En pause » pour réactiver le direct.
          </div>
        )}
        <p className="mt-3 text-[11px]" style={{ color: ST.textMuted }}>
          <Check size={11} className="inline" /> Pour valider/rejeter une action proposée, allez sur <Link href="/admin/agents" className="font-bold underline" style={{ color: ST.green }}>Agents IA</Link>.
          <X size={11} className="inline ml-2" /> Les décisions s'affichent ici en direct.
        </p>
      </main>
    </div>
  );
}
