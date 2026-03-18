// GET /api/formations/[id]/certificate — Télécharger le certificat PDF

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { generateCertificatePDF } from "@/lib/formations/certificate-generator";
import { getSignedUrl } from "@/lib/supabase-storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        formationId: id,
      },
      include: {
        certificate: true,
        formation: {
          select: {
            titleFr: true,
            titleEn: true,
            instructeur: { select: { user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!enrollment?.certificate) {
      return NextResponse.json({ error: "Certificat introuvable" }, { status: 404 });
    }

    const cert = Array.isArray(enrollment.certificate) ? enrollment.certificate[0] : enrollment.certificate;
    if (!cert || cert.revokedAt) {
      return NextResponse.json({ error: "Certificat révoqué ou introuvable" }, { status: 404 });
    }

    // If stored in Supabase Storage, redirect to signed URL
    if (cert.pdfStoragePath) {
      const signedUrl = await getSignedUrl("certificates", cert.pdfStoragePath, 3600);
      if (signedUrl) {
        return NextResponse.redirect(signedUrl);
      }
    }

    // Legacy: if stored as base64, decode and return it
    if (cert.pdfUrl?.startsWith("data:application/pdf;base64,")) {
      const base64 = cert.pdfUrl.replace("data:application/pdf;base64,", "");
      const buffer = Buffer.from(base64, "base64");
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="certificat-${cert.code}.pdf"`,
        },
      });
    }

    // Otherwise generate on-the-fly
    const pdfBuffer = await generateCertificatePDF({
      studentName: session.user.name ?? "Apprenant",
      formationTitle: enrollment.formation.titleFr,
      instructorName: enrollment.formation.instructeur?.user?.name ?? "Instructeur",
      score: cert.score ?? 100,
      completionDate: cert.issuedAt,
      certificateCode: cert.code,
      locale: "fr",
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificat-${cert.code}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/formations/[id]/certificate]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
