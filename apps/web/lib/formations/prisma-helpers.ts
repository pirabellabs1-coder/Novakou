// FreelanceHigh — Prisma helpers for formations
import prisma from "@freelancehigh/db";
import type { FormationsFilters, FormationsSort } from "@freelancehigh/types";
import { INSTRUCTOR_COMMISSION, PLATFORM_COMMISSION } from "@/lib/formations/config";

export { INSTRUCTOR_COMMISSION, PLATFORM_COMMISSION };

// Include pour les cards de formation
export const formationCardInclude = {
  category: {
    select: { id: true, nameFr: true, nameEn: true, slug: true, icon: true, color: true },
  },
  instructeur: {
    select: {
      id: true,
      user: { select: { name: true, avatar: true, image: true } },
    },
  },
} as const;

// Include pour le détail complet d'une formation
export const formationDetailInclude = {
  category: true,
  instructeur: {
    include: {
      user: { select: { id: true, name: true, image: true, avatar: true, country: true } },
    },
  },
  sections: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        orderBy: { order: "asc" as const },
        select: {
          id: true,
          titleFr: true,
          titleEn: true,
          type: true,
          duration: true,
          order: true,
          isFree: true,
          quiz: { select: { id: true, passingScore: true } },
        },
      },
    },
  },
  reviews: {
    take: 10,
    orderBy: { createdAt: "desc" as const },
    include: {
      user: { select: { name: true, avatar: true, image: true, country: true } },
    },
  },
} as const;

// Build WHERE clause from filters
export function buildFormationWhere(filters: FormationsFilters) {
  const where: Record<string, unknown> = { status: "ACTIF" };

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }

  if (filters.level && filters.level !== "all") {
    where.level = filters.level;
  }

  if (filters.language && filters.language !== "all") {
    where.language = { has: filters.language };
  }

  if (filters.minRating) {
    where.rating = { gte: filters.minRating };
  }

  if (filters.priceRange && filters.priceRange !== "all") {
    switch (filters.priceRange) {
      case "free":
        where.isFree = true;
        break;
      case "paid":
        where.isFree = false;
        break;
      case "under20":
        where.price = { lt: 20 };
        where.isFree = false;
        break;
      case "20to50":
        where.price = { gte: 20, lte: 50 };
        break;
      case "over50":
        where.price = { gt: 50 };
        break;
    }
  }

  if (filters.duration && filters.duration !== "all") {
    switch (filters.duration) {
      case "under2h":
        where.duration = { lt: 120 };
        break;
      case "2h5h":
        where.duration = { gte: 120, lt: 300 };
        break;
      case "5h10h":
        where.duration = { gte: 300, lt: 600 };
        break;
      case "over10h":
        where.duration = { gte: 600 };
        break;
    }
  }

  return where;
}

// Build ORDER BY from sort
export function buildFormationOrderBy(sort: FormationsSort) {
  switch (sort) {
    case "note":
      return { rating: "desc" as const };
    case "nouveau":
      return { publishedAt: "desc" as const };
    case "prix_asc":
      return { price: "asc" as const };
    case "prix_desc":
      return { price: "desc" as const };
    case "populaire":
    default:
      return { studentsCount: "desc" as const };
  }
}

// generateCertificateCode() is in certificate-generator.ts — use that one
export { generateCertificateCode } from "./certificate-generator";

// Calculer le pourcentage de progression d'un enrollment
export async function calculateProgress(enrollmentId: string): Promise<number> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      formation: {
        include: {
          sections: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
      lessonProgress: { where: { completed: true } },
    },
  });

  if (!enrollment) return 0;

  const totalLessons = enrollment.formation.sections.reduce(
    (acc, s) => acc + s.lessons.length,
    0
  );

  if (totalLessons === 0) return 0;

  const completedLessons = enrollment.lessonProgress.length;
  return Math.round((completedLessons / totalLessons) * 100);
}
