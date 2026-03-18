// GET /api/admin/formations/refunds — Liste des demandes de remboursement

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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [refunds, total] = await Promise.all([
      prisma.refundRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          enrollment: {
            include: {
              formation: {
                select: {
                  id: true,
                  titleFr: true,
                  slug: true,
                  price: true,
                  instructeur: {
                    select: {
                      id: true,
                      user: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.refundRequest.count({ where }),
    ]);

    return NextResponse.json({
      refunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/formations/refunds]", error);
    return NextResponse.json({ refunds: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
}
