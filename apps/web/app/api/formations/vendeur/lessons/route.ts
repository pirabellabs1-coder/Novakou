/**
 * POST /api/formations/vendeur/lessons
 *
 * Crée une leçon dans une section appartenant au vendeur connecté.
 * Body: { sectionId: string, title?: string, type?: LessonType, duration?: number, videoUrl?: string }
 *
 * - Vérifie l'ownership via section.formation.instructeurId
 * - Calcule l'order = nb de leçons existantes (append à la fin)
 * - Type par défaut = VIDEO
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";
import { LessonType } from "@prisma/client";

const VALID_TYPES: LessonType[] = ["VIDEO", "PDF", "TEXTE", "AUDIO", "QUIZ"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      sectionId?: string;
      title?: string;
      type?: string;
      duration?: number;
      videoUrl?: string;
      isFree?: boolean;
    };

    const sectionId = body.sectionId?.trim();
    if (!sectionId) {
      return NextResponse.json({ error: "sectionId requis" }, { status: 400 });
    }

    // Ownership check via section.formation.instructeurId
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        formation: { select: { instructeurId: true } },
        _count: { select: { lessons: true } },
      },
    });
    if (!section || section.formation.instructeurId !== ctx.instructeurId) {
      return NextResponse.json({ error: "Module introuvable" }, { status: 404 });
    }

    const title = (body.title?.trim() || `Leçon ${section._count.lessons + 1}`).slice(0, 200);
    const typeRaw = (body.type ?? "VIDEO").toString().toUpperCase() as LessonType;
    const type: LessonType = VALID_TYPES.includes(typeRaw) ? typeRaw : "VIDEO";

    let videoUrl: string | null = null;
    if (typeof body.videoUrl === "string" && body.videoUrl.trim()) {
      const url = body.videoUrl.trim();
      if (!/^https?:\/\//.test(url)) {
        return NextResponse.json({ error: "URL vidéo invalide (doit commencer par https://)" }, { status: 400 });
      }
      videoUrl = url;
    }

    let duration: number | null = null;
    if (body.duration !== undefined) {
      const d = Number(body.duration);
      if (!Number.isFinite(d) || d < 0 || d > 86400) {
        return NextResponse.json({ error: "Durée invalide (0-86400 secondes)" }, { status: 400 });
      }
      duration = Math.round(d);
    }

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: section.id,
        title,
        type,
        duration,
        videoUrl,
        order: section._count.lessons,
        isFree: typeof body.isFree === "boolean" ? body.isFree : false,
      },
    });

    return NextResponse.json({ data: lesson });
  } catch (err) {
    console.error("[lessons POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
