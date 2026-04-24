// GET /api/cron/lesson-start-reminder
// Quotidien — trouve les apprenants inscrits depuis 3-4 jours sans aucune progression
// et leur envoie un rappel motivant pour commencer.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

function reminderHtml(firstName: string, formationTitle: string, slug: string, email: string): string {
  const magicLink = `${APP_URL}/acheteur/connexion?email=${encodeURIComponent(email)}&autosend=1&callbackUrl=${encodeURIComponent(APP_URL + "/apprenant/formation/" + slug)}`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;">Bonjour ${firstName},</h2>

      <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 20px;">
        Nous avons remarqué que vous n'avez pas encore commencé votre formation
        <strong style="color:#111827;">« ${formationTitle} »</strong>.
      </p>

      <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
        Quelques minutes par jour suffisent pour progresser. La première leçon
        vous attend — c'est souvent celle qui change la perspective sur le sujet.
      </p>

      <div style="text-align:center;margin:0 0 28px;">
        <a href="${magicLink}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">
          Commencer la formation
        </a>
      </div>

      <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0 0 16px;">
        Si vous rencontrez un problème ou avez une question, répondez simplement à ce mail.
      </p>

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
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

  // Fenêtre : enrollments créés il y a 3 jours (entre 3j00 et 3j23)
  const now = Date.now();
  const threeDaysAgoStart = new Date(now - 4 * 24 * 60 * 60 * 1000);
  const threeDaysAgoEnd = new Date(now - 3 * 24 * 60 * 60 * 1000);

  // Enrollments sans progression créés dans la fenêtre
  const enrollments = await prisma.enrollment.findMany({
    where: {
      createdAt: { gte: threeDaysAgoStart, lte: threeDaysAgoEnd },
      progress: 0,
      status: "ACTIVE",
    },
    include: {
      user: { select: { email: true, name: true } },
      formation: { select: { title: true, slug: true } },
    },
  });

  let sent = 0, failed = 0;

  for (const e of enrollments) {
    if (!e.user?.email || !e.formation) continue;
    const firstName = (e.user.name || e.user.email.split("@")[0]).split(" ")[0];
    try {
      await resend.emails.send({
        from: FROM,
        to: e.user.email,
        subject: `Votre formation « ${e.formation.title} » vous attend`,
        html: reminderHtml(firstName, e.formation.title, e.formation.slug, e.user.email),
      });
      sent++;
    } catch (err) {
      console.error("[lesson-start-reminder] failed", e.user.email, err);
      failed++;
    }
  }

  return NextResponse.json({ data: { sent, failed, total: enrollments.length } });
}
