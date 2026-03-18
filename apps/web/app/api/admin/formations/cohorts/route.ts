// GET /api/admin/formations/cohorts — Liste de toutes les cohortes avec pagination et filtre par statut

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

const VALID_STATUSES = ["OUVERT", "COMPLET", "EN_COURS", "TERMINE", "ANNULE"];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const statusParam = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (statusParam && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam;
    }

    const [cohorts, total] = await Promise.all([
      prisma.formationCohort.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          formation: {
            select: {
              id: true,
              titleFr: true,
              slug: true,
              instructeur: {
                select: {
                  id: true,
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          _count: {
            select: { enrollments: true, messages: true },
          },
        },
      }),
      prisma.formationCohort.count({ where }),
    ]);

    return NextResponse.json({
      cohorts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/formations/cohorts]", error);
    return NextResponse.json({ cohorts: [], total: 0, totalPages: 0 });
  }
}
