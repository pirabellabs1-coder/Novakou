// GET/POST/PUT /api/instructeur/formations/[id]/cohorts/[cohortId]/messages — Chat instructeur

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  attachmentUrl: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
});

const pinSchema = z.object({
  messageId: z.string(),
  isPinned: z.boolean(),
});

async function verifyInstructorAccess(formationId: string, cohortId: string, userId: string) {
  const instructeur = await prisma.instructeurProfile.findUnique({
    where: { userId },
  });
  if (!instructeur) return false;

  const formation = await prisma.formation.findFirst({
    where: { id: formationId, instructeurId: instructeur.id },
  });
  if (!formation) return false;

  const cohort = await prisma.formationCohort.findFirst({
    where: { id: cohortId, formationId },
  });
  return !!cohort;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    const { id, cohortId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const hasAccess = await verifyInstructorAccess(id, cohortId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const after = searchParams.get("after");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const skip = (page - 1) * limit;

    // If `after` param is provided (polling for new messages), only return messages created after that timestamp
    const whereClause = after
      ? { cohortId, createdAt: { gt: new Date(after) } }
      : { cohortId };

    const [messages, total] = await Promise.all([
      prisma.cohortMessage.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, image: true },
          },
        },
        orderBy: { createdAt: after ? "asc" as const : "desc" as const },
        ...(after ? {} : { skip, take: limit }),
      }),
      prisma.cohortMessage.count({ where: { cohortId } }),
    ]);

    // Pinned messages separately
    const pinned = await prisma.cohortMessage.findMany({
      where: { cohortId, isPinned: true },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      messages: after ? messages : messages.reverse(),
      pinned,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/instructeur/.../messages]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    const { id, cohortId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const hasAccess = await verifyInstructorAccess(id, cohortId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const data = messageSchema.parse(body);

    const message = await prisma.cohortMessage.create({
      data: {
        cohortId,
        userId: session.user.id,
        content: data.content,
        isInstructor: true,
        attachmentUrl: data.attachmentUrl ?? null,
        attachmentName: data.attachmentName ?? null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, image: true },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[POST /api/instructeur/.../messages]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    const { id, cohortId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const hasAccess = await verifyInstructorAccess(id, cohortId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const data = pinSchema.parse(body);

    const message = await prisma.cohortMessage.findFirst({
      where: { id: data.messageId, cohortId },
    });
    if (!message) {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    }

    const updated = await prisma.cohortMessage.update({
      where: { id: data.messageId },
      data: { isPinned: data.isPinned },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, image: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[PUT /api/instructeur/.../messages]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
