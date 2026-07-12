import { sendEmail, emailLayout, button, getAppUrl } from "./index";

/**
 * E-mail envoyé au vendeur à la création d'un lien de paiement AVEC webhook :
 * contient le secret de signature (à garder côté serveur) + le lien vers la doc.
 */
export async function sendPaylinkWebhookSecretEmail(params: {
  to: string;
  linkTitle: string;
  webhookUrl: string;
  secret: string;
}): Promise<void> {
  const docUrl = `${getAppUrl()}/vendeur/liens-paiement/documentation`;
  const content = `
    <h1 style="color:#111827;font-size:20px;font-weight:800;margin:0 0 12px;">Votre secret de webhook</h1>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Vous avez ajouté un webhook au lien de paiement <strong>« ${escapeHtml(params.linkTitle)} »</strong>.
      À chaque vente, Novakou enverra une notification signée à :
    </p>
    <p style="font-family:monospace;font-size:13px;color:#006e2f;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 12px;margin:0 0 16px;word-break:break-all;">
      ${escapeHtml(params.webhookUrl)}
    </p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 8px;">
      Votre <strong>secret de signature</strong> (à garder côté serveur, ne le partagez jamais) :
    </p>
    <p style="font-family:monospace;font-size:14px;font-weight:700;color:#111827;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:12px 14px;margin:0 0 20px;word-break:break-all;">
      ${escapeHtml(params.secret)}
    </p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Utilisez ce secret pour vérifier l'en-tête <code>X-Novakou-Signature</code> (HMAC-SHA256) de chaque
      webhook. La documentation complète (exemples Node.js, PHP, Python) explique comment débloquer l'accès
      en toute sécurité sur votre site.
    </p>
    ${button("Voir la documentation d'intégration", docUrl)}
    <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:20px 0 0;">
      Vous retrouvez aussi ce secret sur la page « Liens de paiement » de votre espace vendeur.
    </p>
  `;
  await sendEmail({
    to: params.to,
    subject: `Votre secret de webhook — ${params.linkTitle} · Novakou`,
    html: emailLayout(content),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
