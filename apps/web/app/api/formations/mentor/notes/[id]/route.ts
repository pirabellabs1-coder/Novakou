import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function getMentorProfileId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const m = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return m?.id ?? null;
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const mentorId = await getMentorProfileId();
  if (!mentorId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    content?: string;
    tags?: string[];
  };
  const content = body.content?.trim();
  const tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 10) : undefined;
  if (!content || content.length > 10_000) {
    return NextResponse.json({ error: "Contenu requis (≤ 10 000 caractères)" }, { status: 400 });
  }

  const note = await prisma.mentorStudentNote.updateMany({
    where: { id, mentorId },
    data: { content, tags: tags ?? undefined },
  });
  if (note.count === 0) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });

  const updated = await prisma.mentorStudentNote.findUnique({ where: { id } });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const mentorId = await getMentorProfileId();
  if (!mentorId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const res = await prisma.mentorStudentNote.deleteMany({ where: { id, mentorId } });
  if (res.count === 0) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  return NextResponse.json({ success: true });
}
