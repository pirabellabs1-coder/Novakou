// GET /api/cron/weekly-vendor-recap
// Appelé chaque dimanche à 18h (UTC).
// Envoie un récap hebdo à chaque vendeur ayant eu >=1 vente cette semaine.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

function recapHtml(params: {
  firstName: string;
  totalSales: number;
  totalRevenue: number;
  newEnrollments: number;
  newProductPurchases: number;
  newReviews: number;
  avgRating: number;
}): string {
  const { firstName, totalSales, totalRevenue, newEnrollments, newProductPurchases, newReviews, avgRating } = params;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:36px 40px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.15);padding:10px;margin:0 auto 8px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#ffffff;text-align:center;line-height:28px;color:#006e2f;font-weight:900;font-size:18px;">N</div>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:11px;margin:6px 0 0;letter-spacing:2px;font-weight:600;">RÉCAPITULATIF HEBDOMADAIRE</p>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;">Bonjour ${firstName},</h2>

      <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
        Voici le récapitulatif de votre activité sur Novakou cette semaine.
      </p>

      <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:2px solid #bbf7d0;border-radius:16px;padding:28px;margin:0 0 24px;">
        <p style="color:#006e2f;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">Revenus de la semaine</p>
        <p style="color:#006e2f;font-size:36px;font-weight:900;margin:0;line-height:1;letter-spacing:-1px;">${fmtFCFA(totalRevenue)}</p>
        <p style="color:#059669;font-size:13px;font-weight:600;margin:8px 0 0;">${totalSales} vente${totalSales > 1 ? "s" : ""} réalisée${totalSales > 1 ? "s" : ""}</p>
      </div>

      <div style="display:table;width:100%;border-collapse:collapse;margin:0 0 24px;">
        <div style="display:table-row;">
          <div style="display:table-cell;width:50%;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px 0 0 12px;">
            <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Formations</p>
            <p style="color:#111827;font-size:20px;font-weight:800;margin:0;">${newEnrollments}</p>
            <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">nouveaux apprenants</p>
          </div>
          <div style="display:table-cell;width:50%;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-left:none;border-radius:0 12px 12px 0;">
            <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Produits</p>
            <p style="color:#111827;font-size:20px;font-weight:800;margin:0;">${newProductPurchases}</p>
            <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">téléchargements</p>
          </div>
        </div>
      </div>

      ${newReviews > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:0 0 24px;">
        <p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 4px;">⭐ ${newReviews} nouvel${newReviews > 1 ? "s" : ""} avis cette semaine (moyenne ${avgRating.toFixed(1)}/5)</p>
        <p style="color:#78350f;font-size:12px;margin:0;">N'oubliez pas de répondre à vos avis depuis votre dashboard.</p>
      </div>` : ""}

      <div style="text-align:center;margin:0 0 16px;">
        <a href="${APP_URL}/vendeur/dashboard" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">
          Voir mon dashboard complet
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

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Récupère tous les vendeurs avec au moins une vente cette semaine
  const vendors = await prisma.instructeurProfile.findMany({
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  let sent = 0, skipped = 0, failed = 0;

  for (const v of vendors) {
    if (!v.user?.email) { skipped++; continue; }

    // Stats de la semaine
    const [enrollments, purchases, reviews] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          formation: { instructeurId: v.id },
          createdAt: { gte: weekAgo },
          refundedAt: null,
        },
        include: { formation: { select: { price: true } } },
      }),
      prisma.digitalProductPurchase.findMany({
        where: {
          product: { instructeurId: v.id },
          createdAt: { gte: weekAgo },
        },
        select: { paidAmount: true },
      }),
      prisma.formationReview.findMany({
        where: {
          formation: { instructeurId: v.id },
          createdAt: { gte: weekAgo },
        },
        select: { rating: true },
      }),
    ]);

    const totalSales = enrollments.length + purchases.length;
    if (totalSales === 0) { skipped++; continue; }

    const totalRevenue = enrollments.reduce((s, e) => s + (e.formation?.price ?? 0), 0)
                       + purchases.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    const firstName = (v.user.name || v.user.email.split("@")[0]).split(" ")[0];

    try {
      await resend.emails.send({
        from: FROM,
        to: v.user.email,
        subject: `Votre récapitulatif hebdomadaire — ${fmtFCFA(totalRevenue)} cette semaine`,
        html: recapHtml({
          firstName,
          totalSales,
          totalRevenue,
          newEnrollments: enrollments.length,
          newProductPurchases: purchases.length,
          newReviews: reviews.length,
          avgRating,
        }),
      });
      sent++;
    } catch (e) {
      console.error("[weekly-recap] failed for", v.user.email, e);
      failed++;
    }
  }

  return NextResponse.json({ data: { sent, skipped, failed, total: vendors.length } });
}
