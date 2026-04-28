/**
 * GET /api/formations/apprenant/commandes/[id]/invoice
 *
 * Génère le PDF d'une facture Novakou pour une commande de l'apprenant.
 * La commande peut être :
 *   1. Une Enrollment (formation)
 *   2. Un DigitalProductPurchase (produit numérique)
 *   3. Un MentorBooking (session de mentorat)
 *
 * Sécurité :
 *  - Auth requise (getServerSession). 401 sinon.
 *  - L'utilisateur doit être le propriétaire de la commande. 404 sinon
 *    (on évite de divulguer l'existence d'une commande).
 *
 * Layout PDF (pdf-lib, A4 portrait) :
 *  - Header : logo "NK" vert + "FACTURE" en serif gras
 *  - Block info facture (numéro, date)
 *  - Block émetteur / client
 *  - Table 1 ligne : description / qté / prix unit. / total
 *  - Sous-total + total (pas de TVA pour MVP — Art. 293B CGI)
 *  - Footer : mentions légales
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";

type Params = { params: Promise<{ id: string }> };

// ── Palette Novakou ────────────────────────────────────────────────────
const FOREST = rgb(0 / 255, 110 / 255, 47 / 255); // #006e2f
const FOREST_LIGHT = rgb(34 / 255, 197 / 255, 94 / 255); // #22c55e
const TEXT_DARK = rgb(25 / 255, 28 / 255, 30 / 255); // #191c1e
const TEXT_MUTED = rgb(92 / 255, 100 / 255, 122 / 255); // #5c647a
const TEXT_BORDER = rgb(220 / 255, 222 / 255, 230 / 255);
const ROW_BG = rgb(245 / 255, 250 / 255, 247 / 255);

// Latin-1 transliteration to keep Standard fonts safe (Helvetica + Times
// don't carry every accent reliably, so we strip them for headings/labels).
function asciiSafe(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/'/g, "'")
    .replace(/«|»/g, '"')
    .replace(/€/g, "EUR");
}

function formatXof(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: {
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
    align?: "left" | "right" | "center";
    maxWidth?: number;
  },
) {
  const { font, size, color = TEXT_DARK, align = "left", maxWidth } = options;
  let textToDraw = asciiSafe(text);
  // Trim to maxWidth if needed (very rough — single-line truncation)
  if (maxWidth) {
    while (
      font.widthOfTextAtSize(textToDraw, size) > maxWidth &&
      textToDraw.length > 4
    ) {
      textToDraw = textToDraw.slice(0, -2) + "…";
    }
  }
  let drawX = x;
  if (align === "right") {
    drawX = x - font.widthOfTextAtSize(textToDraw, size);
  } else if (align === "center") {
    drawX = x - font.widthOfTextAtSize(textToDraw, size) / 2;
  }
  page.drawText(textToDraw, { x: drawX, y, size, font, color });
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id: orderId } = await params;

    // ── Look up order : try Enrollment → Purchase → Booking ─────────────
    let kind: "formation" | "product" | "mentor" | null = null;
    let title = "";
    let amount = 0;
    let createdAt: Date = new Date();
    let invoicePrefix = "FV";

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: orderId, userId },
      include: {
        formation: { select: { title: true } },
      },
    });

    if (enrollment) {
      kind = "formation";
      title = enrollment.formation?.title ?? "Formation Novakou";
      amount = enrollment.paidAmount;
      createdAt = enrollment.createdAt;
      invoicePrefix = "FV";
    } else {
      const purchase = await prisma.digitalProductPurchase.findFirst({
        where: { id: orderId, userId },
        include: {
          product: { select: { title: true } },
        },
      });
      if (purchase) {
        kind = "product";
        title = purchase.product?.title ?? "Produit numerique Novakou";
        amount = purchase.paidAmount;
        createdAt = purchase.createdAt;
        invoicePrefix = "FP";
      } else {
        const booking = await prisma.mentorBooking.findFirst({
          where: { id: orderId, studentId: userId },
          include: {
            mentor: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        });
        if (booking) {
          kind = "mentor";
          const mentorName = booking.mentor?.user?.name ?? "Mentor Novakou";
          title = `Session de mentorat (${booking.durationMinutes} min) — ${mentorName}`;
          amount = booking.paidAmount;
          createdAt = booking.scheduledAt ?? new Date();
          invoicePrefix = "FM";
        }
      }
    }

    if (!kind) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 },
      );
    }

    // ── Look up user (name + email) ────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const customerName =
      user?.name?.trim() || user?.email?.split("@")[0] || "Client Novakou";
    const customerEmail = user?.email ?? "";

    // ── Build invoice number ────────────────────────────────────────────
    const year = createdAt.getFullYear();
    const idSlice = orderId.slice(-8).toUpperCase();
    const invoiceNumber = `${invoicePrefix}-${year}-${idSlice}`;

    // ── Build PDF ──────────────────────────────────────────────────────
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Facture Novakou ${invoiceNumber}`);
    pdf.setAuthor("Novakou");
    pdf.setCreator("Novakou");
    pdf.setSubject("Facture commande");
    pdf.setKeywords(["facture", "novakou", invoiceNumber, customerName]);

    const page = pdf.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();
    const margin = 50;

    const fontReg = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontSerifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

    // ── Header ──────────────────────────────────────────────────────────
    // Logo "NK" disc (vert) at top-left
    const logoCx = margin + 18;
    const logoCy = height - margin - 4;
    page.drawCircle({ x: logoCx, y: logoCy, size: 18, color: FOREST });
    page.drawCircle({
      x: logoCx,
      y: logoCy,
      size: 18,
      borderColor: FOREST_LIGHT,
      borderWidth: 1,
    });
    drawText(page, "NK", logoCx, logoCy - 5, {
      font: fontBold,
      size: 14,
      color: rgb(1, 1, 1),
      align: "center",
    });

    // "Novakou" wordmark right of logo
    drawText(page, "Novakou", logoCx + 28, logoCy - 4, {
      font: fontBold,
      size: 18,
      color: TEXT_DARK,
    });
    drawText(
      page,
      "L'academie des createurs digitaux",
      logoCx + 28,
      logoCy - 18,
      { font: fontReg, size: 8, color: TEXT_MUTED },
    );

    // "FACTURE" label — top-right, serif gras
    drawText(page, "FACTURE", width - margin, height - margin - 2, {
      font: fontSerifBold,
      size: 26,
      color: FOREST,
      align: "right",
    });
    drawText(page, invoiceNumber, width - margin, height - margin - 22, {
      font: fontBold,
      size: 10,
      color: TEXT_MUTED,
      align: "right",
    });

    // Header divider
    page.drawLine({
      start: { x: margin, y: height - margin - 50 },
      end: { x: width - margin, y: height - margin - 50 },
      thickness: 1.2,
      color: FOREST,
    });

    let y = height - margin - 80;

    // ── Info facture ────────────────────────────────────────────────────
    drawText(page, "Informations de facturation", margin, y, {
      font: fontBold,
      size: 11,
      color: TEXT_DARK,
    });
    y -= 16;
    const infoRows: [string, string][] = [
      ["Numero de facture", invoiceNumber],
      ["Date d'emission", formatDateFr(createdAt)],
      [
        "Type",
        kind === "formation"
          ? "Formation"
          : kind === "product"
            ? "Produit numerique"
            : "Session de mentorat",
      ],
    ];
    for (const [label, value] of infoRows) {
      drawText(page, label, margin, y, {
        font: fontReg,
        size: 9,
        color: TEXT_MUTED,
      });
      drawText(page, value, margin + 130, y, {
        font: fontBold,
        size: 9,
        color: TEXT_DARK,
      });
      y -= 14;
    }

    y -= 12;

    // ── Emetteur / Client (2 colonnes) ─────────────────────────────────
    const colLeft = margin;
    const colRight = width / 2 + 10;

    drawText(page, "Emetteur", colLeft, y, {
      font: fontBold,
      size: 10,
      color: TEXT_DARK,
    });
    drawText(page, "Client", colRight, y, {
      font: fontBold,
      size: 10,
      color: TEXT_DARK,
    });
    y -= 14;

    const emitterLines = [
      "Novakou",
      "Edite par Pirabel Labs",
      "support@novakou.com",
      "www.novakou.com",
    ];
    const clientLines = [customerName, customerEmail].filter(Boolean);

    let yLeft = y;
    let yRight = y;
    for (const line of emitterLines) {
      drawText(page, line, colLeft, yLeft, {
        font: fontReg,
        size: 9,
        color: TEXT_MUTED,
        maxWidth: width / 2 - margin - 10,
      });
      yLeft -= 12;
    }
    for (const line of clientLines) {
      drawText(page, line, colRight, yRight, {
        font: fontReg,
        size: 9,
        color: TEXT_MUTED,
        maxWidth: width / 2 - margin - 10,
      });
      yRight -= 12;
    }

    y = Math.min(yLeft, yRight) - 14;

    // ── Table : 1 ligne ────────────────────────────────────────────────
    const tableX = {
      desc: margin + 8,
      qty: width - margin - 170,
      unit: width - margin - 100,
      total: width - margin - 8,
    };
    const tableTop = y;

    // Header row
    page.drawRectangle({
      x: margin,
      y: y - 14,
      width: width - margin * 2,
      height: 20,
      color: ROW_BG,
    });
    drawText(page, "Description", tableX.desc, y - 8, {
      font: fontBold,
      size: 9,
      color: TEXT_DARK,
    });
    drawText(page, "Qte", tableX.qty, y - 8, {
      font: fontBold,
      size: 9,
      color: TEXT_DARK,
      align: "right",
    });
    drawText(page, "Prix unit.", tableX.unit, y - 8, {
      font: fontBold,
      size: 9,
      color: TEXT_DARK,
      align: "right",
    });
    drawText(page, "Total", tableX.total, y - 8, {
      font: fontBold,
      size: 9,
      color: TEXT_DARK,
      align: "right",
    });
    y -= 30;

    // Item row
    drawText(page, title, tableX.desc, y, {
      font: fontReg,
      size: 9,
      color: TEXT_DARK,
      maxWidth: tableX.qty - tableX.desc - 16,
    });
    drawText(page, "1", tableX.qty, y, {
      font: fontReg,
      size: 9,
      color: TEXT_DARK,
      align: "right",
    });
    drawText(page, formatXof(amount), tableX.unit, y, {
      font: fontReg,
      size: 9,
      color: TEXT_DARK,
      align: "right",
    });
    drawText(page, formatXof(amount), tableX.total, y, {
      font: fontBold,
      size: 9,
      color: TEXT_DARK,
      align: "right",
    });
    y -= 12;

    // Bottom border of table
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.6,
      color: TEXT_BORDER,
    });
    void tableTop;

    y -= 18;

    // ── Totaux (pas de TVA — Art. 293B CGI) ────────────────────────────
    const totalsLabelX = width - margin - 100;
    const totalsValueX = width - margin - 8;

    drawText(page, "Sous-total", totalsLabelX, y, {
      font: fontReg,
      size: 9,
      color: TEXT_MUTED,
      align: "right",
    });
    drawText(page, formatXof(amount), totalsValueX, y, {
      font: fontReg,
      size: 9,
      color: TEXT_DARK,
      align: "right",
    });
    y -= 14;

    drawText(page, "TVA", totalsLabelX, y, {
      font: fontReg,
      size: 9,
      color: TEXT_MUTED,
      align: "right",
    });
    drawText(page, "Non applicable", totalsValueX, y, {
      font: fontReg,
      size: 9,
      color: TEXT_MUTED,
      align: "right",
    });
    y -= 18;

    // Total bar
    page.drawRectangle({
      x: totalsLabelX - 60,
      y: y - 6,
      width: width - margin - (totalsLabelX - 60),
      height: 22,
      color: FOREST,
    });
    drawText(page, "TOTAL", totalsLabelX, y + 4, {
      font: fontBold,
      size: 11,
      color: rgb(1, 1, 1),
      align: "right",
    });
    drawText(page, formatXof(amount), totalsValueX, y + 4, {
      font: fontBold,
      size: 11,
      color: rgb(1, 1, 1),
      align: "right",
    });

    y -= 36;

    // ── Mentions sous total ─────────────────────────────────────────────
    drawText(
      page,
      "TVA non applicable, Art. 293B du CGI.",
      margin,
      y,
      { font: fontReg, size: 8, color: TEXT_MUTED },
    );
    y -= 11;
    drawText(
      page,
      "Facture acquittee — paiement recu integralement.",
      margin,
      y,
      { font: fontReg, size: 8, color: TEXT_MUTED },
    );

    // ── Footer (bottom of page) ─────────────────────────────────────────
    const footY = 60;
    page.drawLine({
      start: { x: margin, y: footY + 22 },
      end: { x: width - margin, y: footY + 22 },
      thickness: 0.4,
      color: TEXT_BORDER,
    });
    drawText(
      page,
      "Novakou — L'academie des createurs digitaux d'Afrique francophone",
      width / 2,
      footY + 10,
      { font: fontBold, size: 8, color: TEXT_DARK, align: "center" },
    );
    drawText(
      page,
      "Edite par Pirabel Labs  .  support@novakou.com  .  www.novakou.com",
      width / 2,
      footY,
      { font: fontReg, size: 7, color: TEXT_MUTED, align: "center" },
    );
    drawText(
      page,
      "TVA non applicable Art. 293B CGI  .  Document genere automatiquement",
      width / 2,
      footY - 9,
      { font: fontReg, size: 7, color: TEXT_MUTED, align: "center" },
    );

    // ── Output ─────────────────────────────────────────────────────────
    const pdfBytes = await pdf.save();
    const filename = `facture-novakou-${invoiceNumber}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[commandes/[id]/invoice GET]", err);
    return NextResponse.json(
      { error: "Erreur lors de la generation de la facture" },
      { status: 500 },
    );
  }
}
