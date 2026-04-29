// Novakou — Service d'envoi d'emails via Resend
// Tous les emails transactionnels de la plateforme

// Lazy init — env vars may not be available at module load time on Vercel
let _resend: InstanceType<typeof import("resend").Resend> | null = null;
function getResend() {
  if (!_resend) {
    const { Resend } = require("resend") as typeof import("resend");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(apiKey);
  }
  return _resend;
}

function getFromAddress(): string {
  // Domain support@novakou.com is verified — DNS configured in Vercel
  return process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
}

// Helper: send email via Resend (exported for admin-emails.ts)
export async function sendEmail(params: { from?: string; to: string; subject: string; html: string }) {
  const from = params.from ?? getFromAddress();

  if (!process.env.RESEND_API_KEY) {
    console.log(`\n========== EMAIL (DEV MODE — Resend non configure) ==========`);
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log(`From: ${from}`);
    console.log(`=============================================================\n`);
    return { data: { id: "dev-" + Date.now() }, error: null };
  }

  try {
    const resend = getResend();
    const result = await resend.emails.send({ ...params, from });

    if (result.error) {
      console.error(`[EMAIL FAIL] To: ${params.to} | Subject: ${params.subject} | From: ${from} | Error:`, result.error);
    } else {
      console.log(`[EMAIL OK] To: ${params.to} | Subject: ${params.subject} | ID: ${result.data?.id}`);
    }

    return result;
  } catch (err) {
    console.error(`[EMAIL EXCEPTION] To: ${params.to} | Subject: ${params.subject} |`, err);
    return { data: null, error: err };
  }
}

// ── Layout HTML commun ──

export function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;margin-bottom:40px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background:#ffffff;padding:24px 40px;text-align:center;border-bottom:1px solid #e5e7eb;">
      <img src="${getAppUrl()}/apple-icon" alt="Novakou" width="56" height="56" style="display:inline-block;border-radius:12px;vertical-align:middle;" />
      <span style="display:inline-block;vertical-align:middle;margin-left:12px;color:#111827;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Novakou</span>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">L'équipe Novakou</p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        <a href="${getAppUrl()}/cgu" style="color:#006e2f;text-decoration:none;">CGU</a> ·
        <a href="${getAppUrl()}/confidentialite" style="color:#006e2f;text-decoration:none;">Confidentialité</a> ·
        <a href="${getAppUrl()}/contact" style="color:#006e2f;text-decoration:none;">Contact</a>
      </p>
      <p style="color:#d1d5db;font-size:10px;margin:12px 0 0;">© 2026 Novakou — Éditée par Pirabel Labs</p>
    </div>
  </div>
</body>
</html>`;
}

export function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#006e2f;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:16px 0;">${text}</a>`;
}

// ── 1. Email de bienvenue ──

export type FormationsRole = "instructeur" | "apprenant" | "mentor" | "affilie";

function welcomeContentFor(role: FormationsRole | undefined) {
  const base = getAppUrl();
  switch (role) {
    case "instructeur":
      return {
        intro: "Votre compte vendeur est activé. Vous pouvez désormais publier vos formations, e-books, templates et services de coaching, et toucher des milliers d'apprenants en Afrique francophone.",
        steps: [
          "Complétez votre profil et personnalisez votre boutique",
          "Publiez votre première formation ou produit numérique",
          "Configurez votre méthode de retrait (Mobile Money, Wave, virement)",
        ],
        primary: { label: "Accéder à mon espace vendeur", url: `${base}/vendeur/dashboard` },
        secondary: { label: "Compléter mon profil", url: `${base}/vendeur/parametres` },
      };
    case "apprenant":
      return {
        intro: "Votre compte est activé. Vous avez maintenant accès à des centaines de formations, e-books et produits numériques créés par les meilleurs créateurs d'Afrique francophone.",
        steps: [
          "Explorez le catalogue de formations et produits",
          "Complétez votre profil pour personnaliser vos recommandations",
          "Sauvegardez vos favoris et reprenez votre apprentissage à tout moment",
        ],
        primary: { label: "Explorer le catalogue", url: `${base}/explorer` },
        secondary: { label: "Mon espace apprenant", url: `${base}/apprenant/dashboard` },
      };
    case "mentor":
      return {
        intro: "Votre compte mentor est activé. Vous pouvez désormais proposer des sessions de coaching 1-to-1 aux apprenants et monétiser votre expertise.",
        steps: [
          "Complétez votre profil mentor (expertise, expérience, tarif)",
          "Définissez vos disponibilités hebdomadaires",
          "Recevez vos premières demandes de session",
        ],
        primary: { label: "Accéder à mon espace mentor", url: `${base}/mentor/dashboard` },
        secondary: { label: "Compléter mon profil", url: `${base}/mentor/profil` },
      };
    case "affilie":
      return {
        intro: "Votre compte affilié est activé. Vous pouvez désormais promouvoir les meilleurs produits de la plateforme et toucher jusqu'à 40 % de commission sur chaque vente.",
        steps: [
          "Récupérez votre lien d'affiliation unique",
          "Choisissez les produits à promouvoir dans le catalogue",
          "Suivez vos clics, ventes et commissions en temps réel",
        ],
        primary: { label: "Accéder à mon espace affilié", url: `${base}/affilie/dashboard` },
        secondary: { label: "Voir le catalogue à promouvoir", url: `${base}/explorer` },
      };
    default:
      return {
        intro: "Votre compte a été créé avec succès. Bienvenue sur la plateforme qui réunit les meilleurs créateurs digitaux d'Afrique francophone : formations, e-books, templates, coaching.",
        steps: [
          "Complétez votre profil",
          "Choisissez votre espace : vendeur, apprenant, mentor ou affilié",
          "Découvrez le catalogue et la communauté",
        ],
        primary: { label: "Accéder à mon compte", url: `${base}/apprenant/dashboard` },
        secondary: { label: "Explorer le catalogue", url: `${base}/explorer` },
      };
  }
}

export async function sendWelcomeEmail(email: string, name: string, role?: FormationsRole) {
  const c = welcomeContentFor(role);
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Bienvenue sur Novakou, ${name} !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">${c.intro}</p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 8px;"><strong>Prochaines étapes :</strong></p>
    <ol style="color:#4b5563;line-height:1.8;margin:0 0 24px;padding-left:20px;">
      ${c.steps.map((s) => `<li>${s}</li>`).join("")}
    </ol>
    ${button(c.primary.label, c.primary.url)}
    <div style="margin:16px 0;">
      ${button(c.secondary.label, c.secondary.url)}
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">
      Une question ? Écrivez-nous à
      <a href="mailto:support@novakou.com" style="color:#006e2f;">support@novakou.com</a>
    </p>
    <p style="color:#4b5563;margin:24px 0 0;font-style:italic;">— L'équipe Novakou</p>
  `);

  return sendEmail({ to: email, subject: "Bienvenue sur Novakou !", html });
}

// ── 2. Verification email (OTP) ──

export async function sendVerificationEmail(email: string, name: string, code: string) {
  // Always log the code in dev for easy testing
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔑 CODE DE VÉRIFICATION pour ${email}: ${code}\n`);
  }
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Vérifiez votre adresse email</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${escapeHtml(name)}, voici votre code de vérification :
    </p>
    <div style="background:#ecfdf5;border:2px solid #006e2f;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#006e2f;">${escapeHtml(code)}</span>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0;">
      Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.
    </p>
  `);

  return sendEmail({ to: email, subject: `${code} — Code de vérification Novakou`, html });
}

// ── 3. Mot de passe oublie ──

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${encodeURIComponent(resetToken)}`;
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Réinitialiser votre mot de passe</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${escapeHtml(name)}, vous avez demandé la réinitialisation de votre mot de passe.
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
    </p>
    ${button("Réinitialiser mon mot de passe", resetUrl)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>
  `);

  return sendEmail({ to: email, subject: "Réinitialiser votre mot de passe — Novakou", html });
}

// ── 4. Confirmation de commande ──

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: { id: string; serviceTitle: string; amount: number; deadline: string }
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Commande confirmée !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Bonjour ${escapeHtml(name)}, votre commande a été enregistrée avec succès.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Service</td><td style="color:#111827;font-weight:600;text-align:right;font-size:14px;">${escapeHtml(order.serviceTitle)}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Montant</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:16px;">${order.amount.toFixed(2)} EUR</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Date limite</td><td style="color:#111827;text-align:right;font-size:14px;">${escapeHtml(order.deadline)}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Référence</td><td style="color:#111827;text-align:right;font-size:14px;">${escapeHtml(order.id)}</td></tr>
      </table>
    </div>
    ${button("Voir ma commande", `${getAppUrl()}/client/commandes`)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Les fonds sont sécurisés en escrow jusqu'à la livraison et votre validation.
    </p>
  `);

  return sendEmail({ to: email, subject: `Commande confirmée — ${order.serviceTitle}`, html });
}

// ── 5. Nouveau message ──

export async function sendNewMessageEmail(
  email: string,
  name: string,
  senderName: string,
  messagePreview: string,
  conversationUrl: string
) {
  // XSS hardening: senderName + messagePreview are user input. They MUST be
  // escaped before being interpolated in HTML — otherwise a "name" with
  // <script> would execute in every recipient inbox that supports JS.
  const safeSender = escapeHtml(senderName);
  const safePreview = escapeHtml(messagePreview.slice(0, 200)) + (messagePreview.length > 200 ? "…" : "");
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Nouveau message de ${safeSender}</h2>
    <div style="background:#f9fafb;border-left:4px solid #006e2f;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
      <p style="color:#4b5563;margin:0;font-style:italic;">«&nbsp;${safePreview}&nbsp;»</p>
    </div>
    ${button("Répondre", conversationUrl)}
  `);

  // Subject lines are plain text (not HTML); escaping isn't needed there but
  // we still strip newlines to prevent header injection attempts.
  const safeSenderSubject = senderName.replace(/[\r\n]/g, " ").slice(0, 60);
  return sendEmail({ to: email, subject: `Message de ${safeSenderSubject} — Novakou`, html });
}

// ── 6. Paiement recu (freelance) ──

export async function sendPaymentReceivedEmail(
  email: string,
  name: string,
  payment: { amount: number; serviceTitle: string; orderId: string }
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Paiement reçu !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Bonjour ${escapeHtml(name)}, un paiement a été crédité sur votre portefeuille Novakou.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#16a34a;font-size:32px;font-weight:800;margin:0;">+${payment.amount.toFixed(2)} EUR</p>
      <p style="color:#4ade80;font-size:14px;margin:4px 0 0;">${escapeHtml(payment.serviceTitle)}</p>
    </div>
    ${button("Voir mes finances", `${getAppUrl()}/dashboard/finances`)}
  `);

  return sendEmail({ to: email, subject: `Paiement de ${payment.amount.toFixed(2)} EUR reçu`, html });
}

// ── 7. Nouvelle commande recue (freelance) ──

export async function sendNewOrderFreelanceEmail(
  email: string,
  name: string,
  order: { id: string; serviceTitle: string; amount: number; clientName: string }
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Nouvelle commande !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Bonjour ${escapeHtml(name)}, vous avez reçu une nouvelle commande de <strong>${escapeHtml(order.clientName)}</strong>.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Service</td><td style="color:#111827;font-weight:600;text-align:right;font-size:14px;">${escapeHtml(order.serviceTitle)}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Montant</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:16px;">${order.amount.toFixed(2)} EUR</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Client</td><td style="color:#111827;text-align:right;font-size:14px;">${escapeHtml(order.clientName)}</td></tr>
      </table>
    </div>
    ${button("Voir la commande", `${getAppUrl()}/dashboard/commandes`)}
  `);

  return sendEmail({ to: email, subject: `Nouvelle commande — ${order.serviceTitle}`, html });
}

// ── 8. KYC approuve ──

export async function sendKycApprovedEmail(email: string, name: string, level: number) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Vérification KYC approuvée !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${escapeHtml(name)}, votre vérification de niveau ${level} a été approuvée avec succès.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <p style="color:#16a34a;font-size:18px;font-weight:700;margin:0;">Niveau ${level} vérifié</p>
    </div>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      De nouvelles fonctionnalités sont maintenant disponibles sur votre compte.
    </p>
    ${button("Voir mon profil", `${getAppUrl()}/dashboard/profil`)}
  `);

  return sendEmail({ to: email, subject: `Vérification KYC niveau ${level} approuvée`, html });
}

// ── 9. KYC refuse ──

export async function sendKycRejectedEmail(email: string, name: string, level: number, reason: string) {
  // XSS hardening: `reason` is admin-supplied free text — escape before
  // interpolating into HTML so a malicious admin (or a copy-paste with
  // angle brackets) can't ship JS to the recipient.
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Vérification KYC refusée</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${escapeHtml(name)}, votre demande de vérification de niveau ${level} n'a pas pu être approuvée.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#dc2626;font-weight:600;margin:0 0 4px;">Motif du refus :</p>
      <p style="color:#991b1b;margin:0;">${escapeHtml(reason)}</p>
    </div>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Vous pouvez soumettre une nouvelle demande après avoir corrigé les éléments mentionnés.
    </p>
    ${button("Soumettre à nouveau", `${getAppUrl()}/kyc`)}
  `);

  return sendEmail({ to: email, subject: "Vérification KYC refusée — Novakou", html });
}

// ── 10. Service approuve ──

export async function sendServiceApprovedEmail(email: string, name: string, serviceTitle: string) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Service publié !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${escapeHtml(name)}, votre service <strong>«&nbsp;${escapeHtml(serviceTitle)}&nbsp;»</strong> a été approuvé par notre équipe
      et est maintenant visible sur la marketplace.
    </p>
    ${button("Voir mon service", `${getAppUrl()}/dashboard/services`)}
    <p style="color:#9ca3af;font-size:13px;margin:16px 0 0;">
      Pensez à partager votre service sur les réseaux sociaux pour attirer vos premiers clients !
    </p>
  `);

  return sendEmail({ to: email, subject: `Service publié — ${serviceTitle}`, html });
}

// ── 11. Service refuse ──

export async function sendServiceRejectedEmail(email: string, name: string, serviceTitle: string, reason: string) {
  // Same XSS hardening rationale as KYC rejection.
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Service non approuvé</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${escapeHtml(name)}, votre service <strong>«&nbsp;${escapeHtml(serviceTitle)}&nbsp;»</strong> n'a pas pu être publié.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#dc2626;font-weight:600;margin:0 0 4px;">Motif :</p>
      <p style="color:#991b1b;margin:0;">${escapeHtml(reason)}</p>
    </div>
    ${button("Modifier mon service", `${getAppUrl()}/dashboard/services`)}
  `);

  return sendEmail({ to: email, subject: `Service non approuvé — ${serviceTitle}`, html });
}

// ── 12. Livraison effectuee (notification client) ──

export async function sendDeliveryNotificationEmail(
  email: string,
  name: string,
  order: { id: string; serviceTitle: string; freelanceName: string }
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Livraison effectuée !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Bonjour ${escapeHtml(name)}, <strong>${escapeHtml(order.freelanceName)}</strong> a livré votre commande
      pour le service <strong>«&nbsp;${escapeHtml(order.serviceTitle)}&nbsp;»</strong>.
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Veuillez vérifier la livraison et la valider ou demander une révision.
    </p>
    ${button("Voir la livraison", `${getAppUrl()}/client/commandes`)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Si vous ne validez pas dans les 3 jours, la livraison sera automatiquement acceptée.
    </p>
  `);

  return sendEmail({ to: email, subject: `Livraison effectuée — ${order.serviceTitle}`, html });
}

// ── Nouvelle connexion — alerte de sécurité ──

export async function sendLoginAlertEmail(params: {
  email: string;
  name: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  timestamp?: Date;
  method?: "credentials" | "google" | "linkedin";
}) {
  const ts = params.timestamp ?? new Date();
  const dateStr = ts.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = ts.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const methodLabel =
    params.method === "google"
      ? "Google"
      : params.method === "linkedin"
        ? "LinkedIn"
        : "Email + mot de passe";

  const securityUrl = `${getAppUrl()}/apprenant/parametres?tab=securite`;
  const passwordResetUrl = `${getAppUrl()}/mot-de-passe-oublie`;

  const html = emailLayout(`
    <div style="text-align:center;margin-bottom:8px;">
      <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#006e2f,#22c55e);border-radius:50%;text-align:center;line-height:56px;margin-bottom:16px;">
        <span style="color:#ffffff;font-size:28px;">🔐</span>
      </div>
    </div>
    <h2 style="color:#111827;font-size:22px;margin:0 0 8px;text-align:center;">Nouvelle connexion à votre compte</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;text-align:center;">
      Bonjour ${name(params.name)}, une nouvelle session vient d'être ouverte.
    </p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 20px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;width:120px;">Date & heure</td>
          <td style="padding:8px 0;color:#111827;font-weight:600;">${dateStr} à ${timeStr}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Méthode</td>
          <td style="padding:8px 0;color:#111827;font-weight:600;border-top:1px solid #e5e7eb;">${methodLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Appareil</td>
          <td style="padding:8px 0;color:#111827;font-weight:600;border-top:1px solid #e5e7eb;">${escapeHtml(params.browser)} sur ${escapeHtml(params.os)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Type</td>
          <td style="padding:8px 0;color:#111827;font-weight:600;border-top:1px solid #e5e7eb;">${escapeHtml(params.device)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Adresse IP</td>
          <td style="padding:8px 0;color:#111827;font-weight:600;border-top:1px solid #e5e7eb;font-family:monospace;">${escapeHtml(params.ip)}</td>
        </tr>
      </table>
    </div>

    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;margin:0 0 24px;">
      <p style="color:#065f46;font-size:13px;margin:0;line-height:1.6;">
        <strong>C'était vous ?</strong> Aucune action n'est nécessaire. Bonne navigation sur Novakou.
      </p>
    </div>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:0 0 24px;">
      <p style="color:#991b1b;font-size:13px;margin:0 0 12px;line-height:1.6;">
        <strong>Ce n'était pas vous ?</strong> Votre compte est peut-être compromis. Agissez immédiatement :
      </p>
      <ol style="color:#7f1d1d;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
        <li>Changez votre mot de passe</li>
        <li>Activez l'authentification à deux facteurs (2FA)</li>
        <li>Vérifiez les sessions actives et les paramètres du compte</li>
      </ol>
    </div>

    <div style="text-align:center;">
      ${button("Sécuriser mon compte", securityUrl)}
    </div>

    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0;">
      Changer votre mot de passe :
      <a href="${passwordResetUrl}" style="color:#006e2f;text-decoration:none;">${passwordResetUrl}</a>
    </p>
  `);

  return sendEmail({
    to: params.email,
    subject: `🔐 Nouvelle connexion — ${params.browser} sur ${params.os}`,
    html,
  });
}

// Tiny helpers
function name(n?: string | null): string {
  return escapeHtml((n ?? "").split(" ")[0] || "");
}
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
