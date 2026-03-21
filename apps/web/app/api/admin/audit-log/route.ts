import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";

// GET /api/admin/audit-log — Paginated audit log entries
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  if (IS_DEV) {
    // In dev mode, audit logs are only printed to console (see lib/admin/audit.ts)
    return NextResponse.json({ entries: [], total: 0, page, limit });
  }

  try {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: { select: { name: true, email: true } },
          targetUser: { select: { name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, limit });
  } catch (error) {
    console.error("[API /admin/audit-log GET]", error);
    return NextResponse.json({ entries: [], total: 0, page, limit });
  }
}
