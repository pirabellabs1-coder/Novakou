// GET /api/admin/formations/certificats — Liste tous les certificats pour l'admin

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

    const [raw, total] = await Promise.all([
      prisma.certificate.findMany({
        include: {
          user: { select: { name: true, email: true } },
          enrollment: {
            include: {
              formation: { select: { titleFr: true, slug: true } },
            },
          },
        },
        orderBy: { issuedAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.certificate.count(),
    ]);

    // Flatten enrollment.formation to formation for the frontend
    const certificates = raw.map((c) => ({
      id: c.id,
      code: c.code,
      score: c.score,
      issuedAt: c.issuedAt,
      revokedAt: c.revokedAt,
      user: c.user,
      formation: c.enrollment.formation,
    }));

    return NextResponse.json({ certificates, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[GET /api/admin/formations/certificats]", error);
    return NextResponse.json({ certificates: [], total: 0 });
  }
}
