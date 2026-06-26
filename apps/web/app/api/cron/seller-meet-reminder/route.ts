import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout, getAppUrl } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MEET = "https://meet.google.com/kio-zctx-djz";
const SUBJECT = "Rappel — rendez-vous vendeurs Novakou ce soir à 20 h";
const NOTIF_TITLE = "Rappel — rendez-vous vendeurs ce soir à 20 h";
const NOTIF_MSG =
  "C'est aujourd'hui ! Rejoignez la rencontre en ligne ce soir à 20 h (heure du Bénin) : lancement, comment vendre plus et créer de bons visuels. Lien Google Meet : " + MEET;

// Le rappel ne doit partir QUE le 27 juin 2026 (jour du RDV). Garde de sécurité
// car un cron Vercel daté se redéclenche chaque année.
const REMINDER_DATE = "2026-06-27"; // UTC ; 17 h UTC = 18 h heure du Bénin (WAT)

function emailHtml(): string {
  const content = `
    <p style="color:#111827;font-size:15px;line-height:1.6;margin:0 0 16px;">Chère vendeuse, cher vendeur,</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Petit rappel : notre rencontre en ligne a lieu <strong>ce soir à 20 h</strong> (heure du Bénin). Nous serons ravis de vous y retrouver.</p>
    <p style="color:#111827;font-size:15px;font-weight:700;margin:0 0 6px;">Au programme :</p>
    <ul style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;padding-left:20px;">
      <li>Le lancement de Novakou et ce que cela change pour vous.</li>
      <li>Comment vendre plus : attirer des clients et les convaincre.</li>
      <li>Comment créer de bons visuels qui donnent envie d'acheter.</li>
      <li>Un temps d'échange pour répondre à vos questions.</li>
    </ul>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;"><strong>Heure :</strong> 20 h (heure du Bénin, GMT+1) — connectez-vous via le lien ci-dessous.</p>
    <div style="text-align:center;margin:8px 0 20px;">
      <a href="${MEET}" style="display:inline-block;background:#006e2f;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Rejoindre le Google Meet</a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 16px;word-break:break-all;">${MEET}</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">À tout à l'heure,<br/>L'équipe Novakou</p>
  `;
  return emailLayout(content);
}

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  // Garde 1 : uniquement le jour du RDV.
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (todayUtc !== REMINDER_DATE) {
    return NextResponse.json({ skipped: true, reason: `Pas le jour du RDV (aujourd'hui ${todayUtc}, attendu ${REMINDER_DATE})` });
  }

  // Garde 2 : anti-doublon — si un rappel a déjà été créé dans les 12 dernières heures.
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const already = await prisma.notification.count({ where: { title: NOTIF_TITLE, createdAt: { gte: since } } });
  if (already > 0) {
    return NextResponse.json({ skipped: true, reason: `Rappel déjà envoyé (${already} notifications récentes)` });
  }

  const sellers = await prisma.user.findMany({
    where: { formationsRole: "instructeur" },
    select: { id: true, email: true, name: true },
  });
  const withEmail = sellers.filter((s) => s.email && s.email.includes("@"));

  // Notifications in-app
  await prisma.notification.createMany({
    data: withEmail.map((s) => ({ userId: s.id, title: NOTIF_TITLE, message: NOTIF_MSG, type: "ADMIN_ACTION" as const, read: false, link: MEET })),
  });

  // E-mails
  const html = emailHtml();
  let ok = 0, fail = 0;
  for (const s of withEmail) {
    const r = await sendEmail({ to: s.email, subject: SUBJECT, html }).catch(() => ({ error: true }));
    if (r && (r as { error?: unknown }).error) fail++; else ok++;
  }

  console.log(`[seller-meet-reminder] notifications=${withEmail.length} emails_ok=${ok} emails_fail=${fail}`);
  return NextResponse.json({ ok: true, sellers: withEmail.length, notifications: withEmail.length, emailsSent: ok, emailsFailed: fail, appUrl: getAppUrl() });
}
