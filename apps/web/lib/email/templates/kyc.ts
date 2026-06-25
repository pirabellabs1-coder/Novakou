/**
 * Novakou — Email Templates : KYC (dark mode)
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
    ${textDark(`Bonjour ${name}, votre demande de vérification de niveau ${level} a été soumise avec succès.`)}
    ${infoDark(`Niveau demandé&nbsp;: <strong style="color:#F1F5F9;">${level}</strong> — Notre équipe examinera votre dossier dans les plus brefs délais.`)}
    ${mutedDark("Vous recevrez un e-mail dès que votre vérification sera traitée.")}
  `);
  return sendEmail({ to: email, subject: `Vérification KYC niveau ${level} soumise`, html });
}

// ── kyc.approved → email utilisateur ──
export async function sendKycApprovedDarkEmail(email: string, name: string, level: number) {
  const html = emailLayoutDark(`
    ${headingDark("Vérification KYC approuvée&nbsp;!")}
    ${textDark(`Bonjour ${name}, votre vérification de niveau ${level} a été approuvée avec succès.`)}
    ${successBoxDark(`Niveau ${level} vérifié`)}
    ${textDark("De nouvelles fonctionnalités sont maintenant disponibles sur votre compte.")}
    ${buttonDark("Voir mon profil", `${getAppUrl()}/vendeur/profil`, "green")}
  `);
  return sendEmail({ to: email, subject: `Vérification KYC niveau ${level} approuvée`, html });
}

// ── kyc.rejected → email utilisateur ──
export async function sendKycRejectedDarkEmail(email: string, name: string, level: number, reason: string) {
  const html = emailLayoutDark(`
    ${headingDark("Vérification KYC refusée")}
    ${textDark(`Bonjour ${name}, votre demande de vérification de niveau ${level} n'a pas pu être approuvée.`)}
    ${errorBoxDark("Motif du refus", reason)}
    ${textDark("Vous pouvez soumettre une nouvelle demande après avoir corrigé les éléments mentionnés.")}
    ${buttonDark("Soumettre à nouveau", `${getAppUrl()}/kyc`, "amber")}
  `);
  return sendEmail({ to: email, subject: "Vérification KYC refusée — Novakou", html });
}
