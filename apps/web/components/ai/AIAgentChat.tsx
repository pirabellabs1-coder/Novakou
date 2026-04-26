"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

// ─── Markdown rendering ────────────────────────────────────────
// Uses react-markdown + remark-gfm for full GFM support (tables, links,
// code blocks, strikethrough, task lists). The previous home-grown parser
// silently dropped tables, leaving raw `|` characters in the response.
function MarkdownMessage({ children }: { children: string }) {
  return (
    <div className="text-sm text-[#191c1e] leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-extrabold text-[#191c1e] mt-5 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-extrabold text-[#191c1e] mt-5 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold text-[#191c1e] mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-[#191c1e] leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-[#191c1e] leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-[#191c1e]">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#006e2f] underline underline-offset-2 hover:text-[#22c55e]"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#22c55e] pl-3 my-2 text-zinc-600 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-zinc-200" />,
          // Tables — the missing feature that broke this UX
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-50">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-zinc-100 last:border-0">{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-bold text-[#191c1e] uppercase tracking-wide text-[10px]">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="px-3 py-2 align-top text-[#191c1e]">{children}</td>,
          // Code: distinguish inline vs fenced block via the `inline` prop
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className ?? "") || String(children).includes("\n");
            return isBlock ? (
              <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-900 text-emerald-300 p-3 text-[12px] leading-relaxed">
                <code {...props}>{children}</code>
              </pre>
            ) : (
              <code className="px-1 py-0.5 rounded bg-gray-100 text-[12px] font-mono text-[#191c1e]">
                {children}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
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
                {m.role === "assistant" ? <MarkdownMessage>{m.content}</MarkdownMessage> : m.content}
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
