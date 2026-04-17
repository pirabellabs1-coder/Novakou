// Novakou — Emails transactionnels pour la section Formations

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
// Domain contact@novakou.com is verified — DNS configured in Vercel
const FROM = process.env.EMAIL_FROM || "Novakou <contact@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

// ── Layout HTML commun formations ──

function emailLayout(content: string, lang: "fr" | "en" = "fr"): string {
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;margin-bottom:40px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6C2BD9,#8B5CF6);padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0;letter-spacing:1px;">🎓 FORMATIONS</p>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">${lang === "fr" ? "L'équipe Novakou" : "The Novakou Team"}</p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        <a href="${APP_URL}" style="color:#6C2BD9;text-decoration:none;">Formations</a> ·
        <a href="${APP_URL}/apprenant/mes-formations" style="color:#6C2BD9;text-decoration:none;">${lang === "fr" ? "Mes formations" : "My courses"}</a> ·
        <a href="${APP_URL}/contact" style="color:#6C2BD9;text-decoration:none;">Contact</a>
      </p>
      <p style="color:#d1d5db;font-size:10px;margin:12px 0 0;">© 2026 Novakou — ${lang === "fr" ? "Fondée par" : "Founded by"} Lissanon Gildas</p>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#6C2BD9;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:16px 0;">${text}</a>`;
}

function successBadge(text: string): string {
  return `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;margin:16px 0;">
    <span style="color:#16a34a;font-weight:700;font-size:16px;">✅ ${text}</span>
  </div>`;
}

// ── 1. Confirmation d'inscription à une formation ──

export async function sendEnrollmentConfirmedEmail(params: {
  email: string;
  name: string;
  formationTitle: string;
  formationSlug: string;
  paidAmount: number;
  locale?: "fr" | "en";
}) {
  const { email, name, formationTitle, formationSlug, paidAmount, locale = "fr" } = params;
  const isFr = locale === "fr";
  const courseUrl = `${APP_URL}/apprenant/formation/${formationSlug}`;

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">
      ${isFr ? `🎉 Félicitations, ${name} !` : `🎉 Congratulations, ${name}!`}
    </h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      ${isFr
        ? `Votre inscription à la formation <strong>${formationTitle}</strong> est confirmée. Vous pouvez commencer à apprendre dès maintenant !`
        : `Your enrollment in <strong>${formationTitle}</strong> is confirmed. You can start learning right now!`
      }
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">${isFr ? "Formation" : "Course"}</td>
          <td style="color:#111827;font-weight:600;text-align:right;font-size:14px;">${formationTitle}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">${isFr ? "Montant payé" : "Amount paid"}</td>
          <td style="color:#6C2BD9;font-weight:700;text-align:right;font-size:16px;">${paidAmount.toFixed(2)} €</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">${isFr ? "Accès" : "Access"}</td>
          <td style="color:#16a34a;font-weight:600;text-align:right;font-size:14px;">♾️ ${isFr ? "À vie" : "Lifetime"}</td>
        </tr>
      </table>
    </div>
    ${button(isFr ? "Commencer la formation" : "Start learning", courseUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      ${isFr
        ? "Satisfait ou remboursé 30 jours. Contactez le support si vous avez des questions."
        : "30-day money-back guarantee. Contact support if you have any questions."
      }
    </p>
  `,
    locale
  );

  const subject = isFr
    ? `✅ Inscription confirmée — ${formationTitle}`
    : `✅ Enrollment confirmed — ${formationTitle}`;

  return resend.emails.send({ from: FROM, to: email, subject, html });
}

// ── 2. Notification nouvel apprenant (instructeur) ──

export async function sendNewStudentNotificationEmail(params: {
  instructeurEmail: string;
  instructeurName: string;
  studentName: string;
  formationTitle: string;
  paidAmount: number;
}) {
  const { instructeurEmail, instructeurName, studentName, formationTitle, paidAmount } = params;
  const netAmount = paidAmount * 0.95; // 5% platform fee

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">🎓 Nouvelle vente !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${instructeurName}, <strong>${studentName}</strong> vient d'acheter votre produit
      <strong>${formationTitle}</strong>.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#16a34a;font-size:28px;font-weight:800;margin:0;">+${netAmount.toFixed(0)} FCFA</p>
      <p style="color:#4ade80;font-size:13px;margin:4px 0 0;">Vos revenus nets (95%)</p>
    </div>
    ${button("Voir mes apprenants", `${APP_URL}/vendeur/etudiants`)}
  `);

  return resend.emails.send({
    from: FROM,
    to: instructeurEmail,
    subject: `🎓 Nouvel apprenant — ${formationTitle}`,
    html,
  });
}

// ── 3. Certificat délivré ──

export async function sendCertificateIssuedEmail(params: {
  email: string;
  name: string;
  formationTitle: string;
  certificateCode: string;
  pdfUrl?: string;
  score: number;
  locale?: "fr" | "en";
}) {
  const { email, name, formationTitle, certificateCode, pdfUrl, score, locale = "fr" } = params;
  const isFr = locale === "fr";
  const verifyUrl = `${APP_URL}/certificat/${certificateCode}`;
  const certificateUrl = `${APP_URL}/apprenant/certificats`;

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">
      🏆 ${isFr ? `Félicitations ${name}, votre certificat est prêt !` : `Congratulations ${name}, your certificate is ready!`}
    </h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      ${isFr
        ? `Vous avez complété avec succès la formation <strong>${formationTitle}</strong> avec un score de <strong>${score}%</strong>.`
        : `You have successfully completed <strong>${formationTitle}</strong> with a score of <strong>${score}%</strong>.`
      }
    </p>
    <div style="background:linear-gradient(135deg,#f0e8ff,#e8f4ff);border:2px solid #6C2BD9;border-radius:16px;padding:32px;text-align:center;margin:0 0 24px;">
      <p style="color:#6C2BD9;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">
        ${isFr ? "Certificat d'accomplissement" : "Certificate of Completion"}
      </p>
      <p style="color:#111827;font-size:20px;font-weight:800;margin:0 0 8px;">${name}</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">${formationTitle}</p>
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        ${isFr ? "Code de vérification" : "Verification code"} : <strong style="color:#6C2BD9;">${certificateCode}</strong>
      </p>
    </div>
    ${pdfUrl ? button(isFr ? "Télécharger le certificat PDF" : "Download PDF Certificate", pdfUrl) : ""}
    <p style="margin:0 0 8px;">
      <a href="${verifyUrl}" style="color:#6C2BD9;font-size:13px;">
        🔗 ${isFr ? "Partager le lien de vérification" : "Share verification link"}
      </a>
    </p>
    ${button(isFr ? "Voir mes certificats" : "View my certificates", certificateUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      ${isFr
        ? "Partagez votre réussite sur LinkedIn pour valoriser votre profil professionnel."
        : "Share your achievement on LinkedIn to enhance your professional profile."
      }
    </p>
  `,
    locale
  );

  const subject = isFr
    ? `🏆 Votre certificat Novakou est prêt — ${formationTitle}`
    : `🏆 Your Novakou certificate is ready — ${formationTitle}`;

  return resend.emails.send({ from: FROM, to: email, subject, html });
}

// ── 4. Confirmation de candidature instructeur ──

export async function sendInstructorApplicationEmail(params: {
  email: string;
  name: string;
}) {
  const { email, name } = params;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">📋 Candidature reçue !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, nous avons bien reçu votre candidature pour devenir instructeur sur Novakou.
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Notre équipe examinera votre dossier dans les <strong>48 heures</strong> ouvrées. Vous recevrez un email
      de notre part avec notre décision.
    </p>
    ${successBadge("Candidature enregistrée avec succès")}
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:16px 0 0;">
      En attendant, vous pouvez préparer votre premier contenu de formation (slides, vidéos, ressources PDF)
      pour être prêt à publier dès l'approbation de votre candidature.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "📋 Candidature instructeur reçue — Novakou",
    html,
  });
}

// ── 5. Candidature instructeur approuvée ──

export async function sendInstructorApprovedEmail(params: {
  email: string;
  name: string;
}) {
  const { email, name } = params;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">🎉 Félicitations, vous êtes maintenant instructeur !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre candidature pour devenir instructeur sur Novakou a été <strong>approuvée</strong>.
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Vous pouvez maintenant créer et publier vos formations. Vous toucherez <strong>70% des revenus</strong>
      générés par chaque vente.
    </p>
    ${successBadge("Candidature approuvée ✓")}
    ${button("Créer ma première formation", `${APP_URL}/vendeur/produits/creer`)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Visitez votre <a href="${APP_URL}/vendeur/dashboard" style="color:#6C2BD9;">espace instructeur</a>
      pour gérer vos formations et suivre vos revenus.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "🎉 Candidature approuvée — Bienvenue chez les instructeurs Novakou !",
    html,
  });
}

// ── 6. Candidature instructeur refusée ──

export async function sendInstructorRejectedEmail(params: {
  email: string;
  name: string;
  reason?: string;
}) {
  const { email, name, reason } = params;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Décision sur votre candidature</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, après examen de votre candidature, nous ne sommes pas en mesure de l'approuver pour le moment.
    </p>
    ${reason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#dc2626;margin:0;font-size:14px;"><strong>Motif :</strong> ${reason}</p>
    </div>
    ` : ""}
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Vous pouvez soumettre une nouvelle candidature après avoir renforcé votre expérience dans votre domaine.
      N'hésitez pas à nous contacter si vous souhaitez des précisions.
    </p>
    ${button("Contacter le support", `${APP_URL}/contact`)}
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Réponse à votre candidature instructeur — Novakou",
    html,
  });
}

// ── 7. Formation approuvée (instructeur) ──

export async function sendFormationApprovedEmail(params: {
  email: string;
  name: string;
  formationTitle: string;
  formationSlug: string;
}) {
  const { email, name, formationTitle, formationSlug } = params;
  const publicUrl = `${APP_URL}/formation/${formationSlug}`;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">✅ Formation approuvée et publiée !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre formation <strong>${formationTitle}</strong> a été approuvée par notre équipe et est maintenant
      visible dans le marketplace Novakou.
    </p>
    ${successBadge(`${formationTitle} est maintenant en ligne`)}
    ${button("Voir ma formation en ligne", publicUrl)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Partagez le lien de votre formation sur vos réseaux sociaux pour attirer vos premiers apprenants !
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `✅ Formation approuvée — ${formationTitle}`,
    html,
  });
}

// ── 8. Formation refusée (instructeur) ──

export async function sendFormationRejectedEmail(params: {
  email: string;
  name: string;
  formationTitle: string;
  reason?: string;
}) {
  const { email, name, formationTitle, reason } = params;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Formation non approuvée</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre formation <strong>${formationTitle}</strong> n'a pas pu être approuvée en l'état.
    </p>
    ${reason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#dc2626;margin:0;font-size:14px;"><strong>Raison :</strong> ${reason}</p>
    </div>
    ` : ""}
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Veuillez apporter les modifications nécessaires et soumettre à nouveau votre formation pour modération.
    </p>
    ${button("Modifier ma formation", `${APP_URL}/vendeur/produits`)}
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Formation non approuvée — ${formationTitle}`,
    html,
  });
}

// ── 9. Demande de retrait reçue ──

export async function sendWithdrawalRequestEmail(params: {
  email: string;
  name: string;
  amount: number;
  method: string;
}) {
  const { email, name, amount, method } = params;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">💸 Demande de retrait reçue</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre demande de retrait a bien été enregistrée.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">Montant demandé</td>
          <td style="color:#6C2BD9;font-weight:700;text-align:right;font-size:18px;">${amount.toFixed(2)} €</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">Méthode</td>
          <td style="color:#111827;text-align:right;font-size:14px;">${method}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">Statut</td>
          <td style="color:#f59e0b;font-weight:600;text-align:right;font-size:14px;">⏳ En attente</td>
        </tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0;">
      Notre équipe traitera votre demande sous <strong>2–5 jours ouvrés</strong>.
      Vous recevrez un email de confirmation une fois le virement effectué.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `💸 Demande de retrait de ${amount.toFixed(2)} € reçue`,
    html,
  });
}

// ── 10. Livraison produit numérique ──

export async function sendDigitalProductDeliveryEmail(params: {
  email: string;
  name: string;
  productTitle: string;
  downloadUrl: string;
  locale?: "fr" | "en";
}) {
  const { email, name, productTitle, downloadUrl, locale = "fr" } = params;
  const isFr = locale === "fr";

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">
      📦 ${isFr ? `Votre produit est prêt, ${name} !` : `Your product is ready, ${name}!`}
    </h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      ${isFr
        ? `Merci pour votre achat ! Votre produit <strong>${productTitle}</strong> est prêt à être téléchargé.`
        : `Thank you for your purchase! Your product <strong>${productTitle}</strong> is ready to download.`
      }
    </p>
    ${successBadge(isFr ? "Achat confirmé" : "Purchase confirmed")}
    ${button(isFr ? "Télécharger mon produit" : "Download my product", downloadUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      ${isFr
        ? "Vous disposez de 5 téléchargements maximum. Conservez bien votre fichier."
        : "You have a maximum of 5 downloads. Please keep your file safe."
      }
    </p>
  `,
    locale
  );

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr ? `📦 Votre produit est prêt — ${productTitle}` : `📦 Your product is ready — ${productTitle}`,
    html,
  });
}

// ── 11. Livraison clé de licence ──

export async function sendLicenseKeyEmail(params: {
  email: string;
  name: string;
  productTitle: string;
  licenseKey: string;
  downloadUrl: string;
  locale?: "fr" | "en";
}) {
  const { email, name, productTitle, licenseKey, downloadUrl, locale = "fr" } = params;
  const isFr = locale === "fr";

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">
      🔑 ${isFr ? `Votre licence est activée, ${name} !` : `Your license is activated, ${name}!`}
    </h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      ${isFr
        ? `Votre achat de <strong>${productTitle}</strong> inclut une clé de licence unique.`
        : `Your purchase of <strong>${productTitle}</strong> includes a unique license key.`
      }
    </p>
    <div style="background:#f0e8ff;border:2px solid #6C2BD9;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#6C2BD9;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">
        ${isFr ? "Clé de licence" : "License Key"}
      </p>
      <p style="color:#111827;font-size:24px;font-weight:800;font-family:monospace;margin:0;letter-spacing:2px;">${licenseKey}</p>
    </div>
    ${button(isFr ? "Télécharger le produit" : "Download product", downloadUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      ${isFr
        ? "Conservez cette clé précieusement. Elle est unique et non transférable."
        : "Keep this key safe. It is unique and non-transferable."
      }
    </p>
  `,
    locale
  );

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr ? `🔑 Votre clé de licence — ${productTitle}` : `🔑 Your license key — ${productTitle}`,
    html,
  });
}

// ── 12. Panier abandonné — Relance 1 (1h après) ──

export async function sendAbandonedCartEmail1(params: {
  email: string;
  name: string;
  items: { title: string; price: number; thumbnail?: string }[];
  cartUrl: string;
  unsubscribeUrl: string;
}) {
  const { email, name, items, cartUrl, unsubscribeUrl } = params;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;gap:12px;">
            ${item.thumbnail ? `<img src="${item.thumbnail}" width="60" height="40" style="border-radius:6px;object-fit:cover;" />` : ""}
            <span style="color:#111827;font-size:14px;font-weight:600;">${item.title}</span>
          </div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#6C2BD9;font-weight:700;">${item.price.toFixed(2)} €</td>
      </tr>
    `
    )
    .join("");

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">🛒 Vous avez oublié quelque chose !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, il semblerait que vous ayez des articles dans votre panier qui n'attendent que vous !
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      ${itemsHtml}
    </table>
    ${button("Reprendre mon panier", cartUrl)}
    <p style="color:#d1d5db;font-size:11px;margin:24px 0 0;text-align:center;">
      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Se désabonner des rappels</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "🛒 Votre panier vous attend — Novakou",
    html,
  });
}

// ── 13. Panier abandonné — Relance 2 (24h après) ──

export async function sendAbandonedCartEmail2(params: {
  email: string;
  name: string;
  items: { title: string; price: number; learnPoints?: string[] }[];
  cartUrl: string;
  unsubscribeUrl: string;
}) {
  const { email, name, items, cartUrl, unsubscribeUrl } = params;

  const pointsHtml = items
    .flatMap((item) => item.learnPoints?.slice(0, 3) ?? [])
    .map((p) => `<li style="color:#4b5563;font-size:14px;line-height:1.8;">✅ ${p}</li>`)
    .join("");

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">📚 Votre formation vous attend</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, ne manquez pas l'opportunité d'apprendre avec ces formations :
    </p>
    <p style="color:#111827;font-weight:700;margin:0 0 8px;">Ce que vous apprendrez :</p>
    <ul style="padding-left:0;list-style:none;margin:0 0 24px;">${pointsHtml}</ul>
    ${button("Revenir au panier", cartUrl)}
    <p style="color:#d1d5db;font-size:11px;margin:24px 0 0;text-align:center;">
      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Se désabonner des rappels</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "📚 Votre formation vous attend — Novakou",
    html,
  });
}

// ── 14. Panier abandonné — Relance 3 (7 jours après) ──

export async function sendAbandonedCartEmail3(params: {
  email: string;
  name: string;
  items: { title: string; price: number }[];
  cartUrl: string;
  unsubscribeUrl: string;
}) {
  const { email, name, items, cartUrl, unsubscribeUrl } = params;

  const total = items.reduce((s, i) => s + i.price, 0);

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">⏰ Dernière chance !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre panier de <strong>${total.toFixed(2)} €</strong> sera bientôt vidé.
      C'est le dernier rappel que nous vous envoyons.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <p style="color:#dc2626;font-size:16px;font-weight:700;margin:0;">
        ${items.length} article${items.length > 1 ? "s" : ""} en attente
      </p>
      <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">
        Les places sont limitées et les prix peuvent changer.
      </p>
    </div>
    ${button("Finaliser mon achat", cartUrl)}
    <p style="color:#d1d5db;font-size:11px;margin:24px 0 0;text-align:center;">
      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Se désabonner des rappels</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "⏰ Dernière chance — Votre panier expire bientôt",
    html,
  });
}

// ── 15. Paiement échoué ──

export async function sendFailedPaymentEmail(params: {
  email: string;
  name: string;
  formationTitle: string;
  failureReason?: string;
  retryUrl: string;
  locale?: "fr" | "en";
}) {
  const { email, name, formationTitle, failureReason, retryUrl, locale = "fr" } = params;
  const isFr = locale === "fr";

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">
      ❌ ${isFr ? "Votre paiement n'a pas abouti" : "Your payment did not go through"}
    </h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      ${isFr
        ? `Bonjour ${name}, votre paiement pour <strong>${formationTitle}</strong> n'a pas pu être traité.`
        : `Hi ${name}, your payment for <strong>${formationTitle}</strong> could not be processed.`
      }
    </p>
    ${failureReason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#dc2626;margin:0;font-size:14px;">
        <strong>${isFr ? "Motif" : "Reason"} :</strong> ${failureReason}
      </p>
    </div>
    ` : ""}
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      ${isFr
        ? "Vérifiez vos informations de paiement et réessayez. Si le problème persiste, contactez notre support."
        : "Please check your payment details and try again. If the issue persists, contact our support team."
      }
    </p>
    ${button(isFr ? "Réessayer le paiement" : "Retry payment", retryUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      ${isFr
        ? `Besoin d'aide ? <a href="${APP_URL}/contact" style="color:#6C2BD9;">Contactez le support</a>`
        : `Need help? <a href="${APP_URL}/contact" style="color:#6C2BD9;">Contact support</a>`
      }
    </p>
  `,
    locale
  );

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr ? `❌ Paiement échoué — ${formationTitle}` : `❌ Payment failed — ${formationTitle}`,
    html,
  });
}

// ── 16. Confirmation inscription cohorte ──

export async function sendCohortEnrollmentEmail(params: {
  email: string;
  name: string;
  cohortTitle: string;
  formationTitle: string;
  startDate: Date;
  endDate: Date;
  paidAmount: number;
  cohortId: string;
  locale?: "fr" | "en";
}) {
  const { email, name, cohortTitle, formationTitle, startDate, endDate, paidAmount, cohortId, locale = "fr" } = params;
  const isFr = locale === "fr";
  const cohortUrl = `${APP_URL}/apprenant/cohortes/${cohortId}`;
  const startStr = startDate.toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  const endStr = endDate.toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">
      ${isFr ? `🎉 Bienvenue dans la cohorte, ${name} !` : `🎉 Welcome to the cohort, ${name}!`}
    </h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      ${isFr
        ? `Vous avez rejoint la cohorte <strong>${cohortTitle}</strong> de la formation <strong>${formationTitle}</strong>. Préparez-vous à apprendre en groupe !`
        : `You have joined the cohort <strong>${cohortTitle}</strong> for the course <strong>${formationTitle}</strong>. Get ready to learn together!`
      }
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">${isFr ? "Cohorte" : "Cohort"}</td>
          <td style="color:#111827;font-weight:600;text-align:right;font-size:14px;">${cohortTitle}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">${isFr ? "Début" : "Starts"}</td>
          <td style="color:#111827;text-align:right;font-size:14px;">📅 ${startStr}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">${isFr ? "Fin" : "Ends"}</td>
          <td style="color:#111827;text-align:right;font-size:14px;">📅 ${endStr}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">${isFr ? "Montant payé" : "Amount paid"}</td>
          <td style="color:#6C2BD9;font-weight:700;text-align:right;font-size:16px;">${paidAmount.toFixed(2)} €</td>
        </tr>
      </table>
    </div>
    ${button(isFr ? "Accéder à mon espace groupe" : "Access my group space", cohortUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      ${isFr
        ? "Rejoignez le chat de groupe pour faire connaissance avec les autres participants avant le début de la formation."
        : "Join the group chat to get to know other participants before the course starts."
      }
    </p>
  `,
    locale
  );

  const subject = isFr
    ? `🎉 Inscription confirmée — Cohorte ${cohortTitle}`
    : `🎉 Enrollment confirmed — Cohort ${cohortTitle}`;

  return resend.emails.send({ from: FROM, to: email, subject, html });
}

// ── 17. Notification démarrage cohorte ──

export async function sendCohortStartingEmail(params: {
  email: string;
  name: string;
  cohortTitle: string;
  formationTitle: string;
  startDate: Date;
  cohortId: string;
  locale?: "fr" | "en";
}) {
  const { email, name, cohortTitle, formationTitle, startDate, cohortId, locale = "fr" } = params;
  const isFr = locale === "fr";
  const cohortUrl = `${APP_URL}/apprenant/cohortes/${cohortId}`;
  const startStr = startDate.toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">
      🚀 ${isFr ? `Votre cohorte démarre, ${name} !` : `Your cohort starts now, ${name}!`}
    </h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      ${isFr
        ? `La cohorte <strong>${cohortTitle}</strong> de la formation <strong>${formationTitle}</strong> commence le <strong>${startStr}</strong>. C'est parti !`
        : `The cohort <strong>${cohortTitle}</strong> for the course <strong>${formationTitle}</strong> starts on <strong>${startStr}</strong>. Let's go!`
      }
    </p>
    ${successBadge(isFr ? "Votre cohorte est en cours" : "Your cohort is now active")}
    ${button(isFr ? "Rejoindre le groupe" : "Join the group", cohortUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
      ${isFr
        ? "Consultez le programme de la semaine et participez aux discussions de groupe."
        : "Check this week's schedule and participate in group discussions."
      }
    </p>
  `,
    locale
  );

  const subject = isFr
    ? `🚀 Votre cohorte démarre — ${cohortTitle}`
    : `🚀 Your cohort starts — ${cohortTitle}`;

  return resend.emails.send({ from: FROM, to: email, subject, html });
}

// ── 18. Notification litige (instructeur) ──

export async function sendDisputeNotificationEmail(params: {
  email: string;
  name: string;
  formationTitle: string;
  studentName: string;
  amount: number;
}) {
  const { email, name, formationTitle, studentName, amount } = params;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">⚠️ Un litige a été ouvert</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, l'apprenant <strong>${studentName}</strong> a ouvert un litige concernant la formation
      <strong>${formationTitle}</strong>.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">Formation</td>
          <td style="color:#111827;text-align:right;font-size:14px;font-weight:600;">${formationTitle}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">Montant contesté</td>
          <td style="color:#dc2626;text-align:right;font-size:16px;font-weight:700;">${amount.toFixed(2)} €</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:4px 0;font-size:14px;">Statut</td>
          <td style="color:#f59e0b;text-align:right;font-size:14px;font-weight:600;">⚠️ En cours d'examen</td>
        </tr>
      </table>
    </div>
    <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Les fonds sont gelés pendant l'examen du litige. Notre équipe prendra une décision sous 48–72 heures.
    </p>
    ${button("Voir les détails", `${APP_URL}/vendeur/dashboard`)}
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `⚠️ Litige ouvert — ${formationTitle}`,
    html,
  });
}
