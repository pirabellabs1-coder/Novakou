/**
 * PATCH /api/formations/vendeur/lessons/[id]
 *
 * Met à jour une leçon qui appartient à une formation du vendeur connecté.
 * Accepte : title, desc, videoUrl, duration, order, isFree, type.
 * Vérifie la propriété via join Formation.instructeurId = ctx.instructeurId.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

const VALID_TYPES = new Set(["VIDEO", "PDF", "TEXTE", "AUDIO", "QUIZ"]);

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Ownership check
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      section: { select: { formation: { select: { instructeurId: true } } } },
    },
  });
  if (!lesson || lesson.section?.formation?.instructeurId !== ctx.instructeurId) {
    return NextResponse.json({ error: "Leçon introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length < 2 || t.length > 200) {
      return NextResponse.json({ error: "Titre invalide (2-200 car.)" }, { status: 400 });
    }
    data.title = t;
  }
  if (typeof body.desc === "string") data.desc = body.desc.slice(0, 5000) || null;

  if (typeof body.videoUrl === "string" || body.videoUrl === null) {
    const url = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";
    if (url && !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "URL vidéo invalide (doit commencer par https://)" }, { status: 400 });
    }
    data.videoUrl = url || null;
  }

  if (body.duration !== undefined) {
    const d = Number(body.duration);
    if (!Number.isFinite(d) || d < 0 || d > 86400) {
      return NextResponse.json({ error: "Durée invalide (0-86400 secondes)" }, { status: 400 });
    }
    data.duration = Math.round(d);
  }

  if (body.order !== undefined) {
    const o = Number(body.order);
    if (!Number.isFinite(o) || o < 0) {
      return NextResponse.json({ error: "Ordre invalide" }, { status: 400 });
    }
    data.order = Math.round(o);
  }

  if (typeof body.isFree === "boolean") data.isFree = body.isFree;

  if (typeof body.type === "string") {
    const t = body.type.toUpperCase();
    if (!VALID_TYPES.has(t)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }
    data.type = t;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      section: { select: { formation: { select: { instructeurId: true } } } },
    },
  });
  if (!lesson || lesson.section?.formation?.instructeurId !== ctx.instructeurId) {
    return NextResponse.json({ error: "Leçon introuvable" }, { status: 404 });
  }

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
