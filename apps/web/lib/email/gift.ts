// E-mails de l'ACHAT-CADEAU : notice au destinataire (avec lien d'accès OTP) et
// confirmation à l'offreur. Le destinataire n'a pas forcément de compte → on
// l'envoie vers /acheteur/connexion (connexion par code, sans mot de passe).

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

/** Prévient le DESTINATAIRE d'un cadeau (connexion acheteur par OTP). */
export async function notifyGiftRecipient(opts: {
  to: string;
  recipientName: string | null;
  itemTitle: string;
  gifterName: string;
  message?: string | null;
}): Promise<void> {
  try {
    const { sendAdminCampaignEmail } = await import("@/lib/email/admin-campaign");
    const loginUrl = `${APP_URL}/acheteur/connexion`;
    const personalMsg = opts.message?.trim()
      ? `<p style="background:#f6fbf2;border-radius:8px;padding:12px 16px;font-style:italic;color:#374151">« ${opts.message.trim()} »</p>`
      : "";
    const html = `
      <p>Bonne nouvelle 🎉</p>
      <p><strong>${opts.gifterName}</strong> vous a offert <strong>« ${opts.itemTitle} »</strong> sur Novakou.</p>
      ${personalMsg}
      <p>Pour y accéder, connectez-vous à votre espace acheteur avec cette adresse e-mail. Un code de connexion vous sera envoyé — aucun mot de passe nécessaire :</p>
      <p><a href="${loginUrl}" style="display:inline-block;background:#006e2f;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">Accéder à mon cadeau</a></p>
      <p style="color:#6b7280;font-size:13px">Ou rendez-vous sur ${loginUrl}</p>
    `;
    await sendAdminCampaignEmail({
      to: opts.to,
      firstName: opts.recipientName,
      subject: `🎁 ${opts.gifterName} vous a offert « ${opts.itemTitle} »`,
      htmlBody: html,
    });
  } catch (err) {
    console.warn("[gift] notification destinataire échouée:", err);
  }
}

/** Confirme à l'OFFREUR que son cadeau a bien été envoyé. */
export async function notifyGiftSent(opts: {
  to: string;
  buyerName: string | null;
  recipientEmail: string;
  itemTitle: string;
}): Promise<void> {
  try {
    const { sendAdminCampaignEmail } = await import("@/lib/email/admin-campaign");
    const html = `
      <p>Merci pour votre achat 🎁</p>
      <p>Votre cadeau <strong>« ${opts.itemTitle} »</strong> a bien été envoyé à
      <strong>${opts.recipientEmail}</strong>. La personne recevra un e-mail avec un lien
      pour y accéder (connexion par code, sans mot de passe).</p>
      <p style="color:#6b7280;font-size:13px">Si elle ne trouve pas l'e-mail, demandez-lui de vérifier ses spams.</p>
    `;
    await sendAdminCampaignEmail({
      to: opts.to,
      firstName: opts.buyerName,
      subject: `Votre cadeau « ${opts.itemTitle} » a été envoyé`,
      htmlBody: html,
    });
  } catch (err) {
    console.warn("[gift] confirmation offreur échouée:", err);
  }
}
