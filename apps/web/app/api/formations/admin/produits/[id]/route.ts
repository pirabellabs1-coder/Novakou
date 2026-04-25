import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { kind, action } = body; // action: "approve" | "reject" | "archive"

    if (!kind || !action) return NextResponse.json({ error: "kind et action requis" }, { status: 400 });

    if (kind === "formation") {
      const newStatus = action === "approve" ? "ACTIF" as const : "ARCHIVE" as const;
      await prisma.formation.update({ where: { id }, data: { status: newStatus } });
    } else if (kind === "product") {
      const newStatus = action === "approve" ? "ACTIF" as const : action === "reject" ? "REFUSE" as const : "ARCHIVE" as const;
      await prisma.digitalProduct.update({ where: { id }, data: { status: newStatus } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/produits PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
