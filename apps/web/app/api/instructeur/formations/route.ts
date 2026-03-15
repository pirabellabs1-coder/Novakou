// GET /api/instructeur/formations — Liste des formations de l'instructeur connecté
// POST /api/instructeur/formations — Créer une nouvelle formation (brouillon)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur) {
      return NextResponse.json({ formations: [] });
    }

    const formations = await prisma.formation.findMany({
      where: { instructeurId: instructeur.id },
      select: {
        id: true,
        slug: true,
        titleFr: true,
        titleEn: true,
        thumbnail: true,
        status: true,
        price: true,
        isFree: true,
        rating: true,
        reviewsCount: true,
        studentsCount: true,
        duration: true,
        updatedAt: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ formations });
  } catch (error) {
    console.error("[GET /api/instructeur/formations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur) {
      return NextResponse.json({ error: "Profil instructeur introuvable" }, { status: 403 });
    }

    // Verification KYC obligatoire pour les instructeurs (niveau 3 minimum)
    if ((session.user.kyc ?? 1) < 3) {
      return NextResponse.json(
        {
          error: "Verification d'identite requise pour creer une formation. Completez votre KYC (niveau 3 minimum).",
          code: "KYC_REQUIRED",
          requiredLevel: 3,
          currentLevel: session.user.kyc ?? 1,
          redirectTo: "/dashboard/kyc",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      titleFr, titleEn, descriptionFr, descriptionEn,
      categoryId, level, duration, thumbnail, previewVideo,
      price, isFree, originalPrice, hasCertificate, minScore, status,
    } = body;

    if (!titleFr) {
      return NextResponse.json({ error: "Le titre FR est requis" }, { status: 400 });
    }

    // Find a valid category or use the first one
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      const firstCat = await prisma.formationCategory.findFirst({ orderBy: { order: "asc" } });
      if (firstCat) resolvedCategoryId = firstCat.id;
    }

    if (!resolvedCategoryId) {
      return NextResponse.json({ error: "Catégorie requise" }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = (titleFr || "formation")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 60);

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.formation.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const formation = await prisma.formation.create({
      data: {
        slug,
        titleFr: titleFr || "",
        titleEn: titleEn || titleFr || "",
        descriptionFr: descriptionFr || "",
        descriptionEn: descriptionEn || descriptionFr || "",
        categoryId: resolvedCategoryId,
        level: level || "TOUS_NIVEAUX",
        duration: duration || 60,
        thumbnail: thumbnail || null,
        previewVideo: previewVideo || null,
        price: isFree ? 0 : (price || 0),
        originalPrice: originalPrice || null,
        isFree: isFree ?? false,
        hasCertificate: hasCertificate ?? true,
        minScore: minScore ?? 80,
        status: status || "BROUILLON",
        instructeurId: instructeur.id,
        language: ["fr"],
      },
    });

    return NextResponse.json({ formation });
  } catch (error) {
    console.error("[POST /api/instructeur/formations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
