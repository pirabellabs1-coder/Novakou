import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { rateLimit } from "@/lib/api-rate-limit";
import { chatIA, estOpenRouterConfigure, type MessageIA } from "@/lib/ai/openrouter";
import { USAGES, estUnUsage, PLAFOND_QUOTIDIEN_SITE } from "@/lib/ai/usages";

/**
 * POST /api/ai/chat
 *
 * LE SEUL CHEMIN par lequel un écran peut parler à un modèle.
 *
 * Avant, les écrans appelaient Puter.js directement dans le navigateur : le
 * compte de l'utilisateur payait, donc aucun garde-fou n'était nécessaire. En
 * passant à OpenRouter, c'est NOTRE crédit qui part à chaque génération — et
 * une clé dans le navigateur serait lisible par n'importe qui.
 *
 * D'où cette route, et trois barrages :
 *   1. la clé reste sur le serveur, toujours ;
 *   2. le navigateur ne choisit NI le modèle NI la longueur de réponse — il
 *      annonce seulement un usage, dont les règles sont fixées côté serveur ;
 *   3. trois compteurs bornent la dépense : par personne, par rafale, et un
 *      plafond global pour le site entier.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const JOUR_MS = 24 * 3600 * 1000;

function adresse(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "inconnu"
  );
}

export async function POST(req: NextRequest) {
  if (!estOpenRouterConfigure()) {
    return NextResponse.json(
      { error: "L'assistant n'est pas disponible pour le moment.", code: "AI_OFF" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    usage?: string;
    prompt?: string;
    messages?: MessageIA[];
    /** Facultatif, et TOUJOURS ramené sous le plafond de l'usage. */
    maxTokens?: number;
    temperature?: number;
    json?: boolean;
  };

  if (!estUnUsage(body.usage)) {
    return NextResponse.json({ error: "Usage inconnu." }, { status: 400 });
  }
  const regles = USAGES[body.usage];

  const messages: MessageIA[] =
    Array.isArray(body.messages) && body.messages.length > 0
      ? body.messages.filter((m) => m && typeof m.content === "string")
      : typeof body.prompt === "string" && body.prompt.trim()
        ? [{ role: "user", content: body.prompt }]
        : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "Aucun contenu à traiter." }, { status: 400 });
  }

  // Garde-fou d'entrée : une invite démesurée coûte cher même si la réponse
  // est courte — les jetons envoyés sont facturés eux aussi.
  const tailleEntree = messages.reduce((n, m) => n + m.content.length, 0);
  if (tailleEntree > 60_000) {
    return NextResponse.json({ error: "Demande trop longue." }, { status: 413 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  if (!userId && !regles.publiquement) {
    return NextResponse.json(
      { error: "Connectez-vous pour utiliser l'assistant.", code: "AUTH" },
      { status: 401 },
    );
  }

  // Identité de comptage : le compte s'il existe, l'adresse sinon. Une adresse
  // est contournable, mais c'est le seul repère disponible pour un visiteur —
  // et le plafond global rattrape ce que ce compteur laisse passer.
  const qui = userId ?? `ip:${adresse(req)}`;

  // 1. Rafale : empêche une boucle de vider le quota du jour en dix secondes.
  const rafale = await rateLimit(`ai-burst:${qui}`, 6, 60_000);
  if (!rafale.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes d'un coup. Patientez une minute.", code: "BURST" },
      { status: 429 },
    );
  }

  // 2. Quota quotidien de la personne, par usage.
  const quota = await rateLimit(`ai-jour:${body.usage}:${qui}`, regles.parJour, JOUR_MS);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "Vous avez atteint votre limite d'utilisation de l'assistant pour aujourd'hui.",
        code: "QUOTA",
      },
      { status: 429 },
    );
  }

  // 3. Plafond du site : borne la facture, quoi qu'il arrive côté utilisateurs.
  const global = await rateLimit("ai-jour:site", PLAFOND_QUOTIDIEN_SITE, JOUR_MS);
  if (!global.allowed) {
    console.error("[ai/chat] PLAFOND QUOTIDIEN DU SITE ATTEINT", PLAFOND_QUOTIDIEN_SITE);
    return NextResponse.json(
      {
        error: "L'assistant est momentanément indisponible. Réessayez demain.",
        code: "PLAFOND_SITE",
      },
      { status: 429 },
    );
  }

  try {
    const r = await chatIA({
      messages,
      modele: regles.modele,
      // Le client peut demander MOINS que le plafond de l'usage, jamais plus.
      maxTokens: Math.min(regles.maxTokens, Math.max(1, body.maxTokens ?? regles.maxTokens)),
      temperature: typeof body.temperature === "number" ? body.temperature : regles.temperature,
      json: body.json === true,
    });
    return NextResponse.json({
      data: { texte: r.texte, modele: r.modele, jetons: r.jetons, restantAujourdhui: quota.remaining },
    });
  } catch (err) {
    // Le détail part dans les journaux, pas à l'écran : il contient le nom du
    // modèle et l'état du compte, qui ne regardent pas un visiteur.
    console.error("[ai/chat]", body.usage, err);
    return NextResponse.json(
      { error: "L'assistant n'a pas pu répondre. Réessayez dans un instant.", code: "UPSTREAM" },
      { status: 502 },
    );
  }
}
