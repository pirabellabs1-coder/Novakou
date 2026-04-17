/**
 * Novakou — Templates transactionnels branded
 *
 * 8 templates clés pour le flow utilisateur :
 *   1. Email OTP (vérification)
 *   2. Bienvenue (après vérification)
 *   3. Réinitialisation mot de passe
 *   4. Achat confirmé (acheteur)
 *   5. Vente reçue (vendeur)
 *   6. Rapport hebdomadaire (vendeur)
 *   7. Remboursement confirmé
 *   8. Retrait confirmé
 */
import { sendEmail, getAppUrl } from "@/lib/email";
import { emailLayoutFH, heading, paragraph, greeting, button, otpCode, infoBox, orderSummary, statRow, divider, footerNote, BRAND } from "./layout-fh";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

// ═══════════════════════════════════════════════════════════════════════════
// 1. OTP VERIFICATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════
export async function sendOtpEmailFH(to: string, name: string, code: string) {
  const html = emailLayoutFH(`
    ${heading("Confirmez votre adresse email")}
    ${greeting(name)}
    ${paragraph("Bienvenue sur Novakou ! Pour finaliser votre inscription et sécuriser votre compte, entrez le code ci-dessous :")}
    ${otpCode(code)}
    ${infoBox("🔒 Sécurité", "Ne partagez jamais ce code. L'équipe Novakou ne vous demandera jamais votre code par téléphone ou email.", "amber")}
    ${paragraph("Ce code expire dans <strong>10 minutes</strong>. Si vous n'avez pas demandé cette inscription, ignorez simplement cet email.")}
    ${footerNote("Cet email est généré automatiquement. Merci de ne pas y répondre.")}
  `, `Votre code : ${code}`);

  return sendEmail({
    to,
    subject: `${code} — Votre code de vérification Novakou`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. WELCOME EMAIL
// ═══════════════════════════════════════════════════════════════════════════
export async function sendWelcomeEmailFH(to: string, name: string, role: "vendeur" | "apprenant" = "apprenant") {
  const isVendor = role === "vendeur";
  const dashboardUrl = `${getAppUrl()}${isVendor ? "/vendeur" : "/apprenant"}/dashboard`;

  const content = isVendor
    ? `
      ${heading("Bienvenue dans l'aventure créateur 🚀")}
      ${greeting(name)}
      ${paragraph("Votre compte vendeur Novakou est actif. Vous allez pouvoir commencer à vendre vos formations, e-books, templates et coaching dès maintenant.")}
      ${infoBox("🎯 Pour bien démarrer", "<strong>1.</strong> Complétez votre profil public<br/><strong>2.</strong> Créez votre première formation ou produit<br/><strong>3.</strong> Configurez votre moyen de paiement pour recevoir vos gains", "green")}
      ${button("Accéder à mon espace vendeur", dashboardUrl)}
      ${divider()}
      ${paragraph("<strong>Vos avantages :</strong><br/>• Commission ultra-compétitive dès 8%<br/>• Paiements Mobile Money (Orange, Wave, MTN)<br/>• Outils marketing intégrés (funnels, emails, analytics)<br/>• Support vendeur réactif en &lt; 24h")}
      ${footerNote("Besoin d'aide pour démarrer ? Répondez directement à cet email.")}
    `
    : `
      ${heading("Bienvenue sur Novakou 🎓")}
      ${greeting(name)}
      ${paragraph("Votre compte est activé ! Vous avez maintenant accès à des centaines de formations, e-books et produits digitaux créés par les meilleurs créateurs d'Afrique francophone.")}
      ${infoBox("✨ Premières étapes", "<strong>1.</strong> Explorez le catalogue<br/><strong>2.</strong> Ajoutez vos achats à votre bibliothèque<br/><strong>3.</strong> Apprenez à votre rythme, depuis n'importe où", "green")}
      ${button("Explorer le catalogue", `${getAppUrl()}/explorer`)}
      ${divider()}
      ${paragraph("<strong>Votre espace apprenant vous offre :</strong><br/>• Accès à vie à tous vos achats<br/>• Téléchargement offline des PDFs<br/>• Certificats de complétion<br/>• Communauté privée des apprenants")}
      ${footerNote("Des questions ? Notre équipe support est là pour vous.")}
    `;

  return sendEmail({
    to,
    subject: isVendor ? "🚀 Bienvenue vendeur — votre boutique est prête" : "🎓 Bienvenue sur Novakou",
    html: emailLayoutFH(content, isVendor ? "Votre boutique est prête, créez votre premier produit" : "Explorez des centaines de formations et produits"),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PASSWORD RESET
// ═══════════════════════════════════════════════════════════════════════════
export async function sendPasswordResetFH(to: string, name: string, resetToken: string) {
  const resetUrl = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${resetToken}`;
  const html = emailLayoutFH(`
    ${heading("Réinitialisation du mot de passe")}
    ${greeting(name)}
    ${paragraph("Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe sécurisé :")}
    ${button("Réinitialiser mon mot de passe", resetUrl)}
    ${infoBox("⏱ Durée de validité", "Ce lien expire dans <strong>1 heure</strong>. Après, il sera invalide et vous devrez faire une nouvelle demande.", "amber")}
    ${paragraph(`Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/><a href="${resetUrl}" style="color:${BRAND.primary};word-break:break-all;">${resetUrl}</a>`)}
    ${divider()}
    ${infoBox("🔒 Ce n'était pas vous ?", "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste valide.", "red")}
  `, "Réinitialisez votre mot de passe Novakou");

  return sendEmail({
    to,
    subject: "🔑 Réinitialiser votre mot de passe Novakou",
    html,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. PURCHASE CONFIRMATION (BUYER)
// ═══════════════════════════════════════════════════════════════════════════
export async function sendPurchaseConfirmationFH(to: string, name: string, data: {
  orderId: string;
  items: Array<{ title: string; kind: "formation" | "product"; price: number }>;
  total: number;
  paymentMethod: string;
}) {
  const firstItem = data.items[0];
  const itemsList = data.items.map((it) => ({
    title: it.title,
    amount: it.price,
    sub: it.kind === "formation" ? "Formation · Accès à vie" : "Produit digital · Téléchargement illimité",
  }));
  const accessUrl = `${getAppUrl()}/apprenant/${firstItem.kind === "formation" ? "mes-formations" : "produits"}`;

  const html = emailLayoutFH(`
    ${heading("Merci pour votre achat ! 🎉")}
    ${greeting(name)}
    ${paragraph(`Votre commande <strong>#${data.orderId}</strong> est confirmée. Vous avez dès maintenant accès à votre contenu :`)}
    ${orderSummary(itemsList, { label: `Total (${data.paymentMethod})`, amount: data.total })}
    ${button("Accéder à mes achats", accessUrl)}
    ${infoBox("🎯 Comment accéder", "Connectez-vous à votre espace et retrouvez votre achat dans la section \"Mes formations\" ou \"Mes produits\". L'accès est illimité dans le temps.", "green")}
    ${divider()}
    ${paragraph("<strong>Une facture PDF</strong> sera disponible dans votre espace sous 24h. Pour toute question concernant votre achat, contactez directement le créateur depuis votre espace ou notre support.")}
    ${footerNote("Besoin d'aide ? Écrivez à support@novakou.com")}
  `, `Achat confirmé : ${firstItem.title}`);

  return sendEmail({
    to,
    subject: `✅ Achat confirmé — ${firstItem.title}`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. SALE NOTIFICATION (SELLER) — celebratory tone
// ═══════════════════════════════════════════════════════════════════════════
export async function sendSaleNotificationFH(to: string, name: string, data: {
  productTitle: string;
  kind: "formation" | "product";
  grossAmount: number;
  commissionRate: number;
  netAmount: number;
  buyerName?: string;
  totalSales: number;
  monthEarnings: number;
}) {
  const dashboardUrl = `${getAppUrl()}/vendeur/transactions`;
  const isMilestone = data.totalSales === 1 || data.totalSales === 10 || data.totalSales === 50 || data.totalSales === 100 || data.totalSales % 100 === 0;
  const milestoneText = data.totalSales === 1
    ? "🎊 C'est votre <strong>toute première vente</strong> sur Novakou ! Un moment à célébrer."
    : data.totalSales === 10 ? "🎊 Vous atteignez <strong>10 ventes</strong> ! Vous prenez votre rythme."
    : data.totalSales === 50 ? "🎊 <strong>50 ventes</strong> ! Vous êtes officiellement dans les vendeurs sérieux."
    : data.totalSales === 100 ? "🏆 <strong>100 ventes</strong> ! Badge Top Vendeur débloqué !"
    : data.totalSales % 100 === 0 ? `🏆 <strong>${data.totalSales} ventes</strong> — un palier remarquable !` : "";

  const html = emailLayoutFH(`
    <!-- Confetti banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td align="center" style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});border-radius:16px;padding:40px 24px;text-align:center;">
          <p style="font-size:48px;margin:0 0 8px;line-height:1;">🎉</p>
          <p style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 4px;letter-spacing:-0.3px;">WAHOU !</p>
          <p style="color:rgba(255,255,255,0.95);font-size:16px;font-weight:600;margin:0;">Vous venez de faire une vente</p>
        </td>
      </tr>
    </table>

    ${greeting(name)}
    ${paragraph(`${data.buyerName ? `<strong>${data.buyerName}</strong> vient` : "Quelqu'un vient"} d'acheter votre ${data.kind === "formation" ? "formation" : "produit"} <strong>« ${data.productTitle} »</strong> — félicitations ! 🚀`)}

    <!-- Big gain card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:2px solid ${BRAND.accent};border-radius:20px;padding:32px 24px;text-align:center;">
      <tr><td align="center">
        <p style="color:${BRAND.primary};font-size:11px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">💵 Votre gain net</p>
        <p style="color:${BRAND.primary};font-size:56px;font-weight:800;margin:0;line-height:1;letter-spacing:-1px;">+${fmt(data.netAmount)}</p>
        <p style="color:${BRAND.primary};font-size:18px;font-weight:700;margin:4px 0 0;">FCFA</p>
        <p style="color:${BRAND.textMuted};font-size:12px;margin:16px 0 0;padding:8px 16px;background:rgba(255,255,255,0.7);border-radius:8px;display:inline-block;">Prix : ${fmt(data.grossAmount)} F · Commission ${data.commissionRate}% : -${fmt(data.grossAmount - data.netAmount)} F</p>
      </td></tr>
    </table>

    ${isMilestone ? infoBox("🏆 Palier atteint !", milestoneText, "amber") : ""}

    ${statRow([
      { label: "Total ventes", value: data.totalSales.toString(), trend: "up" },
      { label: "Gains ce mois", value: `${fmt(data.monthEarnings)} F`, trend: "up" },
    ])}

    ${button("Voir mes transactions", dashboardUrl)}

    ${divider()}

    <!-- Conseil / next step -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr><td style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;">
        <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 6px;">💡 Conseil du pro</p>
        <p style="color:${BRAND.text};font-size:14px;line-height:1.55;margin:0;">Envoyez un message de bienvenue personnalisé à ${data.buyerName ?? "votre acheteur"} depuis votre espace. <strong>70% des acheteurs satisfaits</strong> laissent un avis 5 étoiles quand le vendeur prend l'initiative du premier contact.</p>
      </td></tr>
    </table>

    ${infoBox("💳 Retrait disponible sous 48h", "Vos gains sont sécurisés pendant 48h (politique anti-fraude) puis disponibles au retrait en Mobile Money, Wave, Stripe ou virement.", "green")}

    ${footerNote(`Vous êtes sur une belle dynamique ${name} — continuez à créer, continuez à vendre 🚀`)}
  `, `WAHOU ! +${fmt(data.netAmount)} FCFA — ${data.productTitle}`);

  return sendEmail({
    to,
    subject: `🎉 WAHOU ! Nouvelle vente : +${fmt(data.netAmount)} FCFA`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. WEEKLY REPORT (SELLER)
// ═══════════════════════════════════════════════════════════════════════════
export async function sendWeeklyReportFH(to: string, name: string, data: {
  weekStart: string;
  weekEnd: string;
  sales: number;
  earnings: number;
  visits: number;
  conversions: number;
  topProduct?: { title: string; sales: number };
  vs: { salesPct: number; earningsPct: number };
}) {
  const dashboardUrl = `${getAppUrl()}/vendeur/statistiques`;
  const conversionRate = data.visits > 0 ? ((data.conversions / data.visits) * 100).toFixed(1) : "0.0";
  const trendSales = data.vs.salesPct > 0 ? "up" : data.vs.salesPct < 0 ? "down" : "neutral";
  const trendEarnings = data.vs.earningsPct > 0 ? "up" : data.vs.earningsPct < 0 ? "down" : "neutral";

  const html = emailLayoutFH(`
    ${heading("Votre rapport hebdomadaire 📊")}
    ${greeting(name)}
    ${paragraph(`Voici le récap de votre activité du <strong>${data.weekStart}</strong> au <strong>${data.weekEnd}</strong>.`)}

    ${statRow([
      { label: "Ventes", value: data.sales.toString(), trend: trendSales as "up" | "down" | "neutral" },
      { label: "Gains nets", value: `${fmt(data.earnings)} F`, trend: trendEarnings as "up" | "down" | "neutral" },
      { label: "Visites", value: fmt(data.visits) },
      { label: "Conversion", value: `${conversionRate}%` },
    ])}

    ${data.vs.salesPct !== 0 || data.vs.earningsPct !== 0 ? infoBox(
      data.vs.salesPct > 0 ? "📈 En progression" : data.vs.salesPct < 0 ? "📉 En baisse" : "→ Stable",
      `Par rapport à la semaine dernière :<br/>• Ventes : ${data.vs.salesPct > 0 ? "+" : ""}${data.vs.salesPct.toFixed(1)}%<br/>• Gains : ${data.vs.earningsPct > 0 ? "+" : ""}${data.vs.earningsPct.toFixed(1)}%`,
      data.vs.salesPct > 0 ? "green" : data.vs.salesPct < 0 ? "amber" : "blue"
    ) : ""}

    ${data.topProduct ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#fafbfd;border:1px solid ${BRAND.border};border-radius:12px;padding:20px;">
        <tr><td>
          <p style="color:${BRAND.textMuted};font-size:11px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">🏆 Top produit de la semaine</p>
          <p style="color:${BRAND.text};font-size:16px;font-weight:700;margin:0 0 4px;">${data.topProduct.title}</p>
          <p style="color:${BRAND.primary};font-size:14px;font-weight:600;margin:0;">${data.topProduct.sales} vente${data.topProduct.sales > 1 ? "s" : ""} cette semaine</p>
        </td></tr>
      </table>
    ` : ""}

    ${button("Voir les statistiques détaillées", dashboardUrl)}
    ${divider()}
    ${paragraph("<strong>💡 Conseil de la semaine :</strong> les vendeurs qui envoient un email à leur liste chaque semaine vendent 3x plus que les autres. Créez votre prochaine campagne depuis votre espace Marketing.")}
    ${footerNote("Ce rapport est envoyé automatiquement chaque lundi à 8h.")}
  `, `${data.sales} ventes · ${fmt(data.earnings)} FCFA de gains cette semaine`);

  return sendEmail({
    to,
    subject: `📊 Votre semaine : ${data.sales} ventes · ${fmt(data.earnings)} FCFA`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. REFUND CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════
export async function sendRefundConfirmationFH(to: string, name: string, data: {
  orderId: string;
  productTitle: string;
  amount: number;
  refundMethod: string;
  estimatedDays: number;
}) {
  const html = emailLayoutFH(`
    ${heading("Votre remboursement est en cours")}
    ${greeting(name)}
    ${paragraph(`Le remboursement de votre commande <strong>#${data.orderId}</strong> a été validé.`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:linear-gradient(135deg,#eff6ff 0%,#ffffff 100%);border:1px solid #93c5fd;border-radius:16px;padding:24px;">
      <tr><td>
        <p style="color:${BRAND.textMuted};font-size:12px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Montant remboursé</p>
        <p style="color:#1e3a8a;font-size:32px;font-weight:800;margin:0;">${fmt(data.amount)} FCFA</p>
        <p style="color:${BRAND.textMuted};font-size:13px;margin:12px 0 0;">Produit : ${data.productTitle}<br/>Méthode : ${data.refundMethod}</p>
      </td></tr>
    </table>

    ${infoBox("⏱ Délai de réception", `Votre remboursement sera visible sur votre ${data.refundMethod} dans <strong>${data.estimatedDays} jour${data.estimatedDays > 1 ? "s" : ""}</strong> ouvrés. Si vous ne le recevez pas passé ce délai, contactez-nous.`, "blue")}

    ${paragraph("L'accès au produit a été révoqué. Si vous changez d'avis, vous pouvez racheter ce produit à tout moment sur la plateforme.")}
    ${divider()}
    ${paragraph("Nous sommes désolés que ce produit ne vous ait pas convenu. Vos retours nous aident à améliorer la qualité de notre catalogue. Si vous souhaitez partager votre expérience, répondez à cet email.")}
    ${footerNote("L'équipe Novakou reste à votre disposition.")}
  `, `Remboursement ${fmt(data.amount)} FCFA en cours`);

  return sendEmail({
    to,
    subject: `✅ Remboursement confirmé — ${fmt(data.amount)} FCFA`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. WITHDRAWAL CONFIRMATION (SELLER)
// ═══════════════════════════════════════════════════════════════════════════
export async function sendWithdrawalConfirmationFH(to: string, name: string, data: {
  amount: number;
  method: string;
  destination: string;
  estimatedDays: number;
  reference: string;
  remainingBalance: number;
}) {
  const dashboardUrl = `${getAppUrl()}/vendeur/transactions`;
  const html = emailLayoutFH(`
    ${heading("Retrait en cours de traitement 💳")}
    ${greeting(name)}
    ${paragraph(`Votre demande de retrait a été validée et est en cours de traitement.`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:linear-gradient(135deg,#ecfdf5 0%,#ffffff 100%);border:1px solid #a7f3d0;border-radius:16px;padding:24px;">
      <tr><td>
        <p style="color:${BRAND.textMuted};font-size:12px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Montant du retrait</p>
        <p style="color:${BRAND.primary};font-size:36px;font-weight:800;margin:0;">${fmt(data.amount)} FCFA</p>
        <p style="color:${BRAND.textMuted};font-size:13px;margin:12px 0 0;">Vers : ${data.method} · ${data.destination}</p>
      </td></tr>
    </table>

    ${infoBox("⏱ Délai de versement", `Votre retrait arrivera dans <strong>${data.estimatedDays} jour${data.estimatedDays > 1 ? "s" : ""}</strong> ouvrés sur ${data.destination}. Vous recevrez un second email dès que le virement est confirmé.`, "green")}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;">
          <p style="color:${BRAND.textMuted};font-size:12px;margin:0 0 4px;">Référence retrait</p>
          <p style="color:${BRAND.text};font-size:14px;font-weight:600;margin:0;font-family:monospace;">${data.reference}</p>
        </td>
        <td style="padding:8px 0;text-align:right;">
          <p style="color:${BRAND.textMuted};font-size:12px;margin:0 0 4px;">Solde restant</p>
          <p style="color:${BRAND.text};font-size:14px;font-weight:600;margin:0;">${fmt(data.remainingBalance)} FCFA</p>
        </td>
      </tr>
    </table>

    ${button("Voir l'historique", dashboardUrl)}
    ${divider()}
    ${footerNote("En cas de retard ou de problème, contactez support@novakou.com avec la référence ci-dessus.")}
  `, `Retrait ${fmt(data.amount)} FCFA vers ${data.method}`);

  return sendEmail({
    to,
    subject: `💳 Retrait confirmé — ${fmt(data.amount)} FCFA`,
    html,
  });
}
