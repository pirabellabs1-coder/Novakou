// PUT /api/admin/formations/cohorts/[id] — Mettre a jour le statut d'une cohorte

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { logAuditAction, getRequestIp } from "@/lib/formations/audit";

const VALID_STATUSES = ["OUVERT", "COMPLET", "EN_COURS", "TERMINE", "ANNULE"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const cohort = await prisma.formationCohort.findUnique({ where: { id } });
    if (!cohort) {
      return NextResponse.json({ error: "Cohorte non trouvée" }, { status: 404 });
    }

    const updated = await prisma.formationCohort.update({
      where: { id },
      data: { status },
    });

    await logAuditAction({
      userId: session.user.id,
      action: "cohort_status_updated",
      targetType: "formationCohort",
      targetId: id,
      metadata: {
        cohortTitle: cohort.titleFr,
        previousStatus: cohort.status,
        newStatus: status,
      },
      ipAddress: getRequestIp(req),
    });

    return NextResponse.json({ cohort: updated });
  } catch (error) {
    console.error("[PUT /api/admin/formations/cohorts/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
