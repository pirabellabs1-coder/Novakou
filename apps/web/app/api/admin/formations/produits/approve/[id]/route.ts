// POST /api/admin/formations/produits/approve/[id] — Approuver un produit numérique

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { logAuditAction, getRequestIp } from "@/lib/formations/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const product = await prisma.digitalProduct.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const updated = await prisma.digitalProduct.update({
      where: { id },
      data: { status: "ACTIF" },
    });

    await logAuditAction({
      userId: session.user.id,
      action: "product_approved",
      targetType: "digitalProduct",
      targetId: id,
      metadata: {
        productTitle: product.titleFr,
        previousStatus: product.status,
      },
      ipAddress: getRequestIp(req),
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("[POST /api/admin/formations/produits/approve/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
