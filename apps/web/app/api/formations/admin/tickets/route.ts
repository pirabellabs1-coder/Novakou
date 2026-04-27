import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN" && role !== "admin") return null;
  return session;
}

/** GET /api/formations/admin/tickets — list with filter & pagination */
export async function GET(req: Request) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // NEW | AUTO_REPLIED | HUMAN_REPLIED | CLOSED | all
  const search = url.searchParams.get("q")?.trim().toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const take = 25;
  const skip = (page - 1) * take;

  type WhereClause = {
    status?: "NEW" | "AUTO_REPLIED" | "HUMAN_REPLIED" | "CLOSED";
    OR?: Array<Record<string, unknown>>;
  };
  const where: WhereClause = {};
  if (status && status !== "all") {
    where.status = status as WhereClause["status"];
  }
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { reference: { contains: search.toUpperCase() } },
      { subject: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total, counts] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        reference: true,
        name: true,
        email: true,
        subject: true,
        message: true,
        status: true,
        aiReplyModel: true,
        aiReplySentAt: true,
        adminReplyAt: true,
        createdAt: true,
      },
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  return NextResponse.json({
    data: { items, total, page, pageSize: take, statusCounts },
  });
}
