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
        files: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, url: true, size: true, mimeType: true, order: true },
        },
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

    // Files: replace-all if `files` array is provided. Each item: { name, url, size?, mimeType? }.
    // We delete existing rows and recreate to keep the order in sync with the array index.
    let filesUpdate: { deleteMany: object; create: Array<{ name: string; url: string; size: number | null; mimeType: string | null; order: number }> } | undefined;
    if (Array.isArray(body.files)) {
      const safe = (body.files as unknown[])
        .filter((f): f is { name: string; url: string; size?: number; mimeType?: string } =>
          !!f && typeof f === "object" && typeof (f as { url?: unknown }).url === "string" && !!(f as { url?: string }).url,
        )
        .slice(0, 50)
        .map((f, idx) => ({
          name: typeof f.name === "string" && f.name.trim() ? f.name.trim() : `fichier-${idx + 1}`,
          url: f.url.trim(),
          size: typeof f.size === "number" ? f.size : null,
          mimeType: typeof f.mimeType === "string" ? f.mimeType : null,
          order: idx,
        }));
      filesUpdate = {
        deleteMany: {},
        create: safe,
      };
    }

    // Keep the legacy `fileUrl` scalar in sync with the first item of the new
    // `files` array. Buyer-side delivery still reads `fileUrl` for backward
    // compat — without this, replacing files leaves a stale (often deleted) URL.
    const fileUrlSync =
      filesUpdate
        ? (filesUpdate.create[0]?.url ?? null)
        : body.fileUrl !== undefined
          ? (body.fileUrl || null)
          : undefined;

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
        fileUrl: fileUrlSync,
        hiddenFromMarketplace: typeof body.hiddenFromMarketplace === "boolean" ? body.hiddenFromMarketplace : undefined,
        ...(filesUpdate ? { files: filesUpdate } : {}),
      },
      include: {
        files: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, url: true, size: true, mimeType: true, order: true },
        },
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
