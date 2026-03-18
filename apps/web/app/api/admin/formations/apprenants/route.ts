// GET /api/admin/formations/apprenants — Liste tous les enrollments pour l'admin

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        include: {
          user: { select: { name: true, email: true, avatar: true, image: true } },
          formation: { select: { titleFr: true, slug: true } },
          certificate: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.enrollment.count(),
    ]);

    return NextResponse.json({ enrollments, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[GET /api/admin/formations/apprenants]", error);
    return NextResponse.json({ enrollments: [], total: 0 });
  }
}
