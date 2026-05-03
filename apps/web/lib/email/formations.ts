// Novakou — Emails transactionnels pour la section Formations

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
// Domain support@novakou.com is verified — DNS configured in Vercel
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

// ── Layout HTML commun formations ──

function emailLayout(content: string, lang: "fr" | "en" = "fr", variant: "default" | "celebration" = "default"): string {
  const headerBg = variant === "celebration"
    ? "linear-gradient(135deg,#22c55e 0%,#10b981 50%,#06b6d4 100%)"
    : "linear-gradient(135deg,#006e2f,#22c55e)";
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:40px;margin-bottom:40px;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <!-- Header -->
    <div style="background:#ffffff;padding:28px 40px;text-align:center;border-bottom:1px solid #e5e7eb;">
      <img src="${APP_URL}/apple-icon" alt="Novakou" width="56" height="56" style="display:inline-block;border-radius:12px;vertical-align:middle;" />
      <span style="display:inline-block;vertical-align:middle;margin-left:12px;color:#111827;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Novakou</span>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:28px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 12px;">${lang === "fr" ? "— L'équipe Novakou 💚" : "— The Novakou Team 💚"}</p>
      <p style="color:#9ca3af;font-size:11px;margin:0 0 8px;">
        <a href="${APP_URL}" style="color:#006e2f;text-decoration:none;font-weight:600;">Accueil</a> ·
        <a href="${APP_URL}/apprenant/mes-formations" style="color:#006e2f;text-decoration:none;font-weight:600;">${lang === "fr" ? "Mes formations" : "My courses"}</a> ·
        <a href="${APP_URL}/vendeur/dashboard" style="color:#006e2f;text-decoration:none;font-weight:600;">${lang === "fr" ? "Mes ventes" : "My sales"}</a> ·
        <a href="${APP_URL}/contact" style="color:#006e2f;text-decoration:none;font-weight:600;">Support</a>
      </p>
      <p style="color:#d1d5db;font-size:10px;margin:8px 0 0;">© 2026 Novakou — ${lang === "fr" ? "Édité par" : "Published by"} Pirabel Labs</p>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, url: string, variant: "primary" | "secondary" = "primary"): string {
  const bg = variant === "primary"
    ? "linear-gradient(135deg,#006e2f,#22c55e)"
    : "#ffffff";
  const color = variant === "primary" ? "#ffffff" : "#006e2f";
  const border = variant === "secondary" ? "border:2px solid #006e2f;" : "";
  return `<a href="${url}" style="display:inline-block;background:${bg};${border}color:${color};padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:15px;margin:16px 0;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(0,110,47,0.2);">${text}</a>`;
}

/** Astuce : on construit des liens "magic" qui autoconnectent ou redirigent vers login si déconnecté */
function autoLoginLink(path: string): string {
  // /connexion redirige vers ?callbackUrl s'il faut se connecter d'abord
  return `${APP_URL}/connexion?callbackUrl=${encodeURIComponent(APP_URL + path)}`;
}

/**
 * Lien magic pour ACHETEUR : pointe vers /acheteur/connexion avec email pré-rempli
 * et autosend=1 qui déclenche l'envoi automatique du code OTP.
 * L'acheteur reçoit le code par email, l'entre, et atterrit sur sa page cible.
 * Parfait pour les utilisateurs qui n'ont jamais créé de compte (guest checkout).
 */
function buyerMagicLink(email: string, path: string): string {
  const params = new URLSearchParams({
    email,
    autosend: "1",
    callbackUrl: APP_URL + path,
  });
  return `${APP_URL}/acheteur/connexion?${params.toString()}`;
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
  const coursePath = `/apprenant/formation/${formationSlug}`;
  // Lien magic : auto-envoi OTP à l'email de l'acheteur + redirect vers la formation
  const courseUrl = buyerMagicLink(email, coursePath);
  const myCoursesUrl = buyerMagicLink(email, "/apprenant/mes-formations");

  const now = new Date();
  const dateStr = now.toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  const reference = `CMD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">
      ${isFr ? `Bonjour ${name},` : `Hello ${name},`}
    </h2>

    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
      ${isFr
        ? `Nous vous remercions pour votre achat. Votre inscription à la formation <strong style="color:#111827;">« ${formationTitle} »</strong> est confirmée.`
        : `Thank you for your purchase. Your enrollment in <strong style="color:#111827;">"${formationTitle}"</strong> is confirmed.`
      }
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      ${button(isFr ? "Accéder à la formation" : "Access the course", courseUrl)}
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin:0 0 24px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        ${isFr ? "Récapitulatif de votre commande" : "Order summary"}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Formation" : "Course"}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${formationTitle}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Montant" : "Amount"}</td><td style="color:#111827;font-weight:700;text-align:right;font-size:14px;">${Math.round(paidAmount).toLocaleString("fr-FR")} FCFA</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Référence" : "Reference"}</td><td style="color:#6b7280;font-family:monospace;text-align:right;font-size:12px;">${reference}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Date</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${dateStr}</td></tr>
      </table>
    </div>

    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0 0 8px;">
      ${isFr
        ? `Votre reçu est disponible dans votre espace apprenant.`
        : `Your receipt is available in your learner space.`
      }
    </p>

    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0;">
      ${isFr
        ? `Pour toute question, notre équipe support est disponible à <a href="mailto:support@novakou.com" style="color:#006e2f;text-decoration:none;font-weight:600;">support@novakou.com</a>.`
        : `For any questions, our support team is available at <a href="mailto:support@novakou.com" style="color:#006e2f;text-decoration:none;font-weight:600;">support@novakou.com</a>.`
      }
    </p>
  `,
    locale
  );

  const subject = isFr
    ? `Confirmation de votre inscription — ${formationTitle}`
    : `Enrollment confirmation — ${formationTitle}`;

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
  const transactionsUrl = autoLoginLink("/vendeur/transactions");
  const formattedAmount = Math.round(paidAmount).toLocaleString("fr-FR");
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const html = emailLayout(`
    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;font-size:48px;margin:0 0 8px;line-height:1;">🎉</div>
      <h2 style="color:#111827;font-size:28px;font-weight:900;margin:0 0 8px;letter-spacing:-0.5px;">
        WAOUH ${instructeurName} !
      </h2>
      <p style="color:#006e2f;font-size:16px;font-weight:700;margin:0;">
        Vous venez de réaliser une nouvelle vente.
      </p>
    </div>

    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
      <strong style="color:#111827;">${studentName}</strong> vient d'acheter votre produit
      <strong style="color:#111827;">« ${formationTitle} »</strong> pour
      <strong style="color:#006e2f;">${formattedAmount} FCFA</strong>.
    </p>

    <!-- Bloc récapitulatif PROPRE (sans commission) -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:0 0 28px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        Détails de la vente
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:6px 0;font-size:13px;">Produit</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${formationTitle}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;font-size:13px;">Acheteur</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${studentName}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;font-size:13px;">Montant</td><td style="color:#006e2f;font-weight:800;text-align:right;font-size:15px;">${formattedAmount} FCFA</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;font-size:13px;">Date</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${dateStr}, ${timeStr}</td></tr>
      </table>
    </div>

    <p style="color:#4b5563;line-height:1.6;font-size:14px;margin:0 0 24px;">
      Les fonds sont disponibles dans votre portefeuille et peuvent être
      retirés à tout moment vers votre méthode de paiement préférée.
    </p>

    <div style="text-align:center;margin:0 0 16px;">
      ${button("Consulter mes ventes", transactionsUrl)}
    </div>

    <p style="color:#006e2f;font-size:14px;font-weight:600;text-align:center;margin:20px 0 0;">
      Félicitations pour cette vente.
    </p>
  `, "fr", "celebration");

  return resend.emails.send({
    from: FROM,
    to: instructeurEmail,
    subject: `WAOUH ! Vous avez une nouvelle vente — ${formattedAmount} FCFA 🎉`,
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
    <div style="background:linear-gradient(135deg,#dcfce7,#ecfdf5);border:2px solid #006e2f;border-radius:16px;padding:32px;text-align:center;margin:0 0 24px;">
      <p style="color:#006e2f;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">
        ${isFr ? "Certificat d'accomplissement" : "Certificate of Completion"}
      </p>
      <p style="color:#111827;font-size:20px;font-weight:800;margin:0 0 8px;">${name}</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">${formationTitle}</p>
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        ${isFr ? "Code de vérification" : "Verification code"} : <strong style="color:#006e2f;">${certificateCode}</strong>
      </p>
    </div>
    ${pdfUrl ? button(isFr ? "Télécharger le certificat PDF" : "Download PDF Certificate", pdfUrl) : ""}
    <p style="margin:0 0 8px;">
      <a href="${verifyUrl}" style="color:#006e2f;font-size:13px;">
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
      Visitez votre <a href="${APP_URL}/vendeur/dashboard" style="color:#006e2f;">espace instructeur</a>
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
          <td style="color:#006e2f;font-weight:700;text-align:right;font-size:18px;">${amount.toFixed(2)} €</td>
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
  /** Optional list of all attached files. When provided and length >= 2, the
   *  email shows a list of named download links instead of a single button. */
  files?: Array<{ name: string; url: string }>;
  locale?: "fr" | "en";
}) {
  const { email, name, productTitle, downloadUrl, files, locale = "fr" } = params;
  const isFr = locale === "fr";
  const hasMultipleFiles = Array.isArray(files) && files.length >= 2;
  // Lien magic : auto-envoi OTP à l'email de l'acheteur + redirect vers ses produits
  const myProductsUrl = buyerMagicLink(email, "/apprenant/mes-produits");

  const now = new Date();
  const dateStr = now.toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  const reference = `CMD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

  const html = emailLayout(
    `
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">
      ${isFr ? `Bonjour ${name},` : `Hello ${name},`}
    </h2>

    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
      ${isFr
        ? `Nous vous remercions pour votre achat. Votre produit <strong style="color:#111827;">« ${productTitle} »</strong> est désormais disponible dans votre espace.`
        : `Thank you for your purchase. Your product <strong style="color:#111827;">"${productTitle}"</strong> is now available in your space.`
      }
    </p>

    ${hasMultipleFiles
      ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px 22px;margin:0 0 28px;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">
            ${isFr ? `${files!.length} fichiers à télécharger` : `${files!.length} files to download`}
          </p>
          <ul style="list-style:none;padding:0;margin:0;">
            ${files!
              .map(
                (f) =>
                  `<li style="padding:10px 0;border-top:1px solid #e5e7eb;">
                    <a href="${f.url}" style="color:#006e2f;font-size:14px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:8px;">
                      <span style="display:inline-block;width:18px;text-align:center;">📄</span>
                      <span style="flex:1;">${f.name}</span>
                      <span style="color:#9ca3af;font-size:12px;font-weight:500;">${isFr ? "Télécharger" : "Download"} →</span>
                    </a>
                  </li>`,
              )
              .join("")}
          </ul>
        </div>`
      : `<div style="text-align:center;margin:0 0 28px;">
          ${button(isFr ? "Accéder à mon produit" : "Access my product", downloadUrl)}
        </div>`
    }

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin:0 0 24px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        ${isFr ? "Récapitulatif" : "Summary"}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Produit" : "Product"}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${productTitle}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Référence" : "Reference"}</td><td style="color:#6b7280;font-family:monospace;text-align:right;font-size:12px;">${reference}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Date</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${dateStr}</td></tr>
      </table>
    </div>

    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0 0 8px;">
      ${isFr
        ? `Un lien <strong>« Voir tous mes achats »</strong> est également disponible ci-dessous pour retrouver l'ensemble de vos produits.`
        : `A link <strong>"View all my purchases"</strong> is also available below to find all your products.`
      }
    </p>

    <p style="margin:0 0 20px;">
      <a href="${myProductsUrl}" style="color:#006e2f;font-size:13px;font-weight:700;text-decoration:none;">
        ${isFr ? "Voir tous mes achats →" : "View all my purchases →"}
      </a>
    </p>

    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0;">
      ${isFr
        ? `Pour tout problème de téléchargement ou question sur le contenu, notre équipe support est disponible à <a href="mailto:support@novakou.com" style="color:#006e2f;text-decoration:none;font-weight:600;">support@novakou.com</a>.`
        : `For any download issue or question, our support team is available at <a href="mailto:support@novakou.com" style="color:#006e2f;text-decoration:none;font-weight:600;">support@novakou.com</a>.`
      }
    </p>
  `,
    locale
  );

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr
      ? `Votre produit est prêt — ${productTitle}`
      : `Your product is ready — ${productTitle}`,
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
    <div style="background:#dcfce7;border:2px solid #006e2f;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#006e2f;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">
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
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#006e2f;font-weight:700;">${item.price.toFixed(2)} €</td>
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
        ? `Besoin d'aide ? <a href="${APP_URL}/contact" style="color:#006e2f;">Contactez le support</a>`
        : `Need help? <a href="${APP_URL}/contact" style="color:#006e2f;">Contact support</a>`
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
          <td style="color:#006e2f;font-weight:700;text-align:right;font-size:16px;">${paidAmount.toFixed(2)} €</td>
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


/**
 * Email envoyé quand un abonnement arrive à échéance (cron renouvellement).
 * Inclut le lien Moneroo pour relancer le paiement.
 */
export async function sendSubscriptionRenewalEmail(params: {
  email: string;
  name: string;
  planName: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly" | string;
  checkoutUrl: string;
  currentPeriodEnd: Date | string;
}) {
  const { email, name, planName, price, currency, interval, checkoutUrl, currentPeriodEnd } = params;
  const periodLabel = interval === "yearly" ? "annuel" : "mensuel";
  const dateStr = new Date(currentPeriodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const fmtPrice = new Intl.NumberFormat("fr-FR").format(Math.round(price));

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">
      Bonjour ${name},
    </h2>
    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
      Votre abonnement <strong style="color:#111827;">« ${planName} »</strong> arrive à échéance le <strong>${dateStr}</strong>. Pour continuer à profiter de votre accès sans interruption, merci de procéder au paiement du renouvellement ${periodLabel} ci-dessous.
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      ${button(`Payer ${fmtPrice} ${currency} et renouveler`, checkoutUrl)}
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin:0 0 24px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        Récapitulatif
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Plan</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${planName}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Cycle</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${periodLabel}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Montant</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:14px;">${fmtPrice} ${currency}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Échéance</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${dateStr}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0 0 8px;">
      Vous avez <strong>14 jours</strong> à partir de l'échéance pour régulariser. Passé ce délai, votre accès aux contenus sera automatiquement suspendu.
    </p>
    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0;">
      Si vous souhaitez annuler votre abonnement, vous pouvez le faire depuis votre espace
      <a href="${APP_URL}/apprenant/abonnements" style="color:#006e2f;text-decoration:none;font-weight:600;">Mes abonnements</a>.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Renouvellement de votre abonnement « ${planName} »`,
    html,
  });
}

// ── 22. Confirmation achat d'un Pack (Bundle) ──
//
// Envoyé immédiatement après confirmation Moneroo/PayGenius d'un bundle.
// Liste les articles inclus + lien vers Mes Formations.
export async function sendBundlePurchasedEmail(params: {
  email: string;
  name: string;
  bundleTitle: string;
  totalItems: number;
  formationCount: number;
  productCount: number;
  paidAmount: number;
  currency?: string;
  locale?: "fr" | "en";
}) {
  const { email, name, bundleTitle, totalItems, formationCount, productCount, paidAmount, currency = "FCFA", locale = "fr" } = params;
  const isFr = locale === "fr";
  const fmtPrice = new Intl.NumberFormat(isFr ? "fr-FR" : "en-US").format(Math.round(paidAmount));
  const myFormationsUrl = buyerMagicLink(email, "/apprenant/mes-formations");
  const myProductsUrl = buyerMagicLink(email, "/apprenant/mes-produits");

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">
      ${isFr ? `Bonjour ${name},` : `Hello ${name},`}
    </h2>
    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
      ${isFr
        ? `Merci pour votre achat ! Votre pack <strong style="color:#111827;">« ${bundleTitle} »</strong> est confirmé et tous les articles inclus sont désormais disponibles dans votre espace.`
        : `Thanks for your purchase! Your pack <strong style="color:#111827;">"${bundleTitle}"</strong> is confirmed and all included items are now in your space.`}
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:22px;margin:0 0 24px;">
      <p style="color:#15803d;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">
        ${isFr ? "Contenu débloqué" : "Unlocked content"}
      </p>
      <p style="color:#111827;font-size:15px;font-weight:700;margin:0 0 8px;">${totalItems} ${isFr ? "article(s) ajouté(s) à votre espace" : "item(s) added to your space"}</p>
      <p style="color:#15803d;font-size:13px;margin:0;">
        ${formationCount > 0 ? `${formationCount} ${isFr ? "formation(s)" : "course(s)"}` : ""}
        ${formationCount > 0 && productCount > 0 ? " · " : ""}
        ${productCount > 0 ? `${productCount} ${isFr ? "produit(s) digital" : "digital product(s)"}` : ""}
      </p>
    </div>
    <div style="text-align:center;margin:0 0 28px;">
      ${button(isFr ? "Accéder à mes contenus" : "Access my content", formationCount > 0 ? myFormationsUrl : myProductsUrl)}
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin:0 0 24px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        ${isFr ? "Récapitulatif" : "Summary"}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Pack" : "Pack"}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${bundleTitle}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Articles" : "Items"}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${totalItems}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Montant" : "Amount"}</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:14px;">${fmtPrice} ${currency}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0;">
      ${isFr
        ? `Vous avez un accès à vie à tous les articles de ce pack. Pour toute question, contactez <a href="mailto:support@novakou.com" style="color:#006e2f;text-decoration:none;font-weight:600;">support@novakou.com</a>.`
        : `You have lifetime access to all items in this pack. For any questions, contact <a href="mailto:support@novakou.com" style="color:#006e2f;text-decoration:none;font-weight:600;">support@novakou.com</a>.`}
    </p>
  `, locale, "celebration");

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr ? `Pack confirmé — ${bundleTitle}` : `Pack confirmed — ${bundleTitle}`,
    html,
  });
}

// ── 23. Confirmation souscription initiale à un abonnement ──
//
// Envoyé lors de la première souscription à un plan (subscription_initial).
// Pour les renouvellements, on utilise sendSubscriptionRenewedEmail (24).
export async function sendSubscriptionConfirmedEmail(params: {
  email: string;
  name: string;
  planName: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly" | string;
  currentPeriodEnd: Date | string;
  trialEndsAt?: Date | string | null;
  locale?: "fr" | "en";
}) {
  const { email, name, planName, price, currency, interval, currentPeriodEnd, trialEndsAt, locale = "fr" } = params;
  const isFr = locale === "fr";
  const periodLabel = interval === "yearly" ? (isFr ? "annuel" : "yearly") : (isFr ? "mensuel" : "monthly");
  const endDateStr = new Date(currentPeriodEnd).toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  const trialDateStr = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" }) : null;
  const fmtPrice = new Intl.NumberFormat(isFr ? "fr-FR" : "en-US").format(Math.round(price));
  const subscriptionsUrl = buyerMagicLink(email, "/apprenant/abonnements");

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">
      ${isFr ? `Bonjour ${name},` : `Hello ${name},`}
    </h2>
    ${trialDateStr
      ? `<p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
          ${isFr
            ? `Votre essai gratuit pour <strong style="color:#111827;">« ${planName} »</strong> est démarré ! Vous serez prélevé(e) <strong>${fmtPrice} ${currency}</strong> le <strong>${trialDateStr}</strong> sauf si vous annulez avant.`
            : `Your free trial for <strong style="color:#111827;">"${planName}"</strong> has started! You'll be charged <strong>${fmtPrice} ${currency}</strong> on <strong>${trialDateStr}</strong> unless you cancel before.`}
        </p>`
      : `<p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
          ${isFr
            ? `Votre abonnement <strong style="color:#111827;">« ${planName} »</strong> est actif jusqu'au <strong>${endDateStr}</strong>. Tous les contenus inclus sont accessibles dans votre espace.`
            : `Your subscription <strong style="color:#111827;">"${planName}"</strong> is active until <strong>${endDateStr}</strong>. All included content is now accessible in your space.`}
        </p>`}
    <div style="text-align:center;margin:0 0 28px;">
      ${button(isFr ? "Voir mes abonnements" : "View my subscriptions", subscriptionsUrl)}
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin:0 0 24px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        ${isFr ? "Récapitulatif" : "Summary"}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Plan</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${planName}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Cycle" : "Cycle"}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${periodLabel}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Montant" : "Amount"}</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:14px;">${fmtPrice} ${currency}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${trialDateStr ? (isFr ? "Fin essai" : "Trial ends") : (isFr ? "Échéance" : "Period end")}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${trialDateStr ?? endDateStr}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0;">
      ${isFr
        ? `Vous pouvez annuler votre abonnement à tout moment depuis votre espace <strong>Mes abonnements</strong>. L'accès reste actif jusqu'à la fin de la période payée.`
        : `You can cancel your subscription anytime from <strong>My subscriptions</strong>. Access remains active until the end of the paid period.`}
    </p>
  `, locale, "celebration");

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr
      ? (trialDateStr ? `Essai démarré — ${planName}` : `Abonnement confirmé — ${planName}`)
      : (trialDateStr ? `Trial started — ${planName}` : `Subscription confirmed — ${planName}`),
    html,
  });
}

// ── 24. Confirmation de renouvellement payé ──
//
// Envoyé après webhook subscription_renewal réussi (paiement de la nouvelle période).
// Différent de sendSubscriptionRenewalEmail (envoi du lien de paiement avant échéance).
export async function sendSubscriptionRenewedEmail(params: {
  email: string;
  name: string;
  planName: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly" | string;
  newPeriodEnd: Date | string;
  locale?: "fr" | "en";
}) {
  const { email, name, planName, price, currency, interval, newPeriodEnd, locale = "fr" } = params;
  const isFr = locale === "fr";
  const periodLabel = interval === "yearly" ? (isFr ? "annuel" : "yearly") : (isFr ? "mensuel" : "monthly");
  const endDateStr = new Date(newPeriodEnd).toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  const fmtPrice = new Intl.NumberFormat(isFr ? "fr-FR" : "en-US").format(Math.round(price));
  const subscriptionsUrl = buyerMagicLink(email, "/apprenant/abonnements");

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">
      ${isFr ? `Merci ${name} 💚` : `Thanks ${name} 💚`}
    </h2>
    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;">
      ${isFr
        ? `Votre abonnement <strong style="color:#111827;">« ${planName} »</strong> a été renouvelé avec succès. Votre accès est prolongé jusqu'au <strong>${endDateStr}</strong>.`
        : `Your subscription <strong style="color:#111827;">"${planName}"</strong> has been renewed successfully. Access extended until <strong>${endDateStr}</strong>.`}
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      ${button(isFr ? "Voir mes abonnements" : "View my subscriptions", subscriptionsUrl)}
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin:0 0 24px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        ${isFr ? "Détail du paiement" : "Payment details"}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Plan</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${planName}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Cycle" : "Cycle"}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${periodLabel}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Prélevé" : "Charged"}</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:14px;">${fmtPrice} ${currency}</td></tr>
        <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${isFr ? "Prochain renouvellement" : "Next renewal"}</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px;">${endDateStr}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin:0;">
      ${isFr
        ? `Pour annuler à tout moment ou modifier votre méthode de paiement, rendez-vous dans <strong>Mes abonnements</strong>.`
        : `To cancel anytime or change your payment method, go to <strong>My subscriptions</strong>.`}
    </p>
  `, locale);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr ? `Abonnement renouvelé — ${planName}` : `Subscription renewed — ${planName}`,
    html,
  });
}

