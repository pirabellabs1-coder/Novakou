/**
 * Brique IA serveur des agents autonomes.
 *
 * Un seul fournisseur : OpenRouter (décision fondateur 2026-08-12). Ce module
 * empilait auparavant Groq, OpenAI puis Gemini, chacun avec son format et sa
 * clé — trois chemins de panne pour un seul besoin, et aucune idée de qui
 * répondait réellement.
 *
 * Sans clé configurée, `agentLLM()` renvoie null : les agents fonctionnent
 * alors en MODE RÈGLES, ce qui couvre déjà rapports, alertes, modération par
 * mots-clés et relances. L'IA n'enrichit que les actions rédigées.
 */

import { chatIAOuNull, estOpenRouterConfigure } from "@/lib/ai/openrouter";


export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };
export type LlmResult = { text: string; tokensUsed: number; provider: string };

export function isLlmConfigured(): boolean {
  return estOpenRouterConfigure();
}

/**
 * Appelle le modèle. Renvoie null si l'IA n'est pas configurée ou si l'appel
 * échoue : l'agent se rabat alors sur sa logique par règles, qui couvre déjà
 * l'essentiel (rapports, alertes, relances).
 */
export async function agentLLM(
  messages: LlmMessage[],
  opts: { maxTokens?: number; temperature?: number; json?: boolean } = {},
): Promise<LlmResult | null> {
  if (!estOpenRouterConfigure()) return null;
  const r = await chatIAOuNull({
    messages,
    maxTokens: opts.maxTokens ?? 700,
    temperature: opts.temperature ?? 0.4,
    json: opts.json,
    timeoutMs: 25_000,
  });
  if (!r) return null;
  return { text: r.texte, tokensUsed: r.jetons, provider: r.modele };
}
