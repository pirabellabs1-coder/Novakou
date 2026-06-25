/**
 * E-mails de relance pour abandons de panier / paiements échoués.
 *
 * Novakou envoie automatiquement 2 relances :
 *  - E-mail #1 : 20 minutes après l'abandon
 *  - E-mail #2 : 1 heure après l'abandon (si toujours pas converti)
 *
 * Les 2 e-mails sont chaleureux, ne culpabilisent pas, et proposent de l'aide.
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
    <h2 style="color:#191c1e;font-size:22px;font-weight:800;margin:0 0 16px;">Votre achat vous attend encore&nbsp;🎁</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting},
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Nous avons remarqué que vous étiez intéressé par <strong>${p.productTitle}</strong> à ${fmtAmount(p.amount, p.currency)}, mais votre paiement n'a pas été finalisé.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Pas de souci&nbsp;! Votre panier est toujours disponible. Cliquez simplement sur le bouton ci-dessous pour continuer là où vous vous étiez arrêté&nbsp;:
    </p>
    ${button("Finaliser mon achat", productUrl)}
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 8px;"><strong>Vous avez rencontré un problème&nbsp;?</strong></p>
      <p style="color:#6b7280;font-size:13px;margin:0;">Répondez simplement à cet e-mail et ${vendorName} vous aidera à résoudre ce qui bloque. Les paiements Mobile Money (Orange, Wave, MTN) marchent parfaitement depuis le Sénégal, la Côte d'Ivoire, le Bénin et d'autres pays d'Afrique francophone.</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      Si vous n'êtes plus intéressé, vous pouvez ignorer cet e-mail.
    </p>
  `;

  await sendEmail({
    to: p.to,
    subject: `Votre achat « ${p.productTitle} » vous attend encore — Novakou`,
    html: emailLayout(content),
  });
}

export async function sendReminder2(p: AbandonReminderParams) {
  const greeting = p.visitorName ? `Bonjour ${p.visitorName}` : "Bonjour";
  const productUrl = p.productSlug
    ? `${getAppUrl()}/${p.productKind === "formation" ? "formation" : "produit"}/${p.productSlug}`
    : getAppUrl();
  const vendorName = p.vendorName ?? "notre équipe";

  const content = `
    <h2 style="color:#191c1e;font-size:22px;font-weight:800;margin:0 0 16px;">Encore intéressé par ${p.productTitle}&nbsp;? 💚</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting},
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Il y a un moment, vous avez essayé d'acheter <strong>${p.productTitle}</strong> sur Novakou mais le paiement n'a pas abouti.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Si vous hésitez, sachez qu'on peut vous aider&nbsp;:
    </p>
    <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 20px;">
      <li>💬 Besoin de plus d'infos&nbsp;? Répondez à cet e-mail.</li>
      <li>💳 Problème de paiement&nbsp;? On peut essayer un autre moyen (Orange Money, Wave, MTN, carte).</li>
      <li>🤔 Toujours en réflexion&nbsp;? On comprend, prenez votre temps.</li>
    </ul>
    ${button("Reprendre mon achat", productUrl)}
    <p style="color:#374151;font-size:14px;line-height:1.6;margin:24px 0 0;">
      ${vendorName} est disponible pour répondre à vos questions et vous aider à finaliser votre achat.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">
      C'est notre dernier rappel — nous ne vous écrirons plus pour cet achat.
    </p>
  `;

  await sendEmail({
    to: p.to,
    subject: `Dernière chance pour « ${p.productTitle} » 💚 Novakou`,
    html: emailLayout(content),
  });
}
