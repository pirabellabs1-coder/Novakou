// GET /api/apprenant/certificats — Liste les certificats de l'apprenant

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const raw = await prisma.certificate.findMany({
      where: { userId: session.user.id, revokedAt: null },
      include: {
        enrollment: {
          include: {
            formation: {
              select: {
                titleFr: true,
                titleEn: true,
                slug: true,
                thumbnail: true,
                instructeur: { include: { user: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    // Reshape: page accesses cert.enrollment.formation.titleFr and cert.enrollment.formation.instructeur.user.name
    const certificates = raw.map((cert) => ({
      id: cert.id,
      code: cert.code,
      score: cert.score,
      issuedAt: cert.issuedAt,
      pdfUrl: cert.pdfUrl,
      enrollment: {
        formation: {
          titleFr: cert.enrollment.formation.titleFr,
          titleEn: cert.enrollment.formation.titleEn,
          slug: cert.enrollment.formation.slug,
          thumbnail: cert.enrollment.formation.thumbnail,
          instructeur: cert.enrollment.formation.instructeur,
        },
      },
    }));

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error("[GET /api/apprenant/certificats]", error);
    return NextResponse.json({ certificates: [] });
  }
}
