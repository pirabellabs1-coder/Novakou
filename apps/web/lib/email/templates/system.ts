/**
 * Novakou — Email Templates : Systeme (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  errorBoxDark, infoDark,
} from "@/lib/email/layout-dark";

// ── system.welcome → email utilisateur ──
export async function sendWelcomeDarkEmail(email: string, name: string, dashboardUrl?: string) {
  const profileUrl = dashboardUrl || `${getAppUrl()}/dashboard/profil`;
  const kycUrl = `${getAppUrl()}/dashboard/kyc`;
  const html = emailLayoutDark(`
    ${headingDark(`Bienvenue sur Novakou, ${name} !`)}
    ${textDark("Votre compte a ete cree avec succes. Vous faites maintenant partie de la plus grande communaute de freelances en Afrique francophone et a l'international.")}
    ${textDark("<strong style='color:#F1F5F9;'>Prochaines etapes :</strong>")}
    <ol style="color:#CBD5E1;line-height:1.8;margin:0 0 24px;padding-left:20px;">
      <li>Completez votre profil (photo, bio, competences)</li>
      <li>Verifiez votre identite pour debloquer toutes les fonctionnalites</li>
      <li>Publiez votre premier service ou explorez les offres</li>
    </ol>
    ${buttonDark("Completer mon profil", profileUrl)}
    <div style="margin:16px 0;">
      ${buttonDark("Verifier mon identite", kycUrl, "green")}
    </div>
    ${mutedDark(`Si vous avez des questions, n'hesitez pas a nous contacter a <a href="mailto:support@novakou.com" style="color:#8B5CF6;">support@novakou.com</a>`)}
    <p style="color:#CBD5E1;margin:24px 0 0;font-style:italic;">— Lissanon Gildas, Fondateur</p>
  `);
  return sendEmail({ to: email, subject: "Bienvenue sur Novakou !", html });
}

// ── system.email_verification → email utilisateur ──
export async function sendVerificationDarkEmail(email: string, name: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔑 CODE DE VERIFICATION pour ${email}: ${code}\n`);
  }
  const html = emailLayoutDark(`
    ${headingDark("Verifiez votre adresse email")}
    ${textDark(`Bonjour ${name}, voici votre code de verification :`)}
    <div style="background:#111827;border:2px solid #8B5CF6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#8B5CF6;">${code}</span>
    </div>
    ${mutedDark("Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.")}
  `);
  return sendEmail({ to: email, subject: `${code} — Code de verification Novakou`, html });
}

// ── system.password_reset → email utilisateur ──
export async function sendPasswordResetDarkEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${resetToken}`;
  const html = emailLayoutDark(`
    ${headingDark("Reinitialiser votre mot de passe")}
    ${textDark(`Bonjour ${name}, vous avez demande la reinitialisation de votre mot de passe.`)}
    ${textDark("Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :")}
    ${buttonDark("Reinitialiser mon mot de passe", resetUrl)}
    ${mutedDark("Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demande cette reinitialisation, ignorez cet email.")}
  `);
  return sendEmail({ to: email, subject: "Reinitialiser votre mot de passe — Novakou", html });
}

// ── system.account_suspended → email utilisateur ──
export async function sendAccountSuspendedDarkEmail(email: string, name: string, reason?: string) {
  const html = emailLayoutDark(`
    ${headingDark("Compte suspendu")}
    ${textDark(`Bonjour ${name}, votre compte Novakou a ete temporairement suspendu.`)}
    ${reason ? errorBoxDark("Motif", reason) : ""}
    ${textDark("Si vous pensez que cette suspension est une erreur, contactez notre equipe de support.")}
    ${buttonDark("Contacter le support", `${getAppUrl()}/contact`, "red")}
  `);
  return sendEmail({ to: email, subject: "Compte suspendu — Novakou", html });
}

// ── system.account_banned → email utilisateur ──
export async function sendAccountBannedDarkEmail(email: string, name: string, reason?: string) {
  const html = emailLayoutDark(`
    ${headingDark("Compte banni")}
    ${textDark(`Bonjour ${name}, votre compte Novakou a ete definitivement banni.`)}
    ${reason ? errorBoxDark("Motif", reason) : ""}
    ${buttonDark("Contacter le support", `${getAppUrl()}/contact`, "red")}
  `);
  return sendEmail({ to: email, subject: "Compte banni — Novakou", html });
}
