/**
 * Novakou — Email Templates : Agence (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  successBoxDark, errorBoxDark, infoDark,
} from "@/lib/email/layout-dark";

// ── agency.member_invited → email membre ──
export async function sendMemberInvitedEmail(
  email: string, memberName: string,
  data: { agencyName: string; inviterName: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Invitation a rejoindre une agence")}
    ${textDark(`Bonjour ${memberName}, <strong style="color:#F1F5F9;">${data.inviterName}</strong> vous invite a rejoindre l'agence <strong style="color:#F1F5F9;">${data.agencyName}</strong> sur Novakou.`)}
    ${infoDark(`En rejoignant cette agence, vous pourrez collaborer sur des projets collectifs et recevoir des commandes sous la marque de l'agence.`)}
    ${buttonDark("Accepter l'invitation", `${getAppUrl()}/agence/equipe`)}
    ${mutedDark("Si vous n'attendiez pas cette invitation, vous pouvez l'ignorer.")}
  `);
  return sendEmail({ to: email, subject: `Invitation — ${data.agencyName}`, html });
}

// ── agency.member_removed → email membre ──
export async function sendMemberRemovedEmail(
  email: string, memberName: string,
  data: { agencyName: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Retrait de l'agence")}
    ${textDark(`Bonjour ${memberName}, vous avez ete retire de l'agence <strong style="color:#F1F5F9;">${data.agencyName}</strong>.`)}
    ${textDark("Votre profil individuel reste actif et vous pouvez continuer a proposer vos services en tant que freelance independant.")}
    ${buttonDark("Mon espace freelance", `${getAppUrl()}/dashboard`)}
  `);
  return sendEmail({ to: email, subject: `Retrait de l'agence ${data.agencyName}`, html });
}

// ── agency.service_approved → email agence ──
export async function sendAgencyServiceApprovedEmail(
  email: string, name: string,
  data: { serviceTitle: string; agencyName: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Service agence publie !")}
    ${textDark(`Bonjour ${name}, le service <strong style="color:#F1F5F9;">"${data.serviceTitle}"</strong> de l'agence ${data.agencyName} a ete approuve et est maintenant visible sur la marketplace.`)}
    ${successBoxDark("Service publie")}
    ${buttonDark("Voir le service", `${getAppUrl()}/agence/services`, "green")}
  `);
  return sendEmail({ to: email, subject: `Service publie — ${data.serviceTitle}`, html });
}

// ── agency.service_rejected → email agence ──
export async function sendAgencyServiceRejectedEmail(
  email: string, name: string,
  data: { serviceTitle: string; reason?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Service agence non approuve")}
    ${textDark(`Bonjour ${name}, le service <strong style="color:#F1F5F9;">"${data.serviceTitle}"</strong> n'a pas pu etre publie.`)}
    ${data.reason ? errorBoxDark("Motif", data.reason) : ""}
    ${buttonDark("Modifier le service", `${getAppUrl()}/agence/services`, "amber")}
  `);
  return sendEmail({ to: email, subject: `Service non approuve — ${data.serviceTitle}`, html });
}
