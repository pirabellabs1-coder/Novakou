/**
 * FreelanceHigh — Email Templates : KYC (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  successBoxDark, errorBoxDark, infoDark,
} from "@/lib/email/layout-dark";

// ── kyc.submitted → email utilisateur ──
export async function sendKycSubmittedEmail(email: string, name: string, level: number) {
  const html = emailLayoutDark(`
    ${headingDark("Demande KYC soumise")}
    ${textDark(`Bonjour ${name}, votre demande de verification de niveau ${level} a ete soumise avec succes.`)}
    ${infoDark(`Niveau demande : <strong style="color:#F1F5F9;">${level}</strong> — Notre equipe examinera votre dossier dans les plus brefs delais.`)}
    ${mutedDark("Vous recevrez un email des que votre verification sera traitee.")}
  `);
  return sendEmail({ to: email, subject: `Verification KYC niveau ${level} soumise`, html });
}

// ── kyc.approved → email utilisateur ──
export async function sendKycApprovedDarkEmail(email: string, name: string, level: number) {
  const html = emailLayoutDark(`
    ${headingDark("Verification KYC approuvee !")}
    ${textDark(`Bonjour ${name}, votre verification de niveau ${level} a ete approuvee avec succes.`)}
    ${successBoxDark(`Niveau ${level} verifie`)}
    ${textDark("De nouvelles fonctionnalites sont maintenant disponibles sur votre compte.")}
    ${buttonDark("Voir mon profil", `${getAppUrl()}/dashboard/profil`, "green")}
  `);
  return sendEmail({ to: email, subject: `Verification KYC niveau ${level} approuvee`, html });
}

// ── kyc.rejected → email utilisateur ──
export async function sendKycRejectedDarkEmail(email: string, name: string, level: number, reason: string) {
  const html = emailLayoutDark(`
    ${headingDark("Verification KYC refusee")}
    ${textDark(`Bonjour ${name}, votre demande de verification de niveau ${level} n'a pas pu etre approuvee.`)}
    ${errorBoxDark("Motif du refus", reason)}
    ${textDark("Vous pouvez soumettre une nouvelle demande apres avoir corrige les elements mentionnes.")}
    ${buttonDark("Soumettre a nouveau", `${getAppUrl()}/dashboard/kyc`, "amber")}
  `);
  return sendEmail({ to: email, subject: "Verification KYC refusee — FreelanceHigh", html });
}
