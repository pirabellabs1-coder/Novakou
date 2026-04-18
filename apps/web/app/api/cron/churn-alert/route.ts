/**
 * Cron : alerte churn — étudiants qui n'ont pas progressé depuis >= 14 jours
 * sur une formation qu'ils ont commencée. Envoie un email de relance (une
 * seule fois par enrollment + par fenêtre de 30 jours).
 *
 * Appelé par Vercel Cron quotidiennement.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout, button, getAppUrl } from "@/lib/email";

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return auth === `Bearer ${expected}`;
}

async function sendChurnEmail(params: {
  email: string;
  name: string | null;
  formationTitle: string;
  formationSlug: string;
  daysInactive: number;
}) {
  const resumeUrl = `${getAppUrl()}/formation/${params.formationSlug}`;
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 12px;">On vous attend, ${params.name?.split(" ")[0] ?? "vous"} 👋</h2>
    <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Vous avez commencé <strong>${params.formationTitle}</strong> il y a quelques temps. Cela fait
      ${params.daysInactive} jours que vous n'avez plus progressé — vos objectifs sont encore à portée de main.
    </p>
    <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Reprendre maintenant, c'est 20 minutes par jour pour finir ce que vous avez commencé.
    </p>
    <div style="text-align:center;">${button("Reprendre ma formation", resumeUrl)}</div>
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:16px 0 0;">
      Vous recevez ce message car vous êtes inscrit à cette formation. <br/>
      <a href="${getAppUrl()}/apprenant/parametres?tab=notifications" style="color:#006e2f;">Gérer mes notifications</a>
    </p>
  `);

  return sendEmail({
    to: params.email,
    subject: `📚 Reprenez là où vous vous êtes arrêté — ${params.formationTitle}`,
    html,
  });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  const recentCutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  // Pick enrollments that :
  //  - are not complete
  //  - were last updated > 14 days ago
  //  - haven't received a churn reminder in the last 30 days
  //
  // NOTE: `Enrollment.progress` field doesn't exist reliably on the schema,
  // so we use `updatedAt` as a proxy for "last activity" — it bumps whenever
  // lesson progress is updated.
  const candidates = await prisma.enrollment.findMany({
    where: {
      completedAt: null,
      refundedAt: null,
      updatedAt: { lt: cutoff },
    },
    select: {
      id: true,
      updatedAt: true,
      user: { select: { id: true, email: true, name: true } },
      formation: { select: { id: true, slug: true, title: true } },
    },
    take: 500, // safety cap per run
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const e of candidates) {
    if (!e.user?.email || !e.formation) {
      skipped++;
      continue;
    }

    // Has a churn reminder been sent in the last 30 days for this enrollment?
    const recent = await prisma.auditLog.findFirst({
      where: {
        action: "churn_reminder_sent",
        targetType: "enrollment",
        targetId: e.id,
        createdAt: { gt: recentCutoff },
      },
      select: { id: true },
    }).catch(() => null);
    if (recent) {
      skipped++;
      continue;
    }

    const daysInactive = Math.floor(
      (Date.now() - new Date(e.updatedAt).getTime()) / (24 * 3600 * 1000),
    );

    try {
      await sendChurnEmail({
        email: e.user.email,
        name: e.user.name,
        formationTitle: e.formation.title,
        formationSlug: e.formation.slug,
        daysInactive,
      });
      await prisma.auditLog
        .create({
          data: {
            action: "churn_reminder_sent",
            targetType: "enrollment",
            targetId: e.id,
            targetUserId: e.user.id,
            details: { daysInactive, formationId: e.formation.id },
          },
        })
        .catch(() => null);
      sent++;
    } catch (err) {
      console.error("[churn-alert] failed:", err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors, candidates: candidates.length });
}
