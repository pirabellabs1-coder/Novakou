// GET/PUT/DELETE /api/instructeur/formations/[id]/cohorts/[cohortId] — CRUD cohorte

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";

const updateCohortSchema = z.object({
  titleFr: z.string().min(3).max(120).optional(),
  titleEn: z.string().min(3).max(120).optional(),
  descriptionFr: z.string().max(2000).optional().nullable(),
  descriptionEn: z.string().max(2000).optional().nullable(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Date invalide").optional(),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Date invalide").optional(),
  enrollmentDeadline: z.string().refine((d) => !isNaN(Date.parse(d)), "Date invalide").optional(),
  maxParticipants: z.number().int().min(2).max(500).optional(),
  price: z.number().min(0).max(10000).optional(),
  originalPrice: z.number().min(0).optional().nullable(),
  status: z.enum(["OUVERT", "COMPLET", "EN_COURS", "TERMINE", "ANNULE"]).optional(),
  schedule: z.any().optional().nullable(),
});

async function verifyOwnership(formationId: string, cohortId: string, userId: string) {
  const instructeur = await prisma.instructeurProfile.findUnique({
    where: { userId },
  });
  if (!instructeur) return null;

  const formation = await prisma.formation.findFirst({
    where: { id: formationId, instructeurId: instructeur.id },
  });
  if (!formation) return null;

  const cohort = await prisma.formationCohort.findFirst({
    where: { id: cohortId, formationId },
  });
  return cohort;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    const { id, cohortId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const cohort = await verifyOwnership(id, cohortId, session.user.id);
    if (!cohort) {
      return NextResponse.json({ error: "Cohorte introuvable" }, { status: 404 });
    }

    const detail = await prisma.formationCohort.findUnique({
      where: { id: cohortId },
      include: {
        _count: { select: { enrollments: true, messages: true } },
        formation: {
          select: { titleFr: true, titleEn: true, slug: true },
        },
      },
    });

    return NextResponse.json(detail);
  } catch (error) {
    console.error("[GET /api/instructeur/.../cohorts/[cohortId]]", error);
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

    const cohort = await verifyOwnership(id, cohortId, session.user.id);
    if (!cohort) {
      return NextResponse.json({ error: "Cohorte introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateCohortSchema.parse(body);

    // Validate status transitions
    if (data.status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        OUVERT: ["COMPLET", "EN_COURS", "ANNULE"],
        COMPLET: ["EN_COURS", "ANNULE"],
        EN_COURS: ["TERMINE"],
        TERMINE: [],
        ANNULE: [],
      };
      const allowed = validTransitions[cohort.status] ?? [];
      if (!allowed.includes(data.status)) {
        return NextResponse.json(
          { error: `Transition de statut invalide : ${cohort.status} → ${data.status}` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.titleFr !== undefined) updateData.titleFr = data.titleFr;
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn;
    if (data.descriptionFr !== undefined) updateData.descriptionFr = data.descriptionFr;
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
    if (data.maxParticipants !== undefined) {
      if (data.maxParticipants < cohort.currentCount) {
        return NextResponse.json({ error: "Le nombre max ne peut pas être inférieur au nombre actuel de participants" }, { status: 400 });
      }
      updateData.maxParticipants = data.maxParticipants;
    }
    if (data.price !== undefined) {
      // Prevent price changes if students are already enrolled
      if (cohort.currentCount > 0) {
        return NextResponse.json({ error: "Impossible de modifier le prix avec des participants inscrits" }, { status: 400 });
      }
      updateData.price = data.price;
    }
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.schedule !== undefined) updateData.schedule = data.schedule;

    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.enrollmentDeadline) updateData.enrollmentDeadline = new Date(data.enrollmentDeadline);

    // Recalculate durationDays if dates changed
    const newStart = data.startDate ? new Date(data.startDate) : cohort.startDate;
    const newEnd = data.endDate ? new Date(data.endDate) : cohort.endDate;
    if (data.startDate || data.endDate) {
      updateData.durationDays = Math.ceil((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
    }

    const updated = await prisma.formationCohort.update({
      where: { id: cohortId },
      data: updateData,
      include: {
        _count: { select: { enrollments: true, messages: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[PUT /api/instructeur/.../cohorts/[cohortId]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    const { id, cohortId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const cohort = await verifyOwnership(id, cohortId, session.user.id);
    if (!cohort) {
      return NextResponse.json({ error: "Cohorte introuvable" }, { status: 404 });
    }

    if (cohort.status !== "OUVERT" || cohort.currentCount > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer une cohorte avec des participants ou déjà démarrée" },
        { status: 400 }
      );
    }

    await prisma.formationCohort.delete({ where: { id: cohortId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/instructeur/.../cohorts/[cohortId]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
