/**
 * FreelanceHigh — Email Templates : Offres personnalisees (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  tableDark, tableRowDark, successBoxDark, errorBoxDark,
} from "@/lib/email/layout-dark";

// ── offer.sent → email client ──
export async function sendOfferSentEmail(
  email: string, clientName: string,
  data: { freelanceName: string; title: string; amount: number; delay: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Nouvelle offre personnalisee")}
    ${textDark(`Bonjour ${clientName}, <strong style="color:#F1F5F9;">${data.freelanceName}</strong> vous a envoye une offre personnalisee.`)}
    ${tableDark(
      tableRowDark("Offre", data.title) +
      tableRowDark("Montant", `${data.amount.toFixed(2)} EUR`, true) +
      tableRowDark("Delai", data.delay)
    )}
    ${buttonDark("Voir l'offre", `${getAppUrl()}/client/offres`)}
    ${mutedDark("Vous pouvez accepter, refuser ou negocier cette offre.")}
  `);
  return sendEmail({ to: email, subject: `Offre de ${data.freelanceName} — ${data.title}`, html });
}

// ── offer.accepted → email freelance ──
export async function sendOfferAcceptedEmail(
  email: string, freelanceName: string,
  data: { clientName: string; title: string; amount: number }
) {
  const html = emailLayoutDark(`
    ${headingDark("Offre acceptee !")}
    ${textDark(`Bonjour ${freelanceName}, <strong style="color:#F1F5F9;">${data.clientName}</strong> a accepte votre offre.`)}
    ${successBoxDark(`${data.title} — ${data.amount.toFixed(2)} EUR`)}
    ${buttonDark("Voir la commande", `${getAppUrl()}/dashboard/commandes`, "green")}
  `);
  return sendEmail({ to: email, subject: `Offre acceptee — ${data.title}`, html });
}

// ── offer.rejected → email freelance ──
export async function sendOfferRejectedEmail(
  email: string, freelanceName: string,
  data: { clientName: string; title: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Offre declinee")}
    ${textDark(`Bonjour ${freelanceName}, <strong style="color:#F1F5F9;">${data.clientName}</strong> a decline votre offre <strong style="color:#F1F5F9;">"${data.title}"</strong>.`)}
    ${errorBoxDark("Statut", "Offre refusee par le client")}
    ${textDark("N'hesitez pas a proposer d'autres offres ou a explorer de nouveaux projets.")}
    ${buttonDark("Voir les projets", `${getAppUrl()}/dashboard/candidatures`)}
  `);
  return sendEmail({ to: email, subject: `Offre declinee — ${data.title}`, html });
}
