/**
 * Mentor private notes on a student (CRM léger).
 *
 * GET ?studentId=... → list my notes for a specific student
 * POST { studentId, content, tags[] } → create a note
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

export async function GET(req: Request) {
  const mentorId = await getMentorProfileId();
  if (!mentorId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const where = studentId ? { mentorId, studentId } : { mentorId };

  const notes = await prisma.mentorStudentNote.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      // no student relation on the model — but we resolve name/avatar via separate query below
    },
  });

  // Bulk resolve student names to save one query per note
  const studentIds = Array.from(new Set(notes.map((n) => n.studentId)));
  const students = studentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, email: true, image: true },
      })
    : [];
  const byStudent = new Map(students.map((s) => [s.id, s]));

  return NextResponse.json({
    data: notes.map((n) => ({
      ...n,
      student: byStudent.get(n.studentId) ?? null,
    })),
  });
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

  const studentId = String(body.studentId ?? "").trim();
  const content = String(body.content ?? "").trim();
  const tags = Array.isArray(body.tags) ? (body.tags as unknown[]).map(String).slice(0, 10) : [];

  if (!studentId) return NextResponse.json({ error: "studentId requis" }, { status: 400 });
  if (!content || content.length > 10_000) {
    return NextResponse.json({ error: "Contenu requis (≤ 10 000 caractères)" }, { status: 400 });
  }

  // Ensure the student has at least one booking with this mentor — else reject
  const hasRelation = await prisma.mentorBooking.findFirst({
    where: { mentorId, studentId },
    select: { id: true },
  });
  if (!hasRelation) {
    return NextResponse.json(
      { error: "Vous ne pouvez créer des notes que pour vos propres apprenants." },
      { status: 403 },
    );
  }

  const note = await prisma.mentorStudentNote.create({
    data: { mentorId, studentId, content, tags },
  });
  return NextResponse.json({ data: note }, { status: 201 });
}
