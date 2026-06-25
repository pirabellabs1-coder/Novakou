/**
 * Novakou — Email Templates : Avis (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark,
  tableDark, tableRowDark, infoDark,
} from "@/lib/email/layout-dark";

// ── review.received → email freelance ──
export async function sendReviewReceivedEmail(
  email: string, name: string,
  data: { serviceTitle: string; reviewerName: string; rating: number; comment: string }
) {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  const html = emailLayoutDark(`
    ${headingDark("Nouvel avis reçu")}
    ${textDark(`Bonjour ${name}, <strong style="color:#F1F5F9;">${data.reviewerName}</strong> a laissé un avis sur votre service <strong style="color:#F1F5F9;">«&nbsp;${data.serviceTitle}&nbsp;»</strong>.`)}
    ${tableDark(
      tableRowDark("Note", `<span style="color:#FBBF24;">${stars}</span> (${data.rating}/5)`)
    )}
    ${data.comment ? infoDark(`«&nbsp;${data.comment}&nbsp;»`, "#FBBF24") : ""}
    ${buttonDark("Voir et répondre", `${getAppUrl()}/vendeur/avis`)}
  `);
  return sendEmail({ to: email, subject: `Nouvel avis — ${data.serviceTitle}`, html });
}
