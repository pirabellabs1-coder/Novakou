import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/admin/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { kind, action } = body; // action: "approve" | "reject" | "archive"
    const reason: string | null = typeof body.reason === "string" ? body.reason : null;

    if (!kind || !action) return NextResponse.json({ error: "kind et action requis" }, { status: 400 });

    const actorId = (session.user as { id?: string }).id;

    if (kind === "formation") {
      const newStatus = action === "approve" ? "ACTIF" as const : "ARCHIVE" as const;
      await prisma.formation.update({ where: { id }, data: { status: newStatus } });

      if (actorId && (action === "approve" || action === "reject")) {
        await createAuditLog({
          actorId,
          action: action === "approve" ? "formation.approved" : "formation.rejected",
          targetType: "formation",
          targetId: id,
          details: { reason },
        }).catch(() => null);
      }
    } else if (kind === "product") {
      const newStatus = action === "approve" ? "ACTIF" as const : action === "reject" ? "REFUSE" as const : "ARCHIVE" as const;
      await prisma.digitalProduct.update({ where: { id }, data: { status: newStatus } });

      if (actorId && (action === "approve" || action === "reject")) {
        await createAuditLog({
          actorId,
          action: action === "approve" ? "product.approved" : "product.rejected",
          targetType: "product",
          targetId: id,
          details: { reason },
        }).catch(() => null);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/produits PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
