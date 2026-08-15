import "server-only";

/**
 * OPENROUTER — la seule porte d'entrée vers un modèle de langage.
 *
 * Décision fondateur (2026-08-12) : tout le site passe par OpenRouter. Avant,
 * l'IA était éclatée entre cinq fournisseurs — Groq, OpenAI, Gemini, Anthropic
 * en direct, et Puter.js dans le navigateur — chacun avec sa clé, son format
 * et son mode de panne. Personne ne pouvait dire ce que l'IA coûtait, ni quel
 * fournisseur répondait à un moment donné.
 *
 * OpenRouter parle le protocole d'OpenAI et sert des centaines de modèles
 * derrière une seule clé : le choix du modèle devient une variable, plus une
 * réécriture.
 *
 * ─── CE QUI NE PASSE PAS PAR ICI ───────────────────────────────────────────
 * La TRANSCRIPTION VOCALE. OpenRouter n'expose que la complétion de discussion
 * (texte et image) : aucun point d'entrée audio. Les messages vocaux de la
 * messagerie continuent donc d'utiliser Whisper d'OpenAI, et c'est le seul
 * endroit du site où une autre clé subsiste — volontairement, pas par oubli.
 *
 * ─── LA CLÉ NE SORT JAMAIS D'ICI ───────────────────────────────────────────
 * Ce module est `server-only`. Une clé OpenRouter dans le navigateur, c'est
 * n'importe qui qui dépense notre crédit. Les écrans passent par
 * `/api/ai/chat`, qui authentifie et compte.
 */

const URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Modèle par défaut. Modifiable sans toucher au code via OPENROUTER_MODEL —
 * c'est justement l'intérêt d'OpenRouter.
 */
export const MODELE_DEFAUT = process.env.OPENROUTER_MODEL?.trim() || "anthropic/claude-sonnet-5";

export type MessageIA = { role: "system" | "user" | "assistant"; content: string };

export type ReponseIA = {
  texte: string;
  modele: string;
  /** Jetons facturés, quand OpenRouter les renvoie — sert au suivi du coût. */
  jetons: number;
};

export function estOpenRouterConfigure(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

/**
 * Appelle un modèle. Lève une erreur explicite plutôt que de renvoyer un texte
 * vide : un écran qui affiche « » sans rien dire laisse l'utilisateur croire
 * que l'IA n'a rien à répondre, alors que la clé est absente ou le crédit épuisé.
 */
export async function chatIA(params: {
  messages: MessageIA[];
  modele?: string;
  temperature?: number;
  maxTokens?: number;
  /** Force une réponse JSON stricte (extraction, classement). */
  json?: boolean;
  timeoutMs?: number;
}): Promise<ReponseIA> {
  const cle = process.env.OPENROUTER_API_KEY?.trim();
  if (!cle) {
    throw new Error("OPENROUTER_API_KEY absente — l'IA n'est pas configurée.");
  }

  const modele = params.modele?.trim() || MODELE_DEFAUT;
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), params.timeoutMs ?? 60_000);

  try {
    const res = await fetch(URL_OPENROUTER, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
        // Recommandé par OpenRouter : identifie l'application appelante dans
        // leur tableau de bord. Sans ça, impossible de savoir quelle partie du
        // site consomme quoi quand la facture monte.
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com",
        "X-Title": "Novakou",
      },
      body: JSON.stringify({
        model: modele,
        messages: params.messages,
        temperature: params.temperature ?? 0.4,
        max_tokens: params.maxTokens ?? 1200,
        ...(params.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    const brut = await res.text();
    if (!res.ok) {
      // On garde le corps : « 402 crédit épuisé » et « 400 modèle inconnu »
      // appellent des gestes très différents, et un message générique nous
      // ferait chercher au mauvais endroit.
      throw new Error(`OpenRouter HTTP ${res.status} : ${brut.slice(0, 300)}`);
    }

    const j = JSON.parse(brut) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
      model?: string;
    };
    const texte = j.choices?.[0]?.message?.content ?? "";
    if (!texte.trim()) {
      throw new Error("OpenRouter a répondu sans contenu.");
    }
    return { texte, modele: j.model ?? modele, jetons: j.usage?.total_tokens ?? 0 };
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Variante tolérante, pour les appels d'agrément (agents autonomes, suggestions).
 * Renvoie null au lieu de lever : l'appelant doit alors se rabattre sur sa
 * logique par règles plutôt que d'échouer devant l'utilisateur.
 */
export async function chatIAOuNull(
  params: Parameters<typeof chatIA>[0],
): Promise<ReponseIA | null> {
  try {
    return await chatIA(params);
  } catch (err) {
    console.warn("[openrouter]", err instanceof Error ? err.message : err);
    return null;
  }
}
