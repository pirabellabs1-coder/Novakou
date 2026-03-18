// GET /api/admin/formations/produits — Liste des produits numériques pour l'admin

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
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.productType = type;

    const [products, total] = await Promise.all([
      prisma.digitalProduct.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          instructeur: {
            select: { user: { select: { name: true, email: true } } },
          },
          category: { select: { nameFr: true } },
        },
      }),
      prisma.digitalProduct.count({ where: where as never }),
    ]);

    return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[GET /api/admin/formations/produits]", error);
    return NextResponse.json({ products: [], total: 0 });
  }
}
