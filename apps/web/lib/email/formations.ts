// Novakou — Emails transactionnels pour la section Formations

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
// Domain contact@novakou.com is verified — DNS configured in Vercel
const FROM = process.env.EMAIL_FROM || "Novakou <contact@novakou.com>";
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
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:40px;margin-bottom:40px;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <!-- Header -->
    <div style="background:${headerBg};padding:40px 40px 32px;text-align:center;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.15);padding:14px;margin:0 auto 12px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#ffffff;text-align:center;line-height:28px;color:#006e2f;font-weight:900;font-size:18px;">N</div>
      </div>
      <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0;letter-spacing:-0.5px;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:11px;margin:6px 0 0;letter-spacing:2px;font-weight:600;">LA PLATEFORME DES CRÉATEURS</p>
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
  const courseUrl = autoLoginLink(coursePath);
  const myCoursesUrl = autoLoginLink("/apprenant/mes-formations");

  const html = emailLayout(
    `
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;font-size:56px;margin:0 0 8px;">🎉</div>
      <h2 style="color:#111827;font-size:26px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">
        ${isFr ? `Bienvenue ${name} !` : `Welcome ${name}!`}
      </h2>
      <p style="color:#006e2f;font-size:15px;font-weight:700;margin:0;">
        ${isFr ? "Votre aventure commence maintenant 🚀" : "Your journey starts now 🚀"}
      </p>
    </div>

    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 20px;">
      ${isFr
        ? `Merci d'avoir fait confiance à Novakou. Votre achat de <strong style="color:#006e2f;">"${formationTitle}"</strong> est confirmé — vous avez <strong>un accès à vie</strong> au contenu complet, incluant toutes les leçons vidéo, ressources et mises à jour futures.`
        : `Thank you for trusting Novakou. Your purchase of <strong style="color:#006e2f;">"${formationTitle}"</strong> is confirmed — you now have <strong>lifetime access</strong> to all lessons, resources, and future updates.`
      }
    </p>

    <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:2px solid #bbf7d0;border-radius:16px;padding:24px;margin:0 0 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#4b5563;padding:6px 0;font-size:13px;">${isFr ? "📚 Formation" : "📚 Course"}</td>
          <td style="color:#111827;font-weight:700;text-align:right;font-size:14px;">${formationTitle}</td>
        </tr>
        <tr>
          <td style="color:#4b5563;padding:6px 0;font-size:13px;">${isFr ? "💳 Montant payé" : "💳 Amount paid"}</td>
          <td style="color:#006e2f;font-weight:800;text-align:right;font-size:16px;">${Math.round(paidAmount).toLocaleString("fr-FR")} FCFA</td>
        </tr>
        <tr>
          <td style="color:#4b5563;padding:6px 0;font-size:13px;">${isFr ? "♾️ Accès" : "♾️ Access"}</td>
          <td style="color:#16a34a;font-weight:700;text-align:right;font-size:13px;">${isFr ? "À vie + mises à jour" : "Lifetime + updates"}</td>
        </tr>
        <tr>
          <td style="color:#4b5563;padding:6px 0;font-size:13px;">${isFr ? "🛡️ Garantie" : "🛡️ Guarantee"}</td>
          <td style="color:#6b7280;font-weight:600;text-align:right;font-size:13px;">${isFr ? "Satisfait ou remboursé 30j" : "30-day money back"}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:0 0 24px;">
      ${button(isFr ? "🎬 Commencer la formation" : "🎬 Start learning", courseUrl)}
      <div style="margin:12px 0 0;">
        <a href="${myCoursesUrl}" style="color:#006e2f;font-size:13px;font-weight:600;text-decoration:none;">
          ${isFr ? "Ou voir toutes mes formations →" : "Or see all my courses →"}
        </a>
      </div>
    </div>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:0 0 16px;">
      <p style="color:#92400e;font-size:13px;line-height:1.6;margin:0;">
        💡 <strong>${isFr ? "Déjà un compte vendeur ?" : "Already a vendor account?"}</strong>
        ${isFr
          ? `Pas de souci — le lien ci-dessus vous connecte automatiquement dans la bonne section apprenant. Votre compte vendeur reste intact.`
          : `No worries — the link above automatically logs you into the learner section. Your vendor account stays untouched.`
        }
      </p>
    </div>

    <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:16px 0 0;text-align:center;">
      ${isFr
        ? `Besoin d'aide ? Réponds simplement à ce mail, on est là pour toi.`
        : `Need help? Just reply to this email, we're here for you.`
      }
    </p>
  `,
    locale,
    "celebration"
  );

  const subject = isFr
    ? `🎉 Bienvenue dans "${formationTitle}" — c'est parti !`
    : `🎉 Welcome to "${formationTitle}" — let's go!`;

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
  const commission = paidAmount - netAmount;
  const dashboardUrl = autoLoginLink("/vendeur/dashboard");
  const transactionsUrl = autoLoginLink("/vendeur/transactions");

  const html = emailLayout(`
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;font-size:64px;margin:0 0 4px;line-height:1;">🎉💰</div>
      <h2 style="color:#111827;font-size:30px;font-weight:900;margin:0 0 8px;letter-spacing:-0.8px;">
        WAOUH ${instructeurName} !
      </h2>
      <p style="color:#006e2f;font-size:17px;font-weight:700;margin:0;">
        Vous venez de faire une nouvelle vente 🚀
      </p>
    </div>

    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 24px;text-align:center;">
      <strong style="color:#111827;">${studentName}</strong> vient d'acheter<br>
      <strong style="color:#006e2f;font-size:17px;">"${formationTitle}"</strong>
    </p>

    <!-- GRAND MONTANT CÉLÉBRATION -->
    <div style="background:linear-gradient(135deg,#006e2f 0%,#22c55e 50%,#10b981 100%);border-radius:20px;padding:36px 20px;text-align:center;margin:0 0 24px;box-shadow:0 12px 32px rgba(0,110,47,0.3);">
      <p style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:700;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">
        💵 Vos revenus nets
      </p>
      <p style="color:#ffffff;font-size:48px;font-weight:900;margin:0;letter-spacing:-1.5px;line-height:1;">
        +${Math.round(netAmount).toLocaleString("fr-FR")}
      </p>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;font-weight:700;margin:4px 0 0;">
        FCFA · Crédité sur votre wallet
      </p>
    </div>

    <!-- Détails -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6b7280;padding:6px 0;font-size:13px;">💳 Prix de vente</td>
          <td style="color:#111827;font-weight:700;text-align:right;font-size:14px;">${Math.round(paidAmount).toLocaleString("fr-FR")} FCFA</td>
        </tr>
        <tr>
          <td style="color:#6b7280;padding:6px 0;font-size:13px;">📊 Commission Novakou (5%)</td>
          <td style="color:#9ca3af;font-weight:600;text-align:right;font-size:13px;">−${Math.round(commission).toLocaleString("fr-FR")} FCFA</td>
        </tr>
        <tr style="border-top:2px solid #e5e7eb;">
          <td style="color:#006e2f;font-weight:700;padding:10px 0 0;font-size:14px;">✅ Votre net</td>
          <td style="color:#006e2f;font-weight:900;text-align:right;font-size:17px;padding:10px 0 0;">+${Math.round(netAmount).toLocaleString("fr-FR")} FCFA</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:0 0 20px;">
      ${button("📊 Voir mes ventes", transactionsUrl)}
      <div style="margin:12px 0 0;">
        <a href="${dashboardUrl}" style="color:#006e2f;font-size:13px;font-weight:600;text-decoration:none;">
          Accéder à mon dashboard vendeur →
        </a>
      </div>
    </div>

    <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:16px 0 0;">
      <p style="color:#78350f;font-size:13px;line-height:1.6;margin:0;">
        💡 <strong>Prochain objectif :</strong> ${Math.round(netAmount * 10).toLocaleString("fr-FR")} FCFA (10 ventes comme celle-ci).
        Partage ta formation sur WhatsApp, LinkedIn ou tes réseaux pour booster les ventes.
      </p>
    </div>
  `, "fr", "celebration");

  return resend.emails.send({
    from: FROM,
    to: instructeurEmail,
    subject: `🎉 WAOUH ! Nouvelle vente : +${Math.round(netAmount).toLocaleString("fr-FR")} FCFA`,
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
  locale?: "fr" | "en";
}) {
  const { email, name, productTitle, downloadUrl, locale = "fr" } = params;
  const isFr = locale === "fr";
  const myProductsUrl = autoLoginLink("/apprenant/mes-produits");

  const html = emailLayout(
    `
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;font-size:56px;margin:0 0 8px;">📦✨</div>
      <h2 style="color:#111827;font-size:26px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">
        ${isFr ? `Merci ${name} !` : `Thank you ${name}!`}
      </h2>
      <p style="color:#006e2f;font-size:15px;font-weight:700;margin:0;">
        ${isFr ? "Votre produit est prêt à être téléchargé 🎁" : "Your product is ready to download 🎁"}
      </p>
    </div>

    <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 20px;text-align:center;">
      ${isFr
        ? `Votre achat de <strong style="color:#006e2f;">"${productTitle}"</strong> est confirmé. Cliquez sur le bouton ci-dessous pour y accéder — c'est à vous, pour toujours.`
        : `Your purchase of <strong style="color:#006e2f;">"${productTitle}"</strong> is confirmed. Click below to access it — it's yours, forever.`
      }
    </p>

    <!-- GRAND CTA DOWNLOAD -->
    <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:2px dashed #22c55e;border-radius:16px;padding:32px 20px;text-align:center;margin:0 0 24px;">
      <p style="color:#006e2f;font-size:13px;font-weight:800;letter-spacing:1.5px;margin:0 0 16px;text-transform:uppercase;">
        ${isFr ? "🎁 Votre fichier est prêt" : "🎁 Your file is ready"}
      </p>
      ${button(isFr ? "📥 Télécharger maintenant" : "📥 Download now", downloadUrl)}
      <p style="color:#6b7280;font-size:12px;margin:12px 0 0;">
        ${isFr ? "Lien sécurisé · Téléchargement immédiat" : "Secure link · Instant download"}
      </p>
    </div>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="${myProductsUrl}" style="color:#006e2f;font-size:14px;font-weight:700;text-decoration:none;">
        ${isFr ? "📚 Voir tous mes achats →" : "📚 See all my purchases →"}
      </a>
    </div>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:0 0 16px;">
      <p style="color:#92400e;font-size:13px;line-height:1.6;margin:0;">
        💡 <strong>${isFr ? "Vous êtes aussi vendeur ?" : "Are you also a vendor?"}</strong>
        ${isFr
          ? `Pas de problème — le lien vous connecte automatiquement dans votre espace apprenant. Votre compte vendeur reste séparé et accessible depuis le menu en haut à droite.`
          : `No problem — the link logs you into your learner space. Your vendor account stays separate and accessible from the top menu.`
        }
      </p>
    </div>

    <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:16px 0 0;text-align:center;">
      ${isFr
        ? `Besoin d'aide ? Réponds à ce mail, on t'aide tout de suite.`
        : `Need help? Reply to this email, we'll help right away.`
      }
    </p>
  `,
    locale,
    "celebration"
  );

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: isFr
      ? `🎁 "${productTitle}" — votre téléchargement est prêt !`
      : `🎁 "${productTitle}" — your download is ready!`,
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
