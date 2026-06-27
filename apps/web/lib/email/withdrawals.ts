// E-mails automatiques liés aux retraits (vendeurs, affiliés, commission plateforme).
import { sendEmail, emailLayout, getAppUrl } from "@/lib/email";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}
function firstName(name?: string | null): string {
  return (name || "").trim().split(/\s+/)[0] || "Bonjour";
}

/** Confirmation : la demande de retrait est enregistrée (statut en attente). */
export async function sendWithdrawalRequestedEmail(to: string, name: string | null | undefined, amount: number, methodLabel: string, dashboardPath = "/wallet") {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Demande de retrait enregistrée</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonjour ${firstName(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Nous avons bien reçu votre demande de retrait de <strong>${fmt(amount)}</strong> via <strong>${methodLabel}</strong>. Elle est en cours de traitement — vous recevrez un e-mail dès qu'elle sera versée.</p>
    <a href="${getAppUrl()}${dashboardPath}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Suivre mon retrait</a>
  `);
  await sendEmail({ to, subject: `Demande de retrait enregistrée — ${fmt(amount)}`, html }).catch(() => null);
}

/** Confirmation : le retrait a été versé (statut traité). */
export async function sendWithdrawalPaidEmail(to: string, name: string | null | undefined, amount: number, methodLabel: string, dashboardPath = "/wallet") {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Votre retrait a été versé ✅</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonjour ${firstName(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonne nouvelle : votre retrait de <strong>${fmt(amount)}</strong> via <strong>${methodLabel}</strong> vient d'être <strong>versé</strong>. Vérifiez votre compte — les fonds arrivent généralement en quelques minutes.</p>
    <a href="${getAppUrl()}${dashboardPath}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Voir mes finances</a>
  `);
  await sendEmail({ to, subject: `Retrait versé ✅ — ${fmt(amount)}`, html }).catch(() => null);
}

/** Information : le retrait a échoué / été refusé (les fonds restent disponibles). */
export async function sendWithdrawalFailedEmail(to: string, name: string | null | undefined, amount: number, reason: string, dashboardPath = "/wallet") {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Retrait non abouti</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonjour ${firstName(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Votre retrait de <strong>${fmt(amount)}</strong> n'a pas pu aboutir.</p>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 16px;">Motif : ${reason}</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Vos fonds restent disponibles. Vérifiez vos coordonnées et créez une nouvelle demande.</p>
    <a href="${getAppUrl()}${dashboardPath}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Réessayer</a>
  `);
  await sendEmail({ to, subject: `Retrait non abouti — ${fmt(amount)}`, html }).catch(() => null);
}
