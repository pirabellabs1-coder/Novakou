/**
 * Novakou — Email Templates : Admin alerts (dark mode)
 * Ces emails sont envoyes aux admins lors d'evenements importants.
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark,
  tableDark, tableRowDark, infoDark,
} from "@/lib/email/layout-dark";

// ── Service approuve → email freelance/agence (dark) ──
export async function sendServiceApprovedDarkEmail(email: string, name: string, serviceTitle: string) {
  const html = emailLayoutDark(`
    ${headingDark("Service publie !")}
    ${textDark(`Bonjour ${name}, votre service <strong style="color:#F1F5F9;">"${serviceTitle}"</strong> a ete approuve par notre equipe et est maintenant visible sur la marketplace.`)}
    ${buttonDark("Voir mon service", `${getAppUrl()}/dashboard/services`, "green")}
    ${textDark(`<span style="color:#64748B;font-size:13px;">Pensez a partager votre service sur les reseaux sociaux pour attirer vos premiers clients !</span>`)}
  `);
  return sendEmail({ to: email, subject: `Service publie — ${serviceTitle}`, html });
}

// ── Service refuse → email freelance/agence (dark) ──
export async function sendServiceRejectedDarkEmail(email: string, name: string, serviceTitle: string, reason: string) {
  const html = emailLayoutDark(`
    ${headingDark("Service non approuve")}
    ${textDark(`Bonjour ${name}, votre service <strong style="color:#F1F5F9;">"${serviceTitle}"</strong> n'a pas pu etre publie.`)}
    <div style="background:#1C1917;border:1px solid #7F1D1D;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#EF4444;font-weight:600;margin:0 0 4px;">Motif :</p>
      <p style="color:#FCA5A5;margin:0;">${reason}</p>
    </div>
    ${buttonDark("Modifier mon service", `${getAppUrl()}/dashboard/services`, "amber")}
  `);
  return sendEmail({ to: email, subject: `Service non approuve — ${serviceTitle}`, html });
}
