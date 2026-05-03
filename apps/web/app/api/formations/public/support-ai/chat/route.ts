import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/api-rate-limit";

/**
 * POST /api/formations/public/support-ai/chat
 *
 * Endpoint public — relais entre le widget chatbot et OpenAI.
 *
 * Important : ON N'EXIGE AUCUNE INSCRIPTION DU VISITEUR. L'IA répond
 * directement, le coût est porté par Novakou (modèle gpt-4o-mini, faible
 * coût). On protège l'endpoint avec un rate-limit par IP pour éviter abuse.
 *
 * Body : { instructeurId, history: Message[], userMessage, pageContext? }
 * Réponse : { reply: string }
 */
export const dynamic = "force-dynamic";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_HISTORY = 20; // garde les 20 derniers messages max
const MAX_USER_MESSAGE_LEN = 2000; // limite le payload

type Message = { role: "user" | "assistant"; content: string };

function isMessage(x: unknown): x is Message {
  if (!x || typeof x !== "object") return false;
  const o = x as { role?: unknown; content?: unknown };
  return (o.role === "user" || o.role === "assistant") && typeof o.content === "string";
}

export async function POST(req: NextRequest) {
  // Rate limit : 30 req/min par IP — assez pour une vraie conversation, bloque les bots
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`support-ai:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de messages — patientez un instant avant de réessayer." },
      { status: 429 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Service IA non configuré — utilisez le formulaire de contact." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const { instructeurId, history, userMessage, pageContext } = (body ?? {}) as {
    instructeurId?: unknown;
    history?: unknown;
    userMessage?: unknown;
    pageContext?: unknown;
  };

  if (typeof instructeurId !== "string" || !instructeurId) {
    return NextResponse.json({ error: "instructeurId manquant" }, { status: 400 });
  }
  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }
  if (userMessage.length > MAX_USER_MESSAGE_LEN) {
    return NextResponse.json(
      { error: `Message trop long (max ${MAX_USER_MESSAGE_LEN} caractères)` },
      { status: 400 },
    );
  }

  const safeHistory: Message[] = Array.isArray(history)
    ? history.filter(isMessage).slice(-MAX_HISTORY)
    : [];
  const safePageContext = typeof pageContext === "string" ? pageContext.slice(0, 500) : "";

  // Charge la config du vendeur (pour le system prompt)
  const inst = await prisma.instructeurProfile.findUnique({
    where: { id: instructeurId },
    select: {
      supportAiEnabled: true,
      supportAiContext: true,
      user: { select: { name: true } },
    },
  });
  if (!inst || !inst.supportAiEnabled) {
    return NextResponse.json(
      { error: "Le chatbot de ce vendeur n'est pas actif." },
      { status: 404 },
    );
  }

  const vendorName = inst.user?.name ?? "le vendeur";
  const systemPrompt = `Tu es un assistant virtuel amical pour la boutique de ${vendorName} sur Novakou (marketplace de formations et produits digitaux pour l'Afrique francophone).

Ton rôle : aider les visiteurs à prendre des décisions d'achat, répondre à leurs questions sur les produits, les prix, les politiques. Tu es enthousiaste, professionnel et honnête.

Contexte du vendeur :
${inst.supportAiContext || "Aucun contexte spécifique fourni."}
${safePageContext ? `\nPage visitée : ${safePageContext}` : ""}

RÈGLES STRICTES :
- Réponds UNIQUEMENT en français
- Réponses courtes (2-4 phrases max, sauf question complexe)
- Si tu ne connais pas la réponse : "Je ne suis pas sûr, je vous conseille de contacter directement ${vendorName} via le formulaire."
- Jamais d'invention (pas de prix, pas de délai, pas de promesse qui ne figure pas dans le contexte)
- Ton africain francophone chaleureux mais professionnel
- Encourage à acheter quand c'est pertinent, sans pousser
- Si la question est hors sujet (politique, actualités) : recentre poliment sur la boutique`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...safeHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage.trim() },
  ];

  try {
    const aiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.warn("[support-ai/chat] OpenAI error", aiRes.status, errText.slice(0, 500));
      return NextResponse.json(
        { error: "L'IA est momentanément indisponible. Utilisez le formulaire ci-dessous." },
        { status: 502 },
      );
    }

    const json = (await aiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Réponse IA vide. Réessayez ou utilisez le formulaire." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[support-ai/chat]", err);
    return NextResponse.json(
      { error: "Erreur réseau côté IA. Réessayez ou utilisez le formulaire." },
      { status: 500 },
    );
  }
}
