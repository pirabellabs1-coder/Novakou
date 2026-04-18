/**
 * POST /api/formations/vendeur/sections
 *
 * Crée un module (section) dans une formation appartenant au vendeur connecté.
 * Body: { formationId: string, title?: string }
 *
 * - Vérifie l'ownership de la formation via instructeurId
 * - Calcule automatiquement l'order = nb de sections existantes (append à la fin)
 * - Retourne la section créée avec son tableau de leçons vide
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      formationId?: string;
      title?: string;
      desc?: string;
    };

    const formationId = body.formationId?.trim();
    if (!formationId) {
      return NextResponse.json({ error: "formationId requis" }, { status: 400 });
    }

    // Ownership check
    const formation = await prisma.formation.findFirst({
      where: { id: formationId, instructeurId: ctx.instructeurId },
      select: { id: true, _count: { select: { sections: true } } },
    });
    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    const title = (body.title?.trim() || `Module ${formation._count.sections + 1}`).slice(0, 200);

    const section = await prisma.section.create({
      data: {
        formationId: formation.id,
        title,
        desc: body.desc?.slice(0, 5000) || null,
        order: formation._count.sections,
      },
      include: { lessons: true },
    });

    return NextResponse.json({ data: section });
  } catch (err) {
    console.error("[sections POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
