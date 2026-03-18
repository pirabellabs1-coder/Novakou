// GET /api/produits/[id]/download — Téléchargement sécurisé (vérifie achat + limite downloads)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Find the product (include instructeurId for owner check)
    const product = await prisma.digitalProduct.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
        id: true,
        fileUrl: true,
        fileStoragePath: true,
        fileMimeType: true,
        fileSize: true,
        titleFr: true,
        isFree: true,
        instructeur: { select: { userId: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    if (!product.fileUrl) {
      return NextResponse.json(
        { error: "Aucun fichier associé à ce produit" },
        { status: 404 }
      );
    }

    // Allow the product's own instructor to download (for testing/verification)
    const isOwner = product.instructeur?.userId === session.user.id;

    // For free products or product owner, no purchase check needed
    if (!product.isFree && !isOwner) {
      // Verify the user has purchased this product
      const purchase = await prisma.digitalProductPurchase.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
      });

      if (!purchase) {
        return NextResponse.json(
          { error: "Vous n'avez pas acheté ce produit" },
          { status: 403 }
        );
      }

      // Check download limit
      if (purchase.downloadCount >= purchase.maxDownloads) {
        return NextResponse.json(
          {
            error: `Limite de téléchargements atteinte (${purchase.maxDownloads} max)`,
          },
          { status: 403 }
        );
      }

      // Increment download count
      await prisma.digitalProductPurchase.update({
        where: { id: purchase.id },
        data: { downloadCount: { increment: 1 } },
      });
    }

    // Fetch the file and stream it to the client
    const fileResponse = await fetch(product.fileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Impossible de récupérer le fichier" },
        { status: 502 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    // Sanitize filename
    const safeTitle = product.titleFr
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);
    const ext = product.fileMimeType?.split("/").pop() || "pdf";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": product.fileMimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/produits/[id]/download]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
