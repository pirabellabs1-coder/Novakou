// GET /api/cron/monthly-vendor-recap
// Appelé le 1er de chaque mois à 09h00 (UTC).
// Envoie un récapitulatif mensuel à chaque vendeur avec CTA retrait si solde > 0.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

function monthName(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(d);
}

function monthlyHtml(params: {
  firstName: string;
  monthLabel: string;
  totalSales: number;
  totalRevenue: number;
  newEnrollments: number;
  newProductPurchases: number;
  newReviews: number;
  avgRating: number;
  availableBalance: number;
  topItemTitle: string | null;
  topItemSales: number;
}): string {
  const {
    firstName,
    monthLabel,
    totalSales,
    totalRevenue,
    newEnrollments,
    newProductPurchases,
    newReviews,
    avgRating,
    availableBalance,
    topItemTitle,
    topItemSales,
  } = params;

  const hasBalance = availableBalance >= 1000;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:36px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:11px;margin:6px 0 0;letter-spacing:2px;font-weight:600;">BILAN DE ${monthLabel.toUpperCase()}</p>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;">Bonjour ${firstName},</h2>

      <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
        Voici votre bilan mensuel sur Novakou pour ${monthLabel}.
      </p>

      <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:2px solid #bbf7d0;border-radius:16px;padding:28px;margin:0 0 24px;">
        <p style="color:#006e2f;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">Revenus du mois</p>
        <p style="color:#006e2f;font-size:38px;font-weight:900;margin:0;line-height:1;letter-spacing:-1px;">${fmtFCFA(totalRevenue)}</p>
        <p style="color:#059669;font-size:13px;font-weight:600;margin:8px 0 0;">${totalSales} vente${totalSales > 1 ? "s" : ""} réalisée${totalSales > 1 ? "s" : ""}</p>
      </div>

      <div style="display:table;width:100%;border-collapse:collapse;margin:0 0 24px;">
        <div style="display:table-row;">
          <div style="display:table-cell;width:50%;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px 0 0 12px;">
            <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Formations</p>
            <p style="color:#111827;font-size:22px;font-weight:800;margin:0;">${newEnrollments}</p>
            <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">nouveaux apprenants</p>
          </div>
          <div style="display:table-cell;width:50%;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-left:none;border-radius:0 12px 12px 0;">
            <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Produits</p>
            <p style="color:#111827;font-size:22px;font-weight:800;margin:0;">${newProductPurchases}</p>
            <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">téléchargements</p>
          </div>
        </div>
      </div>

      ${topItemTitle ? `
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:18px;margin:0 0 24px;">
        <p style="color:#92400e;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Meilleure performance</p>
        <p style="color:#111827;font-size:15px;font-weight:700;margin:0 0 4px;">${topItemTitle}</p>
        <p style="color:#78350f;font-size:13px;margin:0;">${topItemSales} vente${topItemSales > 1 ? "s" : ""} ce mois</p>
      </div>` : ""}

      ${newReviews > 0 ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:0 0 24px;">
        <p style="color:#1e40af;font-size:14px;font-weight:700;margin:0 0 4px;">${newReviews} nouvel${newReviews > 1 ? "s" : ""} avis ce mois (moyenne ${avgRating.toFixed(1)}/5)</p>
        <p style="color:#1e3a8a;font-size:12px;margin:0;">Répondez à vos avis depuis votre espace vendeur pour renforcer la confiance.</p>
      </div>` : ""}

      ${hasBalance ? `
      <div style="background:linear-gradient(135deg,#006e2f,#22c55e);border-radius:16px;padding:28px;margin:0 0 24px;text-align:center;">
        <p style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">Solde disponible pour retrait</p>
        <p style="color:#fff;font-size:30px;font-weight:900;margin:0 0 18px;letter-spacing:-0.5px;">${fmtFCFA(availableBalance)}</p>
        <a href="${APP_URL}/vendeur/transactions" style="display:inline-block;background:#fff;color:#006e2f;padding:13px 30px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;">
          Demander un retrait
        </a>
      </div>` : ""}

      <div style="text-align:center;margin:0 0 16px;">
        <a href="${APP_URL}/vendeur/dashboard" style="display:inline-block;background:${hasBalance ? "#f3f4f6" : "linear-gradient(135deg,#006e2f,#22c55e)"};color:${hasBalance ? "#111827" : "#fff"};padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;border:${hasBalance ? "1px solid #e5e7eb" : "none"};">
          ${hasBalance ? "Ouvrir mon dashboard" : "Voir mon dashboard"}
        </a>
      </div>

      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="color:#4b5563;font-size:14px;margin:0 0 4px;">Cordialement,</p>
        <p style="color:#006e2f;font-size:15px;font-weight:800;margin:0;">L'équipe Novakou</p>
      </div>
    </div>

    <div style="padding:20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Novakou — Édité par Pirabel Labs</p>
    </div>
  </div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !req.headers.get("x-vercel-cron")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Fenêtre : le mois écoulé (aujourd'hui = 1er → de J-31 à J-1)
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const monthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const monthLabel = monthName(monthDate);

  const HOLD_MS = 24 * 3_600_000;

  const vendors = await prisma.instructeurProfile.findMany({
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  let sent = 0, skipped = 0, failed = 0;

  for (const v of vendors) {
    if (!v.user?.email) { skipped++; continue; }

    // Stats du mois (à partir des enrollments / purchases / reviews)
    const [enrollments, purchases, reviews, revenueRows, withdrawalsAgg, topFormations, topProducts] =
      await Promise.all([
        prisma.enrollment.findMany({
          where: {
            formation: { instructeurId: v.id },
            createdAt: { gte: start },
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
          include: { formation: { select: { id: true, title: true, price: true } } },
        }),
        prisma.digitalProductPurchase.findMany({
          where: {
            product: { instructeurId: v.id },
            createdAt: { gte: start },
            status: { in: ["PAID", "COMPLETED"] },
          },
          select: { paidAmount: true, productId: true, product: { select: { title: true } } },
        }),
        prisma.formationReview.findMany({
          where: {
            formation: { instructeurId: v.id },
            createdAt: { gte: start },
          },
          select: { rating: true },
        }),
        // Full revenue history → pour calculer le solde dispo
        prisma.platformRevenue.findMany({
          where: {
            instructeurId: v.id,
            orderType: { in: ["formation", "product"] },
          },
          select: { vendorAmount: true, createdAt: true },
        }),
        prisma.instructorWithdrawal.aggregate({
          where: {
            instructeurId: v.id,
            NOT: { method: { endsWith: "_mentor" } },
            status: { in: ["EN_ATTENTE", "TRAITE"] },
          },
          _sum: { amount: true },
        }),
        prisma.enrollment.groupBy({
          by: ["formationId"],
          where: {
            formation: { instructeurId: v.id },
            createdAt: { gte: start },
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
          _count: { formationId: true },
          orderBy: { _count: { formationId: "desc" } },
          take: 1,
        }),
        prisma.digitalProductPurchase.groupBy({
          by: ["productId"],
          where: {
            product: { instructeurId: v.id },
            createdAt: { gte: start },
            status: { in: ["PAID", "COMPLETED"] },
          },
          _count: { productId: true },
          orderBy: { _count: { productId: "desc" } },
          take: 1,
        }),
      ]);

    const totalSales = enrollments.length + purchases.length;
    // On envoie même sans vente si le solde est retirable — utile pour relancer les vendeurs inactifs
    const totalRevenue = enrollments.reduce((s, e) => s + (e.formation?.price ?? 0), 0)
                       + purchases.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    // Solde dispo : revenus libérés (>24h) - retraits EN_ATTENTE/TRAITE
    let netReleased = 0;
    const nowMs = Date.now();
    for (const r of revenueRows) {
      if (nowMs - new Date(r.createdAt).getTime() >= HOLD_MS) netReleased += r.vendorAmount;
    }
    const availableBalance = Math.max(0, netReleased - (withdrawalsAgg._sum.amount ?? 0));

    // Top item du mois
    let topItemTitle: string | null = null;
    let topItemSales = 0;
    const topF = topFormations[0];
    const topP = topProducts[0];
    if (topF && (!topP || topF._count.formationId >= topP._count.productId)) {
      const fmt = enrollments.find((e) => e.formation?.id === topF.formationId)?.formation;
      if (fmt) { topItemTitle = fmt.title; topItemSales = topF._count.formationId; }
    } else if (topP) {
      const pur = purchases.find((p) => p.productId === topP.productId)?.product;
      if (pur) { topItemTitle = pur.title; topItemSales = topP._count.productId; }
    }

    // Si pas de ventes ce mois ET pas de solde retirable → skip
    if (totalSales === 0 && availableBalance < 1000) { skipped++; continue; }

    const firstName = (v.user.name || v.user.email.split("@")[0]).split(" ")[0];

    try {
      const subject = availableBalance >= 1000
        ? `Bilan ${monthLabel} — ${fmtFCFA(availableBalance)} disponibles au retrait`
        : `Bilan ${monthLabel} — ${fmtFCFA(totalRevenue)} générés`;

      await resend.emails.send({
        from: FROM,
        to: v.user.email,
        subject,
        html: monthlyHtml({
          firstName,
          monthLabel,
          totalSales,
          totalRevenue,
          newEnrollments: enrollments.length,
          newProductPurchases: purchases.length,
          newReviews: reviews.length,
          avgRating,
          availableBalance,
          topItemTitle,
          topItemSales,
        }),
      });
      sent++;
    } catch (e) {
      console.error("[monthly-recap] failed for", v.user.email, e);
      failed++;
    }
  }

  return NextResponse.json({ data: { sent, skipped, failed, total: vendors.length, monthLabel } });
}
