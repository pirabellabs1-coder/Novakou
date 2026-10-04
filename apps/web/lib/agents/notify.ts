import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

/**
 * Notifie les admins (e-mail + Telegram si configuré). Utilisé notamment pour
 * les actions DESTRUCTIVES : avant qu'un agent ne supprime/masque quoi que ce
 * soit, l'admin reçoit une alerte et doit valider.
 *
 * Telegram (optionnel) : définir TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID en env.
 */
/**
 * Le texte des alertes contient des saisies d'utilisateurs (motif d'un litige,
 * nom, e-mail) : échappé partout où il devient du HTML — message Telegram et
 * e-mail aux admins, où il aurait sinon pu injecter un lien.
 */
const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function notifyAdmins(opts: {
  subject: string;
  body: string;      // texte simple
  html?: string;     // version e-mail (sinon body)
  url?: string;      // lien d'action (tableau de bord)
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  const link = opts.url || `${appUrl}/admin/dashboard`;

  // 1) Telegram (instantané) si configuré
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    // Mode HTML, pas Markdown : en Markdown, un seul `_` ou `*` (CRON_SECRET,
    // kyc_verification, un titre de produit…) faisait REFUSER tout le message,
    // et l'alerte se perdait sans bruit. En HTML, trois caractères à échapper
    // suffisent, quel que soit le texte.
    const envoyer = (corps: Record<string, unknown>) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, disable_web_page_preview: true, ...corps }),
      });
    try {
      const r = await envoyer({
        text: `🤖 <b>${echapper(opts.subject)}</b>\n\n${echapper(opts.body)}\n\n${echapper(link)}`,
        parse_mode: "HTML",
      });
      if (!r.ok) {
        // Dernier recours : le même texte, sans aucune mise en forme.
        console.warn("[notifyAdmins telegram] refus", r.status, (await r.text()).slice(0, 200));
        await envoyer({ text: `🤖 ${opts.subject}\n\n${opts.body}\n\n${link}` });
      }
    } catch (e) {
      console.warn("[notifyAdmins telegram]", (e as Error).message);
    }
  }

  // 2) E-mail à tous les admins
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const html =
      opts.html ||
      emailLayout(`
        <h2 style="color:#13241b;font-size:20px;font-weight:800;margin:0 0 12px;">${echapper(opts.subject)}</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">${echapper(opts.body)}</p>
        <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Examiner et valider</a>
      `);
    for (const a of admins) {
      if (a.email) await sendEmail({ to: a.email, subject: `🤖 ${opts.subject}`, html }).catch(() => null);
    }
  } catch (e) {
    console.warn("[notifyAdmins email]", (e as Error).message);
  }
}
