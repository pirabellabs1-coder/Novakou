import jsPDF from "jspdf";

interface AccountingReportData {
  period: string;
  startDate: string;
  endDate: string;
  kpis: {
    revenueServices: number;
    totalCommissions: number;
    revenueBoosts: number;
    revenueAbonnements: number;
    totalRefunds: number;
    netResult: number;
    operationsCount: number;
  };
  operationsCount: number;
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Generate a PDF accounting summary report.
 * Returns a Uint8Array that can be used to create a Blob.
 */
export function generateAccountingReport(data: AccountingReportData): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFillColor(17, 24, 39); // bg-background-dark
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Novakou", 20, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Recapitulatif comptable", 20, 28);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Periode : ${data.period} (${fmtDate(data.startDate)} - ${fmtDate(data.endDate)})`, 20, 36);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(`Genere le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth - 20, 36, { align: "right" });

  // ── Summary table ──
  let y = 55;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resume financier", 20, y);
  y += 10;

  const rows = [
    { label: "Recettes services (ventes)", value: data.kpis.revenueServices, color: [16, 185, 129] }, // emerald
    { label: "Commissions percues", value: data.kpis.totalCommissions, color: [168, 85, 247] }, // purple (primary)
    { label: "Revenus boosts", value: data.kpis.revenueBoosts, color: [245, 158, 11] }, // amber
    { label: "Revenus abonnements", value: data.kpis.revenueAbonnements, color: [59, 130, 246] }, // blue
    { label: "Remboursements", value: -data.kpis.totalRefunds, color: [239, 68, 68] }, // red
  ];

  // Table header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(20, y, pageWidth - 40, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("CATEGORIE", 25, y + 5.5);
  doc.text("MONTANT (EUR)", pageWidth - 25, y + 5.5, { align: "right" });
  y += 10;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const row of rows) {
    if (y % 2 === 0) {
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(20, y - 2, pageWidth - 40, 8, "F");
    }
    doc.setTextColor(226, 232, 240); // slate-200
    doc.text(row.label, 25, y + 4);
    doc.setTextColor(row.color[0], row.color[1], row.color[2]);
    doc.text(`${row.value >= 0 ? "+" : ""}${fmt(row.value)} \u20ac`, pageWidth - 25, y + 4, { align: "right" });
    y += 9;
  }

  // Separator
  y += 3;
  doc.setDrawColor(100, 116, 139); // slate-500
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Net result
  doc.setFillColor(data.kpis.netResult >= 0 ? 16 : 239, data.kpis.netResult >= 0 ? 185 : 68, data.kpis.netResult >= 0 ? 129 : 68);
  doc.rect(20, y - 3, pageWidth - 40, 12, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RESULTAT NET", 25, y + 5);
  doc.text(`${fmt(data.kpis.netResult)} \u20ac`, pageWidth - 25, y + 5, { align: "right" });
  y += 20;

  // ── Stats ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`Nombre total d'operations : ${data.operationsCount}`, 20, y);
  y += 7;
  doc.text(`Commission moyenne par vente : ${data.kpis.revenueServices > 0 ? fmt(data.kpis.totalCommissions / Math.max(1, data.operationsCount)) : "0,00"} \u20ac`, 20, y);
  y += 7;

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Novakou — La plateforme freelance qui eleve votre carriere au plus haut niveau", pageWidth / 2, footerY, { align: "center" });
  doc.text("Document genere automatiquement — Ne constitue pas une facture officielle", pageWidth / 2, footerY + 4, { align: "center" });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
