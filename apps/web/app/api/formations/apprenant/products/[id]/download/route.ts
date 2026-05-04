import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

/**
 * POST /api/formations/apprenant/products/[id]/download
 *
 * Incrémente le compteur downloadCount de la DigitalProductPurchase
 * correspondante. L'apprenant doit être connecté ET propriétaire de la
 * purchase. Idempotent : appelé à chaque clic "Télécharger" côté client.
 *
 * Body : (vide)
 * Response : { downloadCount: number }
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifie que la purchase existe ET appartient à l'apprenant
    const purchase = await prisma.digitalProductPurchase.findFirst({
      where: { id, userId },
      select: { id: true, downloadCount: true },
    });
    if (!purchase) {
      return NextResponse.json(
        { error: "Achat introuvable ou non autorisé" },
        { status: 404 },
      );
    }

    const updated = await prisma.digitalProductPurchase.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
      select: { downloadCount: true },
    });

    return NextResponse.json({ downloadCount: updated.downloadCount });
  } catch (err) {
    console.error("[apprenant/products/download POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
