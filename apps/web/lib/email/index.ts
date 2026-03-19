// FreelanceHigh — Service d'envoi d'emails via Resend
// Tous les emails transactionnels de la plateforme

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY || "re_placeholder");
const CUSTOM_FROM = process.env.EMAIL_FROM || "FreelanceHigh <noreply@freelancehigh.com>";
const FALLBACK_FROM = "FreelanceHigh <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://freelancehigh.com";

// Helper: send email via Resend with fallback FROM address
async function sendEmail(params: { from: string; to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.log(`\n========== EMAIL (DEV MODE — Resend non configure) ==========`);
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log(`=============================================================\n`);
    return { data: { id: "dev-" + Date.now() }, error: null };
  }

  // Try with configured FROM address
  const result = await resend.emails.send(params);

  if (result.error) {
    console.error(`[EMAIL] Resend error with ${params.from}:`, result.error);

    // Retry with Resend's test address if custom domain fails
    if (params.from !== FALLBACK_FROM) {
      console.log(`[EMAIL] Retrying with fallback address: ${FALLBACK_FROM}`);
      const retryResult = await resend.emails.send({ ...params, from: FALLBACK_FROM });
      if (retryResult.error) {
        console.error("[EMAIL] Fallback also failed:", retryResult.error);
      } else {
        console.log(`[EMAIL] Sent via fallback to ${params.to} (id: ${retryResult.data?.id})`);
      }
      return retryResult;
    }
  } else {
    console.log(`[EMAIL] Sent to ${params.to} (id: ${result.data?.id})`);
  }

  return result;
}

// ── Layout HTML commun ──

function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;margin-bottom:40px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6C2BD9,#8B5CF6);padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">FreelanceHigh</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0;letter-spacing:1px;">LA PLATEFORME FREELANCE</p>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">L'equipe FreelanceHigh</p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        <a href="${APP_URL}/cgu" style="color:#6C2BD9;text-decoration:none;">CGU</a> ·
        <a href="${APP_URL}/confidentialite" style="color:#6C2BD9;text-decoration:none;">Confidentialite</a> ·
        <a href="${APP_URL}/contact" style="color:#6C2BD9;text-decoration:none;">Contact</a>
      </p>
      <p style="color:#d1d5db;font-size:10px;margin:12px 0 0;">© 2026 FreelanceHigh — Fondee par Lissanon Gildas</p>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#6C2BD9;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:16px 0;">${text}</a>`;
}

// ── 1. Email de bienvenue ──

export async function sendWelcomeEmail(email: string, name: string, dashboardUrl?: string) {
  const profileUrl = dashboardUrl || `${APP_URL}/dashboard/profil`;
  const kycUrl = `${APP_URL}/dashboard/kyc`;
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Bienvenue sur FreelanceHigh, ${name} !</h2>
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
      <a href="mailto:support@freelancehigh.com" style="color:#6C2BD9;">support@freelancehigh.com</a>
    </p>
    <p style="color:#4b5563;margin:24px 0 0;font-style:italic;">— Lissanon Gildas, Fondateur</p>
  `);

  return sendEmail({ from: CUSTOM_FROM, to: email, subject: "Bienvenue sur FreelanceHigh !", html });
}

// ── 2. Verification email (OTP) ──

export async function sendVerificationEmail(email: string, name: string, code: string) {
  // Always log the code in dev for easy testing
  if (!RESEND_API_KEY) {
    console.log(`\n🔑 CODE DE VERIFICATION pour ${email}: ${code}\n`);
  }
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Verifiez votre adresse email</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour ${name}, voici votre code de verification :
    </p>
    <div style="background:#f3f0ff;border:2px solid #6C2BD9;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#6C2BD9;">${code}</span>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0;">
      Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.
    </p>
  `);

  return sendEmail({ from: CUSTOM_FROM, to: email, subject: `${code} — Code de verification FreelanceHigh`, html });
}

// ── 3. Mot de passe oublie ──

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${APP_URL}/reinitialiser-mot-de-passe?token=${resetToken}`;
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

  return sendEmail({ from: CUSTOM_FROM, to: email, subject: "Reinitialiser votre mot de passe — FreelanceHigh", html });
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
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Montant</td><td style="color:#6C2BD9;font-weight:700;text-align:right;font-size:16px;">${order.amount.toFixed(2)} EUR</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Date limite</td><td style="color:#111827;text-align:right;font-size:14px;">${order.deadline}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Reference</td><td style="color:#111827;text-align:right;font-size:14px;">${order.id}</td></tr>
      </table>
    </div>
    ${button("Voir ma commande", `${APP_URL}/client/commandes`)}
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
      Les fonds sont securises en escrow jusqu'a la livraison et votre validation.
    </p>
  `);

  return sendEmail({ from: CUSTOM_FROM, to: email, subject: `Commande confirmee — ${order.serviceTitle}`, html });
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
    <div style="background:#f9fafb;border-left:4px solid #6C2BD9;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
      <p style="color:#4b5563;margin:0;font-style:italic;">"${messagePreview.slice(0, 200)}${messagePreview.length > 200 ? "..." : ""}"</p>
    </div>
    ${button("Repondre", conversationUrl)}
  `);

  return sendEmail({ from: CUSTOM_FROM, to: email, subject: `Message de ${senderName} — FreelanceHigh`, html });
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
      Bonjour ${name}, un paiement a ete credite sur votre portefeuille FreelanceHigh.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#16a34a;font-size:32px;font-weight:800;margin:0;">+${payment.amount.toFixed(2)} EUR</p>
      <p style="color:#4ade80;font-size:14px;margin:4px 0 0;">${payment.serviceTitle}</p>
    </div>
    ${button("Voir mes finances", `${APP_URL}/dashboard/finances`)}
  `);

  return sendEmail({ from: CUSTOM_FROM, to: email, subject: `Paiement de ${payment.amount.toFixed(2)} EUR recu`, html });
}
