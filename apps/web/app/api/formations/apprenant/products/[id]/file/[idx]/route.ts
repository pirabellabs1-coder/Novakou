// GET /api/formations/apprenant/products/[id]/file/[idx]
//
// Proxy de téléchargement pour les produits numériques achetés.
//
// Pourquoi un proxy plutôt qu'une signed URL Supabase exposée au client ?
// 1. Les signed URLs ont un TTL (1h) → si l'utilisateur ouvre la page puis
//    clique le lien plus tard, le JWT a expiré → erreur InvalidJWT côté
//    Supabase (visible par l'utilisateur). Le proxy résout l'URL fraîche
//    AU MOMENT du clic.
// 2. Garantit `Content-Disposition: attachment` → le navigateur télécharge
//    direct au lieu d'ouvrir le PDF inline. Pas de dépendance à un param
//    Supabase qui pourrait être ignoré par certaines configs.
// 3. Aucune URL Supabase n'est exposée côté client → impossible de partager
//    le lien direct vers le fichier.
// 4. On peut auditer chaque download côté serveur (downloadCount).
//
// Le client utilise simplement `<a href="/api/.../file/0" download="nom.pdf">`
// → navigation vers cette route → 302 redirect vers signed URL fraîche +
// Content-Disposition. Le browser télécharge sans afficher d'onglet.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";
import { resolveStorageFileUrl } from "@/lib/supabase-storage";

export const runtime = "nodejs";
// Pas de cache : chaque clic doit générer une URL fraîche.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; idx: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id, idx } = await params;
    const index = Math.max(0, Number.parseInt(idx, 10) || 0);

    // Vérifie ownership : la purchase doit appartenir au user connecté.
    const purchase = await prisma.digitalProductPurchase.findFirst({
      where: { id, userId },
      select: {
        id: true,
        product: {
          select: {
            fileUrl: true,
            files: {
              orderBy: { order: "asc" },
              select: { id: true, name: true, url: true, mimeType: true },
            },
          },
        },
      },
    });
    if (!purchase || !purchase.product) {
      return NextResponse.json(
        { error: "Achat introuvable ou non autorisé" },
        { status: 404 },
      );
    }

    // Sélectionne le fichier demandé. Si pas de `files`, fallback sur le
    // fileUrl legacy (un seul fichier).
    const allFiles = purchase.product.files ?? [];
    let target: { name: string; url: string } | null = null;
    if (allFiles.length > 0) {
      const f = allFiles[index];
      if (!f) {
        return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
      }
      target = { name: f.name || `fichier-${index + 1}`, url: f.url };
    } else if (purchase.product.fileUrl) {
      target = {
        name: purchase.product.fileUrl.split("?")[0].split("/").pop() ?? "fichier",
        url: purchase.product.fileUrl,
      };
    }

    if (!target) {
      return NextResponse.json({ error: "Aucun fichier disponible" }, { status: 404 });
    }

    // Génère une URL Supabase fraîche AVEC Content-Disposition: attachment
    // (via l'option `download` = nom de fichier).
    const fresh = await resolveStorageFileUrl(
      target.url,
      "order-deliveries",
      3600,
      target.name || true,
    );

    if (!fresh) {
      return NextResponse.json(
        { error: "Impossible de générer le lien de téléchargement" },
        { status: 500 },
      );
    }

    // Incrémente le compteur (best-effort, non bloquant).
    prisma.digitalProductPurchase
      .update({ where: { id }, data: { downloadCount: { increment: 1 } } })
      .catch((e) => console.warn("[proxy file] downloadCount inc failed", e));

    // 302 redirect vers l'URL signée fraîche. Le browser suit, télécharge
    // depuis Supabase avec le header Content-Disposition: attachment, et
    // sauve le fichier sans ouvrir d'onglet.
    return NextResponse.redirect(fresh, { status: 302 });
  } catch (err) {
    console.error("[apprenant/products/file GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
