/**
 * GET /api/formations/apprenant/certificates/[id]/pdf
 *
 * Génère le PDF du certificat Novakou — design "grande école" :
 * fond ivoire, double bordure or, médaillon central avec couronne de
 * laurier, ornements aux 4 coins, typographie serif, mention honorifique
 * (cum laude / magna cum laude / summa cum laude), signatures.
 *
 * Sécurité :
 *  - L'utilisateur connecté doit être le titulaire du certificat,
 *    OU le certificat doit être public (cas par défaut — un lien
 *    /certificat/<code> est public, donc /pdf l'est aussi).
 *  - Les certificats révoqués renvoient 410 Gone.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFPage, type PDFFont } from "pdf-lib";

type Params = { params: Promise<{ id: string }> };

// ── Palette "grande école" ─────────────────────────────────────────────
const IVORY_BG = rgb(251 / 255, 250 / 255, 243 / 255); // #fbfaf3
const FOREST = rgb(13 / 255, 59 / 255, 31 / 255); // #0d3b1f
const GOLD = rgb(201 / 255, 169 / 255, 97 / 255); // #c9a961
const TEXT_DARK = rgb(26 / 255, 26 / 255, 26 / 255); // #1a1a1a
const TEXT_MUTED = rgb(92 / 255, 92 / 255, 92 / 255); // #5c5c5c

function honorific(score: number): { latin: string; french: string } | null {
  if (score >= 95) return { latin: "Summa cum Laude", french: "Avec les plus grands honneurs" };
  if (score >= 90) return { latin: "Magna cum Laude", french: "Avec grande distinction" };
  if (score >= 80) return { latin: "Cum Laude", french: "Avec distinction" };
  return null;
}

// Latin-1 transliteration to keep Standard fonts (which don't carry full
// accent glyphs) safe. We replace É → E, etc., but only for headings/
// labels — names + titles fall back to the original chars (Helvetica
// supports them in PDF/A reasonably).
function asciiSafe(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/'/g, "'")
    .replace(/«|»/g, '"');
}

// ── Drawing helpers ────────────────────────────────────────────────────
function drawCenteredText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: ReturnType<typeof rgb>,
  pageWidth: number,
  letterSpacing = 0,
) {
  if (letterSpacing > 0) {
    // Manually space characters
    let totalWidth = 0;
    for (const ch of text) {
      totalWidth += font.widthOfTextAtSize(ch, size) + letterSpacing;
    }
    totalWidth -= letterSpacing;
    let x = (pageWidth - totalWidth) / 2;
    for (const ch of text) {
      page.drawText(ch, { x, y, size, font, color });
      x += font.widthOfTextAtSize(ch, size) + letterSpacing;
    }
    return;
  }
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (pageWidth - w) / 2, y, size, font, color });
}

// 4 corner ornaments — drawn programmatically using small lines/circles
function drawCornerOrnament(
  page: PDFPage,
  x: number,
  y: number,
  rotate: 0 | 90 | 180 | 270,
) {
  // base shape : two small arcs forming an L-volute, anchored at (x,y)
  // For rotate=0, ornament points down-right.
  const dx = (a: number, b: number) => {
    if (rotate === 0) return [x + a, y - b];
    if (rotate === 90) return [x + b, y + a];
    if (rotate === 180) return [x - a, y + b];
    return [x - b, y - a]; // 270
  };

  // Outer L line
  const [ax1, ay1] = dx(0, 0);
  const [ax2, ay2] = dx(40, 0);
  const [ax3, ay3] = dx(0, 40);
  page.drawLine({
    start: { x: ax1, y: ay1 },
    end: { x: ax2, y: ay2 },
    thickness: 1,
    color: GOLD,
  });
  page.drawLine({
    start: { x: ax1, y: ay1 },
    end: { x: ax3, y: ay3 },
    thickness: 1,
    color: GOLD,
  });
  // Decorative dots
  const dots: [number, number][] = [
    [40, 6],
    [6, 40],
    [22, 22],
  ];
  for (const [a, b] of dots) {
    const [px, py] = dx(a, b);
    page.drawCircle({ x: px, y: py, size: 1.5, color: GOLD });
  }
  // Small diamond
  const [bx, by] = dx(50, 12);
  page.drawSquare({
    x: bx,
    y: by,
    size: 4,
    color: GOLD,
    rotate: degrees(45),
  });
}

// Center medallion with laurel wreath + NK monogram
function drawMedallion(
  page: PDFPage,
  cx: number,
  cy: number,
  fontBold: PDFFont,
) {
  // Outer thin gold ring
  page.drawCircle({
    x: cx,
    y: cy,
    size: 38,
    borderColor: GOLD,
    borderWidth: 0.8,
    color: undefined,
  });
  page.drawCircle({
    x: cx,
    y: cy,
    size: 35,
    borderColor: GOLD,
    borderWidth: 0.4,
    color: undefined,
  });
  // Inner forest disc
  page.drawCircle({
    x: cx,
    y: cy,
    size: 26,
    color: FOREST,
  });
  page.drawCircle({
    x: cx,
    y: cy,
    size: 26,
    borderColor: GOLD,
    borderWidth: 0.6,
    color: undefined,
  });
  // Laurel leaves — 5 left, 5 right (small ellipses approximated by tiny rotated rectangles)
  const leaves: { angle: number; r: number }[] = [
    { angle: 180, r: 35 }, // far left
    { angle: 200, r: 32 },
    { angle: 220, r: 30 },
    { angle: 160, r: 32 },
    { angle: 140, r: 30 },
    { angle: 0, r: 35 }, // far right
    { angle: 20, r: 30 },
    { angle: 40, r: 32 },
    { angle: -20, r: 32 },
    { angle: -40, r: 30 },
  ];
  for (const leaf of leaves) {
    const rad = (leaf.angle * Math.PI) / 180;
    const lx = cx + Math.cos(rad) * leaf.r;
    const ly = cy + Math.sin(rad) * leaf.r;
    page.drawEllipse({
      x: lx,
      y: ly,
      xScale: 2,
      yScale: 5,
      color: GOLD,
      opacity: 0.5,
      rotate: degrees(leaf.angle + 90),
    });
  }
  // Monogram NK
  const monoSize = 20;
  const monoText = "NK";
  const monoW = fontBold.widthOfTextAtSize(monoText, monoSize);
  page.drawText(monoText, {
    x: cx - monoW / 2,
    y: cy - monoSize / 2 + 2,
    size: monoSize,
    font: fontBold,
    color: GOLD,
  });
}

// Ornamental divider : line - diamond - line
function drawOrnamentalDivider(
  page: PDFPage,
  cx: number,
  y: number,
  totalWidth = 240,
) {
  const lineW = (totalWidth - 18) / 2;
  page.drawLine({
    start: { x: cx - totalWidth / 2, y },
    end: { x: cx - 9, y },
    thickness: 0.6,
    color: GOLD,
  });
  page.drawLine({
    start: { x: cx + 9, y },
    end: { x: cx + totalWidth / 2, y },
    thickness: 0.6,
    color: GOLD,
  });
  void lineW;
  // Diamond
  page.drawSquare({
    x: cx,
    y,
    size: 6,
    color: GOLD,
    rotate: degrees(45),
  });
  // Inner light diamond
  page.drawSquare({
    x: cx,
    y,
    size: 3,
    color: IVORY_BG,
    rotate: degrees(45),
  });
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const cert = await prisma.certificate.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        user: { select: { id: true, name: true, email: true } },
        formation: {
          include: {
            sections: { include: { lessons: { select: { id: true } } } },
            instructeur: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificat introuvable" }, { status: 404 });
    }
    if (cert.revokedAt) {
      return NextResponse.json({ error: "Certificat révoqué" }, { status: 410 });
    }

    const session = await getServerSession(authOptions);
    void session;

    const totalLessons = cert.formation.sections.reduce(
      (sum, s) => sum + s.lessons.length,
      0,
    );
    const studentName = cert.user.name || cert.user.email.split("@")[0] || "Apprenant";
    const formationTitle = cert.formation.title;
    const instructorName = cert.formation.instructeur?.user?.name || "";
    const issuedDate = new Date(cert.issuedAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const honor = honorific(cert.score);

    // ── Build PDF ────────────────────────────────────────────────────────
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Certificat Novakou - ${formationTitle}`);
    pdf.setAuthor("Novakou");
    pdf.setCreator("Novakou");
    pdf.setSubject("Certificat de complétion");
    pdf.setKeywords(["certificat", "novakou", "formation", studentName]);

    // A4 paysage
    const page = pdf.addPage([842, 595]);
    const { width, height } = page.getSize();
    const cx = width / 2;

    const fontReg = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontItal = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const fontSerifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const fontSerifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
    const fontSerifReg = await pdf.embedFont(StandardFonts.TimesRoman);

    // Ivory background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: IVORY_BG,
    });

    // ── Double gold border ──────────────────────────────────────────────
    page.drawRectangle({
      x: 22,
      y: 22,
      width: width - 44,
      height: height - 44,
      borderColor: GOLD,
      borderWidth: 1.6,
      color: undefined,
    });
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: GOLD,
      borderWidth: 0.5,
      color: undefined,
      opacity: 0,
      borderOpacity: 0.6,
    });
    // Inner forest hairline
    page.drawRectangle({
      x: 50,
      y: 50,
      width: width - 100,
      height: height - 100,
      borderColor: FOREST,
      borderWidth: 0.4,
      color: undefined,
      opacity: 0,
      borderOpacity: 0.2,
    });

    // ── Corner ornaments ────────────────────────────────────────────────
    drawCornerOrnament(page, 60, height - 60, 0); // top-left
    drawCornerOrnament(page, width - 60, height - 60, 90); // top-right
    drawCornerOrnament(page, 60, 60, 270); // bottom-left
    drawCornerOrnament(page, width - 60, 60, 180); // bottom-right

    // ── Header ──────────────────────────────────────────────────────────
    let y = height - 90;
    drawCenteredText(
      page,
      asciiSafe("Scientia . Ars . Industria"),
      fontSerifReg,
      9,
      y,
      GOLD,
      width,
      4, // wide letter-spacing
    );

    y -= 30;
    drawCenteredText(
      page,
      "NOVAKOU",
      fontSerifBold,
      24,
      y,
      FOREST,
      width,
      6,
    );

    y -= 18;
    drawCenteredText(
      page,
      asciiSafe("Academie des createurs digitaux d'Afrique francophone"),
      fontSerifItalic,
      9,
      y,
      TEXT_MUTED,
      width,
    );

    y -= 22;
    drawOrnamentalDivider(page, cx, y);

    y -= 22;
    drawCenteredText(
      page,
      asciiSafe("CERTIFICAT DE COMPLETION"),
      fontSerifBold,
      11,
      y,
      FOREST,
      width,
      8,
    );

    // ── Body : "atteste que" ────────────────────────────────────────────
    y -= 28;
    drawCenteredText(
      page,
      asciiSafe("Le present diplome atteste que"),
      fontSerifItalic,
      12,
      y,
      TEXT_DARK,
      width,
    );

    // Student name (BIG serif)
    y -= 50;
    const nameRaw = studentName;
    const nameSize = nameRaw.length > 28 ? 30 : nameRaw.length > 20 ? 36 : 44;
    const nameW = fontSerifBold.widthOfTextAtSize(nameRaw, nameSize);
    page.drawText(nameRaw, {
      x: cx - nameW / 2,
      y,
      size: nameSize,
      font: fontSerifBold,
      color: FOREST,
    });

    // Underline ornement (line + dot + line)
    y -= 14;
    const ulHalf = 38;
    page.drawLine({
      start: { x: cx - ulHalf, y },
      end: { x: cx - 6, y },
      thickness: 0.7,
      color: GOLD,
    });
    page.drawLine({
      start: { x: cx + 6, y },
      end: { x: cx + ulHalf, y },
      thickness: 0.7,
      color: GOLD,
    });
    page.drawCircle({ x: cx, y, size: 2.2, color: GOLD });

    y -= 22;
    drawCenteredText(
      page,
      asciiSafe("a complete avec succes l'integralite de la formation"),
      fontSerifItalic,
      12,
      y,
      TEXT_DARK,
      width,
    );

    // Formation title
    y -= 26;
    const titleClean = `« ${formationTitle} »`;
    const titleSize =
      titleClean.length > 70 ? 13 : titleClean.length > 50 ? 16 : titleClean.length > 30 ? 18 : 21;
    const titleW = fontSerifItalic.widthOfTextAtSize(titleClean, titleSize);
    const titleX = Math.max(70, cx - titleW / 2);
    page.drawText(titleClean, {
      x: titleX,
      y,
      size: titleSize,
      font: fontSerifItalic,
      color: FOREST,
      maxWidth: width - 140,
    });

    if (instructorName) {
      y -= 22;
      const instrPrefix = "sous la direction de ";
      const instrFull = instrPrefix + instructorName;
      const prefixW = fontSerifItalic.widthOfTextAtSize(instrPrefix, 10);
      const nameW2 = fontSerifBold.widthOfTextAtSize(instructorName, 10);
      const startX = cx - (prefixW + nameW2) / 2;
      page.drawText(instrPrefix, {
        x: startX,
        y,
        size: 10,
        font: fontSerifItalic,
        color: TEXT_MUTED,
      });
      page.drawText(instructorName, {
        x: startX + prefixW,
        y,
        size: 10,
        font: fontSerifBold,
        color: FOREST,
      });
      void instrFull;
    }

    // ── Honorific (if score >= 80) ──────────────────────────────────────
    if (honor) {
      y -= 32;
      const boxW = 220;
      const boxH = 42;
      const boxX = cx - boxW / 2;
      const boxY = y - boxH + 6;
      // box background tint
      page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH,
        color: GOLD,
        opacity: 0.05,
      });
      page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH,
        borderColor: GOLD,
        borderWidth: 0.6,
        color: undefined,
      });
      drawCenteredText(
        page,
        "MENTION",
        fontSerifBold,
        7,
        boxY + boxH - 12,
        GOLD,
        width,
        3,
      );
      drawCenteredText(
        page,
        honor.latin,
        fontSerifItalic,
        12,
        boxY + boxH - 24,
        FOREST,
        width,
      );
      drawCenteredText(
        page,
        asciiSafe(honor.french),
        fontSerifReg,
        7,
        boxY + 6,
        TEXT_MUTED,
        width,
      );
      y = boxY - 10;
    } else {
      y -= 16;
    }

    // ── Divider before signatures ──────────────────────────────────────
    drawOrnamentalDivider(page, cx, y);

    // ── Signatures + medallion ─────────────────────────────────────────
    const sigY = 130;

    // Center medallion
    drawMedallion(page, cx, sigY + 16, fontBold);
    drawCenteredText(
      page,
      asciiSafe("SCEAU OFFICIEL"),
      fontSerifBold,
      7,
      sigY - 32,
      GOLD,
      width,
      4,
    );

    // Left signature : instructor (or "Direction")
    {
      const cxLeft = 200;
      const sigLabel = instructorName ? instructorName : "Pirabel Labs";
      const sigW = fontSerifItalic.widthOfTextAtSize(sigLabel, 16);
      page.drawText(sigLabel, {
        x: cxLeft - sigW / 2,
        y: sigY + 8,
        size: 16,
        font: fontSerifItalic,
        color: FOREST,
      });
      page.drawLine({
        start: { x: cxLeft - 70, y: sigY },
        end: { x: cxLeft + 70, y: sigY },
        thickness: 0.5,
        color: FOREST,
        opacity: 0.6,
      });
      const role1 = instructorName ? asciiSafe("FORMATEUR") : asciiSafe("DIRECTION");
      const role1W = fontSerifBold.widthOfTextAtSize(role1, 7);
      page.drawText(role1, {
        x: cxLeft - role1W / 2,
        y: sigY - 12,
        size: 7,
        font: fontSerifBold,
        color: TEXT_MUTED,
      });
    }

    // Right signature : Pirabel Labs
    {
      const cxRight = width - 200;
      const sigLabel = "Pirabel Labs";
      const sigW = fontSerifItalic.widthOfTextAtSize(sigLabel, 16);
      page.drawText(sigLabel, {
        x: cxRight - sigW / 2,
        y: sigY + 8,
        size: 16,
        font: fontSerifItalic,
        color: FOREST,
      });
      page.drawLine({
        start: { x: cxRight - 70, y: sigY },
        end: { x: cxRight + 70, y: sigY },
        thickness: 0.5,
        color: FOREST,
        opacity: 0.6,
      });
      const role2 = asciiSafe("FONDATEUR . NOVAKOU");
      const role2W = fontSerifBold.widthOfTextAtSize(role2, 7);
      page.drawText(role2, {
        x: cxRight - role2W / 2,
        y: sigY - 12,
        size: 7,
        font: fontSerifBold,
        color: TEXT_MUTED,
      });
    }

    // ── Stats row ──────────────────────────────────────────────────────
    const statsY = 88;
    page.drawLine({
      start: { x: 200, y: statsY + 26 },
      end: { x: width - 200, y: statsY + 26 },
      thickness: 0.4,
      color: GOLD,
      opacity: 0.5,
    });
    const stats: { label: string; value: string }[] = [
      { label: asciiSafe("DELIVRE LE"), value: asciiSafe(issuedDate.toUpperCase()) },
      { label: "SCORE", value: `${cert.score} / 100` },
      { label: asciiSafe("LECONS"), value: String(totalLessons) },
    ];
    const colWidth = (width - 240) / stats.length;
    stats.forEach((s, i) => {
      const colCx = 120 + colWidth * i + colWidth / 2;
      const labelW = fontSerifBold.widthOfTextAtSize(s.label, 7);
      const valueW = fontSerifBold.widthOfTextAtSize(s.value, 11);
      page.drawText(s.label, {
        x: colCx - labelW / 2,
        y: statsY + 10,
        size: 7,
        font: fontSerifBold,
        color: GOLD,
      });
      page.drawText(s.value, {
        x: colCx - valueW / 2,
        y: statsY - 6,
        size: 11,
        font: fontSerifBold,
        color: FOREST,
      });
    });

    // ── Verification footer ─────────────────────────────────────────────
    const footY = 50;
    drawCenteredText(
      page,
      asciiSafe("CODE DE VERIFICATION"),
      fontSerifBold,
      7,
      footY + 8,
      TEXT_MUTED,
      width,
      3,
    );
    drawCenteredText(page, cert.code, fontBold, 9, footY - 4, FOREST, width, 1);
    drawCenteredText(
      page,
      asciiSafe(`Verifiez l'authenticite sur novakou.com/certificat/${cert.code}`),
      fontSerifItalic,
      7,
      footY - 16,
      TEXT_MUTED,
      width,
    );

    // ── Output ─────────────────────────────────────────────────────────
    const pdfBytes = await pdf.save();
    const filename = `certificat-novakou-${cert.code}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[certificates/[id]/pdf GET]", err);
    return NextResponse.json(
      { error: "Erreur lors de la generation du PDF" },
      { status: 500 },
    );
  }
}
