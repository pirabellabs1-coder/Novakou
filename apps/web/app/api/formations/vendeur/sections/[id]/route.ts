/**
 * PATCH/DELETE /api/formations/vendeur/sections/[id]
 *
 * Édition / suppression d'un module (section) appartenant au vendeur connecté.
 * Vérifie l'ownership via section.formation.instructeurId.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

async function ensureOwnership(session: Awaited<ReturnType<typeof getServerSession>>, sectionId: string) {
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return null;
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { formation: { select: { instructeurId: true } } },
  });
  if (!section || section.formation.instructeurId !== ctx.instructeurId) return null;
  return { ctx, section };
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const owned = await ensureOwnership(session, id);
  if (!owned) return NextResponse.json({ error: "Module introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length < 1 || t.length > 200) {
      return NextResponse.json({ error: "Titre invalide (1-200 car.)" }, { status: 400 });
    }
    data.title = t;
  }
  if (typeof body.desc === "string") data.desc = body.desc.slice(0, 5000) || null;
  if (body.order !== undefined) {
    const o = Number(body.order);
    if (!Number.isFinite(o) || o < 0) {
      return NextResponse.json({ error: "Ordre invalide" }, { status: 400 });
    }
    data.order = Math.round(o);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const updated = await prisma.section.update({ where: { id }, data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const owned = await ensureOwnership(session, id);
  if (!owned) return NextResponse.json({ error: "Module introuvable" }, { status: 404 });

  // Cascade delete des leçons via Prisma onDelete: Cascade (configuré dans schema)
  await prisma.section.delete({ where: { id } });
  return NextResponse.json({ data: { ok: true } });
}
