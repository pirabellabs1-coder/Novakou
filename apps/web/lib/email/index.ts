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
  // Domain contact@novakou.com is verified — DNS configured in Vercel
  return process.env.EMAIL_FROM || "Novakou <contact@novakou.com>";
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
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;margin-bottom:40px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0;letter-spacing:1px;">LA PLATEFORME FREELANCE</p>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">L'equipe Novakou</p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        <a href="${getAppUrl()}/cgu" style="color:#006e2f;text-decoration:none;">CGU</a> ·
        <a href="${getAppUrl()}/confidentialite" style="color:#006e2f;text-decoration:none;">Confidentialite</a> ·
        <a href="${getAppUrl()}/contact" style="color:#006e2f;text-decoration:none;">Contact</a>
      </p>
      <p style="color:#d1d5db;font-size:10px;margin:12px 0 0;">© 2026 Novakou — Fondee par Lissanon Gildas</p>
    </div>
  </div>
</body>
</html>`;
}

export function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#006e2f;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:16px 0;">${text}</a>`;
}

// ── 1. Email de bienvenue ──

export async function sendWelcomeEmail(email: string, name: string, dashboardUrl?: string) {
  const profileUrl = dashboardUrl || `${getAppUrl()}/dashboard/profil`;
  const kycUrl = `${getAppUrl()}/dashboard/kyc`;
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Bienvenue sur Novakou, ${name} !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Votre compte a ete cree avec succes. Vous faites maintenant partie de la plus grande communaute
      de freelances en Afrique francophone et a l'international.
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 8px;">
      <strong>Prochaines etapes :</strong>
    </p>
    <ol style="color:#4b5563;line-height:1.8;margin:0 0 24px;padding-left:20px;">
      <li>Completez votre profil (photo, bio, competences)</li>
      <li>Verifiez votre identite pour debloquer toutes les fonctionnalites</li>
      <li>Publiez votre premier service ou explorez les offres</li>
    </ol>
    ${button("Completer mon profil", profileUrl)}
    <div style="margin:16px 0;">
      ${button("Verifier mon identite", kycUrl)}
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">
      Si vous avez des questions, n'hesitez pas a nous contacter a
      <a href="mailto:support@novakou.com" style="color:#006e2f;">support@novakou.com</a>
    </p>
    <p style="color:#4b5563;margin:24px 0 0;font-style:italic;">— Lissanon Gildas, Fondateur</p>
  `);

  return sendEmail({ to: email, subject: "Bienvenue sur Novakou !", html });
}

// ── 2. Verification email (OTP) ──

export async function sendVerificationEmail(email: string, name: string, code: string) {
  // Always log the code in dev for easy testing
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔑 CODE DE VERIFICATION pour ${email}: ${code}\n`);
  }
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Verifiez votre adresse email</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, voici votre code de verification :
    </p>
    <div style="background:#ecfdf5;border:2px solid #006e2f;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#006e2f;">${code}</span>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0;">
      Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.
    </p>
  `);

  return sendEmail({ to: email, subject: `${code} — Code de verification Novakou`, html });
}

// ── 3. Mot de passe oublie ──

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${resetToken}`;
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Reinitialiser votre mot de passe</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, vous avez demande la reinitialisation de votre mot de passe.
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
    </p>
    ${button("Reinitialiser mon mot de passe", resetUrl)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demande cette reinitialisation, ignorez cet email.
    </p>
  `);

  return sendEmail({ to: email, subject: "Reinitialiser votre mot de passe — Novakou", html });
}

// ── 4. Confirmation de commande ──

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: { id: string; serviceTitle: string; amount: number; deadline: string }
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Commande confirmee !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Bonjour ${name}, votre commande a ete enregistree avec succes.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Service</td><td style="color:#111827;font-weight:600;text-align:right;font-size:14px;">${order.serviceTitle}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Montant</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:16px;">${order.amount.toFixed(2)} EUR</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Date limite</td><td style="color:#111827;text-align:right;font-size:14px;">${order.deadline}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Reference</td><td style="color:#111827;text-align:right;font-size:14px;">${order.id}</td></tr>
      </table>
    </div>
    ${button("Voir ma commande", `${getAppUrl()}/client/commandes`)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Les fonds sont securises en escrow jusqu'a la livraison et votre validation.
    </p>
  `);

  return sendEmail({ to: email, subject: `Commande confirmee — ${order.serviceTitle}`, html });
}

// ── 5. Nouveau message ──

export async function sendNewMessageEmail(
  email: string,
  name: string,
  senderName: string,
  messagePreview: string,
  conversationUrl: string
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Nouveau message de ${senderName}</h2>
    <div style="background:#f9fafb;border-left:4px solid #006e2f;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
      <p style="color:#4b5563;margin:0;font-style:italic;">"${messagePreview.slice(0, 200)}${messagePreview.length > 200 ? "..." : ""}"</p>
    </div>
    ${button("Repondre", conversationUrl)}
  `);

  return sendEmail({ to: email, subject: `Message de ${senderName} — Novakou`, html });
}

// ── 6. Paiement recu (freelance) ──

export async function sendPaymentReceivedEmail(
  email: string,
  name: string,
  payment: { amount: number; serviceTitle: string; orderId: string }
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Paiement recu !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Bonjour ${name}, un paiement a ete credite sur votre portefeuille Novakou.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#16a34a;font-size:32px;font-weight:800;margin:0;">+${payment.amount.toFixed(2)} EUR</p>
      <p style="color:#4ade80;font-size:14px;margin:4px 0 0;">${payment.serviceTitle}</p>
    </div>
    ${button("Voir mes finances", `${getAppUrl()}/dashboard/finances`)}
  `);

  return sendEmail({ to: email, subject: `Paiement de ${payment.amount.toFixed(2)} EUR recu`, html });
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
      Bonjour ${name}, vous avez recu une nouvelle commande de <strong>${order.clientName}</strong>.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Service</td><td style="color:#111827;font-weight:600;text-align:right;font-size:14px;">${order.serviceTitle}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Montant</td><td style="color:#006e2f;font-weight:700;text-align:right;font-size:16px;">${order.amount.toFixed(2)} EUR</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Client</td><td style="color:#111827;text-align:right;font-size:14px;">${order.clientName}</td></tr>
      </table>
    </div>
    ${button("Voir la commande", `${getAppUrl()}/dashboard/commandes`)}
  `);

  return sendEmail({ to: email, subject: `Nouvelle commande — ${order.serviceTitle}`, html });
}

// ── 8. KYC approuve ──

export async function sendKycApprovedEmail(email: string, name: string, level: number) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Verification KYC approuvee !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre verification de niveau ${level} a ete approuvee avec succes.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <p style="color:#16a34a;font-size:18px;font-weight:700;margin:0;">Niveau ${level} verifie</p>
    </div>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      De nouvelles fonctionnalites sont maintenant disponibles sur votre compte.
    </p>
    ${button("Voir mon profil", `${getAppUrl()}/dashboard/profil`)}
  `);

  return sendEmail({ to: email, subject: `Verification KYC niveau ${level} approuvee`, html });
}

// ── 9. KYC refuse ──

export async function sendKycRejectedEmail(email: string, name: string, level: number, reason: string) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Verification KYC refusee</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre demande de verification de niveau ${level} n'a pas pu etre approuvee.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#dc2626;font-weight:600;margin:0 0 4px;">Motif du refus :</p>
      <p style="color:#991b1b;margin:0;">${reason}</p>
    </div>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Vous pouvez soumettre une nouvelle demande apres avoir corrige les elements mentionnes.
    </p>
    ${button("Soumettre a nouveau", `${getAppUrl()}/dashboard/kyc`)}
  `);

  return sendEmail({ to: email, subject: "Verification KYC refusee — Novakou", html });
}

// ── 10. Service approuve ──

export async function sendServiceApprovedEmail(email: string, name: string, serviceTitle: string) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Service publie !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre service <strong>"${serviceTitle}"</strong> a ete approuve par notre equipe
      et est maintenant visible sur la marketplace.
    </p>
    ${button("Voir mon service", `${getAppUrl()}/dashboard/services`)}
    <p style="color:#9ca3af;font-size:13px;margin:16px 0 0;">
      Pensez a partager votre service sur les reseaux sociaux pour attirer vos premiers clients !
    </p>
  `);

  return sendEmail({ to: email, subject: `Service publie — ${serviceTitle}`, html });
}

// ── 11. Service refuse ──

export async function sendServiceRejectedEmail(email: string, name: string, serviceTitle: string, reason: string) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Service non approuve</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, votre service <strong>"${serviceTitle}"</strong> n'a pas pu etre publie.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#dc2626;font-weight:600;margin:0 0 4px;">Motif :</p>
      <p style="color:#991b1b;margin:0;">${reason}</p>
    </div>
    ${button("Modifier mon service", `${getAppUrl()}/dashboard/services`)}
  `);

  return sendEmail({ to: email, subject: `Service non approuve — ${serviceTitle}`, html });
}

// ── 12. Livraison effectuee (notification client) ──

export async function sendDeliveryNotificationEmail(
  email: string,
  name: string,
  order: { id: string; serviceTitle: string; freelanceName: string }
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Livraison effectuee !</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Bonjour ${name}, <strong>${order.freelanceName}</strong> a livre votre commande
      pour le service <strong>"${order.serviceTitle}"</strong>.
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
      Veuillez verifier la livraison et la valider ou demander une revision.
    </p>
    ${button("Voir la livraison", `${getAppUrl()}/client/commandes`)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Si vous ne validez pas dans les 3 jours, la livraison sera automatiquement acceptee.
    </p>
  `);

  return sendEmail({ to: email, subject: `Livraison effectuee — ${order.serviceTitle}`, html });
}
