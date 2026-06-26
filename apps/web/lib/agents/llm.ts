/**
 * Brique IA serveur ENFICHABLE pour les agents.
 *
 * Puter.js ne fonctionne QUE côté navigateur (session utilisateur) — il ne peut
 * pas servir les agents autonomes côté serveur. On utilise donc ici un LLM
 * appelable côté serveur, configuré par variable d'env (au choix) :
 *   - GROQ_API_KEY     → Groq (gratuit, rapide, compatible OpenAI)  [recommandé]
 *   - OPENAI_API_KEY   → OpenAI
 *   - GEMINI_API_KEY   → Google Gemini (free tier)
 *
 * Si AUCUNE clé n'est configurée → agentLLM() renvoie null : les agents
 * fonctionnent alors en MODE RÈGLES (sans IA), ce qui couvre déjà l'essentiel
 * (rapports, alertes, modération par mots-clés, relances). L'IA n'enrichit que
 * les actions « intelligentes » (réponses rédigées, analyse fine).
 */

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };
export type LlmResult = { text: string; tokensUsed: number; provider: string };

export function isLlmConfigured(): boolean {
  return !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
}

type Provider = {
  name: string;
  url: string;
  key: string;
  model: string;
  headers: (k: string) => Record<string, string>;
};

function resolveProvider(): Provider | null {
  if (process.env.GROQ_API_KEY) {
    return {
      name: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      headers: (k) => ({ Authorization: `Bearer ${k}`, "Content-Type": "application/json" }),
    };
  }
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 20) {
    return {
      name: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      key: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      headers: (k) => ({ Authorization: `Bearer ${k}`, "Content-Type": "application/json" }),
    };
  }
  return null; // Gemini géré séparément (format différent)
}

/**
 * Appelle le LLM serveur. Renvoie null si aucun provider configuré (mode règles)
 * ou en cas d'échec — l'agent doit alors se rabattre sur sa logique par règles.
 */
export async function agentLLM(
  messages: LlmMessage[],
  opts: { maxTokens?: number; temperature?: number; json?: boolean } = {},
): Promise<LlmResult | null> {
  // 1) Providers compatibles OpenAI (Groq / OpenAI)
  const p = resolveProvider();
  if (p) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25_000);
      const res = await fetch(p.url, {
        method: "POST",
        headers: p.headers(p.key),
        signal: ctrl.signal,
        body: JSON.stringify({
          model: p.model,
          messages,
          temperature: opts.temperature ?? 0.4,
          max_tokens: opts.maxTokens ?? 700,
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      clearTimeout(t);
      if (!res.ok) {
        console.warn(`[agentLLM ${p.name}] HTTP ${res.status}`);
        return null;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      const tokensUsed = data?.usage?.total_tokens ?? 0;
      if (!text) return null;
      return { text, tokensUsed, provider: p.name };
    } catch (e) {
      console.warn("[agentLLM] échec provider OpenAI-compat:", (e as Error).message);
      return null;
    }
  }

  // 2) Gemini (free tier) — format Google
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(sys ? { systemInstruction: { parts: [{ text: sys }] } } : {}),
            contents,
            generationConfig: {
              temperature: opts.temperature ?? 0.4,
              maxOutputTokens: opts.maxTokens ?? 700,
              ...(opts.json ? { responseMimeType: "application/json" } : {}),
            },
          }),
        },
      );
      if (!res.ok) {
        console.warn(`[agentLLM gemini] HTTP ${res.status}`);
        return null;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((x: { text?: string }) => x.text).join("") ?? "";
      const tokensUsed = data?.usageMetadata?.totalTokenCount ?? 0;
      if (!text) return null;
      return { text, tokensUsed, provider: "gemini" };
    } catch (e) {
      console.warn("[agentLLM] échec Gemini:", (e as Error).message);
      return null;
    }
  }

  return null; // aucun provider → mode règles
}
