import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const product = await prisma.digitalProduct.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
      select: {
        id: true, slug: true, title: true, description: true, descriptionFormat: true,
        productType: true, banner: true, price: true, originalPrice: true,
        rating: true, reviewsCount: true, salesCount: true, viewsCount: true,
        tags: true, status: true, fileUrl: true,
        hiddenFromMarketplace: true,
        createdAt: true, updatedAt: true,
        category: { select: { id: true, slug: true, name: true } },
      },
    });

    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    return NextResponse.json({ data: product });
  } catch (err) {
    console.error("[vendeur/products/[id] GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.digitalProduct.findFirst({ where: { id, instructeurId: ctx.instructeurId } });
    if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.digitalProduct.update({
      where: { id },
      data: {
        title: body.title?.trim() || undefined,
        description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
        descriptionFormat: body.descriptionFormat ?? undefined,
        banner: body.banner !== undefined ? (body.banner || null) : undefined,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        originalPrice: body.originalPrice !== undefined ? (body.originalPrice ? parseFloat(body.originalPrice) : null) : undefined,
        productType: body.productType ?? undefined,
        tags: Array.isArray(body.tags) ? body.tags : undefined,
        status: body.status ?? undefined,
        fileUrl: body.fileUrl !== undefined ? (body.fileUrl || null) : undefined,
        hiddenFromMarketplace: typeof body.hiddenFromMarketplace === "boolean" ? body.hiddenFromMarketplace : undefined,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[vendeur/products/[id] PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.digitalProduct.findFirst({ where: { id, instructeurId: ctx.instructeurId } });
    if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    await prisma.digitalProduct.delete({ where: { id } });
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error("[vendeur/products/[id] DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
