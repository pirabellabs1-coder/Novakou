// GET /api/formations/[id] — Détail formation (par slug ou id)
// PUT /api/formations/[id] — Modifier formation (instructeur)
// DELETE /api/formations/[id] — Supprimer formation (instructeur/admin)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { formationDetailInclude } from "@/lib/formations/prisma-helpers";
import { z } from "zod";

// ── GET ──────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Chercher par slug ou id
    const formation = await prisma.formation.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: formationDetailInclude,
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    // Get session once for all auth checks
    const session = await getServerSession(authOptions);

    // Non-ACTIF formations are only visible to their owner or admin
    if (formation.status !== "ACTIF") {
      const isAdmin = session?.user?.role === "admin";
      const isOwner = session?.user?.id && formation.instructeur?.userId === session.user.id;
      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
      }
    }

    // Incrémenter les vues (fire-and-forget)
    if (formation.status === "ACTIF") {
      prisma.formation.update({
        where: { id: formation.id },
        data: { viewsCount: { increment: 1 } },
      }).catch(() => {});
    }

    // Check enrollment + favorite status for authenticated user
    let isEnrolled = false;
    let enrollment: { id: string; progress: number; completedAt: Date | null } | null = null;
    let isFavorite = false;

    if (session?.user) {
      const [enrollmentResult, favoriteResult] = await Promise.all([
        prisma.enrollment.findUnique({
          where: { userId_formationId: { userId: session.user.id, formationId: formation.id } },
          select: { id: true, progress: true, completedAt: true },
        }),
        prisma.formationFavorite.findUnique({
          where: { userId_formationId: { userId: session.user.id, formationId: formation.id } },
          select: { id: true },
        }),
      ]);
      isEnrolled = !!enrollmentResult;
      enrollment = enrollmentResult;
      isFavorite = !!favoriteResult;
    }

    // Include cohorts if group formation
    let cohorts: unknown[] = [];
    if (formation.isGroupFormation) {
      cohorts = await prisma.formationCohort.findMany({
        where: {
          formationId: formation.id,
          status: { in: ["OUVERT", "COMPLET", "EN_COURS"] },
        },
        orderBy: { startDate: "asc" },
      });
    }

    // Include active flash promotion
    const now = new Date();
    const flashPromos = await prisma.flashPromotion.findMany({
      where: {
        formationId: formation.id,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      select: { id: true, discountPct: true, endsAt: true, maxUsage: true, usageCount: true },
      take: 1,
      orderBy: { discountPct: "desc" },
    });
    // Filter out maxUsage-exceeded promos in JS
    const flashPromo = flashPromos.find((p) => !p.maxUsage || p.usageCount < p.maxUsage) ?? null;

    return NextResponse.json({ ...formation, flashPromo, cohorts, isEnrolled, enrollment, isFavorite });
  } catch (error) {
    console.error("[GET /api/formations/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT ──────────────────────────────────────────────────────

const updateFormationSchema = z.object({
  title: z.string().min(5).max(80).optional(),
  shortDesc: z.string().max(200).optional().nullable(),
  description: z.string().optional().nullable(),
  learnPoints: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  targetAudience: z.string().optional().nullable(),
  locale: z.string().optional(),
  thumbnail: z.string().optional().nullable(),
  previewVideo: z.string().optional().nullable(),
  categoryId: z.string().optional(),
  subCategory: z.string().optional().nullable(),
  level: z.enum(["DEBUTANT", "INTERMEDIAIRE", "AVANCE", "TOUS_NIVEAUX"]).optional(),
  language: z.array(z.string()).optional(),
  price: z.number().min(0).max(500).optional(),
  originalPrice: z.number().optional().nullable(),
  isFree: z.boolean().optional(),
  hasCertificate: z.boolean().optional(),
  minScore: z.number().min(0).max(100).optional(),
  requireFinalQuiz: z.boolean().optional(),
  status: z.enum(["BROUILLON", "EN_ATTENTE", "ACTIF", "ARCHIVE"]).optional(),
  draftStep: z.number().optional(),
  scheduledAt: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formation = await prisma.formation.findUnique({
      where: { id },
      include: { instructeur: true },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    // Vérifier que c'est le bon instructeur ou un admin
    const isAdmin = session.user.role === "admin";
    const isOwner = formation.instructeur.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateFormationSchema.parse(body);

    // Si passage à EN_ATTENTE, définir publishedAt éventuellement
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "ACTIF" && !formation.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.formation.update({
      where: { id },
      data: updateData,
      include: formationDetailInclude,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[PUT /api/formations/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formation = await prisma.formation.findUnique({
      where: { id },
      include: { instructeur: true, _count: { select: { enrollments: true } } },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = formation.instructeur.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Pas de suppression si des apprenants sont inscrits
    if (formation._count.enrollments > 0 && !isAdmin) {
      return NextResponse.json(
        { error: "Impossible de supprimer une formation avec des apprenants inscrits" },
        { status: 400 }
      );
    }

    await prisma.formation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/formations/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
