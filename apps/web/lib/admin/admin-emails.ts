// Novakou — Admin Email Templates
// Uses sendEmail from lib/email/index.ts — single source of truth for Resend

import { sendEmail, emailLayout, button, getAppUrl } from "@/lib/email";

// Re-export existing email functions for convenience
export {
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendServiceApprovedEmail,
  sendServiceRejectedEmail,
} from "@/lib/email";

// ── Admin Broadcast Notification Email ──
export async function sendAdminBroadcastEmail(
  email: string,
  name: string,
  title: string,
  message: string
) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">${title}</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">Bonjour ${name},</p>
    <div style="background:#f9fafb;border-left:4px solid #6C2BD9;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
      <p style="color:#4b5563;margin:0;line-height:1.6;">${message}</p>
    </div>
    ${button("Acceder a la plateforme", getAppUrl())}
  `);
  return sendEmail({ to: email, subject: `${title} — Novakou`, html });
}

// ── Account Suspended Email ──
export async function sendAccountSuspendedEmail(email: string, name: string, reason?: string) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Compte suspendu</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">Bonjour ${name}, votre compte Novakou a ete temporairement suspendu.</p>
    ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;"><p style="color:#dc2626;font-weight:600;margin:0 0 4px;">Motif :</p><p style="color:#991b1b;margin:0;">${reason}</p></div>` : ""}
    <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">Si vous pensez que cette suspension est une erreur, contactez notre equipe de support.</p>
    ${button("Contacter le support", `${getAppUrl()}/contact`)}
  `);
  return sendEmail({ to: email, subject: "Compte suspendu — Novakou", html });
}

// ── Account Banned Email ──
export async function sendAccountBannedEmail(email: string, name: string, reason?: string) {
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Compte banni</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">Bonjour ${name}, votre compte Novakou a ete definitivement banni.</p>
    ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;"><p style="color:#dc2626;font-weight:600;margin:0 0 4px;">Motif :</p><p style="color:#991b1b;margin:0;">${reason}</p></div>` : ""}
    ${button("Contacter le support", `${getAppUrl()}/contact`)}
  `);
  return sendEmail({ to: email, subject: "Compte banni — Novakou", html });
}

// ── Admin Team Invitation Email ──
export async function sendAdminTeamInviteEmail(email: string, inviterName: string, role: string) {
  const roleLabels: Record<string, string> = {
    super_admin: "Super Administrateur",
    moderateur: "Moderateur",
    validateur_kyc: "Validateur KYC",
    analyste: "Analyste",
    support: "Support",
    financier: "Financier",
  };
  const roleLabel = roleLabels[role] || role;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Invitation a l'equipe d'administration</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      Bonjour, <strong>${inviterName}</strong> vous invite a rejoindre l'equipe d'administration de Novakou
      en tant que <strong>${roleLabel}</strong>.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin:0 0 24px;">
      <p style="color:#16a34a;font-size:16px;font-weight:700;margin:0;">Role : ${roleLabel}</p>
    </div>
    ${button("Accepter l'invitation", `${getAppUrl()}/admin`)}
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
  `);
  return sendEmail({ to: email, subject: `Invitation equipe admin — Novakou`, html });
}
