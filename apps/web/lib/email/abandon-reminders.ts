/**
 * Emails de relance pour abandons de panier / paiements echoues.
 *
 * Novakou envoie automatiquement 2 relances :
 *  - Email #1 : 30 minutes apres l'abandon
 *  - Email #2 : 24 heures apres l'abandon (si toujours pas converti)
 *
 * Les 2 emails sont chaleureux, ne culpabilisent pas, et proposent de l'aide.
 */

import { sendEmail, emailLayout, button, getAppUrl } from "./index";

type AbandonReminderParams = {
  to: string;
  visitorName: string | null;
  productTitle: string;
  productSlug: string | null;
  productKind: "formation" | "product";
  amount: number;
  currency: string;
  vendorName: string | null;
  attemptId: string;
};

function fmtAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " " + currency;
}

export async function sendReminder1(p: AbandonReminderParams) {
  const greeting = p.visitorName ? `Bonjour ${p.visitorName}` : "Bonjour";
  const productUrl = p.productSlug
    ? `${getAppUrl()}/${p.productKind === "formation" ? "formation" : "produit"}/${p.productSlug}`
    : getAppUrl();
  const vendorName = p.vendorName ?? "le vendeur";

  const content = `
    <h2 style="color:#191c1e;font-size:22px;font-weight:800;margin:0 0 16px;">Votre achat attend encore vous 🎁</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting},
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Nous avons remarque que vous etiez interesse par <strong>${p.productTitle}</strong> a ${fmtAmount(p.amount, p.currency)}, mais votre paiement n'a pas ete finalise.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Pas de souci ! Votre panier est toujours disponible. Cliquez simplement sur le bouton ci-dessous pour continuer la ou vous vous etiez arrete :
    </p>
    ${button("Finaliser mon achat", productUrl)}
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 8px;"><strong>Vous avez rencontre un probleme ?</strong></p>
      <p style="color:#6b7280;font-size:13px;margin:0;">Repondez simplement a cet email et ${vendorName} vous aidera a resoudre ce qui bloque. Les paiements Mobile Money (Orange, Wave, MTN) marchent parfaitement depuis le Senegal, la Cote d'Ivoire, le Benin et d'autres pays d'Afrique francophone.</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      Si vous n'etes plus interesse, vous pouvez ignorer cet email.
    </p>
  `;

  await sendEmail({
    to: p.to,
    subject: `Votre achat "${p.productTitle}" attend encore — Novakou`,
    html: emailLayout(content),
  });
}

export async function sendReminder2(p: AbandonReminderParams) {
  const greeting = p.visitorName ? `Bonjour ${p.visitorName}` : "Bonjour";
  const productUrl = p.productSlug
    ? `${getAppUrl()}/${p.productKind === "formation" ? "formation" : "produit"}/${p.productSlug}`
    : getAppUrl();
  const vendorName = p.vendorName ?? "notre equipe";

  const content = `
    <h2 style="color:#191c1e;font-size:22px;font-weight:800;margin:0 0 16px;">Encore interesse par ${p.productTitle} ? 💚</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting},
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Il y a 24 heures, vous avez essaye d'acheter <strong>${p.productTitle}</strong> sur Novakou mais le paiement n'a pas abouti.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Si vous hesitez, sachez qu'on peut vous aider :
    </p>
    <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 20px;">
      <li>💬 Besoin de plus d'infos ? Repondez a cet email.</li>
      <li>💳 Probleme de paiement ? On peut essayer un autre moyen (Orange Money, Wave, MTN, Carte).</li>
      <li>🤔 Toujours en reflexion ? On comprend, prenez votre temps.</li>
    </ul>
    ${button("Reprendre mon achat", productUrl)}
    <p style="color:#374151;font-size:14px;line-height:1.6;margin:24px 0 0;">
      ${vendorName} est disponible pour repondre a vos questions et vous aider a finaliser votre achat.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">
      C'est notre dernier rappel — nous ne vous ecrirons plus pour cet achat.
    </p>
  `;

  await sendEmail({
    to: p.to,
    subject: `Derniere chance pour "${p.productTitle}" 💚 Novakou`,
    html: emailLayout(content),
  });
}
