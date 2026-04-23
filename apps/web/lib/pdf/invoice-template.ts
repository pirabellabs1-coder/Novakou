/**
 * Invoice PDF generation using jsPDF.
 * Generates branded Novakou invoices.
 */
import { jsPDF } from "jspdf";

export interface InvoiceData {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: "payee" | "en_attente";
  // Optional details
  customerName?: string;
  customerEmail?: string;
  planName?: string;
  billingPeriod?: string;
  commissionRate?: number;
}

const PRIMARY_COLOR: [number, number, number] = [108, 43, 217]; // #6C2BD9
const DARK_TEXT: [number, number, number] = [30, 30, 40];
const GRAY_TEXT: [number, number, number] = [120, 120, 140];
const LIGHT_BG: [number, number, number] = [245, 243, 255];

export function generateInvoicePDF(invoice: InvoiceData): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // ── Header bar ──
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Novakou", margin, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("La plateforme freelance qui eleve votre carriere au plus haut niveau", margin, 26);

  // Invoice label on right
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", pageWidth - margin, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.id, pageWidth - margin, 26, { align: "right" });

  y = 55;

  // ── Invoice info section ──
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Informations de facturation", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);

  const infoLines = [
    ["Numero de facture", invoice.id],
    ["Date d'emission", formatDate(invoice.date)],
    ["Statut", invoice.status === "payee" ? "Payee" : "En attente"],
  ];

  if (invoice.planName) {
    infoLines.push(["Plan", invoice.planName]);
  }
  if (invoice.billingPeriod) {
    infoLines.push(["Periode", invoice.billingPeriod]);
  }
  if (invoice.commissionRate !== undefined) {
    infoLines.push(["Taux de commission", `${invoice.commissionRate}%`]);
  }

  for (const [label, value] of infoLines) {
    doc.setTextColor(...GRAY_TEXT);
    doc.text(label, margin, y);
    doc.setTextColor(...DARK_TEXT);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 55, y);
    doc.setFont("helvetica", "normal");
    y += 6;
  }

  y += 5;

  // ── Emetteur / Destinataire ──
  const col1 = margin;
  const col2 = pageWidth / 2 + 10;

  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Emetteur", col1, y);
  doc.text("Destinataire", col2, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_TEXT);

  const emitterLines = [
    "Novakou SAS",
    "123 Avenue de la Tech",
    "75001 Paris, France",
    "support@novakou.com",
    "SIRET : 123 456 789 00000",
  ];

  const recipientLines = [
    invoice.customerName || "Client Novakou",
    invoice.customerEmail || "",
  ].filter(Boolean);

  emitterLines.forEach((line, i) => {
    doc.text(line, col1, y + i * 5);
  });

  recipientLines.forEach((line, i) => {
    doc.text(line, col2, y + i * 5);
  });

  y += Math.max(emitterLines.length, recipientLines.length) * 5 + 10;

  // ── Table header ──
  doc.setFillColor(...LIGHT_BG);
  doc.rect(margin, y, pageWidth - margin * 2, 10, "F");

  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  const tableX = {
    desc: margin + 3,
    qty: pageWidth - margin - 70,
    unit: pageWidth - margin - 40,
    total: pageWidth - margin - 3,
  };

  doc.text("Description", tableX.desc, y + 7);
  doc.text("Qte", tableX.qty, y + 7, { align: "right" });
  doc.text("Prix unit.", tableX.unit, y + 7, { align: "right" });
  doc.text("Total", tableX.total, y + 7, { align: "right" });

  y += 14;

  // ── Table row ──
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);

  doc.text(invoice.description, tableX.desc, y);
  doc.text("1", tableX.qty, y, { align: "right" });
  doc.text(`${invoice.amount.toFixed(2)} EUR`, tableX.unit, y, { align: "right" });
  doc.text(`${invoice.amount.toFixed(2)} EUR`, tableX.total, y, { align: "right" });

  y += 4;

  // ── Separator ──
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ── Totals ──
  const totalsX = pageWidth - margin - 3;
  const labelsX = pageWidth - margin - 55;

  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Sous-total HT", labelsX, y, { align: "right" });
  doc.setTextColor(...DARK_TEXT);
  doc.text(`${invoice.amount.toFixed(2)} EUR`, totalsX, y, { align: "right" });
  y += 6;

  doc.setTextColor(...GRAY_TEXT);
  doc.text("TVA (20%)", labelsX, y, { align: "right" });
  doc.setTextColor(...DARK_TEXT);
  const tva = invoice.amount * 0.2;
  doc.text(`${tva.toFixed(2)} EUR`, totalsX, y, { align: "right" });
  y += 8;

  // Total TTC
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(labelsX - 10, y - 5, pageWidth - margin - labelsX + 13, 12, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Total TTC", labelsX, y + 3, { align: "right" });
  const totalTTC = invoice.amount + tva;
  doc.text(`${totalTTC.toFixed(2)} EUR`, totalsX, y + 3, { align: "right" });

  y += 25;

  // ── Payment info ──
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Moyens de paiement acceptes", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_TEXT);
  doc.setFontSize(8);
  const payments = [
    "Carte bancaire (Visa, Mastercard)",
    "Mobile Money (Orange Money, Wave, MTN MoMo)",
    "PayPal",
    "Virement SEPA",
  ];
  payments.forEach((p) => {
    doc.text(`  •  ${p}`, margin, y);
    y += 5;
  });

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(7);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "Novakou SAS — La plateforme freelance qui eleve votre carriere au plus haut niveau",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    "www.novakou.com | support@novakou.com | SIRET 123 456 789 00000",
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  return doc.output("arraybuffer") as ArrayBuffer;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
