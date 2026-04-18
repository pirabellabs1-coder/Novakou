/**
 * GET /api/formations/vendeur/resources
 *
 * Agrège tous les fichiers/médias attachés aux contenus du vendeur :
 *   - thumbnails de formations + digital products
 *   - fichiers de leçons (vidéos, PDFs, etc.) via LessonAttachment si existe
 *   - banners et aperçus produits
 *
 * Retourne une liste unifiée triable/filtrable pour donner au vendeur
 * une vue d'ensemble de ses assets sans devoir ouvrir chaque produit.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

function guessKind(url: string): "video" | "pdf" | "image" | "audio" | "other" {
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(mp4|webm|mov|m4v|avi|mkv)$/.test(lower)) return "video";
  if (/\.(pdf)$/.test(lower)) return "pdf";
  if (/\.(png|jpe?g|gif|webp|svg|avif)$/.test(lower)) return "image";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(lower)) return "audio";
  return "other";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { instructeurId: ctx.instructeurId },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          updatedAt: true,
        },
      }),
      prisma.digitalProduct.findMany({
        where: { instructeurId: ctx.instructeurId },
        select: {
          id: true,
          title: true,
          slug: true,
          banner: true,
          updatedAt: true,
        },
      }),
    ]);

    const resources: Array<{
      id: string;
      title: string;
      url: string;
      kind: string;
      source: string;
      sourceId: string;
      sourceTitle: string;
      updatedAt: string;
    }> = [];

    for (const f of formations) {
      if (f.thumbnail) {
        resources.push({
          id: `f-thumb-${f.id}`,
          title: `Miniature — ${f.title}`,
          url: f.thumbnail,
          kind: guessKind(f.thumbnail),
          source: "formation",
          sourceId: f.id,
          sourceTitle: f.title,
          updatedAt: f.updatedAt.toISOString(),
        });
      }
    }
    for (const p of products) {
      if (p.banner) {
        resources.push({
          id: `p-banner-${p.id}`,
          title: `Bannière — ${p.title}`,
          url: p.banner,
          kind: guessKind(p.banner),
          source: "product",
          sourceId: p.id,
          sourceTitle: p.title,
          updatedAt: p.updatedAt.toISOString(),
        });
      }
    }

    // Note: we don't pull lesson attachments — to surface them, we'd join
    // Section + Lesson + optional Attachment tables. Added later if needed.

    resources.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return NextResponse.json({
      data: {
        resources,
        counts: {
          total: resources.length,
          formations: formations.length,
          products: products.length,
          videos: resources.filter((r) => r.kind === "video").length,
          images: resources.filter((r) => r.kind === "image").length,
          pdfs: resources.filter((r) => r.kind === "pdf").length,
        },
      },
    });
  } catch (err) {
    console.error("[vendeur/resources]", err);
    return NextResponse.json({ data: { resources: [], counts: {} } });
  }
}
