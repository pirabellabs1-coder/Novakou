import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const action = url.searchParams.get("action") || undefined;
    const actorId = url.searchParams.get("actorId") || undefined;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (actorId) where.actorId = actorId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, name: true, email: true, image: true } },
          targetUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Distinct actions for filter dropdown
    const actions = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: { _count: { action: "desc" } },
      take: 30,
    });

    return NextResponse.json({
      data: logs,
      total,
      page,
      pages: Math.ceil(total / limit),
      actions: actions.map((a) => ({ action: a.action, count: a._count })),
    });
  } catch (error) {
    console.error("[Admin Audit API]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
