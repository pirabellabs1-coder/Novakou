// GET/PUT /api/admin/formations/marketing/promotions — Liste et gestion des promotions actives

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { logAuditAction, getRequestIp } from "@/lib/formations/audit";

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

    const where = { isActive: true };

    const [promotions, total] = await Promise.all([
      prisma.flashPromotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          formation: {
            select: {
              id: true,
              titleFr: true,
              instructeur: {
                select: {
                  id: true,
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          digitalProduct: {
            select: {
              id: true,
              titleFr: true,
              instructeur: {
                select: {
                  id: true,
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      }),
      prisma.flashPromotion.count({ where }),
    ]);

    return NextResponse.json({
      promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/formations/marketing/promotions]", error);
    return NextResponse.json({ promotions: [], total: 0, totalPages: 0 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID de promotion requis" }, { status: 400 });
    }

    const promotion = await prisma.flashPromotion.findUnique({ where: { id } });
    if (!promotion) {
      return NextResponse.json({ error: "Promotion non trouvée" }, { status: 404 });
    }

    const updated = await prisma.flashPromotion.update({
      where: { id },
      data: { isActive: false },
    });

    await logAuditAction({
      userId: session.user.id,
      action: "promotion_disabled",
      targetType: "flashPromotion",
      targetId: id,
      metadata: {
        discountPct: promotion.discountPct,
        formationId: promotion.formationId,
        digitalProductId: promotion.digitalProductId,
      },
      ipAddress: getRequestIp(req),
    });

    return NextResponse.json({ promotion: updated });
  } catch (error) {
    console.error("[PUT /api/admin/formations/marketing/promotions]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
