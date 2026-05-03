/**
 * Novakou — Email Templates : Paiements & Retraits (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import { escapeHtml } from "@/lib/email/escape";
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
    ${headingDark("Paiement reçu !")}
    ${textDark(`Bonjour ${escapeHtml(name)}, un paiement a été crédité sur votre portefeuille Novakou.`)}
    ${amountDark(`${data.amount.toFixed(2)} EUR`, escapeHtml(data.serviceTitle))}
    ${buttonDark("Voir mes finances", `${getAppUrl()}/vendeur/finances`, "green")}
  `);
  return sendEmail({ to: email, subject: `Paiement de ${data.amount.toFixed(2)} EUR reçu`, html });
}

// ── payment.failed → email client ──
export async function sendPaymentFailedEmail(
  email: string, name: string,
  data: { amount: number; serviceTitle: string; reason?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Échec du paiement")}
    ${textDark(`Bonjour ${escapeHtml(name)}, votre paiement de <strong style="color:#F1F5F9;">${data.amount.toFixed(2)} EUR</strong> pour "${escapeHtml(data.serviceTitle)}" n'a pas abouti.`)}
    ${data.reason ? errorBoxDark("Motif", escapeHtml(data.reason)) : ""}
    ${textDark("Veuillez vérifier votre méthode de paiement et réessayer.")}
    ${buttonDark("Réessayer", `${getAppUrl()}/apprenant/commandes`, "red")}
  `);
  return sendEmail({ to: email, subject: `Échec du paiement — ${data.serviceTitle}`, html });
}

// ── withdrawal.requested → email freelance ──
export async function sendWithdrawalRequestedEmail(
  email: string, name: string,
  data: { amount: number; method: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Demande de retrait enregistrée")}
    ${textDark(`Bonjour ${escapeHtml(name)}, votre demande de retrait a été prise en compte.`)}
    ${tableDark(
      tableRowDark("Montant", `${data.amount.toFixed(2)} EUR`, true) +
      tableRowDark("Méthode", escapeHtml(data.method))
    )}
    ${mutedDark("Le traitement prend généralement 1 à 3 jours ouvrables.")}
    ${buttonDark("Suivre mon retrait", `${getAppUrl()}/vendeur/finances`)}
  `);
  return sendEmail({ to: email, subject: `Demande de retrait — ${data.amount.toFixed(2)} EUR`, html });
}

// ── withdrawal.approved → email freelance ──
export async function sendWithdrawalApprovedEmail(
  email: string, name: string,
  data: { amount: number; method: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Retrait approuvé !")}
    ${textDark(`Bonjour ${escapeHtml(name)}, votre retrait a été approuvé et est en cours de traitement.`)}
    ${successBoxDark(`${data.amount.toFixed(2)} EUR approuvé`)}
    ${tableDark(tableRowDark("Méthode", escapeHtml(data.method)))}
    ${mutedDark("Les fonds seront disponibles sous 1 à 3 jours ouvrables selon votre méthode de retrait.")}
  `);
  return sendEmail({ to: email, subject: `Retrait approuvé — ${data.amount.toFixed(2)} EUR`, html });
}

// ── withdrawal.rejected → email freelance ──
export async function sendWithdrawalRejectedEmail(
  email: string, name: string,
  data: { amount: number; reason?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Retrait refusé")}
    ${textDark(`Bonjour ${escapeHtml(name)}, votre demande de retrait de <strong style="color:#F1F5F9;">${data.amount.toFixed(2)} EUR</strong> n'a pas pu être traitée.`)}
    ${data.reason ? errorBoxDark("Motif du refus", escapeHtml(data.reason)) : ""}
    ${textDark("Les fonds restent disponibles sur votre portefeuille.")}
    ${buttonDark("Contacter le support", `${getAppUrl()}/contact`, "red")}
  `);
  return sendEmail({ to: email, subject: "Retrait refusé — Novakou", html });
}
