"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

// ─── Types Puter ───────────────────────────────────────────────
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
    return c
      .map((b) => (b && typeof b === "object" && typeof b.text === "string" ? b.text : ""))
      .join("");
  }
  return "";
}

// ─── Mini parser Markdown pour le chat ─────────────────────────
// Gere : **gras**, *italique*, `code`, [lien](url), listes simples
// Retourne un array de React nodes qui preservent les sauts de ligne.
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    // Regex capture dans l'ordre : **bold**, `code`, [text](url), *italic*
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("**")) {
        parts.push(<strong key={`${lineIdx}-${match.index}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("`")) {
        parts.push(<code key={`${lineIdx}-${match.index}`} className="px-1 py-0.5 rounded bg-gray-100 text-[11px] font-mono">{token.slice(1, -1)}</code>);
      } else if (token.startsWith("[")) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          parts.push(
            <a key={`${lineIdx}-${match.index}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline text-inherit">
              {linkMatch[1]}
            </a>,
          );
        } else {
          parts.push(token);
        }
      } else if (token.startsWith("*")) {
        parts.push(<em key={`${lineIdx}-${match.index}`}>{token.slice(1, -1)}</em>);
      }
      lastIndex = match.index + token.length;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    nodes.push(<span key={lineIdx}>{parts}</span>);
    if (lineIdx < lines.length - 1) {
      nodes.push(<br key={`br-${lineIdx}`} />);
    }
  });

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
export default function AISupportWidget({ instructeurId, shopSlug, pageContext }: AISupportWidgetProps) {
  const [config, setConfig] = useState<VendorConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [fallbackSent, setFallbackSent] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check Puter availability
  useEffect(() => {
    const check = () => {
      if (typeof window !== "undefined" && window.puter) {
        setPuterReady(true);
        return true;
      }
      return false;
    };
    if (!check()) {
      const interval = setInterval(() => { if (check()) clearInterval(interval); }, 300);
      return () => clearInterval(interval);
    }
  }, []);

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

    if (!puterReady || !window.puter) {
      // Fallback: open the inquiry form
      setInquiryError("L'IA n'est pas disponible. Laissez vos coordonnées et le vendeur vous recontactera.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setSending(true);

    // Build system prompt
    const systemPrompt = `Tu es un assistant virtuel amical pour la boutique de ${config.vendorName} sur Novakou (marketplace de formations et produits digitaux pour l'Afrique francophone).

Ton role : aider les visiteurs a prendre des decisions d'achat, repondre a leurs questions sur les produits, les prix, les politiques. Tu es enthousiaste, professionnel et honnete.

Contexte du vendeur :
${config.context || "Aucun contexte fourni pour l'instant."}

${pageContext ? `\nPage visitee : ${pageContext}\n` : ""}

REGLES STRICTES :
- Reponds UNIQUEMENT en francais
- Reponses courtes (2-4 phrases max, sauf question complexe)
- Si tu ne connais pas la reponse : "Je ne suis pas sur, je vous conseille de contacter directement ${config.vendorName} via le formulaire."
- Jamais d'invention (pas de prix, pas de delai, pas de promesse qui ne figure pas dans le contexte)
- Ton africain francophone chaleureux mais professionnel
- Encourage a acheter quand c'est pertinent, sans pousser
- Si la question est hors sujet (ex: politique, actualites) : recentre poliment sur la boutique`;

    // Conversation history
    const conversationForAI = [
      ...messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) !== 0), // skip welcome msg
      { role: "user" as const, content: userMessage },
    ];

    const fullPrompt = `${systemPrompt}\n\nHistorique de la conversation :\n${conversationForAI
      .map((m) => `${m.role === "user" ? "Visiteur" : "Assistant"}: ${m.content}`)
      .join("\n")}\n\nAssistant:`;

    try {
      const response = await window.puter.ai.chat(fullPrompt, {
        model: "claude-sonnet-4-6",
        temperature: 0.5,
        max_tokens: 500,
      });
      const text = extractText(response).trim();
      setMessages((prev) => [...prev, { role: "assistant", content: text || "Désolé, je n'ai pas compris. Pouvez-vous reformuler ?" }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Désolé, je rencontre un problème technique. Vous pouvez contacter directement ${config.vendorName} via le formulaire ci-dessous.`,
      }]);
      console.error("[AISupportWidget]", e);
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
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

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
        <div className="fixed bottom-5 right-5 z-[9999] w-[calc(100vw-2.5rem)] sm:w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
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

          {/* Fallback form (si erreur Puter) */}
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
                placeholder={puterReady ? "Posez votre question…" : "Chargement de l'IA…"}
                disabled={!puterReady || sending}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending || !puterReady}
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
