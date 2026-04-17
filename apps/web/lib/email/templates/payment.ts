/**
 * Novakou — Email Templates : Paiements & Retraits (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  amountDark, tableDark, tableRowDark, errorBoxDark, successBoxDark,
} from "@/lib/email/layout-dark";

// ── payment.success → email freelance ──
export async function sendPaymentSuccessEmail(
  email: string, name: string,
  data: { amount: number; serviceTitle: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Paiement recu !")}
    ${textDark(`Bonjour ${name}, un paiement a ete credite sur votre portefeuille Novakou.`)}
    ${amountDark(`${data.amount.toFixed(2)} EUR`, data.serviceTitle)}
    ${buttonDark("Voir mes finances", `${getAppUrl()}/dashboard/finances`, "green")}
  `);
  return sendEmail({ to: email, subject: `Paiement de ${data.amount.toFixed(2)} EUR recu`, html });
}

// ── payment.failed → email client ──
export async function sendPaymentFailedEmail(
  email: string, name: string,
  data: { amount: number; serviceTitle: string; reason?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Echec du paiement")}
    ${textDark(`Bonjour ${name}, votre paiement de <strong style="color:#F1F5F9;">${data.amount.toFixed(2)} EUR</strong> pour "${data.serviceTitle}" n'a pas abouti.`)}
    ${data.reason ? errorBoxDark("Motif", data.reason) : ""}
    ${textDark("Veuillez verifier votre methode de paiement et reessayer.")}
    ${buttonDark("Reessayer", `${getAppUrl()}/client/commandes`, "red")}
  `);
  return sendEmail({ to: email, subject: `Echec du paiement — ${data.serviceTitle}`, html });
}

// ── withdrawal.requested → email freelance ──
export async function sendWithdrawalRequestedEmail(
  email: string, name: string,
  data: { amount: number; method: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Demande de retrait enregistree")}
    ${textDark(`Bonjour ${name}, votre demande de retrait a ete prise en compte.`)}
    ${tableDark(
      tableRowDark("Montant", `${data.amount.toFixed(2)} EUR`, true) +
      tableRowDark("Methode", data.method)
    )}
    ${mutedDark("Le traitement prend generalement 1 a 3 jours ouvrables.")}
    ${buttonDark("Suivre mon retrait", `${getAppUrl()}/dashboard/finances`)}
  `);
  return sendEmail({ to: email, subject: `Demande de retrait — ${data.amount.toFixed(2)} EUR`, html });
}

// ── withdrawal.approved → email freelance ──
export async function sendWithdrawalApprovedEmail(
  email: string, name: string,
  data: { amount: number; method: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Retrait approuve !")}
    ${textDark(`Bonjour ${name}, votre retrait a ete approuve et est en cours de traitement.`)}
    ${successBoxDark(`${data.amount.toFixed(2)} EUR approuve`)}
    ${tableDark(tableRowDark("Methode", data.method))}
    ${mutedDark("Les fonds seront disponibles sous 1 a 3 jours ouvrables selon votre methode de retrait.")}
  `);
  return sendEmail({ to: email, subject: `Retrait approuve — ${data.amount.toFixed(2)} EUR`, html });
}

// ── withdrawal.rejected → email freelance ──
export async function sendWithdrawalRejectedEmail(
  email: string, name: string,
  data: { amount: number; reason?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Retrait refuse")}
    ${textDark(`Bonjour ${name}, votre demande de retrait de <strong style="color:#F1F5F9;">${data.amount.toFixed(2)} EUR</strong> n'a pas pu etre traitee.`)}
    ${data.reason ? errorBoxDark("Motif du refus", data.reason) : ""}
    ${textDark("Les fonds restent disponibles sur votre portefeuille.")}
    ${buttonDark("Contacter le support", `${getAppUrl()}/contact`, "red")}
  `);
  return sendEmail({ to: email, subject: "Retrait refuse — Novakou", html });
}
