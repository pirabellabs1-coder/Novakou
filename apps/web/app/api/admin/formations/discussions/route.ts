// GET /api/admin/formations/discussions — Liste des discussions (signalees par defaut, ou toutes)

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
    const filter = searchParams.get("filter") ?? "reported";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> =
      filter === "all" ? {} : { reportCount: { gt: 0 } };

    const [discussions, total] = await Promise.all([
      prisma.courseDiscussion.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ reportCount: "desc" }, { createdAt: "desc" }],
        include: {
          formation: {
            select: { id: true, titleFr: true, slug: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          reports: {
            select: {
              id: true,
              reason: true,
              createdAt: true,
              user: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      prisma.courseDiscussion.count({ where }),
    ]);

    return NextResponse.json({
      discussions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/formations/discussions]", error);
    return NextResponse.json({ discussions: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
}
