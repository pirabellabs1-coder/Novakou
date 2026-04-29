/**
 * Novakou — Email Templates : Produits numériques (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  tableDark, tableRowDark, amountDark,
} from "@/lib/email/layout-dark";

// XSS hardening — escape every interpolated user value before it lands in HTML.
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── product.purchased → email acheteur ──
export async function sendProductPurchasedEmail(
  email: string, name: string,
  data: { productTitle: string; amount: number; downloadUrl?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Achat confirmé !")}
    ${textDark(`Bonjour ${esc(name)}, votre achat du produit <strong style="color:#F1F5F9;">«&nbsp;${esc(data.productTitle)}&nbsp;»</strong> a été confirmé.`)}
    ${amountDark(`${data.amount.toFixed(2)} EUR`, esc(data.productTitle), false)}
    ${data.downloadUrl
      ? buttonDark("Télécharger", data.downloadUrl, "green")
      : buttonDark("Mes achats", `${getAppUrl()}/apprenant/mes-produits`, "green")}
    ${mutedDark("Le lien de téléchargement est disponible dans votre espace.")}
  `);
  return sendEmail({ to: email, subject: `Achat confirmé — ${data.productTitle}`, html });
}

// ── product.purchased → email vendeur ──
export async function sendProductSoldEmail(
  email: string, name: string,
  data: { productTitle: string; amount: number; buyerName: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Nouvelle vente !")}
    ${textDark(`Bonjour ${esc(name)}, <strong style="color:#F1F5F9;">${esc(data.buyerName)}</strong> a acheté votre produit <strong style="color:#F1F5F9;">«&nbsp;${esc(data.productTitle)}&nbsp;»</strong>.`)}
    ${amountDark(`${data.amount.toFixed(2)} EUR`, "Crédité sur votre portefeuille")}
    ${buttonDark("Voir mes ventes", `${getAppUrl()}/vendeur/transactions`, "green")}
  `);
  return sendEmail({ to: email, subject: `Vente — ${data.productTitle}`, html });
}

// ── product.downloaded → email vendeur (optionnel) ──
export async function sendProductDownloadedEmail(
  email: string, name: string,
  data: { productTitle: string; buyerName: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Produit téléchargé")}
    ${textDark(`Bonjour ${esc(name)}, <strong style="color:#F1F5F9;">${esc(data.buyerName)}</strong> a téléchargé votre produit <strong style="color:#F1F5F9;">«&nbsp;${esc(data.productTitle)}&nbsp;»</strong>.`)}
    ${tableDark(
      tableRowDark("Produit", esc(data.productTitle)) +
      tableRowDark("Acheteur", esc(data.buyerName))
    )}
  `);
  return sendEmail({ to: email, subject: `Téléchargement — ${data.productTitle}`, html });
}
