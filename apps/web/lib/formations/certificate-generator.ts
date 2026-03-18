// Certificate PDF generator — Premium design with FreelanceHigh branding & QR code

import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  studentName: string;
  formationTitle: string;
  instructorName: string;
  score: number;
  completionDate: Date;
  certificateCode: string;
  locale: "fr" | "en";
}

const LABELS = {
  fr: {
    brand: "FreelanceHigh",
    brandSub: "Formations & Certifications",
    title: "CERTIFICAT DE RÉUSSITE",
    subtitle: "Ce certificat atteste que",
    completed: "a complété avec succès la formation",
    score: "Score obtenu",
    date: "Date de complétion",
    instructor: "Instructeur",
    verify: "Vérifier ce certificat",
    platform: "FreelanceHigh — La plateforme freelance qui élève votre carrière au plus haut niveau",
    code: "Code du certificat",
    signedBy: "Délivré et signé par",
    rights: "Tous droits réservés.",
    verifyAt: "Vérifiable sur",
  },
  en: {
    brand: "FreelanceHigh",
    brandSub: "Formations & Certifications",
    title: "CERTIFICATE OF COMPLETION",
    subtitle: "This certifies that",
    completed: "has successfully completed the course",
    score: "Score achieved",
    date: "Completion date",
    instructor: "Instructor",
    verify: "Verify this certificate",
    platform: "FreelanceHigh — The freelance platform that elevates your career to the highest level",
    code: "Certificate code",
    signedBy: "Issued and signed by",
    rights: "All rights reserved.",
    verifyAt: "Verifiable at",
  },
};

// Brand colors
const VIOLET = { r: 108, g: 43, b: 217 };  // #6C2BD9 — primary
const BLUE = { r: 14, g: 165, b: 233 };     // #0EA5E9 — accent blue
const GREEN = { r: 16, g: 185, b: 129 };    // #10B981 — accent green
const GOLD = { r: 212, g: 175, b: 55 };     // #D4AF37 — decorative gold
const DARK = { r: 30, g: 30, b: 30 };       // near-black text
const MUTED = { r: 140, g: 140, b: 140 };   // muted text
const LIGHT_MUTED = { r: 180, g: 180, b: 180 };

// ── Helper: draw a filled diamond at (cx, cy) ──────────────────────
function drawDiamond(doc: jsPDF, cx: number, cy: number, size: number) {
  doc.triangle(cx, cy - size, cx + size, cy, cx, cy + size, "F");
  doc.triangle(cx, cy - size, cx - size, cy, cx, cy + size, "F");
}

// ── Helper: draw decorative corner bracket ──────────────────────────
function drawCornerBrackets(
  doc: jsPDF,
  x: number,
  y: number,
  len: number,
  flipX: boolean,
  flipY: boolean
) {
  const dx = flipX ? -1 : 1;
  const dy = flipY ? -1 : 1;
  doc.line(x, y, x + dx * len, y);
  doc.line(x, y, x, y + dy * len);
  // Small inner accent line
  doc.line(x + dx * 3, y + dy * 3, x + dx * (len - 4), y + dy * 3);
  doc.line(x + dx * 3, y + dy * 3, x + dx * 3, y + dy * (len - 4));
}

// ── Helper: draw a horizontal ornamental divider ────────────────────
function drawOrnamentalDivider(doc: jsPDF, cx: number, y: number, halfWidth: number) {
  // Center diamond
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  drawDiamond(doc, cx, y, 1.8);
  // Two smaller diamonds on each side
  drawDiamond(doc, cx - 12, y, 1.0);
  drawDiamond(doc, cx + 12, y, 1.0);
  // Lines connecting them
  doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
  doc.setLineWidth(0.3);
  doc.line(cx - halfWidth, y, cx - 14, y);
  doc.line(cx - 10, y, cx - 3, y);
  doc.line(cx + 3, y, cx + 10, y);
  doc.line(cx + 14, y, cx + halfWidth, y);
}

// ── Helper: draw a gradient-like colored strip ──────────────────────
function drawTopStrip(doc: jsPDF, w: number) {
  // Violet strip at the very top
  doc.setFillColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.rect(0, 0, w, 3, "F");
  // Blue accent line below
  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.rect(0, 3, w, 1.2, "F");
  // Green thin accent
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.rect(0, 4.2, w, 0.6, "F");
}

function drawBottomStrip(doc: jsPDF, w: number, h: number) {
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.rect(0, h - 4.8, w, 0.6, "F");
  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.rect(0, h - 4.2, w, 1.2, "F");
  doc.setFillColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.rect(0, h - 3, w, 3, "F");
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const {
    studentName,
    formationTitle,
    instructorName,
    score,
    completionDate,
    certificateCode,
    locale,
  } = data;
  const t = LABELS[locale];

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();  // 297
  const h = doc.internal.pageSize.getHeight(); // 210

  // ── 1. White background ─────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");

  // ── 2. Branded color strips at top and bottom ───────────────────
  drawTopStrip(doc, w);
  drawBottomStrip(doc, w, h);

  // ── 3. Subtle background pattern (faint watermark grid) ─────────
  doc.setGState(doc.GState({ opacity: 0.02 }));
  doc.setFillColor(VIOLET.r, VIOLET.g, VIOLET.b);
  for (let px = 20; px < w - 20; px += 15) {
    for (let py = 20; py < h - 20; py += 15) {
      doc.circle(px, py, 0.4, "F");
    }
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  // ── 4. Decorative outer border (gold) ───────────────────────────
  const m = 10; // margin from edge
  doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
  doc.setLineWidth(1.2);
  doc.rect(m, m, w - 2 * m, h - 2 * m);

  // Inner border (violet, thinner)
  const mi = 13;
  doc.setDrawColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.setLineWidth(0.3);
  doc.rect(mi, mi, w - 2 * mi, h - 2 * mi);

  // ── 5. Corner ornaments ─────────────────────────────────────────
  const cornerLen = 20;
  doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
  doc.setLineWidth(1.0);

  // Top-left
  drawCornerBrackets(doc, m, m, cornerLen, false, false);
  // Top-right
  drawCornerBrackets(doc, w - m, m, cornerLen, true, false);
  // Bottom-left
  drawCornerBrackets(doc, m, h - m, cornerLen, false, true);
  // Bottom-right
  drawCornerBrackets(doc, w - m, h - m, cornerLen, true, true);

  // Corner diamonds
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  drawDiamond(doc, m, m, 2.2);
  drawDiamond(doc, w - m, m, 2.2);
  drawDiamond(doc, m, h - m, 2.2);
  drawDiamond(doc, w - m, h - m, 2.2);

  // ── 6. Side decorative accents (small violet dots along edges) ──
  doc.setFillColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.setGState(doc.GState({ opacity: 0.15 }));
  for (let sy = 30; sy < h - 30; sy += 8) {
    doc.circle(mi + 2, sy, 0.5, "F");
    doc.circle(w - mi - 2, sy, 0.5, "F");
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  // ── 7. HEADER: FreelanceHigh brand ──────────────────────────────
  // Brand name — large and prominent
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.text(t.brand, w / 2, 24, { align: "center" });

  // "Formations & Certifications" subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  doc.text(t.brandSub, w / 2, 30, { align: "center" });

  // Ornamental divider below brand
  drawOrnamentalDivider(doc, w / 2, 35, 60);

  // ── 8. CERTIFICATE TITLE ────────────────────────────────────────
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text(t.title, w / 2, 48, { align: "center" });

  // Gold underline below title
  doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
  doc.setLineWidth(0.8);
  doc.line(w / 2 - 55, 52, w / 2 + 55, 52);
  // Thinner secondary line
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 40, 54, w / 2 + 40, 54);

  // ── 9. "This certifies that" ────────────────────────────────────
  doc.setFontSize(12);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "italic");
  doc.text(t.subtitle, w / 2, 63, { align: "center" });

  // ── 10. STUDENT NAME (prominent) ────────────────────────────────
  doc.setFontSize(30);
  doc.setTextColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.setFont("helvetica", "bold");
  doc.text(studentName, w / 2, 77, { align: "center" });

  // Decorative line under name
  const nameWidth = doc.getTextWidth(studentName);
  doc.setDrawColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.setLineWidth(0.5);
  doc.line(w / 2 - nameWidth / 2 - 8, 80, w / 2 + nameWidth / 2 + 8, 80);
  // Small green accent dots at line ends
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.circle(w / 2 - nameWidth / 2 - 8, 80, 0.8, "F");
  doc.circle(w / 2 + nameWidth / 2 + 8, 80, 0.8, "F");

  // ── 11. "has completed the course" ──────────────────────────────
  doc.setFontSize(12);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.completed, w / 2, 89, { align: "center" });

  // ── 12. FORMATION TITLE ─────────────────────────────────────────
  doc.setFontSize(18);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(formationTitle, w - 110);
  doc.text(titleLines, w / 2, 100, { align: "center" });

  // ── 13. Ornamental divider between title and details ────────────
  const dividerY = titleLines.length > 1 ? 112 : 108;
  drawOrnamentalDivider(doc, w / 2, dividerY, 50);

  // ── 14. DETAILS: 3-column layout ───────────────────────────────
  const detailsY = dividerY + 8;
  const colWidth = (w - 100) / 3;
  const col1X = 50 + colWidth / 2;
  const col2X = w / 2;
  const col3X = w - 50 - colWidth / 2;
  const boxH = 24;
  const boxR = 3;

  // --- Score box ---
  // Background
  doc.setFillColor(248, 245, 255); // very light violet
  doc.roundedRect(col1X - colWidth / 2, detailsY - 4, colWidth, boxH, boxR, boxR, "F");
  // Left accent bar
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.rect(col1X - colWidth / 2, detailsY - 4, 1.5, boxH, "F");
  // Label
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.score.toUpperCase(), col1X, detailsY + 2, { align: "center" });
  // Value
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  // Color the score based on performance
  if (score >= 90) {
    doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  } else if (score >= 70) {
    doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  } else {
    doc.setTextColor(VIOLET.r, VIOLET.g, VIOLET.b);
  }
  doc.text(`${score}%`, col1X, detailsY + 14, { align: "center" });

  // --- Date box ---
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(col2X - colWidth / 2, detailsY - 4, colWidth, boxH, boxR, boxR, "F");
  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.rect(col2X - colWidth / 2, detailsY - 4, 1.5, boxH, "F");
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.date.toUpperCase(), col2X, detailsY + 2, { align: "center" });
  doc.setFontSize(13);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont("helvetica", "bold");
  const formattedDate = completionDate.toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );
  doc.text(formattedDate, col2X, detailsY + 14, { align: "center" });

  // --- Instructor box ---
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(col3X - colWidth / 2, detailsY - 4, colWidth, boxH, boxR, boxR, "F");
  doc.setFillColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.rect(col3X - colWidth / 2, detailsY - 4, 1.5, boxH, "F");
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.instructor.toUpperCase(), col3X, detailsY + 2, { align: "center" });
  doc.setFontSize(13);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont("helvetica", "bold");
  doc.text(instructorName, col3X, detailsY + 14, { align: "center" });

  // ── 15. SIGNATURE SECTION ───────────────────────────────────────
  const sigY = detailsY + boxH + 12;

  // Signature line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(w / 2 - 35, sigY, w / 2 + 35, sigY);

  // Signed by text
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.signedBy, w / 2, sigY + 5, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont("helvetica", "bold");
  doc.text(instructorName, w / 2, sigY + 11, { align: "center" });

  // ── 16. QR CODE (bottom-left) ───────────────────────────────────
  const verifyUrl = `https://freelancehigh.com/formations/verification/${certificateCode}`;
  const qrX = 22;
  const qrY = h - 48;
  const qrSize = 24;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 250,
      margin: 1,
      color: { dark: "#6C2BD9", light: "#FFFFFF" },
    });
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch {
    // QR generation failed — draw a placeholder box
    doc.setDrawColor(VIOLET.r, VIOLET.g, VIOLET.b);
    doc.setLineWidth(0.3);
    doc.rect(qrX, qrY, qrSize, qrSize);
    doc.setFontSize(7);
    doc.setTextColor(VIOLET.r, VIOLET.g, VIOLET.b);
    doc.setFont("helvetica", "bold");
    doc.text("QR Code", qrX + qrSize / 2, qrY + qrSize / 2 - 1, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(verifyUrl, qrX + qrSize / 2, qrY + qrSize / 2 + 3, {
      align: "center",
      maxWidth: qrSize - 2,
    });
  }

  // QR caption
  doc.setFontSize(6);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.verify, qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });
  doc.setFontSize(5);
  doc.setTextColor(LIGHT_MUTED.r, LIGHT_MUTED.g, LIGHT_MUTED.b);
  doc.text(
    `freelancehigh.com/verify/${certificateCode}`,
    qrX + qrSize / 2,
    qrY + qrSize + 8,
    { align: "center" }
  );

  // ── 17. CERTIFICATE CODE (bottom-center) ────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.code.toUpperCase(), w / 2, h - 30, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(VIOLET.r, VIOLET.g, VIOLET.b);
  doc.setFont("helvetica", "bold");
  doc.text(certificateCode, w / 2, h - 24, { align: "center" });

  // Unique ID underline
  const codeWidth = doc.getTextWidth(certificateCode);
  doc.setDrawColor(BLUE.r, BLUE.g, BLUE.b);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - codeWidth / 2 - 3, h - 22.5, w / 2 + codeWidth / 2 + 3, h - 22.5);

  // ── 18. VERIFICATION URL (bottom-right) ─────────────────────────
  const vrX = w - 22;
  doc.setFontSize(6);
  doc.setTextColor(LIGHT_MUTED.r, LIGHT_MUTED.g, LIGHT_MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.verifyAt, vrX, h - 32, { align: "right" });
  doc.setFontSize(7);
  doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  doc.setFont("helvetica", "bold");
  doc.text("freelancehigh.com/formations/verification", vrX, h - 28, { align: "right" });

  // ── 19. PLATFORM FOOTER ─────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(LIGHT_MUTED.r, LIGHT_MUTED.g, LIGHT_MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(t.platform, w / 2, h - 14, { align: "center" });
  doc.setFontSize(6);
  doc.text(
    `\u00A9 ${new Date().getFullYear()} FreelanceHigh. ${t.rights}`,
    w / 2,
    h - 10,
    { align: "center" }
  );

  // Return as buffer
  return Buffer.from(doc.output("arraybuffer"));
}

// Generate a unique certificate code (format: FH-XXXX-XXXX-XXXX)
export function generateCertificateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments: string[] = [];
  for (let s = 0; s < 3; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return `FH-${segments.join("-")}`;
}
