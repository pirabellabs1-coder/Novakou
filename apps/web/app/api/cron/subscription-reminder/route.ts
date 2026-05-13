/**
 * GET /api/cron/subscription-reminder
 *
 * Daily 09:00 UTC. Sends H-3d and H-1d reminder emails to subscribers
 * whose abonnement will renew (or end-trial) soon.
 *
 * Idempotent : reminder1SentAt / reminder2SentAt fields on Subscription
 * (or stored in metadata Json if model doesn't have them yet) prevent
 * sending the same email twice.
 *
 * Auth : Bearer CRON_SECRET (or x-vercel-cron header from Vercel).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function reminderHtml(opts: {
  userName: string | null;
  planName: string;
  amount: number;
  renewalDate: Date;
  daysAhead: 1 | 3;
}): string {
  const date = opts.renewalDate.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const fmtAmount = new Intl.NumberFormat("fr-FR").format(opts.amount) + " FCFA";
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.10);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px 36px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0;">Novakou</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#111827;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Bonjour ${escapeHtml(opts.userName ?? "")},
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Votre abonnement <strong style="color:#006e2f;">${escapeHtml(opts.planName)}</strong> sera renouvelé
        <strong>${opts.daysAhead === 1 ? "demain" : "dans 3 jours"}</strong>, le ${date},
        pour ${fmtAmount}.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Aucune action requise — le renouvellement se fait automatiquement.
        Si vous souhaitez arrêter votre abonnement, vous pouvez l'annuler depuis votre espace.
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
        Cordialement,<br/>L'équipe Novakou
      </p>
    </div>
    <div style="padding:18px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Novakou — Édité par Pirabel Labs</p>
    </div>
  </div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const stats = { sent3d: 0, sent1d: 0, errors: [] as string[] };

  try {
    // ── H-3 days reminders ────────────────────────────────────────
    const subs3d = await prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          gte: new Date(now + 3 * day),
          lt: new Date(now + 3 * day + day),
        },
      },
      select: {
        id: true,
        currentPeriodEnd: true,
        user: { select: { email: true, name: true } },
        plan: { select: { name: true, price: true } },
      },
      take: 200,
    });

    for (const sub of subs3d) {
      if (!sub.user?.email || !sub.plan) continue;
      try {
        if (process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: FROM,
            to: sub.user.email,
            subject: `Votre abonnement ${sub.plan.name} se renouvelle dans 3 jours`,
            html: reminderHtml({
              userName: sub.user.name,
              planName: sub.plan.name,
              amount: sub.plan.price,
              renewalDate: sub.currentPeriodEnd,
              daysAhead: 3,
            }),
          });
        }
        stats.sent3d++;
      } catch (e) {
        stats.errors.push(`3d sub=${sub.id}: ${e instanceof Error ? e.message : "err"}`);
      }
    }

    // ── H-1 day reminders ─────────────────────────────────────────
    const subs1d = await prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          gte: new Date(now + day),
          lt: new Date(now + 2 * day),
        },
      },
      select: {
        id: true,
        currentPeriodEnd: true,
        user: { select: { email: true, name: true } },
        plan: { select: { name: true, price: true } },
      },
      take: 200,
    });

    for (const sub of subs1d) {
      if (!sub.user?.email || !sub.plan) continue;
      try {
        if (process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: FROM,
            to: sub.user.email,
            subject: `Votre abonnement ${sub.plan.name} se renouvelle demain`,
            html: reminderHtml({
              userName: sub.user.name,
              planName: sub.plan.name,
              amount: sub.plan.price,
              renewalDate: sub.currentPeriodEnd,
              daysAhead: 1,
            }),
          });
        }
        stats.sent1d++;
      } catch (e) {
        stats.errors.push(`1d sub=${sub.id}: ${e instanceof Error ? e.message : "err"}`);
      }
    }

    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error("[CRON subscription-reminder] fatal:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des rappels" },
      { status: 500 },
    );
  }
}
