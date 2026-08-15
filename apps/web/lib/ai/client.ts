"use client";

import type { Usage } from "@/lib/ai/usages";

/**
 * L'IA vue depuis le navigateur.
 *
 * Remplace `window.puter.ai.chat(...)`. La différence tient en une phrase :
 * plus aucune clé ni aucun choix de modèle ne vit dans le navigateur. L'écran
 * dit ce qu'il veut faire (`usage`) et envoie son texte ; le serveur décide du
 * modèle, de la longueur, et compte la dépense.
 *
 * Il n'y a donc plus de SDK à charger, donc plus d'état « prêt / pas prêt » à
 * surveiller : l'appel part immédiatement.
 */

export type OptionsIA = {
  usage: Usage;
  /** Plafonné côté serveur par les règles de l'usage. */
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
  signal?: AbortSignal;
};

export class ErreurIA extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Envoie une demande et renvoie le TEXTE de la réponse.
 *
 * Lève une `ErreurIA` avec un message déjà rédigé pour l'utilisateur : quota
 * atteint, connexion requise, assistant indisponible. L'appelant peut donc
 * l'afficher tel quel plutôt que d'inventer un message générique.
 */
export async function chatIA(prompt: string, opts: OptionsIA): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts.signal,
    body: JSON.stringify({
      usage: opts.usage,
      prompt,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
      json: opts.json,
    }),
  });

  const j = (await res.json().catch(() => ({}))) as {
    data?: { texte?: string };
    error?: string;
    code?: string;
  };

  if (!res.ok) {
    throw new ErreurIA(
      j.error || "L'assistant n'a pas pu répondre.",
      j.code || String(res.status),
    );
  }
  return j.data?.texte ?? "";
}
