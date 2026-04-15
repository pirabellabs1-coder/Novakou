// FreelanceHigh — Mentor booking emails (branded green)

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "FreelanceHigh <noreply@freelancehigh.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://freelancehigh.com";

// ─── Shared green-branded layout ──────────────────────────────────────────────
function layout(content: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<div style="text-align:center;margin:24px 0;">
         <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(to right,#006e2f,#22c55e);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">${ctaLabel}</a>
       </div>` : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f9fb;font-family:-apple-system,'Plus Jakarta Sans',BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.04);border:1px solid #eef0f3;">
    <div style="background:linear-gradient(135deg,#003d1a 0%,#006e2f 50%,#22c55e 100%);padding:32px 40px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);line-height:48px;margin-bottom:12px;">
        <span style="color:#ffffff;font-weight:800;font-size:16px;letter-spacing:-0.5px;">FH</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">FreelanceHigh</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:11px;margin:4px 0 0;letter-spacing:1.5px;font-weight:600;">🎓 MENTORAT</p>
    </div>
    <div style="padding:36px 40px;color:#191c1e;line-height:1.6;font-size:14px;">
      ${content}
      ${cta}
    </div>
    <div style="padding:20px 40px;background:#f7f9fb;border-top:1px solid #eef0f3;text-align:center;">
      <p style="color:#5c647a;font-size:11px;margin:0 0 4px;">L'équipe FreelanceHigh</p>
      <p style="color:#9ca3af;font-size:10px;margin:0;">La plateforme qui élève votre carrière freelance.</p>
    </div>
  </div>
</body>
</html>`;
}

const fmtFcfa = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtTime = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// ─── Mentor: new booking request ──────────────────────────────────────────────
export async function sendMentorBookingRequestEmail(opts: {
  mentorEmail: string;
  mentorName: string;
  studentName: string;
  scheduledAt: Date;
  durationMinutes: number;
  paidAmount: number;
}) {
  const content = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;">Nouvelle demande de séance 🎉</h2>
    <p style="margin:0 0 16px;color:#5c647a;">Bonjour <strong style="color:#191c1e;">${opts.mentorName}</strong>,</p>
    <p style="margin:0 0 16px;">
      <strong>${opts.studentName}</strong> vient de réserver une séance avec vous.
    </p>
    <div style="background:#f7f9fb;border-radius:12px;padding:16px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#5c647a;font-size:12px;width:120px;">📅 Date</td><td style="padding:6px 0;color:#191c1e;font-weight:600;font-size:13px;">${fmtDate(opts.scheduledAt)}</td></tr>
        <tr><td style="padding:6px 0;color:#5c647a;font-size:12px;">⏰ Heure</td><td style="padding:6px 0;color:#191c1e;font-weight:600;font-size:13px;">${fmtTime(opts.scheduledAt)}</td></tr>
        <tr><td style="padding:6px 0;color:#5c647a;font-size:12px;">⏱️ Durée</td><td style="padding:6px 0;color:#191c1e;font-weight:600;font-size:13px;">${opts.durationMinutes} minutes</td></tr>
        <tr><td style="padding:6px 0;color:#5c647a;font-size:12px;">💰 Montant payé</td><td style="padding:6px 0;color:#006e2f;font-weight:700;font-size:14px;">${fmtFcfa(opts.paidAmount)} FCFA</td></tr>
      </table>
    </div>
    <p style="margin:16px 0;color:#5c647a;font-size:13px;">Confirmez ou refusez cette séance depuis votre espace mentor.</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.mentorEmail,
    subject: `Nouvelle réservation — ${opts.studentName}`,
    html: layout(content, "Voir la demande", `${APP_URL}/formations/mentor/rendez-vous`),
  });
}

// ─── Student: booking request confirmed by mentor ─────────────────────────────
export async function sendMentorBookingConfirmedEmail(opts: {
  studentEmail: string;
  studentName: string;
  mentorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink?: string;
}) {
  const linkBlock = opts.meetingLink
    ? `<div style="background:#eef5ff;border-radius:12px;padding:14px;margin:16px 0;"><p style="margin:0 0 4px;color:#1e40af;font-size:12px;font-weight:700;">🎥 Lien de visioconférence</p><a href="${opts.meetingLink}" style="color:#2563eb;font-weight:600;font-size:13px;word-break:break-all;">${opts.meetingLink}</a></div>`
    : `<p style="margin:12px 0;color:#5c647a;font-size:13px;">Le mentor vous enverra le lien de visioconférence avant la séance.</p>`;

  const content = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;">Séance confirmée ✅</h2>
    <p style="margin:0 0 16px;color:#5c647a;">Bonjour <strong style="color:#191c1e;">${opts.studentName}</strong>,</p>
    <p style="margin:0 0 16px;">
      Bonne nouvelle ! <strong>${opts.mentorName}</strong> a confirmé votre séance de mentorat.
    </p>
    <div style="background:#f7f9fb;border-radius:12px;padding:16px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#5c647a;font-size:12px;width:120px;">📅 Date</td><td style="padding:6px 0;color:#191c1e;font-weight:600;font-size:13px;">${fmtDate(opts.scheduledAt)}</td></tr>
        <tr><td style="padding:6px 0;color:#5c647a;font-size:12px;">⏰ Heure</td><td style="padding:6px 0;color:#191c1e;font-weight:600;font-size:13px;">${fmtTime(opts.scheduledAt)}</td></tr>
        <tr><td style="padding:6px 0;color:#5c647a;font-size:12px;">⏱️ Durée</td><td style="padding:6px 0;color:#191c1e;font-weight:600;font-size:13px;">${opts.durationMinutes} min</td></tr>
      </table>
    </div>
    ${linkBlock}
    <p style="margin:12px 0;color:#5c647a;font-size:13px;">💡 Préparez vos questions à l'avance pour profiter au maximum de la séance.</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.studentEmail,
    subject: `Votre séance avec ${opts.mentorName} est confirmée`,
    html: layout(content, "Voir ma réservation", `${APP_URL}/formations/apprenant/dashboard`),
  });
}

// ─── Student: booking cancelled ───────────────────────────────────────────────
export async function sendMentorBookingCancelledEmail(opts: {
  studentEmail: string;
  studentName: string;
  mentorName: string;
  scheduledAt: Date;
}) {
  const content = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;">Séance annulée</h2>
    <p style="margin:0 0 16px;color:#5c647a;">Bonjour <strong style="color:#191c1e;">${opts.studentName}</strong>,</p>
    <p style="margin:0 0 16px;">
      ${opts.mentorName} a malheureusement dû annuler votre séance du <strong>${fmtDate(opts.scheduledAt)}</strong> à <strong>${fmtTime(opts.scheduledAt)}</strong>.
    </p>
    <div style="background:#fef3c7;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#92400e;font-size:13px;">💰 Votre paiement vous sera intégralement remboursé sous 3 à 5 jours ouvrés.</p>
    </div>
    <p style="margin:16px 0;color:#5c647a;font-size:13px;">Vous pouvez réserver une autre séance depuis l'annuaire des mentors.</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.studentEmail,
    subject: `Séance du ${fmtDate(opts.scheduledAt)} annulée`,
    html: layout(content, "Voir d'autres mentors", `${APP_URL}/formations/mentors`),
  });
}

// ─── Student: mentor shared the meeting link ──────────────────────────────────
export async function sendMentorMeetingLinkEmail(opts: {
  studentEmail: string;
  studentName: string;
  mentorName: string;
  scheduledAt: Date;
  meetingLink: string;
}) {
  const content = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;">Lien de séance disponible 🎥</h2>
    <p style="margin:0 0 16px;color:#5c647a;">Bonjour <strong style="color:#191c1e;">${opts.studentName}</strong>,</p>
    <p style="margin:0 0 16px;">
      <strong>${opts.mentorName}</strong> a partagé le lien pour votre séance du <strong>${fmtDate(opts.scheduledAt)}</strong> à <strong>${fmtTime(opts.scheduledAt)}</strong>.
    </p>
    <div style="background:#eef5ff;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 4px;color:#1e40af;font-size:12px;font-weight:700;">🎥 Lien de visioconférence</p>
      <a href="${opts.meetingLink}" style="color:#2563eb;font-weight:600;font-size:13px;word-break:break-all;">${opts.meetingLink}</a>
    </div>
    <p style="margin:12px 0;color:#5c647a;font-size:13px;">💡 Pensez à tester votre caméra et votre microphone avant la séance.</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.studentEmail,
    subject: `Lien de séance avec ${opts.mentorName}`,
    html: layout(content, "Rejoindre la séance", opts.meetingLink),
  });
}

// ─── Student: session completed — invite to review ────────────────────────────
export async function sendMentorSessionCompletedEmail(opts: {
  studentEmail: string;
  studentName: string;
  mentorName: string;
  bookingId: string;
}) {
  const content = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;">Merci d'avoir participé ! 🙌</h2>
    <p style="margin:0 0 16px;color:#5c647a;">Bonjour <strong style="color:#191c1e;">${opts.studentName}</strong>,</p>
    <p style="margin:0 0 16px;">
      Votre séance de mentorat avec <strong>${opts.mentorName}</strong> est terminée. Nous espérons qu'elle vous a été utile !
    </p>
    <p style="margin:16px 0;">⭐ Votre avis compte beaucoup — il aide d'autres apprenants à choisir le bon mentor.</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.studentEmail,
    subject: `Partagez votre avis sur votre séance avec ${opts.mentorName}`,
    html: layout(content, "Laisser un avis", `${APP_URL}/formations/apprenant/dashboard`),
  });
}
