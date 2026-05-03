/**
 * Novakou — Email Templates : Commandes (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import { escapeHtml } from "@/lib/email/escape";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  tableDark, tableRowDark, amountDark, infoDark, errorBoxDark,
} from "@/lib/email/layout-dark";

interface OrderData {
  orderId: string;
  serviceTitle: string;
  amount: number;
  clientName: string;
  freelanceName: string;
  deadline?: string;
}

// ── order.created → email client ──
export async function sendOrderCreatedClientEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Commande confirmée !")}
    ${textDark(`Bonjour ${escapeHtml(name)}, votre commande a été enregistrée avec succès.`)}
    ${tableDark(
      tableRowDark("Service", escapeHtml(order.serviceTitle)) +
      tableRowDark("Montant", `${order.amount.toFixed(2)} EUR`, true) +
      (order.deadline ? tableRowDark("Date limite", escapeHtml(order.deadline)) : "") +
      tableRowDark("Référence", escapeHtml(order.orderId))
    )}
    ${buttonDark("Voir ma commande", `${getAppUrl()}/apprenant/commandes`)}
    ${mutedDark("Les fonds sont sécurisés en escrow jusqu'à la livraison et votre validation.")}
  `);
  return sendEmail({ to: email, subject: `Commande confirmée — ${order.serviceTitle}`, html });
}

// ── order.created → email freelance ──
export async function sendOrderCreatedFreelanceEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Nouvelle commande !")}
    ${textDark(`Bonjour ${escapeHtml(name)}, vous avez reçu une nouvelle commande de <strong style="color:#F1F5F9;">${escapeHtml(order.clientName)}</strong>.`)}
    ${tableDark(
      tableRowDark("Service", escapeHtml(order.serviceTitle)) +
      tableRowDark("Montant", `${order.amount.toFixed(2)} EUR`, true) +
      tableRowDark("Client", escapeHtml(order.clientName))
    )}
    ${buttonDark("Voir la commande", `${getAppUrl()}/vendeur/commandes`, "green")}
  `);
  return sendEmail({ to: email, subject: `Nouvelle commande — ${order.serviceTitle}`, html });
}

// ── order.delivered → email client ──
export async function sendOrderDeliveredEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Livraison effectuée !")}
    ${textDark(`Bonjour ${escapeHtml(name)}, <strong style="color:#F1F5F9;">${escapeHtml(order.freelanceName)}</strong> a livré votre commande pour le service <strong style="color:#F1F5F9;">"${escapeHtml(order.serviceTitle)}"</strong>.`)}
    ${textDark("Veuillez vérifier la livraison et la valider ou demander une révision.")}
    ${buttonDark("Voir la livraison", `${getAppUrl()}/apprenant/commandes`, "green")}
    ${mutedDark("Si vous ne validez pas dans les 3 jours, la livraison sera automatiquement acceptée.")}
  `);
  return sendEmail({ to: email, subject: `Livraison effectuée — ${order.serviceTitle}`, html });
}

// ── order.completed → email freelance ──
export async function sendOrderCompletedEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Commande terminée !")}
    ${textDark(`Bonjour ${escapeHtml(name)}, la commande pour <strong style="color:#F1F5F9;">"${escapeHtml(order.serviceTitle)}"</strong> a été validée par le client.`)}
    ${amountDark(`${order.amount.toFixed(2)} EUR`, "Crédité sur votre portefeuille")}
    ${buttonDark("Voir mes finances", `${getAppUrl()}/vendeur/finances`, "green")}
  `);
  return sendEmail({ to: email, subject: `Commande terminée — ${order.serviceTitle}`, html });
}

// ── order.cancelled → email (client ou freelance) ──
export async function sendOrderCancelledEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Commande annulée")}
    ${textDark(`Bonjour ${escapeHtml(name)}, la commande pour <strong style="color:#F1F5F9;">"${escapeHtml(order.serviceTitle)}"</strong> a été annulée.`)}
    ${infoDark(`Référence : ${escapeHtml(order.orderId)}`, "#EF4444")}
    ${buttonDark("Voir les détails", `${getAppUrl()}/vendeur/commandes`, "red")}
  `);
  return sendEmail({ to: email, subject: `Commande annulée — ${order.serviceTitle}`, html });
}

// ── order.revision_requested → email freelance ──
export async function sendOrderRevisionEmail(email: string, name: string, order: OrderData, message?: string) {
  const html = emailLayoutDark(`
    ${headingDark("Révision demandée")}
    ${textDark(`Bonjour ${escapeHtml(name)}, le client <strong style="color:#F1F5F9;">${escapeHtml(order.clientName)}</strong> a demandé une révision pour <strong style="color:#F1F5F9;">"${escapeHtml(order.serviceTitle)}"</strong>.`)}
    ${message ? infoDark(`"${escapeHtml(message)}"`, "#F59E0B") : ""}
    ${buttonDark("Voir la commande", `${getAppUrl()}/vendeur/commandes`, "amber")}
  `);
  return sendEmail({ to: email, subject: `Révision demandée — ${order.serviceTitle}`, html });
}

// ── order.deadline_24h → email freelance ──
export async function sendOrderDeadline24hEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Délai dans 24h !")}
    ${textDark(`Bonjour ${escapeHtml(name)}, la commande <strong style="color:#F1F5F9;">"${escapeHtml(order.serviceTitle)}"</strong> doit être livrée dans les prochaines 24 heures.`)}
    ${tableDark(
      tableRowDark("Service", escapeHtml(order.serviceTitle)) +
      (order.deadline ? tableRowDark("Date limite", escapeHtml(order.deadline)) : "")
    )}
    ${buttonDark("Livrer maintenant", `${getAppUrl()}/vendeur/commandes`, "amber")}
  `);
  return sendEmail({ to: email, subject: `Rappel : délai dans 24h — ${order.serviceTitle}`, html });
}

// ── order.deadline_overdue → email freelance ──
export async function sendOrderOverdueEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Commande en retard")}
    ${textDark(`Bonjour ${escapeHtml(name)}, la commande <strong style="color:#F1F5F9;">"${escapeHtml(order.serviceTitle)}"</strong> a dépassé la date limite de livraison.`)}
    ${errorBoxDark("Attention", "Un retard prolongé peut affecter votre taux de complétion et votre classement.")}
    ${buttonDark("Livrer maintenant", `${getAppUrl()}/vendeur/commandes`, "red")}
  `);
  return sendEmail({ to: email, subject: `Commande en retard — ${order.serviceTitle}`, html });
}
