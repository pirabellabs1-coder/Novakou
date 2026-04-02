// GET /api/apprenant/certificats/[id] — Détail d'un certificat

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const raw = await prisma.certificate.findFirst({
      where: { id, userId: session.user.id },
      include: {
        user: { select: { name: true } },
        enrollment: {
          include: {
            formation: {
              select: {
                title: true,
                slug: true,
                duration: true,
                instructeur: { include: { user: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    if (!raw) {
      return NextResponse.json({ error: "Certificat introuvable" }, { status: 404 });
    }

    // Reshape: page expects cert.formation, cert.user, cert.enrollment.formation.instructeur
    const certificate = {
      id: raw.id,
      code: raw.code,
      score: raw.score,
      issuedAt: raw.issuedAt,
      pdfUrl: raw.pdfUrl,
      formationId: raw.formationId,
      user: raw.user,
      formation: {
        title: raw.enrollment.formation.title,
        slug: raw.enrollment.formation.slug,
        duration: raw.enrollment.formation.duration,
      },
      enrollment: {
        formation: {
          instructeur: raw.enrollment.formation.instructeur,
        },
      },
    };

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error("[GET /api/apprenant/certificats/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
