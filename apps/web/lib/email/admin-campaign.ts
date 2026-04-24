// Helper pour construire + envoyer les campagnes admin broadcast avec
// layout + signature Novakou cohérents avec les autres emails transactionnels.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

/**
 * Wrap un contenu HTML (éditeur riche) dans le layout Novakou avec :
 *  - Header gradient vert + logo NK
 *  - Contenu centré (le HTML fourni par l'admin)
 *  - Signature auto "L'équipe Novakou"
 *  - Footer avec liens + mentions légales
 *
 * Le contenu `innerHtml` est ce que l'admin a tapé dans le RichTextEditor.
 * On substitue aussi les variables : {{prenom}}, {{email}}
 */
export function wrapAdminCampaignHtml(innerHtml: string, recipientFirstName?: string | null, recipientEmail?: string | null): string {
  // Substitution variables
  const substituted = innerHtml
    .replace(/\{\{\s*prenom\s*\}\}/gi, recipientFirstName || "")
    .replace(/\{\{\s*email\s*\}\}/gi, recipientEmail || "");

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px 40px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.15);padding:10px;margin:0 auto 8px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#ffffff;text-align:center;line-height:28px;color:#006e2f;font-weight:900;font-size:18px;">N</div>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
    </div>

    <!-- Contenu éditable par admin -->
    <div style="padding:40px;color:#111827;font-size:15px;line-height:1.7;">
      ${substituted}

      <!-- ── Signature auto (immutable) ── -->
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
        <p style="color:#4b5563;font-size:14px;margin:0 0 4px;">Cordialement,</p>
        <p style="color:#006e2f;font-size:15px;font-weight:800;margin:0;">L'équipe Novakou</p>
        <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">La plateforme des créateurs en Afrique francophone.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">
        <a href="${APP_URL}" style="color:#006e2f;text-decoration:none;font-weight:600;">novakou.com</a> ·
        <a href="${APP_URL}/contact" style="color:#006e2f;text-decoration:none;font-weight:600;">Support</a> ·
        <a href="mailto:support@novakou.com" style="color:#006e2f;text-decoration:none;font-weight:600;">support@novakou.com</a>
      </p>
      <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;">
        © 2026 Novakou — Édité par Pirabel Labs
      </p>
      <p style="color:#9ca3af;font-size:10px;margin:8px 0 0;">
        Vous recevez cet email car vous êtes inscrit sur Novakou. Pour toute question, répondez à ce message.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/** Envoi direct (une adresse) — usage interne ou test */
export async function sendAdminCampaignEmail(params: {
  to: string;
  firstName?: string | null;
  subject: string;
  htmlBody: string; // HTML de l'éditeur admin
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { to, firstName, subject, htmlBody } = params;
  const finalHtml = wrapAdminCampaignHtml(htmlBody, firstName, to);
  try {
    const r = await resend.emails.send({ from: FROM, to, subject, html: finalHtml });
    if ("error" in r && r.error) {
      return { ok: false, error: String(r.error) };
    }
    const id = (r as { data?: { id?: string }; id?: string }).data?.id || (r as { id?: string }).id;
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Envoi en masse par lots (anti rate-limit Resend).
 * Resend Free limite ~100 emails/min, on batch par 10 + delay.
 */
export async function sendAdminCampaignBatch(params: {
  recipients: { email: string; firstName?: string | null }[];
  subject: string;
  htmlBody: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<{ sent: number; failed: number; results: { email: string; ok: boolean; id?: string; error?: string }[] }> {
  const { recipients, subject, htmlBody, onProgress } = params;
  const results: { email: string; ok: boolean; id?: string; error?: string }[] = [];
  let sent = 0, failed = 0;

  const BATCH_SIZE = 10;
  const DELAY_MS = 1200;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (r) => {
        const res = await sendAdminCampaignEmail({
          to: r.email,
          firstName: r.firstName,
          subject,
          htmlBody,
        });
        if (res.ok) sent++; else failed++;
        return { email: r.email, ...res };
      })
    );
    results.push(...batchResults);
    onProgress?.(Math.min(i + BATCH_SIZE, recipients.length), recipients.length);
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return { sent, failed, results };
}
