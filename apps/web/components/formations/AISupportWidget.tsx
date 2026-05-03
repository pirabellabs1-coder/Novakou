"use client";

import React, { useEffect, useRef, useState } from "react";

// ─── Mini parser Markdown pour le chat ─────────────────────────
// Gere : **gras**, *italique*, `code`, [lien](url), listes simples
// Retourne un array de React nodes qui preservent les sauts de ligne.
/** Parse inline markdown (bold, code, links, italic) */
function renderInline(line: string, lineIdx: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={`${lineIdx}-${match.index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={`${lineIdx}-${match.index}`} className="px-1 py-0.5 rounded bg-gray-100 text-[11px] font-mono">{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(<a key={`${lineIdx}-${match.index}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline text-inherit">{linkMatch[1]}</a>);
      } else parts.push(token);
    } else if (token.startsWith("*")) {
      parts.push(<em key={`${lineIdx}-${match.index}`}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    // Detect markdown table: current line starts with |, next line is separator
    if (
      lines[i].trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^[\s|:-]+$/.test(lines[i + 1].trim()) &&
      lines[i + 1].includes("|")
    ) {
      const parseCells = (line: string) => line.split("|").map((c) => c.trim()).filter((_, ci, arr) => ci > 0 && ci < arr.length);
      const headers = parseCells(lines[i]);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseCells(lines[i]));
        i++;
      }
      nodes.push(
        <div key={`tbl-${i}`} className="my-2 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((h, hi) => (
                  <th key={hi} className="px-2 py-1.5 text-left font-semibold border-b border-gray-200 whitespace-nowrap">{renderInline(h, hi)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? "bg-gray-50/50" : ""}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 border-b border-gray-100 whitespace-nowrap">{renderInline(cell, ri * 100 + ci)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Normal line
    nodes.push(<span key={i}>{renderInline(lines[i], i)}</span>);
    if (i < lines.length - 1) nodes.push(<br key={`br-${i}`} />);
    i++;
  }

  return nodes;
}

// ─── Props ─────────────────────────────────────────────────────
interface AISupportWidgetProps {
  instructeurId?: string;
  shopSlug?: string;
  // Contexte optionnel supplémentaire (ex: "Le visiteur regarde le produit X à Y FCFA")
  pageContext?: string;
}

type VendorConfig = {
  instructeurId: string;
  vendorName: string;
  vendorAvatar: string | null;
  welcome: string;
  context: string;
  color: string;
};

type Message = { role: "user" | "assistant"; content: string };

// ─── Widget ────────────────────────────────────────────────────
//
// IMPORTANT : ce widget appelle un endpoint serveur Novakou
// (/api/formations/public/support-ai/chat) qui relaie vers OpenAI
// avec la clé serveur. Le visiteur ne voit AUCUN prompt de
// connexion à un service tiers (pas de Puter, pas de signup).
// Coût IA porté par Novakou (gpt-4o-mini, faible coût/token).
export default function AISupportWidget({ instructeurId, shopSlug, pageContext }: AISupportWidgetProps) {
  const [config, setConfig] = useState<VendorConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [fallbackSent, setFallbackSent] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch vendor config
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const qs = new URLSearchParams();
        if (instructeurId) qs.set("instructeurId", instructeurId);
        else if (shopSlug) qs.set("shopSlug", shopSlug);
        else return;
        const res = await fetch(`/api/formations/public/support-ai?${qs.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancel) return;
        if (json.data) {
          setConfig(json.data);
          setMessages([{ role: "assistant", content: json.data.welcome }]);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancel = true; };
  }, [instructeurId, shopSlug]);

  // Autoscroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    if (!input.trim() || sending || !config) return;

    const userMessage = input.trim();
    setInput("");
    // Build the history we'll send (without the welcome message)
    const historyForApi = messages.filter((_, i) => i > 0); // skip welcome
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setSending(true);

    try {
      const res = await fetch("/api/formations/public/support-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructeurId: config.instructeurId,
          history: historyForApi,
          userMessage,
          pageContext: pageContext ?? "",
        }),
      });
      const json = await res.json().catch(() => ({} as { reply?: string; error?: string }));
      if (!res.ok || !json.reply) {
        // Echec IA → on propose le formulaire de contact en repli
        setInquiryError(
          json.error ||
            "L'IA est momentanément indisponible. Laissez vos coordonnées et le vendeur vous recontactera.",
        );
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Désolé, je rencontre un souci technique. Vous pouvez écrire directement à ${config.vendorName} via le formulaire ci-dessous.`,
        }]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
    } catch (e) {
      console.error("[AISupportWidget]", e);
      setInquiryError(
        "Problème réseau. Laissez vos coordonnées et le vendeur vous recontactera.",
      );
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Désolé, je rencontre un problème de connexion. Vous pouvez contacter directement ${config.vendorName} via le formulaire ci-dessous.`,
      }]);
    } finally {
      setSending(false);
    }
  }

  async function sendInquiry() {
    if (!fallbackEmail.trim() || !fallbackMessage.trim() || !config) return;
    setInquiryError(null);
    try {
      const res = await fetch("/api/formations/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructeurId: config.instructeurId,
          visitorName: fallbackName,
          visitorEmail: fallbackEmail,
          subject: "Question via chatbot IA",
          message: fallbackMessage,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Erreur");
      }
      setFallbackSent(true);
    } catch (e) {
      setInquiryError(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (!config) return null;

  return (
    <>
      {/* Bubble button (fermé) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full shadow-xl text-white flex items-center justify-center hover:scale-105 transition-transform"
          style={{ backgroundColor: config.color }}
          aria-label="Ouvrir l'assistant"
        >
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        // Mobile: quasi plein-écran (haut → bas) pour ne pas couper l'entête.
        // Desktop: ancré bottom-right avec max-h-screen pour s'adapter aux
        // viewports courts (laptops 13" à 720p) où h-[560px] dépasse la
        // hauteur disponible et coupe la top bar du widget.
        <div className="fixed inset-x-3 bottom-3 top-3 sm:inset-x-auto sm:top-auto sm:bottom-5 sm:right-5 z-[9999] sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100vh-2.5rem)] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between text-white"
            style={{ backgroundColor: config.color }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {config.vendorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.vendorAvatar} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{config.vendorName}</p>
                <p className="text-[10px] opacity-90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Assistant IA en ligne
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "text-white rounded-br-sm whitespace-pre-wrap"
                      : "bg-white text-[#191c1e] rounded-bl-sm border border-gray-100"
                  }`}
                  style={m.role === "user" ? { backgroundColor: config.color } : {}}
                >
                  {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-3 rounded-2xl bg-white border border-gray-100 rounded-bl-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Fallback form (si erreur IA) */}
          {inquiryError && !fallbackSent && (
            <div className="p-3 bg-amber-50 border-t border-amber-200 space-y-2">
              <p className="text-xs text-amber-800 font-semibold">📨 Laissez un message au vendeur</p>
              <input
                type="text"
                placeholder="Votre nom"
                value={fallbackName}
                onChange={(e) => setFallbackName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
              />
              <input
                type="email"
                placeholder="Votre email *"
                value={fallbackEmail}
                onChange={(e) => setFallbackEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
              />
              <textarea
                rows={2}
                placeholder="Votre question *"
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
              />
              <button
                onClick={sendInquiry}
                disabled={!fallbackEmail.trim() || !fallbackMessage.trim()}
                className="w-full py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-50"
                style={{ backgroundColor: config.color }}
              >
                Envoyer
              </button>
            </div>
          )}

          {fallbackSent && (
            <div className="p-3 bg-emerald-50 border-t border-emerald-200 text-center">
              <p className="text-xs text-emerald-800 font-bold">✅ Message envoyé ! Le vendeur vous recontactera par email.</p>
            </div>
          )}

          {/* Input */}
          {!inquiryError && (
            <div className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Posez votre question…"
                disabled={sending}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-40"
                style={{ backgroundColor: config.color }}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          )}

          <div className="px-3 pb-2 text-center">
            <p className="text-[9px] text-[#5c647a]">
              Propulsé par IA · Les réponses peuvent être approximatives.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
