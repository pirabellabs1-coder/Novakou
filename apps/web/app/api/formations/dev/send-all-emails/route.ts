import { NextResponse } from "next/server";
import {
  sendOtpEmailFH,
  sendWelcomeEmailFH,
  sendPasswordResetFH,
  sendPurchaseConfirmationFH,
  sendSaleNotificationFH,
  sendWeeklyReportFH,
  sendRefundConfirmationFH,
  sendWithdrawalConfirmationFH,
} from "@/lib/email/templates-fh";

/**
 * GET /api/formations/dev/send-all-emails?to=email@domain.com
 *
 * Dev-only: sends one sample of each Novakou transactional email template
 * to the target address. Useful for design review.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");
  if (!to) return NextResponse.json({ error: "Provide ?to=email" }, { status: 400 });

  const name = "Gildas";

  const jobs: Array<{ key: string; subject: string; run: () => Promise<{ data?: { id?: string } | null; error?: unknown }> }> = [
    {
      key: "1-otp",
      subject: "🔐 Code de vérification",
      run: () => sendOtpEmailFH(to, name, "482917"),
    },
    {
      key: "2-welcome-vendeur",
      subject: "🚀 Bienvenue vendeur",
      run: () => sendWelcomeEmailFH(to, name, "vendeur"),
    },
    {
      key: "3-welcome-apprenant",
      subject: "🎓 Bienvenue apprenant",
      run: () => sendWelcomeEmailFH(to, name, "apprenant"),
    },
    {
      key: "4-password-reset",
      subject: "🔑 Réinitialisation mot de passe",
      run: () => sendPasswordResetFH(to, name, "abc123def456secret"),
    },
    {
      key: "5-purchase-confirmation",
      subject: "✅ Achat confirmé",
      run: () =>
        sendPurchaseConfirmationFH(to, name, {
          orderId: "FH-2026-0142",
          items: [
            { title: "Masterclass Facebook & Instagram Ads", kind: "formation", price: 45000 },
            { title: "Pack 50 templates Notion pro", kind: "product", price: 12000 },
          ],
          total: 57000,
          paymentMethod: "Orange Money",
        }),
    },
    {
      key: "6-sale-notification",
      subject: "💰 Nouvelle vente",
      run: () =>
        sendSaleNotificationFH(to, name, {
          productTitle: "Masterclass Facebook & Instagram Ads",
          kind: "formation",
          grossAmount: 45000,
          commissionRate: 10,
          netAmount: 40500,
          buyerName: "Aminata D.",
          totalSales: 23,
          monthEarnings: 342500,
        }),
    },
    {
      key: "7-weekly-report",
      subject: "📊 Rapport hebdomadaire",
      run: () =>
        sendWeeklyReportFH(to, name, {
          weekStart: "7 avril",
          weekEnd: "13 avril",
          sales: 12,
          earnings: 468000,
          visits: 1247,
          conversions: 12,
          topProduct: { title: "Masterclass Facebook & Instagram Ads", sales: 8 },
          vs: { salesPct: 33.3, earningsPct: 42.1 },
        }),
    },
    {
      key: "8-refund",
      subject: "✅ Remboursement confirmé",
      run: () =>
        sendRefundConfirmationFH(to, name, {
          orderId: "FH-2026-0098",
          productTitle: "Pack 50 templates Notion pro",
          amount: 12000,
          refundMethod: "Orange Money",
          estimatedDays: 3,
        }),
    },
    {
      key: "9-withdrawal",
      subject: "💳 Retrait confirmé",
      run: () =>
        sendWithdrawalConfirmationFH(to, name, {
          amount: 250000,
          method: "Wave",
          destination: "+221 77 *** 42 18",
          estimatedDays: 1,
          reference: "WD-2026-04-0042",
          remainingBalance: 92500,
        }),
    },
  ];

  const results: Array<{ key: string; subject: string; ok: boolean; id?: string; error?: string }> = [];

  for (const job of jobs) {
    try {
      const r = await job.run();
      if (r.error) {
        results.push({ key: job.key, subject: job.subject, ok: false, error: String((r.error as { message?: string })?.message ?? r.error) });
      } else {
        results.push({ key: job.key, subject: job.subject, ok: true, id: r.data?.id });
      }
      // brief delay to avoid rate-limits (Resend: 2 req/s by default)
      await new Promise((res) => setTimeout(res, 600));
    } catch (err) {
      results.push({ key: job.key, subject: job.subject, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({
    to,
    sent,
    failed: results.length - sent,
    results,
  });
}
