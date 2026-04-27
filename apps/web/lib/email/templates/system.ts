/**
 * Novakou — Email Templates : Système (dark mode)
 */

import { sendEmail, getAppUrl, type FormationsRole } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  errorBoxDark,
} from "@/lib/email/layout-dark";

function welcomeContentDarkFor(role: FormationsRole | undefined) {
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

// ── system.welcome → email utilisateur ──
export async function sendWelcomeDarkEmail(email: string, name: string, role?: FormationsRole) {
  const c = welcomeContentDarkFor(role);
  const html = emailLayoutDark(`
    ${headingDark(`Bienvenue sur Novakou, ${name} !`)}
    ${textDark(c.intro)}
    ${textDark("<strong style='color:#F1F5F9;'>Prochaines étapes :</strong>")}
    <ol style="color:#CBD5E1;line-height:1.8;margin:0 0 24px;padding-left:20px;">
      ${c.steps.map((s) => `<li>${s}</li>`).join("")}
    </ol>
    ${buttonDark(c.primary.label, c.primary.url)}
    <div style="margin:16px 0;">
      ${buttonDark(c.secondary.label, c.secondary.url, "green")}
    </div>
    ${mutedDark(`Une question ? Écrivez-nous à <a href="mailto:support@novakou.com" style="color:#22c55e;">support@novakou.com</a>`)}
    <p style="color:#CBD5E1;margin:24px 0 0;font-style:italic;">— L'équipe Novakou</p>
  `);
  return sendEmail({ to: email, subject: "Bienvenue sur Novakou !", html });
}

// ── system.email_verification → email utilisateur ──
export async function sendVerificationDarkEmail(email: string, name: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔑 CODE DE VÉRIFICATION pour ${email}: ${code}\n`);
  }
  const html = emailLayoutDark(`
    ${headingDark("Vérifiez votre adresse email")}
    ${textDark(`Bonjour ${name}, voici votre code de vérification :`)}
    <div style="background:#111827;border:2px solid #22c55e;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#22c55e;">${code}</span>
    </div>
    ${mutedDark("Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.")}
  `);
  return sendEmail({ to: email, subject: `${code} — Code de vérification Novakou`, html });
}

// ── system.password_reset → email utilisateur ──
export async function sendPasswordResetDarkEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${resetToken}`;
  const html = emailLayoutDark(`
    ${headingDark("Réinitialiser votre mot de passe")}
    ${textDark(`Bonjour ${name}, vous avez demandé la réinitialisation de votre mot de passe.`)}
    ${textDark("Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :")}
    ${buttonDark("Réinitialiser mon mot de passe", resetUrl)}
    ${mutedDark("Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.")}
  `);
  return sendEmail({ to: email, subject: "Réinitialiser votre mot de passe — Novakou", html });
}

// ── system.account_suspended → email utilisateur ──
export async function sendAccountSuspendedDarkEmail(email: string, name: string, reason?: string) {
  const html = emailLayoutDark(`
    ${headingDark("Compte suspendu")}
    ${textDark(`Bonjour ${name}, votre compte Novakou a été temporairement suspendu.`)}
    ${reason ? errorBoxDark("Motif", reason) : ""}
    ${textDark("Si vous pensez que cette suspension est une erreur, contactez notre équipe de support.")}
    ${buttonDark("Contacter le support", `${getAppUrl()}/contact`, "red")}
  `);
  return sendEmail({ to: email, subject: "Compte suspendu — Novakou", html });
}

// ── system.account_banned → email utilisateur ──
export async function sendAccountBannedDarkEmail(email: string, name: string, reason?: string) {
  const html = emailLayoutDark(`
    ${headingDark("Compte banni")}
    ${textDark(`Bonjour ${name}, votre compte Novakou a été définitivement banni.`)}
    ${reason ? errorBoxDark("Motif", reason) : ""}
    ${buttonDark("Contacter le support", `${getAppUrl()}/contact`, "red")}
  `);
  return sendEmail({ to: email, subject: "Compte banni — Novakou", html });
}
