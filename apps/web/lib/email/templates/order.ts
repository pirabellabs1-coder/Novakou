/**
 * Novakou — Email Templates : Commandes (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
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
    ${headingDark("Commande confirmee !")}
    ${textDark(`Bonjour ${name}, votre commande a ete enregistree avec succes.`)}
    ${tableDark(
      tableRowDark("Service", order.serviceTitle) +
      tableRowDark("Montant", `${order.amount.toFixed(2)} EUR`, true) +
      (order.deadline ? tableRowDark("Date limite", order.deadline) : "") +
      tableRowDark("Reference", order.orderId)
    )}
    ${buttonDark("Voir ma commande", `${getAppUrl()}/client/commandes`)}
    ${mutedDark("Les fonds sont securises en escrow jusqu'a la livraison et votre validation.")}
  `);
  return sendEmail({ to: email, subject: `Commande confirmee — ${order.serviceTitle}`, html });
}

// ── order.created → email freelance ──
export async function sendOrderCreatedFreelanceEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Nouvelle commande !")}
    ${textDark(`Bonjour ${name}, vous avez recu une nouvelle commande de <strong style="color:#F1F5F9;">${order.clientName}</strong>.`)}
    ${tableDark(
      tableRowDark("Service", order.serviceTitle) +
      tableRowDark("Montant", `${order.amount.toFixed(2)} EUR`, true) +
      tableRowDark("Client", order.clientName)
    )}
    ${buttonDark("Voir la commande", `${getAppUrl()}/dashboard/commandes`, "green")}
  `);
  return sendEmail({ to: email, subject: `Nouvelle commande — ${order.serviceTitle}`, html });
}

// ── order.delivered → email client ──
export async function sendOrderDeliveredEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Livraison effectuee !")}
    ${textDark(`Bonjour ${name}, <strong style="color:#F1F5F9;">${order.freelanceName}</strong> a livre votre commande pour le service <strong style="color:#F1F5F9;">"${order.serviceTitle}"</strong>.`)}
    ${textDark("Veuillez verifier la livraison et la valider ou demander une revision.")}
    ${buttonDark("Voir la livraison", `${getAppUrl()}/client/commandes`, "green")}
    ${mutedDark("Si vous ne validez pas dans les 3 jours, la livraison sera automatiquement acceptee.")}
  `);
  return sendEmail({ to: email, subject: `Livraison effectuee — ${order.serviceTitle}`, html });
}

// ── order.completed → email freelance ──
export async function sendOrderCompletedEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Commande terminee !")}
    ${textDark(`Bonjour ${name}, la commande pour <strong style="color:#F1F5F9;">"${order.serviceTitle}"</strong> a ete validee par le client.`)}
    ${amountDark(`${order.amount.toFixed(2)} EUR`, "Credite sur votre portefeuille")}
    ${buttonDark("Voir mes finances", `${getAppUrl()}/dashboard/finances`, "green")}
  `);
  return sendEmail({ to: email, subject: `Commande terminee — ${order.serviceTitle}`, html });
}

// ── order.cancelled → email (client ou freelance) ──
export async function sendOrderCancelledEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Commande annulee")}
    ${textDark(`Bonjour ${name}, la commande pour <strong style="color:#F1F5F9;">"${order.serviceTitle}"</strong> a ete annulee.`)}
    ${infoDark(`Reference : ${order.orderId}`, "#EF4444")}
    ${buttonDark("Voir les details", `${getAppUrl()}/dashboard/commandes`, "red")}
  `);
  return sendEmail({ to: email, subject: `Commande annulee — ${order.serviceTitle}`, html });
}

// ── order.revision_requested → email freelance ──
export async function sendOrderRevisionEmail(email: string, name: string, order: OrderData, message?: string) {
  const html = emailLayoutDark(`
    ${headingDark("Revision demandee")}
    ${textDark(`Bonjour ${name}, le client <strong style="color:#F1F5F9;">${order.clientName}</strong> a demande une revision pour <strong style="color:#F1F5F9;">"${order.serviceTitle}"</strong>.`)}
    ${message ? infoDark(`"${message}"`, "#F59E0B") : ""}
    ${buttonDark("Voir la commande", `${getAppUrl()}/dashboard/commandes`, "amber")}
  `);
  return sendEmail({ to: email, subject: `Revision demandee — ${order.serviceTitle}`, html });
}

// ── order.deadline_24h → email freelance ──
export async function sendOrderDeadline24hEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Delai dans 24h !")}
    ${textDark(`Bonjour ${name}, la commande <strong style="color:#F1F5F9;">"${order.serviceTitle}"</strong> doit etre livree dans les prochaines 24 heures.`)}
    ${tableDark(
      tableRowDark("Service", order.serviceTitle) +
      (order.deadline ? tableRowDark("Date limite", order.deadline) : "")
    )}
    ${buttonDark("Livrer maintenant", `${getAppUrl()}/dashboard/commandes`, "amber")}
  `);
  return sendEmail({ to: email, subject: `Rappel : delai dans 24h — ${order.serviceTitle}`, html });
}

// ── order.deadline_overdue → email freelance ──
export async function sendOrderOverdueEmail(email: string, name: string, order: OrderData) {
  const html = emailLayoutDark(`
    ${headingDark("Commande en retard")}
    ${textDark(`Bonjour ${name}, la commande <strong style="color:#F1F5F9;">"${order.serviceTitle}"</strong> a depasse la date limite de livraison.`)}
    ${errorBoxDark("Attention", "Un retard prolonge peut affecter votre taux de completion et votre classement.")}
    ${buttonDark("Livrer maintenant", `${getAppUrl()}/dashboard/commandes`, "red")}
  `);
  return sendEmail({ to: email, subject: `Commande en retard — ${order.serviceTitle}`, html });
}
