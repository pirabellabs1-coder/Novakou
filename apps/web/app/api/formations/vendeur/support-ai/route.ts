import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * GET /api/formations/vendeur/support-ai
 * Retourne la config actuelle du chatbot IA du vendeur connecte.
 *
 * PATCH /api/formations/vendeur/support-ai
 * Met a jour la config.
 * Body: { enabled?, welcome?, context?, color? }
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const inst = await prisma.instructeurProfile.findUnique({
      where: { id: ctx.instructeurId },
      select: {
        supportAiEnabled: true,
        supportAiWelcome: true,
        supportAiContext: true,
        supportAiColor: true,
      },
    });

    return NextResponse.json({
      data: {
        enabled: inst?.supportAiEnabled ?? false,
        welcome: inst?.supportAiWelcome ?? "",
        context: inst?.supportAiContext ?? "",
        color: inst?.supportAiColor ?? "#006e2f",
      },
    });
  } catch (err) {
    console.error("[vendeur/support-ai GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const body = await request.json();
    const { enabled, welcome, context, color } = body as {
      enabled?: boolean;
      welcome?: string;
      context?: string;
      color?: string;
    };

    // Validation simple
    if (typeof context === "string" && context.length > 8000) {
      return NextResponse.json(
        { error: "Le contexte ne peut pas dépasser 8000 caractères" },
        { status: 400 },
      );
    }
    if (typeof welcome === "string" && welcome.length > 300) {
      return NextResponse.json(
        { error: "Le message d'accueil ne peut pas dépasser 300 caractères" },
        { status: 400 },
      );
    }
    if (typeof color === "string" && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: "Couleur invalide (attendu: #RRGGBB)" },
        { status: 400 },
      );
    }

    const updated = await prisma.instructeurProfile.update({
      where: { id: ctx.instructeurId },
      data: {
        ...(typeof enabled === "boolean" && { supportAiEnabled: enabled }),
        ...(typeof welcome === "string" && { supportAiWelcome: welcome.trim() || null }),
        ...(typeof context === "string" && { supportAiContext: context.trim() || null }),
        ...(typeof color === "string" && { supportAiColor: color }),
      },
      select: {
        supportAiEnabled: true,
        supportAiWelcome: true,
        supportAiContext: true,
        supportAiColor: true,
      },
    });

    return NextResponse.json({
      data: {
        enabled: updated.supportAiEnabled,
        welcome: updated.supportAiWelcome ?? "",
        context: updated.supportAiContext ?? "",
        color: updated.supportAiColor ?? "#006e2f",
      },
    });
  } catch (err) {
    console.error("[vendeur/support-ai PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
