import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveStorageFields } from "@/lib/storage-resolver";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/formations/public/formation/[slug]
 * Returns full formation detail for the public page.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const formation = await prisma.formation.findUnique({
      where: { slug },
      include: {
        // Anonymat : on n'expose que l'id (pixels/reco/inquiry cote client) et
        // les pixels marketing. JAMAIS le nom/avatar/bio perso du vendeur.
        instructeur: {
          select: {
            id: true,
            marketingPixels: {
              where: { isActive: true },
              select: { type: true, pixelId: true },
            },
          },
        },
        category: { select: { id: true, slug: true, name: true } },
        shop: { select: { slug: true, name: true, legalName: true, font: true, themeColor: true, logoUrl: true, legalEmail: true, legalPhone: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                duration: true,
                isFree: true,
                order: true,
              },
            },
          },
        },
        reviews: {
          where: { rating: { gte: 1 } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    // Le public ne voit que les fiches ACTIF. Exception : un ADMIN authentifié
    // peut consulter une fiche non publiée (En attente / brouillon) pour la
    // contrôler AVANT validation depuis le tableau de bord admin. Sans cette
    // exception, le bouton « Voir » de l'admin renvoyait un 404.
    if (formation.status !== "ACTIF") {
      const session = await getServerSession(authOptions);
      const role = (session?.user as { role?: string } | undefined)?.role;
      const isAdmin = role === "admin" || role === "ADMIN";
      if (!isAdmin) {
        return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
      }
    }

    // Compteur de vues : uniquement pour le public sur une fiche publiée. Un
    // aperçu admin ne doit pas gonfler les statistiques du vendeur.
    if (formation.status === "ACTIF") {
      prisma.formation
        .update({
          where: { id: formation.id },
          data: { viewsCount: { increment: 1 } },
        })
        .catch(() => null);
    }

    // Compute total lessons + duration
    const totalLessons = formation.sections.reduce(
      (sum: number, s: { lessons: unknown[] }) => sum + s.lessons.length,
      0
    );

    // Construit la payload puis résout tous les paths image (thumbnail,
    // instructeur.image, reviews[].user.image) en signed URLs.
    const payload = {
      id: formation.id,
      slug: formation.slug,
      title: formation.title,
      shortDesc: formation.shortDesc,
      description: formation.description,
      descriptionFormat: formation.descriptionFormat,
      learnPoints: formation.learnPoints,
      requirements: formation.requirements,
      targetAudience: formation.targetAudience,
      locale: formation.locale,
      thumbnail: formation.thumbnail,
      previewVideo: formation.previewVideo,
      level: formation.level,
      languages: formation.language,
      duration: formation.duration,
      price: formation.price,
      originalPrice: formation.originalPrice,
      isFree: formation.isFree,
      hasCertificate: formation.hasCertificate,
      maxStudents: formation.maxStudents,
      rating: formation.rating,
      reviewsCount: formation.reviewsCount,
      studentsCount: formation.studentsCount,
      viewsCount: formation.viewsCount,
      totalLessons,
      category: formation.category,
      shop: formation.shop
        ? {
            slug: formation.shop.slug,
            name: formation.shop.name,
            legalName: formation.shop.legalName,
            font: formation.shop.font,
            themeColor: formation.shop.themeColor,
            logoUrl: formation.shop.logoUrl,
            // Alimentent le bloc « Contactez-nous ». Une seule saisie fait foi :
            // celle des informations legales de la boutique. Les anciens champs
            // contactEmail/whatsapp faisaient saisir deux fois les memes
            // coordonnees — ils ne sont plus lus.
            contactEmail: formation.shop.legalEmail,
            whatsapp: formation.shop.legalPhone,
          }
        : null,
      instructeur: {
        id: formation.instructeur.id,
        marketingPixels: formation.instructeur.marketingPixels ?? [],
      },
      sections: formation.sections.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        lessons: s.lessons,
        lessonCount: s.lessons.length,
        duration: s.lessons.reduce((sum: number, l: { duration: number | null }) => sum + (l.duration ?? 0), 0),
      })),
      reviews: formation.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        response: r.response,
        respondedAt: r.respondedAt,
        createdAt: r.createdAt,
        user: r.user,
      })),
      createdAt: formation.createdAt,
    };

    return NextResponse.json({ data: await resolveStorageFields(payload) });
  } catch (err) {
    console.error("[public/formation/[slug]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
