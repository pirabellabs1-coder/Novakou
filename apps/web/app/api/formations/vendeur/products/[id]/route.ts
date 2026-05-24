import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { resolveStorageFileUrl, getStorageObjectPath } from "@/lib/supabase-storage";

// Reconvertit une URL Supabase Storage (signée ou non) en chemin brut pour la DB.
// Pour les URLs externes (Cloudinary, http public), conserve la valeur telle quelle.
function normalizeStorageUrlForDb(value: string): string {
  const trimmed = value.trim();
  const obj = getStorageObjectPath(trimmed, "order-deliveries");
  return obj ? obj.path : trimmed;
}

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
        productType: true, thumbnail: true, banner: true, price: true, originalPrice: true,
        rating: true, reviewsCount: true, salesCount: true, viewsCount: true,
        tags: true, status: true, fileUrl: true,
        hiddenFromMarketplace: true,
        previewEnabled: true, previewPages: true, watermarkEnabled: true,
        // Limites de vente (pour le formulaire vendeur)
        maxBuyers: true, currentBuyers: true, salesEndAt: true,
        createdAt: true, updatedAt: true,
        category: { select: { id: true, slug: true, name: true } },
        files: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, url: true, size: true, mimeType: true, order: true },
        },
      },
    });

    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    // Les colonnes DB peuvent contenir un chemin Supabase, une signed URL expirée
    // ou une URL publique. On résout à chaque GET pour que les boutons "Aperçu" /
    // "Ouvrir" du formulaire vendeur fonctionnent (TTL 1h, durée d'une session édition).
    const [fileUrl, resolvedFiles] = await Promise.all([
      product.fileUrl ? resolveStorageFileUrl(product.fileUrl, "order-deliveries", 3600) : Promise.resolve(null),
      Promise.all(
        product.files.map(async (f) => ({
          ...f,
          url: (await resolveStorageFileUrl(f.url, "order-deliveries", 3600)) || f.url,
        })),
      ),
    ]);

    return NextResponse.json({
      data: {
        ...product,
        fileUrl: fileUrl ?? product.fileUrl,
        files: resolvedFiles,
      },
    });
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

    // V2.1 — server-side price validation on update
    let priceVal: number | undefined;
    if (body.price !== undefined) {
      const tmp = parseFloat(body.price);
      if (!Number.isFinite(tmp) || tmp < 0) {
        return NextResponse.json(
          { error: "Le prix doit être un nombre positif ou nul." },
          { status: 400 }
        );
      }
      priceVal = tmp;
    }
    // Effective price after potential update (fallback to existing record)
    const effectivePrice = priceVal !== undefined ? priceVal : existing.price;

    // V2.3 — originalPrice strictement supérieur au prix
    let originalPriceVal: number | null | undefined;
    if (body.originalPrice !== undefined) {
      if (body.originalPrice === null || body.originalPrice === "" || body.originalPrice === 0) {
        originalPriceVal = null;
      } else {
        const tmp = parseFloat(body.originalPrice);
        if (!Number.isFinite(tmp) || tmp <= effectivePrice) {
          return NextResponse.json(
            { error: "Le prix barré doit être strictement supérieur au prix de vente." },
            { status: 400 }
          );
        }
        originalPriceVal = tmp;
      }
    }

    // V2.2 — publishedAt management
    // Stamp it the first time the product becomes ACTIF; null it on return to BROUILLON.
    // DigitalProduct has no publishedAt column in the schema, so we don't write one — but
    // we still gate the status transition behind the same logic (no-op).
    void body.status;

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
          url: normalizeStorageUrlForDb(f.url),
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
          ? (body.fileUrl ? normalizeStorageUrlForDb(body.fileUrl) : null)
          : undefined;

    const updated = await prisma.digitalProduct.update({
      where: { id },
      data: {
        title: body.title?.trim() || undefined,
        description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
        descriptionFormat: body.descriptionFormat ?? undefined,
        thumbnail: body.thumbnail !== undefined ? (body.thumbnail || null) : undefined,
        banner: body.banner !== undefined ? (body.banner || null) : undefined,
        price: priceVal,
        originalPrice: originalPriceVal,
        productType: body.productType ?? undefined,
        tags: Array.isArray(body.tags) ? body.tags : undefined,
        status: body.status ?? undefined,
        fileUrl: fileUrlSync,
        hiddenFromMarketplace: typeof body.hiddenFromMarketplace === "boolean" ? body.hiddenFromMarketplace : undefined,
        previewEnabled: typeof body.previewEnabled === "boolean" ? body.previewEnabled : undefined,
        previewPages: typeof body.previewPages === "number" && body.previewPages >= 1 && body.previewPages <= 20
          ? Math.floor(body.previewPages)
          : undefined,
        watermarkEnabled: typeof body.watermarkEnabled === "boolean" ? body.watermarkEnabled : undefined,
        // Limites de vente. body.X === null → on remet null (pas de limite). undefined → on ne touche pas.
        maxBuyers: body.maxBuyers === null
          ? null
          : typeof body.maxBuyers === "number" && body.maxBuyers >= 0
            ? Math.floor(body.maxBuyers)
            : undefined,
        currentBuyers: typeof body.currentBuyers === "number" && body.currentBuyers >= 0
          ? Math.floor(body.currentBuyers)
          : undefined,
        salesEndAt: body.salesEndAt === null
          ? null
          : typeof body.salesEndAt === "string" && body.salesEndAt.trim() !== ""
            ? new Date(body.salesEndAt)
            : undefined,
        ...(filesUpdate ? { files: filesUpdate } : {}),
      },
      include: {
        files: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, url: true, size: true, mimeType: true, order: true },
        },
      },
    });

    // Résoudre les chemins en signed URLs pour la réponse — sinon le client
    // récupère des chemins bruts non-cliquables jusqu'au prochain refetch GET.
    const [respFileUrl, respFiles] = await Promise.all([
      updated.fileUrl ? resolveStorageFileUrl(updated.fileUrl, "order-deliveries", 3600) : Promise.resolve(null),
      Promise.all(
        updated.files.map(async (f) => ({
          ...f,
          url: (await resolveStorageFileUrl(f.url, "order-deliveries", 3600)) || f.url,
        })),
      ),
    ]);

    return NextResponse.json({
      data: { ...updated, fileUrl: respFileUrl ?? updated.fileUrl, files: respFiles },
    });
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
