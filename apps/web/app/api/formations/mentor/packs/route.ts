/**
 * Mentor session packs API — CRUD from the mentor's own dashboard.
 *
 * GET    → list my packs
 * POST   → create a new pack { title, sessionsCount, priceXof, sessionDurationMinutes?, description?, validityDays? }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

async function getMentorProfileId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const m = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return m?.id ?? null;
}

export async function GET() {
  const mentorId = await getMentorProfileId();
  if (!mentorId) return NextResponse.json({ error: "Non authentifié ou profil mentor introuvable" }, { status: 401 });
  const packs = await prisma.mentorSessionPack.findMany({
    where: { mentorId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { purchases: true } },
    },
  });
  return NextResponse.json({ data: packs });
}

export async function POST(req: Request) {
  const mentorId = await getMentorProfileId();
  if (!mentorId) return NextResponse.json({ error: "Non authentifié ou profil mentor introuvable" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const sessionsCount = Number(body.sessionsCount);
  const priceXof = Number(body.priceXof);
  const sessionDurationMinutes = Number(body.sessionDurationMinutes ?? 60);
  const description = body.description ? String(body.description).trim() : null;
  const validityDays = Number(body.validityDays ?? 180);

  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  if (!Number.isFinite(sessionsCount) || sessionsCount < 2 || sessionsCount > 50) {
    return NextResponse.json({ error: "Nombre de séances invalide (2 à 50)" }, { status: 400 });
  }
  if (!Number.isFinite(priceXof) || priceXof < 500) {
    return NextResponse.json({ error: "Prix invalide (minimum 500 FCFA)" }, { status: 400 });
  }
  if (!Number.isFinite(sessionDurationMinutes) || sessionDurationMinutes < 15 || sessionDurationMinutes > 240) {
    return NextResponse.json({ error: "Durée de séance invalide (15-240 min)" }, { status: 400 });
  }
  if (!Number.isFinite(validityDays) || validityDays < 30 || validityDays > 730) {
    return NextResponse.json({ error: "Validité invalide (30-730 jours)" }, { status: 400 });
  }

  const pack = await prisma.mentorSessionPack.create({
    data: {
      mentorId,
      title,
      sessionsCount,
      priceXof,
      sessionDurationMinutes,
      description,
      validityDays,
    },
  });
  return NextResponse.json({ data: pack }, { status: 201 });
}
