/**
 * Mentor resources library — PDF / video / link / audio files shareable
 * with students after a session.
 *
 * GET  → list my resources
 * POST { title, kind, url, description?, fileSize?, tags?[], isPublic? }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

const VALID_KINDS = new Set(["pdf", "video", "link", "audio", "other"]);

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
  if (!mentorId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const resources = await prisma.mentorResource.findMany({
    where: { mentorId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: resources });
}

export async function POST(req: Request) {
  const mentorId = await getMentorProfileId();
  if (!mentorId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const kind = String(body.kind ?? "").toLowerCase();
  const url = String(body.url ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const fileSize = body.fileSize ? Number(body.fileSize) : null;
  const tags = Array.isArray(body.tags) ? (body.tags as unknown[]).map(String).slice(0, 10) : [];
  const isPublic = !!body.isPublic;

  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  if (!VALID_KINDS.has(kind)) return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  const resource = await prisma.mentorResource.create({
    data: {
      mentorId,
      title,
      kind,
      url,
      description,
      fileSize: fileSize && Number.isFinite(fileSize) ? fileSize : null,
      tags,
      isPublic,
    },
  });
  return NextResponse.json({ data: resource }, { status: 201 });
}
