/**
 * GET /api/formations/payment/receipt?ref=<internalRef>
 *
 * REÇU DE PAIEMENT (PDF) d'un achat, retrouvé par sa RÉFÉRENCE DE PAIEMENT
 * (`internalRef` « nk:… »). C'est le document que l'acheteur d'un LIEN DE
 * PAIEMENT peut télécharger : un lien de paiement n'a pas de fichier à livrer,
 * donc le reçu — portant la référence — est ce qui lui permet de prouver son
 * paiement (notamment pour finaliser sur le site externe du vendeur).
 *
 * PUBLIC (pas d'auth) : l'acheteur d'un lien est souvent un invité qui n'a pas
 * de session. La référence « nk:<timestamp>:<aléa> » sert de secret de lecture
 * (correspondance EXACTE requise). Par prudence, on n'expose PAS l'e-mail de
 * l'acheteur sur ce document accessible par URL — seulement son nom.
 *
 * La référence est la MÊME des deux côtés : `DigitalProductPurchase.stripeSessionId`
 * (= internalRef), et exposée au vendeur dans son espace transactions.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/api-rate-limit";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  FOREST, FOREST_LIGHT, TEXT_DARK, TEXT_MUTED, TEXT_BORDER, ROW_BG, WHITE,
  asciiSafe, formatXof, formatDateFr, drawText,
} from "@/lib/pdf/novakou-pdf";

type Ligne = { titre: string; montant: number };

export async function GET(request: Request) {
  try {
    const ref = (new URL(request.url).searchParams.get("ref") ?? "").trim();
    if (!ref) return NextResponse.json({ error: "Référence manquante" }, { status: 400 });

    // Rate-limit par IP : cet endpoint est PUBLIC et expose des données
    // personnelles (nom acheteur, montant…). 30 req/min coupe tout balayage,
    // sans gêner un acheteur légitime qui télécharge son reçu.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const rl = await rateLimit(`receipt:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requêtes. Réessayez dans un instant." }, { status: 429 });
    }

    // Toutes les lignes rattachées à cette référence de paiement (un lien de
    // paiement = 1 produit, mais on gère un panier multi-lignes par robustesse).
    const [purchases, enrollments] = await Promise.all([
      prisma.digitalProductPurchase.findMany({
        where: { stripeSessionId: ref },
        select: {
          paidAmount: true, createdAt: true,
          userId: true,
          product: { select: { title: true, shop: { select: { name: true } } } },
        },
      }),
      prisma.enrollment.findMany({
        where: { stripeSessionId: ref },
        select: {
          paidAmount: true, createdAt: true,
          userId: true,
          formation: { select: { title: true, shop: { select: { name: true } } } },
        },
      }),
    ]);

    const lignes: Ligne[] = [
      ...purchases.map((p) => ({ titre: p.product?.title ?? "Produit numérique", montant: p.paidAmount })),
      ...enrollments.map((e) => ({ titre: e.formation?.title ?? "Formation", montant: e.paidAmount })),
    ];
    if (lignes.length === 0) {
      return NextResponse.json({ error: "Aucun paiement pour cette référence" }, { status: 404 });
    }

    const total = lignes.reduce((s, l) => s + l.montant, 0);
    const createdAt = purchases[0]?.createdAt ?? enrollments[0]?.createdAt ?? new Date();
    const userId = purchases[0]?.userId ?? enrollments[0]?.userId ?? null;
    const boutique =
      purchases[0]?.product?.shop?.name ?? enrollments[0]?.formation?.shop?.name ?? null;

    // Nom acheteur (jamais l'e-mail sur ce document public).
    const acheteur = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }).catch(() => null)
      : null;
    const nomAcheteur = acheteur?.name?.trim() || acheteur?.email?.split("@")[0] || "Client";

    // Méthode de paiement (facultative), depuis la tentative de checkout.
    const attempt = await prisma.checkoutAttempt
      .findFirst({
        where: { metadata: { path: ["internalRef"], equals: ref } },
        select: { providerRef: true, metadata: true },
      })
      .catch(() => null);
    const meta = (attempt?.metadata ?? {}) as Record<string, unknown>;
    const methode = typeof meta.paymentProvider === "string" && meta.paymentProvider
      ? String(meta.paymentProvider)
      : null;

    // ── PDF ────────────────────────────────────────────────────────────────
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Recu de paiement Novakou ${ref}`);
    pdf.setAuthor("Novakou");
    pdf.setCreator("Novakou");
    pdf.setSubject("Recu de paiement");

    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    const fontReg = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontSerifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

    // Header : logo + wordmark
    const logoCx = margin + 18;
    const logoCy = height - margin - 4;
    page.drawCircle({ x: logoCx, y: logoCy, size: 18, color: FOREST });
    page.drawCircle({ x: logoCx, y: logoCy, size: 18, borderColor: FOREST_LIGHT, borderWidth: 1 });
    drawText(page, "NK", logoCx, logoCy - 5, { font: fontBold, size: 14, color: WHITE, align: "center" });
    drawText(page, "Novakou", logoCx + 28, logoCy - 4, { font: fontBold, size: 18, color: TEXT_DARK });
    drawText(page, "L'academie des createurs digitaux", logoCx + 28, logoCy - 18, { font: fontReg, size: 8, color: TEXT_MUTED });

    drawText(page, "RECU DE PAIEMENT", width - margin, height - margin - 2, { font: fontSerifBold, size: 22, color: FOREST, align: "right" });
    drawText(page, "Paiement recu", width - margin, height - margin - 20, { font: fontBold, size: 10, color: TEXT_MUTED, align: "right" });

    page.drawLine({ start: { x: margin, y: height - margin - 50 }, end: { x: width - margin, y: height - margin - 50 }, thickness: 1.2, color: FOREST });

    // ── Bloc RÉFÉRENCE DE PAIEMENT (mis en avant) ────────────────────────────
    let y = height - margin - 74;
    const boxH = 46;
    page.drawRectangle({ x: margin, y: y - boxH + 14, width: width - margin * 2, height: boxH, color: ROW_BG, borderColor: FOREST, borderWidth: 1 });
    drawText(page, "REFERENCE DE PAIEMENT", margin + 14, y, { font: fontBold, size: 9, color: TEXT_MUTED });
    drawText(page, ref, margin + 14, y - 18, { font: fontBold, size: 15, color: FOREST });
    drawText(page, "A communiquer au vendeur pour confirmer votre paiement.", margin + 14, y - 30, { font: fontReg, size: 8, color: TEXT_MUTED });

    y -= boxH + 24;

    // ── Détails ─────────────────────────────────────────────────────────────
    const infoRows: [string, string][] = [
      ["Date du paiement", formatDateFr(createdAt)],
      ["Acheteur", nomAcheteur],
      ...(boutique ? [["Boutique", boutique] as [string, string]] : []),
      ...(methode ? [["Moyen de paiement", methode] as [string, string]] : []),
      ...(attempt?.providerRef ? [["Ref. transaction", attempt.providerRef] as [string, string]] : []),
    ];
    for (const [label, value] of infoRows) {
      drawText(page, label, margin, y, { font: fontReg, size: 9, color: TEXT_MUTED });
      drawText(page, value, margin + 150, y, { font: fontBold, size: 9, color: TEXT_DARK, maxWidth: width - margin - (margin + 150) });
      y -= 15;
    }

    y -= 10;

    // ── Table des lignes ─────────────────────────────────────────────────────
    page.drawRectangle({ x: margin, y: y - 14, width: width - margin * 2, height: 20, color: ROW_BG });
    drawText(page, "Description", margin + 8, y - 8, { font: fontBold, size: 9, color: TEXT_DARK });
    drawText(page, "Montant", width - margin - 8, y - 8, { font: fontBold, size: 9, color: TEXT_DARK, align: "right" });
    y -= 30;
    for (const l of lignes) {
      drawText(page, l.titre, margin + 8, y, { font: fontReg, size: 9, color: TEXT_DARK, maxWidth: width - margin - 8 - 130 });
      drawText(page, formatXof(l.montant), width - margin - 8, y, { font: fontBold, size: 9, color: TEXT_DARK, align: "right" });
      y -= 16;
    }
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.6, color: TEXT_BORDER });
    y -= 22;

    // Total bar
    const labelX = width - margin - 100;
    page.drawRectangle({ x: labelX - 60, y: y - 6, width: width - margin - (labelX - 60), height: 22, color: FOREST });
    drawText(page, "TOTAL PAYE", labelX, y + 4, { font: fontBold, size: 11, color: WHITE, align: "right" });
    drawText(page, formatXof(total), width - margin - 8, y + 4, { font: fontBold, size: 11, color: WHITE, align: "right" });

    // Footer
    const footY = 60;
    page.drawLine({ start: { x: margin, y: footY + 22 }, end: { x: width - margin, y: footY + 22 }, thickness: 0.4, color: TEXT_BORDER });
    drawText(page, "Novakou — paiement traite via la plateforme", width / 2, footY + 10, { font: fontBold, size: 8, color: TEXT_DARK, align: "center" });
    drawText(page, "Edite par Pirabel Labs  .  support@novakou.com  .  www.novakou.com", width / 2, footY, { font: fontReg, size: 7, color: TEXT_MUTED, align: "center" });
    drawText(page, "Document genere automatiquement — conservez votre reference de paiement", width / 2, footY - 9, { font: fontReg, size: 7, color: TEXT_MUTED, align: "center" });

    const pdfBytes = await pdf.save();
    // Nom de fichier : la référence, nettoyée (les « : » ne passent pas partout).
    const safeRef = ref.replace(/[^A-Za-z0-9_-]+/g, "-");
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="recu-novakou-${safeRef}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[payment/receipt GET]", err);
    return NextResponse.json({ error: "Erreur lors de la génération du reçu" }, { status: 500 });
  }
}

// pdf-lib + Prisma → runtime Node (pas Edge).
export const runtime = "nodejs";
