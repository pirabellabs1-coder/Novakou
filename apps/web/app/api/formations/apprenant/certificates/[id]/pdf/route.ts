/**
 * GET /api/formations/apprenant/certificates/[id]/pdf
 *
 * Génère et renvoie un PDF (paysage A4) du certificat. Utilise pdf-lib
 * pour rester sur l'Edge runtime sans dépendre de puppeteer.
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
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Params = { params: Promise<{ id: string }> };

const NK_GREEN = rgb(0 / 255, 110 / 255, 47 / 255); // #006e2f
const NK_GREEN_LIGHT = rgb(34 / 255, 197 / 255, 94 / 255); // #22c55e
const TEXT_DARK = rgb(25 / 255, 28 / 255, 30 / 255); // #191c1e
const TEXT_MUTED = rgb(92 / 255, 100 / 255, 122 / 255); // #5c647a
const BORDER_LIGHT = rgb(229 / 255, 231 / 255, 235 / 255); // gray-200

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

    // Auth check : optionnellement on restreint aux propriétaires connectés.
    // Pour l'instant, comme la page /certificat/<code> est publique (lien
    // partageable LinkedIn / recruteurs), on laisse le PDF public également.
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

    // ── Build PDF ────────────────────────────────────────────────────────
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Certificat Novakou - ${formationTitle}`);
    pdf.setAuthor("Novakou");
    pdf.setCreator("Novakou");
    pdf.setSubject("Certificat de complétion");
    pdf.setKeywords(["certificat", "novakou", "formation", studentName]);

    // A4 paysage : 842 x 595 pt
    const page = pdf.addPage([842, 595]);
    const { width, height } = page.getSize();

    const fontReg = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontItal = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const fontSerifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

    // ── Top + bottom green ribbons ─────────────────────────────────────
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width,
      height: 12,
      color: NK_GREEN,
    });
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: 12,
      color: NK_GREEN,
    });
    // Light gradient overlay (faked with a lighter strip)
    page.drawRectangle({
      x: width * 0.33,
      y: height - 12,
      width: width * 0.34,
      height: 12,
      color: NK_GREEN_LIGHT,
    });
    page.drawRectangle({
      x: width * 0.33,
      y: 0,
      width: width * 0.34,
      height: 12,
      color: NK_GREEN_LIGHT,
    });

    // ── Outer border ───────────────────────────────────────────────────
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: NK_GREEN,
      borderWidth: 1.5,
      opacity: 0,
      borderOpacity: 0.25,
    });
    page.drawRectangle({
      x: 38,
      y: 38,
      width: width - 76,
      height: height - 76,
      borderColor: NK_GREEN,
      borderWidth: 0.5,
      opacity: 0,
      borderOpacity: 0.4,
    });

    // ── Header ─────────────────────────────────────────────────────────
    const headerY = height - 90;

    // "Certificat de complétion" pill — drawn as plain text centred
    const pillText = "CERTIFICAT DE COMPLETION";
    const pillTextWidth = fontBold.widthOfTextAtSize(pillText, 9);
    page.drawText(pillText, {
      x: (width - pillTextWidth) / 2,
      y: headerY,
      size: 9,
      font: fontBold,
      color: NK_GREEN,
    });

    // NK logo + "Novakou"
    const brandY = headerY - 35;
    const logoSize = 28;
    const brandText = "Novakou";
    const brandTextWidth = fontBold.widthOfTextAtSize(brandText, 18);
    const brandTotalWidth = logoSize + 8 + brandTextWidth;
    const brandStartX = (width - brandTotalWidth) / 2;

    page.drawRectangle({
      x: brandStartX,
      y: brandY,
      width: logoSize,
      height: logoSize,
      color: NK_GREEN,
    });
    const nkText = "NK";
    const nkTextWidth = fontBold.widthOfTextAtSize(nkText, 11);
    page.drawText(nkText, {
      x: brandStartX + (logoSize - nkTextWidth) / 2,
      y: brandY + logoSize / 2 - 3.5,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText(brandText, {
      x: brandStartX + logoSize + 8,
      y: brandY + logoSize / 2 - 6,
      size: 18,
      font: fontBold,
      color: TEXT_DARK,
    });

    // Subtitle
    const sub = "Plateforme de formations & produits digitaux";
    const subW = fontReg.widthOfTextAtSize(sub, 9);
    page.drawText(sub, {
      x: (width - subW) / 2,
      y: brandY - 18,
      size: 9,
      font: fontReg,
      color: TEXT_MUTED,
    });

    // ── Body ───────────────────────────────────────────────────────────
    const bodyTopY = brandY - 55;

    const line1 = "Ce certificat atteste que";
    const line1W = fontReg.widthOfTextAtSize(line1, 11);
    page.drawText(line1, {
      x: (width - line1W) / 2,
      y: bodyTopY,
      size: 11,
      font: fontReg,
      color: TEXT_MUTED,
    });

    // Student name — large, serif
    const nameSize = Math.min(36, (width - 200) / (studentName.length * 0.55));
    const nameW = fontSerifBold.widthOfTextAtSize(studentName, nameSize);
    page.drawText(studentName, {
      x: (width - nameW) / 2,
      y: bodyTopY - 50,
      size: nameSize,
      font: fontSerifBold,
      color: TEXT_DARK,
    });

    const line2 = "a complete avec succes la formation";
    const line2W = fontReg.widthOfTextAtSize(line2, 11);
    page.drawText(line2, {
      x: (width - line2W) / 2,
      y: bodyTopY - 80,
      size: 11,
      font: fontReg,
      color: TEXT_MUTED,
    });

    // Formation title (truncate for safety)
    const titleClean = `« ${formationTitle} »`;
    const titleSize = titleClean.length > 60 ? 14 : titleClean.length > 40 ? 16 : 18;
    const titleW = fontBold.widthOfTextAtSize(titleClean, titleSize);
    const titleX = Math.max(60, (width - titleW) / 2);
    page.drawText(titleClean, {
      x: titleX,
      y: bodyTopY - 110,
      size: titleSize,
      font: fontBold,
      color: NK_GREEN,
      maxWidth: width - 120,
    });

    if (instructorName) {
      const instr = `enseignee par ${instructorName}`;
      const instrW = fontItal.widthOfTextAtSize(instr, 10);
      page.drawText(instr, {
        x: (width - instrW) / 2,
        y: bodyTopY - 135,
        size: 10,
        font: fontItal,
        color: TEXT_MUTED,
      });
    }

    // ── Stats row ──────────────────────────────────────────────────────
    const statsY = 160;
    const stats = [
      { label: "DELIVRE LE", value: issuedDate, color: TEXT_DARK },
      { label: "SCORE", value: `${cert.score}/100`, color: NK_GREEN },
      { label: "LECONS", value: String(totalLessons), color: TEXT_DARK },
    ];

    const colWidth = (width - 120) / stats.length;
    stats.forEach((s, i) => {
      const cx = 60 + colWidth * i + colWidth / 2;
      const labelW = fontBold.widthOfTextAtSize(s.label, 8);
      const valueW = fontBold.widthOfTextAtSize(s.value, 12);
      page.drawText(s.label, {
        x: cx - labelW / 2,
        y: statsY + 18,
        size: 8,
        font: fontBold,
        color: TEXT_MUTED,
      });
      page.drawText(s.value, {
        x: cx - valueW / 2,
        y: statsY,
        size: 12,
        font: fontBold,
        color: s.color,
      });
    });

    // Divider above stats
    page.drawLine({
      start: { x: 60, y: statsY + 45 },
      end: { x: width - 60, y: statsY + 45 },
      thickness: 0.5,
      color: BORDER_LIGHT,
    });

    // ── Code + signature ───────────────────────────────────────────────
    const footerY = 80;
    page.drawLine({
      start: { x: 60, y: footerY + 40 },
      end: { x: width - 60, y: footerY + 40 },
      thickness: 0.5,
      color: BORDER_LIGHT,
    });

    // Left : verification code
    page.drawText("CODE DE VERIFICATION", {
      x: 60,
      y: footerY + 22,
      size: 7,
      font: fontBold,
      color: TEXT_MUTED,
    });
    page.drawText(cert.code, {
      x: 60,
      y: footerY + 6,
      size: 10,
      font: fontBold,
      color: TEXT_DARK,
    });

    // Right : signature
    const sigName = "Pirabel Labs";
    const sigNameW = fontSerifBold.widthOfTextAtSize(sigName, 16);
    const sigCenterX = width - 130;
    page.drawText(sigName, {
      x: sigCenterX - sigNameW / 2,
      y: footerY + 18,
      size: 16,
      font: fontSerifBold,
      color: NK_GREEN,
    });
    page.drawLine({
      start: { x: sigCenterX - 60, y: footerY + 12 },
      end: { x: sigCenterX + 60, y: footerY + 12 },
      thickness: 0.6,
      color: TEXT_DARK,
    });
    const sigRole = "Fondateur & CEO - Novakou";
    const sigRoleW = fontReg.widthOfTextAtSize(sigRole, 7);
    page.drawText(sigRole, {
      x: sigCenterX - sigRoleW / 2,
      y: footerY + 2,
      size: 7,
      font: fontReg,
      color: TEXT_MUTED,
    });

    // Verification URL footer
    const verifyText = `Verifiez ce certificat sur novakou.com/certificat/${cert.code}`;
    const verifyW = fontReg.widthOfTextAtSize(verifyText, 7);
    page.drawText(verifyText, {
      x: (width - verifyW) / 2,
      y: 28,
      size: 7,
      font: fontReg,
      color: TEXT_MUTED,
    });

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
