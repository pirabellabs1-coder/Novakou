// GET /api/formations — Liste des formations publiques (marketplace)
// POST /api/formations — Créer une formation (instructeur)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import {
  buildFormationWhere,
  buildFormationOrderBy,
  formationCardInclude,
} from "@/lib/formations/prisma-helpers";
import type { FormationsFilters, FormationsSort } from "@freelancehigh/types";
import { z } from "zod";

// ── GET — Marketplace formations ──────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filters: FormationsFilters = {
      q: searchParams.get("q") || undefined,
      categorySlug: searchParams.get("category") || undefined,
      level: (searchParams.get("level") as FormationsFilters["level"]) || "all",
      priceRange: (searchParams.get("price") as FormationsFilters["priceRange"]) || "all",
      duration: (searchParams.get("duration") as FormationsFilters["duration"]) || "all",
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      language: (searchParams.get("language") as FormationsFilters["language"]) || "all",
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      limit: Math.min(50, Number(searchParams.get("limit")) || 12),
    };

    const sort: FormationsSort = (searchParams.get("sort") as FormationsSort) || "populaire";
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;

    const where = buildFormationWhere(filters);

    // Si recherche full-text
    if (filters.q && filters.q.trim()) {
      const searchTerm = filters.q.trim();
      // FTS via colonne searchVector (GIN index) avec fallback ILIKE
      // La colonne searchVector est créée par 001_formation_search_vector.sql
      const ftsResults = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Formation"
        WHERE status = 'ACTIF'
          AND (
            "searchVector" @@ plainto_tsquery('french', ${searchTerm})
            OR "searchVector" @@ plainto_tsquery('english', ${searchTerm})
            OR "titleFr" ILIKE ${'%' + searchTerm + '%'}
            OR "titleEn" ILIKE ${'%' + searchTerm + '%'}
          )
        ORDER BY
          ts_rank("searchVector", plainto_tsquery('french', ${searchTerm})) DESC,
          ts_rank("searchVector", plainto_tsquery('english', ${searchTerm})) DESC
      `;

      const matchingIds = ftsResults.map((r) => r.id);
      if (matchingIds.length === 0) {
        return NextResponse.json({ formations: [], total: 0, page, totalPages: 0 });
      }
      where.id = { in: matchingIds };
    }

    // When searching with FTS and using default sort, preserve relevance ordering
    const hasFtsSearch = filters.q && filters.q.trim() && where.id;
    const useRelevanceOrder = hasFtsSearch && sort === "populaire";

    const [formations, total] = await Promise.all([
      prisma.formation.findMany({
        where,
        include: formationCardInclude,
        // When using FTS relevance, don't override with a different orderBy
        // The IDs are already ordered by relevance from the raw query
        ...(!useRelevanceOrder ? { orderBy: buildFormationOrderBy(sort) } : {}),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.formation.count({ where }),
    ]);

    // If using relevance ordering, sort results to match the FTS-ranked ID order
    let sortedFormations = formations;
    if (useRelevanceOrder && where.id && "in" in where.id) {
      const idOrder = where.id.in as string[];
      sortedFormations = [...formations].sort(
        (a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id)
      );
    }

    return NextResponse.json({
      formations: sortedFormations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/formations]", error);
    return NextResponse.json({ formations: [], total: 0, page: 1, totalPages: 0 });
  }
}

// ── POST — Créer une formation (instructeur) ──────────────────

const createFormationSchema = z.object({
  titleFr: z.string().min(5).max(80),
  titleEn: z.string().min(5).max(80),
  shortDescFr: z.string().max(200).optional(),
  shortDescEn: z.string().max(200).optional(),
  categoryId: z.string().min(1),
  level: z.enum(["DEBUTANT", "INTERMEDIAIRE", "AVANCE", "TOUS_NIVEAUX"]).default("TOUS_NIVEAUX"),
  language: z.array(z.string()).default(["fr"]),
  price: z.number().min(0).max(500).default(0),
  isFree: z.boolean().default(false),
  hasCertificate: z.boolean().default(true),
  minScore: z.number().min(0).max(100).default(80),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur || instructeur.status !== "APPROUVE") {
      return NextResponse.json(
        { error: "Compte instructeur non approuvé" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createFormationSchema.parse(body);

    // Générer un slug unique
    const baseSlug = data.titleFr
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60);

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.formation.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const formation = await prisma.formation.create({
      data: {
        ...data,
        slug,
        instructeurId: instructeur.id,
        status: "BROUILLON",
        draftStep: 1,
      },
      include: formationCardInclude,
    });

    return NextResponse.json(formation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[POST /api/formations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
