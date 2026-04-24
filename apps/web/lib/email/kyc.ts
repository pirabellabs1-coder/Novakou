// KYC transactional emails — same visual identity as mentor emails
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

function layout(content: string, subtitle: string, ctaLabel?: string, ctaUrl?: string, headerColor = "#006e2f"): string {
  const cta = ctaLabel && ctaUrl
    ? `<div style="text-align:center;margin:24px 0;">
         <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(to right,#006e2f,#22c55e);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">${ctaLabel}</a>
       </div>`
    : "";
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f9fb;font-family:-apple-system,'Manrope',BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.04);border:1px solid #eef0f3;">
    <div style="background:linear-gradient(135deg,#003d1a 0%,${headerColor} 50%,#22c55e 100%);padding:32px 40px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.15);line-height:48px;margin-bottom:12px;">
        <span style="color:#ffffff;font-weight:800;font-size:16px;">FH</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:11px;margin:4px 0 0;letter-spacing:1.5px;font-weight:600;">🪪 ${subtitle}</p>
    </div>
    <div style="padding:36px 40px;color:#191c1e;line-height:1.6;font-size:14px;">
      ${content}
      ${cta}
    </div>
    <div style="padding:20px 40px;background:#f7f9fb;border-top:1px solid #eef0f3;text-align:center;">
      <p style="color:#5c647a;font-size:11px;margin:0 0 4px;">L'équipe Novakou</p>
      <p style="color:#9ca3af;font-size:10px;margin:0;">La plateforme qui élève votre carrière freelance.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── 1. Soumission KYC ──
export async function sendKycSubmittedEmail(opts: { userEmail: string; userName: string; documentType: string }) {
  const content = `
    <p>Bonjour ${opts.userName},</p>
    <p>Nous avons bien reçu votre demande de vérification d'identité. Votre document <strong>${opts.documentType}</strong> a été transmis à notre équipe de modération.</p>
    <div style="background:#f7f9fb;border:1px solid #eef0f3;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;"><strong>Délai moyen :</strong> 24 à 48h ouvrées.</p>
      <p style="margin:8px 0 0;font-size:13px;">Vous recevrez un email dès que notre équipe aura examiné votre dossier.</p>
    </div>
    <p style="font-size:13px;color:#5c647a;">Si vous avez soumis un document par erreur ou souhaitez le remplacer, contactez-nous à support@novakou.com.</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.userEmail,
    subject: "Votre demande de vérification KYC a été reçue",
    html: layout(content, "VÉRIFICATION D'IDENTITÉ", "Voir ma demande", `${APP_URL}/kyc`, "#006e2f"),
  });
}

// ── 2. KYC approuvé ──
export async function sendKycApprovedEmail(opts: { userEmail: string; userName: string; level: number }) {
  const isPro = opts.level >= 4;
  const label = isPro ? "certification professionnelle" : "vérification d'identité";
  const statusLine = isPro
    ? "✓ Certification pro validée — badge Elite activé sur votre profil."
    : "✓ Identité vérifiée — retraits de vos gains autorisés.";
  const content = `
    <p>Bonjour ${opts.userName},</p>
    <p>Excellente nouvelle ! Votre ${label} a été <strong style="color:#006e2f;">approuvée</strong> par notre équipe.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;"><strong>${statusLine}</strong></p>
    </div>
    <p style="font-size:13px;">Bonne continuation sur la plateforme !</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.userEmail,
    subject: isPro ? "✓ Votre certification pro a été validée" : "✓ Votre identité a été vérifiée",
    html: layout(content, isPro ? "CERTIFICATION PRO" : "IDENTITÉ VÉRIFIÉE", "Accéder à mon espace", `${APP_URL}/kyc`, "#006e2f"),
  });
}

// ── 3. KYC refusé ──
export async function sendKycRefusedEmail(opts: { userEmail: string; userName: string; refuseReason: string }) {
  const content = `
    <p>Bonjour ${opts.userName},</p>
    <p>Après examen, nous n'avons pas pu valider votre demande de vérification d'identité.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Motif :</strong></p>
      <p style="margin:8px 0 0;font-size:13px;color:#991b1b;">${opts.refuseReason}</p>
    </div>
    <p style="font-size:13px;">Vous pouvez soumettre une nouvelle demande avec un document corrigé ou plus lisible.</p>
    <p style="font-size:13px;color:#5c647a;">Si vous pensez qu'il s'agit d'une erreur, contactez support@novakou.com.</p>
  `;
  return resend.emails.send({
    from: FROM,
    to: opts.userEmail,
    subject: "Votre demande de vérification KYC n'a pas été validée",
    html: layout(content, "KYC — À RECOMMENCER", "Soumettre à nouveau", `${APP_URL}/kyc`, "#dc2626"),
  });
}
