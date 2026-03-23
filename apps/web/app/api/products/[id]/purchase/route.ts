import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id: productId } = await params;

    // Fetch the product
    const product = await prisma.digitalProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Only active products can be purchased
    if (product.status !== "ACTIF") {
      return NextResponse.json({ error: "Ce produit n'est pas disponible" }, { status: 400 });
    }

    // Check stock if limited (maxBuyers set)
    if (product.maxBuyers != null && product.currentBuyers >= product.maxBuyers) {
      return NextResponse.json({ error: "Produit en rupture de stock" }, { status: 400 });
    }

    // Check if already purchased
    const existingPurchase = await prisma.digitalProductPurchase.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json({ error: "Vous avez deja achete ce produit" }, { status: 409 });
    }

    // For free products, create purchase directly
    if (product.isFree || product.price === 0) {
      const purchase = await prisma.digitalProductPurchase.create({
        data: {
          userId: session.user.id,
          productId,
          paidAmount: 0,
          licenseKey: product.productType === "LICENCE" ? generateLicenseKey() : null,
          maxDownloads: 5,
        },
      });

      // Increment buyers + sales
      await prisma.digitalProduct.update({
        where: { id: productId },
        data: {
          currentBuyers: { increment: 1 },
          salesCount: { increment: 1 },
        },
      });

      return NextResponse.json({
        purchase: {
          id: purchase.id,
          productId: purchase.productId,
          paidAmount: purchase.paidAmount,
          licenseKey: purchase.licenseKey,
          downloadCount: purchase.downloadCount,
          maxDownloads: purchase.maxDownloads,
          createdAt: purchase.createdAt.toISOString(),
        },
      }, { status: 201 });
    }

    // For paid products, read optional stripeSessionId from body
    const body = await request.json().catch(() => ({}));
    const { stripeSessionId } = body as { stripeSessionId?: string };

    // TODO: In production, verify the Stripe session/payment before creating purchase
    const purchase = await prisma.digitalProductPurchase.create({
      data: {
        userId: session.user.id,
        productId,
        paidAmount: product.price,
        stripeSessionId: stripeSessionId || null,
        licenseKey: product.productType === "LICENCE" ? generateLicenseKey() : null,
        maxDownloads: 5,
      },
    });

    // Increment buyers + sales
    await prisma.digitalProduct.update({
      where: { id: productId },
      data: {
        currentBuyers: { increment: 1 },
        salesCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      purchase: {
        id: purchase.id,
        productId: purchase.productId,
        paidAmount: purchase.paidAmount,
        licenseKey: purchase.licenseKey,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        createdAt: purchase.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /products/[id]/purchase POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'achat du produit" },
      { status: 500 }
    );
  }
}

function generateLicenseKey(): string {
  const bytes = randomBytes(16);
  const hex = bytes.toString("hex").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}
