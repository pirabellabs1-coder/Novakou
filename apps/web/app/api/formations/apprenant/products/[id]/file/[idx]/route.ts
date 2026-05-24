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
import {
  resolveStorageFileUrl,
  getStorageObjectPath,
  getSignedUrl,
  type StorageBucket,
} from "@/lib/supabase-storage";

export const runtime = "nodejs";
// Pas de cache : chaque clic doit générer une URL fraîche.
export const dynamic = "force-dynamic";

// Petite page HTML autonome (pas de layout Next, pas de hydration) qui
// s'affiche quand un fichier est introuvable. Utilisée pour les achats
// faits avant une migration de DB ou un changement de bucket.
function fileNotFoundPage(productTitle: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fichier indisponible — Novakou</title>
  <style>
    body { margin:0;padding:48px 24px;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#191c1e;line-height:1.5; }
    .card { max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,.06);text-align:center; }
    .icon { width:64px;height:64px;border-radius:50%;background:#fef3c7;color:#b45309;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:32px; }
    h1 { font-size:20px;font-weight:800;margin:0 0 12px; }
    p { color:#5c647a;font-size:14px;margin:0 0 16px; }
    a { display:inline-block;background:#006e2f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;margin-top:8px; }
    .small { color:#9ca3af;font-size:12px;margin-top:24px; }
    code { background:#f3f3f4;padding:2px 6px;border-radius:4px;font-size:12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠</div>
    <h1>Fichier temporairement indisponible</h1>
    <p>Le fichier du produit <strong>« ${productTitle.replace(/[<>&"']/g, "")}»</strong> n'est plus accessible. Cela arrive parfois sur d'anciens achats lorsque le vendeur a déplacé son contenu.</p>
    <p>Ton achat reste valide. Écris-nous à <a href="mailto:support@novakou.com" style="background:none;color:#006e2f;text-decoration:underline;padding:0;font-weight:600;">support@novakou.com</a> en précisant le nom du produit — on te le renverra sous 24h.</p>
    <a href="/apprenant/mes-produits">← Retour à mes produits</a>
  </div>
</body>
</html>`;
}

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
            title: true,
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

    const productTitle = purchase.product.title || "votre produit";

    if (!target) {
      return new NextResponse(fileNotFoundPage(productTitle), {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Avant de rediriger, on vérifie que le fichier existe vraiment dans
    // notre Supabase Storage actuel. Cas concret : un achat fait avant
    // une migration de base — le path en DB pointe vers un bucket/projet
    // qui n'existe plus. Sans cette vérif, le user clique "Télécharger"
    // → Supabase répond "InvalidJWT exp claim timestamp check failed"
    // (cryptique). Avec la vérif, on lui sert une page claire avec un
    // lien support.
    const object = getStorageObjectPath(target.url, "order-deliveries");
    if (object) {
      // Test : l'objet existe-t-il vraiment ? On essaie de signer une URL
      // courte (60s) ; si Supabase rejette parce que le fichier n'est pas
      // dans le bucket actuel, on tombe dans le catch.
      const probe = await getSignedUrl(object.bucket as StorageBucket, object.path, 60);
      if (!probe) {
        console.warn(
          `[proxy file] Fichier introuvable côté Supabase pour purchase=${id} bucket=${object.bucket} path=${object.path}`,
        );
        return new NextResponse(fileNotFoundPage(productTitle), {
          status: 410,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    // Génère l'URL finale avec Content-Disposition: attachment + filename.
    const fresh = await resolveStorageFileUrl(
      target.url,
      "order-deliveries",
      3600,
      target.name || true,
    );

    if (!fresh || !/^https?:\/\//i.test(fresh)) {
      // resolveStorageFileUrl peut retourner le path brut si non-résoluble
      // — on traite ça comme "fichier introuvable".
      return new NextResponse(fileNotFoundPage(productTitle), {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
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
