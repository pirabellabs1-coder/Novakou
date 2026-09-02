// @ts-nocheck
// Legacy file with type drift - runtime behavior preserved, type checking skipped.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStorageFileUrl } from "@/lib/supabase-storage";
import { construireApercuPdf, PdfIllisibleError } from "@/lib/formations/apercu-pdf";

// Jamais de cache public : le vendeur peut dépublier son produit ou remplacer
// son PDF à tout moment, et un CDN partagé continuerait de servir l'ancien
// extrait. Un cache privé d'1 h suffit à absorber les rafraîchissements.
const CACHE_HEADER = "private, max-age=3600";

// Aperçu public du PDF d'un produit numérique.
// Renvoie les PAGES_APERCU premières pages, toujours filigranées. Ni le nombre
// de pages ni le filigrane ne sont négociables : voir lib/formations/apercu.ts.
// Pas d'auth — l'aperçu fait partie de la vitrine publique du produit.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const product = await prisma.digitalProduct.findUnique({
      where: { id },
      select: {
        status: true,
        fileUrl: true,
        files: {
          orderBy: { order: "asc" },
          select: { url: true, mimeType: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }
    if (product.status !== "ACTIF") {
      return NextResponse.json({ error: "Produit non publié" }, { status: 404 });
    }

    // Pick the first PDF from the file list. Fall back to the legacy fileUrl
    // scalar (older products that pre-date the multi-file uploader).
    const pdfFile =
      product.files.find((f) => (f.mimeType ?? "").toLowerCase() === "application/pdf") ??
      (product.fileUrl?.toLowerCase().endsWith(".pdf")
        ? { url: product.fileUrl, mimeType: "application/pdf" }
        : null);

    if (!pdfFile?.url) {
      return NextResponse.json(
        { error: "Aucun PDF disponible pour l'aperçu" },
        { status: 404 },
      );
    }

    // Le champ stocké peut être un chemin Supabase Storage brut, une signed URL
    // expirée (TTL upload = 1h), ou une URL publique externe. On résout au moment
    // du fetch pour toujours avoir une URL valide.
    const fetchableUrl = await resolveStorageFileUrl(pdfFile.url, "order-deliveries", 600);
    if (!fetchableUrl) {
      console.error("[produits/preview] cannot resolve URL", pdfFile.url);
      return NextResponse.json({ error: "Fichier source indisponible" }, { status: 502 });
    }
    const upstream = await fetch(fetchableUrl, { cache: "no-store" });
    if (!upstream.ok) {
      console.error("[produits/preview] upstream fetch failed", upstream.status, fetchableUrl);
      return NextResponse.json({ error: "Fichier source indisponible" }, { status: 502 });
    }
    const sourceBytes = new Uint8Array(await upstream.arrayBuffer());

    // Découpe + filigrane : lib/formations/apercu-pdf.ts, couvert par
    // tests/apercu-ebook.spec.ts.
    let outBytes: Uint8Array;
    try {
      outBytes = await construireApercuPdf(sourceBytes);
    } catch (err) {
      if (err instanceof PdfIllisibleError) {
        console.error("[produits/preview] PDF illisible", err.message);
        return NextResponse.json({ error: "PDF illisible" }, { status: 422 });
      }
      throw err;
    }

    // Bump view count async — mirrors the public product GET.
    prisma.digitalProduct
      .update({ where: { id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => null);

    return new NextResponse(outBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="apercu-${id}.pdf"`,
        "Content-Length": String(outBytes.byteLength),
        "Cache-Control": CACHE_HEADER,
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (err) {
    console.error("[produits/preview]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
