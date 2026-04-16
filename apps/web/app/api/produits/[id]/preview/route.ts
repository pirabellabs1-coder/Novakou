// GET /api/produits/[id]/preview — Aperçu PDF filigrané (N premières pages)

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import prisma from "@freelancehigh/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.digitalProduct.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: "ACTIF",
        previewEnabled: true,
      },
      select: {
        id: true,
        fileUrl: true,
        fileMimeType: true,
        previewPages: true,
        watermarkEnabled: true,
        title: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable ou aperçu désactivé" },
        { status: 404 }
      );
    }

    if (!product.fileUrl) {
      return NextResponse.json(
        { error: "Aucun fichier associé à ce produit" },
        { status: 404 }
      );
    }

    // Only PDF preview is supported
    if (product.fileMimeType && !product.fileMimeType.includes("pdf")) {
      return NextResponse.json(
        { error: "L'aperçu est uniquement disponible pour les fichiers PDF" },
        { status: 400 }
      );
    }

    // Fetch the original PDF
    const pdfResponse = await fetch(product.fileUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: "Impossible de récupérer le fichier" },
        { status: 502 }
      );
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const totalPages = sourcePdf.getPageCount();
    const previewPageCount = Math.min(product.previewPages, totalPages);

    // Create preview PDF with only N first pages
    const previewPdf = await PDFDocument.create();
    const copiedPages = await previewPdf.copyPages(
      sourcePdf,
      Array.from({ length: previewPageCount }, (_, i) => i)
    );

    for (const page of copiedPages) {
      previewPdf.addPage(page);
    }

    // Add watermark if enabled
    if (product.watermarkEnabled) {
      const font = await previewPdf.embedFont(StandardFonts.HelveticaBold);
      const watermarkText = "APERÇU - FreelanceHigh";

      for (let i = 0; i < previewPdf.getPageCount(); i++) {
        const page = previewPdf.getPage(i);
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) * 0.06;
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

        // Diagonal watermark centered
        page.drawText(watermarkText, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.8, 0.2, 0.2),
          opacity: 0.25,
          rotate: degrees(-45),
        });
      }
    }

    // Add a final "end of preview" page
    const endPage = previewPdf.addPage();
    const endFont = await previewPdf.embedFont(StandardFonts.HelveticaBold);
    const endFontRegular = await previewPdf.embedFont(StandardFonts.Helvetica);
    const { width: ew, height: eh } = endPage.getSize();

    const endTitle = "Fin de l'apercu";
    const endSubtitle = `Cet apercu contient ${previewPageCount} page(s) sur ${totalPages}.`;
    const endCta = "Achetez le produit complet sur FreelanceHigh";

    endPage.drawText(endTitle, {
      x: (ew - endFont.widthOfTextAtSize(endTitle, 28)) / 2,
      y: eh / 2 + 40,
      size: 28,
      font: endFont,
      color: rgb(0.42, 0.17, 0.85),
    });

    endPage.drawText(endSubtitle, {
      x: (ew - endFontRegular.widthOfTextAtSize(endSubtitle, 14)) / 2,
      y: eh / 2,
      size: 14,
      font: endFontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });

    endPage.drawText(endCta, {
      x: (ew - endFontRegular.widthOfTextAtSize(endCta, 12)) / 2,
      y: eh / 2 - 40,
      size: 12,
      font: endFontRegular,
      color: rgb(0.05, 0.65, 0.51),
    });

    const previewBytes = await previewPdf.save();

    return new NextResponse(Buffer.from(previewBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="apercu-${product.id}.pdf"`,
        "Cache-Control": "public, max-age=3600", // 1h cache
      },
    });
  } catch (error) {
    console.error("[GET /api/produits/[id]/preview]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
