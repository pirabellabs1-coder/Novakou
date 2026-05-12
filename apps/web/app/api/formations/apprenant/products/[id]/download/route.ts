import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";
import { resolveStorageFileUrl } from "@/lib/supabase-storage";

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
      select: {
        id: true,
        downloadCount: true,
        product: {
          select: {
            fileUrl: true,
            files: {
              orderBy: { order: "asc" },
              select: { id: true, name: true, url: true, size: true, mimeType: true },
            },
          },
        },
      },
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

    const files = purchase.product?.files?.length
      ? await Promise.all(
          purchase.product.files.map(async (file) => ({
            ...file,
            url: await resolveStorageFileUrl(file.url, "order-deliveries", 3600),
          })),
        )
      : purchase.product?.fileUrl
        ? [{
            id: "legacy-file",
            name: purchase.product.fileUrl.split("?")[0].split("/").pop() ?? "fichier",
            url: await resolveStorageFileUrl(purchase.product.fileUrl, "order-deliveries", 3600),
            size: null,
            mimeType: null,
          }]
        : [];

    return NextResponse.json({ downloadCount: updated.downloadCount, files });
  } catch (err) {
    console.error("[apprenant/products/download POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
