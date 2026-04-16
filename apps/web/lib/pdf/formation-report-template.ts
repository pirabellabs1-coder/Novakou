// Templates PDF pour rapports formations (instructeur + apprenant)
import jsPDF from "jspdf";

const PRIMARY_COLOR: [number, number, number] = [108, 43, 217];
const DARK_TEXT: [number, number, number] = [30, 30, 40];
const GRAY_TEXT: [number, number, number] = [120, 120, 140];
const LIGHT_BG: [number, number, number] = [245, 243, 255];

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Instructeur Report ──

export interface InstructorReportData {
  formationTitle: string;
  instructorName: string;
  generatedAt: string;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  completionRate: number;
  totalRevenue: number;
  netRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  lessonCompletion: { title: string; completedPct: number }[];
  avgQuizScore: number;
}

export function generateInstructorReportPDF(data: InstructorReportData): ArrayBuffer {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0;

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FreelanceHigh", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Rapport de formation — Instructeur", margin, 28);
  doc.text(formatDate(data.generatedAt), pageW - margin, 28, { align: "right" });
  y = 50;

  // Formation title
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.formationTitle, margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_TEXT);
  doc.text(`Instructeur : ${data.instructorName}`, margin, y);
  y += 12;

  // KPI cards
  const kpis = [
    { label: "Apprenants", value: `${data.studentsCount}` },
    { label: "Note moyenne", value: `${data.rating.toFixed(1)}/5 (${data.reviewsCount} avis)` },
    { label: "Taux de complétion", value: `${data.completionRate.toFixed(0)}%` },
    { label: "CA brut", value: `${data.totalRevenue.toFixed(2)}€` },
    { label: "CA net (70%)", value: `${data.netRevenue.toFixed(2)}€` },
  ];

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, pageW - margin * 2, 32, 3, 3, "F");
  y += 8;

  const kpiW = (pageW - margin * 2) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = margin + i * kpiW + kpiW / 2;
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x, y + 2, { align: "center" });
    doc.setTextColor(...GRAY_TEXT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x, y + 9, { align: "center" });
  });
  y += 34;

  // Revenue by month table
  if (data.revenueByMonth.length > 0) {
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Revenus mensuels", margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Mois", margin, y);
    doc.text("Revenus", pageW - margin, y, { align: "right" });
    y += 2;
    doc.setDrawColor(220, 220, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_TEXT);
    for (const row of data.revenueByMonth) {
      doc.text(row.month, margin, y);
      doc.text(`${row.revenue.toFixed(2)}€`, pageW - margin, y, { align: "right" });
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    y += 6;
  }

  // Lesson completion
  if (data.lessonCompletion.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Complétion par leçon", margin, y);
    y += 8;

    doc.setFontSize(8);
    for (const lesson of data.lessonCompletion.slice(0, 20)) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK_TEXT);
      const title = lesson.title.length > 50 ? lesson.title.slice(0, 47) + "..." : lesson.title;
      doc.text(title, margin, y);

      // Progress bar
      const barX = margin + 90;
      const barW = 60;
      const barH = 3;
      doc.setFillColor(230, 230, 240);
      doc.roundedRect(barX, y - 3, barW, barH, 1, 1, "F");
      doc.setFillColor(...PRIMARY_COLOR);
      doc.roundedRect(barX, y - 3, barW * (lesson.completedPct / 100), barH, 1, 1, "F");

      doc.setTextColor(...GRAY_TEXT);
      doc.text(`${lesson.completedPct.toFixed(0)}%`, barX + barW + 4, y);
      y += 7;
      if (y > 270) { doc.addPage(); y = 20; }
    }
    y += 6;
  }

  // Quiz score
  if (data.avgQuizScore > 0) {
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Score moyen aux quiz", margin, y);
    y += 8;
    doc.setFontSize(24);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`${data.avgQuizScore.toFixed(0)}%`, margin, y);
    y += 12;
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`FreelanceHigh — Rapport généré le ${formatDate(data.generatedAt)}`, margin, 290);
    doc.text(`Page ${i}/${pages}`, pageW - margin, 290, { align: "right" });
  }

  return doc.output("arraybuffer");
}

// ── Apprenant Report ──

export interface LearnerReportData {
  learnerName: string;
  generatedAt: string;
  enrollments: {
    title: string;
    instructor: string;
    progress: number;
    enrolledAt: string;
    completedAt: string | null;
    certificate: boolean;
    totalHours: number;
  }[];
  stats: {
    inProgress: number;
    completed: number;
    certificates: number;
    totalHours: number;
  };
}

export function generateLearnerReportPDF(data: LearnerReportData): ArrayBuffer {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0;

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FreelanceHigh", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Rapport de progression — Apprenant", margin, 28);
  doc.text(formatDate(data.generatedAt), pageW - margin, 28, { align: "right" });
  y = 50;

  // Learner name
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.learnerName, margin, y);
  y += 12;

  // Stats
  const stats = [
    { label: "En cours", value: `${data.stats.inProgress}` },
    { label: "Complétées", value: `${data.stats.completed}` },
    { label: "Certifications", value: `${data.stats.certificates}` },
    { label: "Heures", value: `${data.stats.totalHours}h` },
  ];

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "F");
  y += 7;

  const statW = (pageW - margin * 2) / stats.length;
  stats.forEach((s, i) => {
    const x = margin + i * statW + statW / 2;
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(s.value, x, y + 2, { align: "center" });
    doc.setTextColor(...GRAY_TEXT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(s.label, x, y + 9, { align: "center" });
  });
  y += 30;

  // Formations table
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Mes formations", margin, y);
  y += 8;

  // Table header
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Formation", margin, y);
  doc.text("Instructeur", margin + 70, y);
  doc.text("Progression", margin + 110, y);
  doc.text("Inscrit le", margin + 140, y);
  y += 2;
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  for (const e of data.enrollments) {
    doc.setTextColor(...DARK_TEXT);
    const title = e.title.length > 40 ? e.title.slice(0, 37) + "..." : e.title;
    doc.text(title, margin, y);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(e.instructor.length > 20 ? e.instructor.slice(0, 17) + "..." : e.instructor, margin + 70, y);

    // Mini progress bar
    const barX = margin + 110;
    const barW = 24;
    doc.setFillColor(230, 230, 240);
    doc.roundedRect(barX, y - 2.5, barW, 2.5, 1, 1, "F");
    doc.setFillColor(e.progress >= 100 ? 16 : 108, e.progress >= 100 ? 185 : 43, e.progress >= 100 ? 129 : 217);
    doc.roundedRect(barX, y - 2.5, barW * (e.progress / 100), 2.5, 1, 1, "F");
    doc.text(`${Math.round(e.progress)}%`, barX + barW + 2, y);

    doc.text(formatDate(e.enrolledAt), margin + 140, y);

    if (e.certificate) {
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text("Certifié", pageW - margin, y, { align: "right" });
    }

    y += 7;
    if (y > 270) { doc.addPage(); y = 20; }
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`FreelanceHigh — Rapport généré le ${formatDate(data.generatedAt)}`, margin, 290);
    doc.text(`Page ${i}/${pages}`, pageW - margin, 290, { align: "right" });
  }

  return doc.output("arraybuffer");
}
