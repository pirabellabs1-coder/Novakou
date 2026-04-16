/**
 * FreelanceHigh — Email Templates : Produits numeriques (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  tableDark, tableRowDark, amountDark,
} from "@/lib/email/layout-dark";

// ── product.purchased → email acheteur ──
export async function sendProductPurchasedEmail(
  email: string, name: string,
  data: { productTitle: string; amount: number; downloadUrl?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Achat confirme !")}
    ${textDark(`Bonjour ${name}, votre achat du produit <strong style="color:#F1F5F9;">"${data.productTitle}"</strong> a ete confirme.`)}
    ${amountDark(`${data.amount.toFixed(2)} EUR`, data.productTitle, false)}
    ${data.downloadUrl
      ? buttonDark("Telecharger", data.downloadUrl, "green")
      : buttonDark("Mes achats", `${getAppUrl()}/client/achats`, "green")}
    ${mutedDark("Le lien de telechargement est disponible dans votre espace.")}
  `);
  return sendEmail({ to: email, subject: `Achat confirme — ${data.productTitle}`, html });
}

// ── product.purchased → email vendeur ──
export async function sendProductSoldEmail(
  email: string, name: string,
  data: { productTitle: string; amount: number; buyerName: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Nouvelle vente !")}
    ${textDark(`Bonjour ${name}, <strong style="color:#F1F5F9;">${data.buyerName}</strong> a achete votre produit <strong style="color:#F1F5F9;">"${data.productTitle}"</strong>.`)}
    ${amountDark(`${data.amount.toFixed(2)} EUR`, "Credite sur votre portefeuille")}
    ${buttonDark("Voir mes ventes", `${getAppUrl()}/dashboard/finances`, "green")}
  `);
  return sendEmail({ to: email, subject: `Vente — ${data.productTitle}`, html });
}

// ── product.downloaded → email vendeur (optionnel) ──
export async function sendProductDownloadedEmail(
  email: string, name: string,
  data: { productTitle: string; buyerName: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Produit telecharge")}
    ${textDark(`Bonjour ${name}, <strong style="color:#F1F5F9;">${data.buyerName}</strong> a telecharge votre produit <strong style="color:#F1F5F9;">"${data.productTitle}"</strong>.`)}
    ${tableDark(
      tableRowDark("Produit", data.productTitle) +
      tableRowDark("Acheteur", data.buyerName)
    )}
  `);
  return sendEmail({ to: email, subject: `Telechargement — ${data.productTitle}`, html });
}
