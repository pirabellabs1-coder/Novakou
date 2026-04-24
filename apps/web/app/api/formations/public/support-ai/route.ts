import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/public/support-ai?instructeurId=XXX
 *                                 OR ?shopSlug=XXX
 *
 * Endpoint public lu par le widget AISupportWidget pour obtenir la config
 * du chatbot IA d'un vendeur donne. Pas d'auth, pas de sensitive data.
 *
 * Retourne null si le chatbot n'est pas active.
 */
export const dynamic = "force-dynamic";
export const revalidate = 60; // cache 1 minute cote CDN

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructeurId = searchParams.get("instructeurId");
    const shopSlug = searchParams.get("shopSlug");

    if (!instructeurId && !shopSlug) {
      return NextResponse.json({ data: null });
    }

    const where = instructeurId ? { id: instructeurId } : { shopSlug: shopSlug! };

    const inst = await prisma.instructeurProfile.findFirst({
      where: {
        ...where,
        supportAiEnabled: true, // ne rien renvoyer si desactive
      },
      select: {
        id: true,
        supportAiWelcome: true,
        supportAiContext: true,
        supportAiColor: true,
        user: { select: { name: true, image: true, avatar: true } },
      },
    });

    if (!inst) return NextResponse.json({ data: null });

    return NextResponse.json({
      data: {
        instructeurId: inst.id,
        vendorName: inst.user?.name ?? "Le vendeur",
        vendorAvatar: inst.user?.avatar ?? inst.user?.image ?? null,
        welcome: inst.supportAiWelcome ?? `Bonjour ! Je suis l'assistant de ${inst.user?.name ?? "cette boutique"}. Comment puis-je vous aider ?`,
        context: inst.supportAiContext ?? "",
        color: inst.supportAiColor ?? "#006e2f",
      },
    });
  } catch (err) {
    console.error("[public/support-ai GET]", err);
    return NextResponse.json({ data: null });
  }
}
