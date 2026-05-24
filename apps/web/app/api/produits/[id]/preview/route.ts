// @ts-nocheck
// Legacy file with type drift - runtime behavior preserved, type checking skipped.

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { resolveStorageFileUrl } from "@/lib/supabase-storage";

// Streamed inline so the iframe can render it. Do NOT cache publicly — the
// underlying PDF can be unpublished or the vendor can revoke previewEnabled
// at any time. Private cache for 1h is enough to absorb refreshes.
const CACHE_HEADER = "private, max-age=3600";

const WATERMARK_TEXT = "APERÇU — novakou.com";

// Public preview of a digital product PDF.
// Streams the first N pages (vendor-controlled, capped at 20) with an optional
// diagonal Novakou watermark. No auth required: previews are part of the
// product's public marketing surface, but only when the vendor opts in.
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
        previewEnabled: true,
        previewPages: true,
        watermarkEnabled: true,
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
    if (!product.previewEnabled) {
      return NextResponse.json(
        { error: "Aperçu non activé par le vendeur" },
        { status: 403 },
      );
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

    // pdf-lib refuses encrypted PDFs by default. Try ignoreEncryption so a
    // password-protected source falls back to "no preview" rather than 500.
    let srcDoc: PDFDocument;
    try {
      srcDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    } catch (err) {
      console.error("[produits/preview] PDFDocument.load failed", err);
      return NextResponse.json({ error: "PDF illisible" }, { status: 422 });
    }

    const totalPages = srcDoc.getPageCount();
    const requested = Math.max(1, Math.min(product.previewPages ?? 5, 20));
    const take = Math.min(requested, totalPages);

    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(
      srcDoc,
      Array.from({ length: take }, (_, i) => i),
    );
    for (const page of copied) outDoc.addPage(page);

    // Diagonal Novakou watermark across each page. Repeated in a 3-row band
    // so it covers the visible area regardless of page orientation.
    if (product.watermarkEnabled !== false) {
      const font = await outDoc.embedFont(StandardFonts.HelveticaBold);
      for (const page of outDoc.getPages()) {
        const { width, height } = page.getSize();
        const fontSize = Math.max(28, Math.min(width, height) * 0.06);
        const color = rgb(0.55, 0.55, 0.55);
        const opacity = 0.22;
        for (const ratio of [0.25, 0.5, 0.75]) {
          page.drawText(WATERMARK_TEXT, {
            x: width * 0.08,
            y: height * ratio,
            size: fontSize,
            font,
            color,
            opacity,
            rotate: degrees(-30),
          });
        }
      }
    }

    const outBytes = await outDoc.save();

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
