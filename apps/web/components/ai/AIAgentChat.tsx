"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

// ─── Typage Puter ──────────────────────────────────────────────
type PuterContentBlock = { type?: string; text?: string };
type PuterChatResponse = {
  message: { content: string | PuterContentBlock[] };
};
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string,
          options?: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean },
        ) => Promise<PuterChatResponse>;
      };
    };
  }
}
function extractText(res: PuterChatResponse): string {
  const c = res.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c.map((b) => (b && typeof b.text === "string" ? b.text : "")).join("");
  }
  return "";
}

// ─── Mini Markdown ─────────────────────────────────────────────
function md(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (/^###\s/.test(line)) { nodes.push(<h3 key={i} className="text-base font-bold text-[#191c1e] mt-4 mb-2">{line.replace(/^###\s*/, "")}</h3>); return; }
    if (/^##\s/.test(line)) { nodes.push(<h2 key={i} className="text-lg font-extrabold text-[#191c1e] mt-5 mb-2">{line.replace(/^##\s*/, "")}</h2>); return; }
    if (/^[\-\*]\s/.test(line)) { nodes.push(<li key={i} className="ml-5 list-disc text-sm text-[#191c1e]">{inline(line.replace(/^[\-\*]\s*/, ""), i)}</li>); return; }
    if (/^\d+\.\s/.test(line)) { nodes.push(<li key={i} className="ml-5 list-decimal text-sm text-[#191c1e]">{inline(line.replace(/^\d+\.\s*/, ""), i)}</li>); return; }
    if (line.trim() === "") { nodes.push(<div key={i} className="h-2" />); return; }
    nodes.push(<p key={i} className="text-sm text-[#191c1e] leading-relaxed">{inline(line, i)}</p>);
  });
  return nodes;
}
function inline(text: string, lineIdx: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={`${lineIdx}-${m.index}`}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) parts.push(<code key={`${lineIdx}-${m.index}`} className="px-1 py-0.5 rounded bg-gray-100 text-[12px] font-mono">{t.slice(1, -1)}</code>);
    else if (t.startsWith("*")) parts.push(<em key={`${lineIdx}-${m.index}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ─── Props ─────────────────────────────────────────────────────
export type AIAgentRole = "vendeur" | "apprenant" | "mentor" | "affiliation";

interface Props {
  role: AIAgentRole;
  icon: string;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  systemPrompt: string;
  welcomeMessage: string;
  quickActions?: Array<{ label: string; prompt: string }>;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function AIAgentChat({
  role, icon, title, subtitle, gradientFrom, gradientTo,
  systemPrompt, welcomeMessage, quickActions,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      if (typeof window !== "undefined" && window.puter) { setPuterReady(true); return true; }
      return false;
    };
    if (!check()) {
      const i = setInterval(() => { if (check()) clearInterval(i); }, 300);
      return () => clearInterval(i);
    }
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending || !puterReady || !window.puter) return;
    const userMsg = text.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    const history = [...messages, { role: "user" as const, content: userMsg }]
      .filter((m, i) => !(m.role === "assistant" && i === 0)) // skip welcome
      .slice(-10) // garde les 10 derniers messages seulement
      .map((m) => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}\n\nHistorique de la conversation :\n${history}\n\nAssistant:`;

    try {
      const response = await window.puter.ai.chat(fullPrompt, {
        model: "claude-sonnet-4-6",
        temperature: 0.5,
        max_tokens: 2000,
      });
      const text = extractText(response).trim();
      setMessages(prev => [...prev, { role: "assistant", content: text || "Désolé, je n'ai pas compris. Pouvez-vous reformuler ?" }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Erreur : ${e instanceof Error ? e.message : "inconnue"}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">{title}</h1>
            <p className="text-sm text-[#5c647a]">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${puterReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
          <span className="text-[#5c647a]">{puterReady ? "Claude Sonnet 4.6 · prêt" : "Chargement du SDK IA…"}</span>
        </div>
      </div>

      {/* Quick actions */}
      {quickActions && quickActions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {quickActions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q.prompt)}
              disabled={!puterReady || sending}
              className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-[#191c1e] bg-white hover:border-[#006e2f]/50 hover:bg-[#006e2f]/5 disabled:opacity-40"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  m.role === "user" ? "text-white rounded-br-sm whitespace-pre-wrap" : "bg-gray-50 text-[#191c1e] rounded-bl-sm"
                }`}
                style={m.role === "user" ? { background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` } : {}}
              >
                {m.role === "assistant" ? md(m.content) : m.content}
              </div>
            </div>
          ))}
          {sending && <div className="flex justify-start"><div className="px-4 py-3 rounded-2xl bg-gray-50"><div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} /></div></div></div>}
          <div ref={endRef} />
        </div>
        <div className="border-t border-gray-100 p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={puterReady ? "Pose ta question ou décris ton besoin…" : "Chargement…"}
            disabled={!puterReady || sending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending || !puterReady}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 inline-flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
