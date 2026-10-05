// E-mails automatiques liés aux retraits (vendeurs, affiliés, commission plateforme).
import { sendEmail, emailLayout, getAppUrl } from "@/lib/email";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}
function firstName(name?: string | null): string {
  return (name || "").trim().split(/\s+/)[0] || "Bonjour";
}

/** Confirmation : la demande de retrait est enregistrée (statut en attente). */
export async function sendWithdrawalRequestedEmail(to: string, name: string | null | undefined, amount: number, methodLabel: string, dashboardPath = "/wallet") {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Demande de retrait enregistrée</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonjour ${firstName(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Nous avons bien reçu votre demande de retrait de <strong>${fmt(amount)}</strong> via <strong>${methodLabel}</strong>. Elle est en cours de traitement — vous recevrez un e-mail dès qu'elle sera versée.</p>
    <a href="${getAppUrl()}${dashboardPath}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Suivre mon retrait</a>
  `);
  await sendEmail({ to, subject: `Demande de retrait enregistrée — ${fmt(amount)}`, html }).catch(() => null);
}

/** Confirmation : le retrait a été versé (statut traité). */
export async function sendWithdrawalPaidEmail(to: string, name: string | null | undefined, amount: number, methodLabel: string, dashboardPath = "/wallet") {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Votre retrait a été versé ✅</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonjour ${firstName(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonne nouvelle : votre retrait de <strong>${fmt(amount)}</strong> via <strong>${methodLabel}</strong> vient d'être <strong>versé</strong>. Vérifiez votre compte — les fonds arrivent généralement en quelques minutes.</p>
    <a href="${getAppUrl()}${dashboardPath}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Voir mes finances</a>
  `);
  await sendEmail({ to, subject: `Retrait versé ✅ — ${fmt(amount)}`, html }).catch(() => null);
}

/** Information : le retrait a échoué / été refusé (les fonds restent disponibles). */
export async function sendWithdrawalFailedEmail(to: string, name: string | null | undefined, amount: number, reason: string, dashboardPath = "/wallet") {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Retrait non abouti</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonjour ${firstName(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Votre retrait de <strong>${fmt(amount)}</strong> n'a pas pu aboutir.</p>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 16px;">Motif : ${reason}</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Vos fonds restent disponibles. Vérifiez vos coordonnées et créez une nouvelle demande.</p>
    <a href="${getAppUrl()}${dashboardPath}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Réessayer</a>
  `);
  await sendEmail({ to, subject: `Retrait non abouti — ${fmt(amount)}`, html }).catch(() => null);
}

// ── Versement mensuel automatique des affiliés (le 5 du mois) ──────────────

const BOUTON = "display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;";
const PARAGRAPHE = "color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;";

/** Le versement mensuel est parti vers le moyen enregistré. */
export async function sendVersementMensuelEmail(to: string, name: string | null | undefined, amount: number, destination: string) {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Votre versement mensuel est en route</h2>
    <p style="${PARAGRAPHE}">Bonjour ${firstName(name)},</p>
    <p style="${PARAGRAPHE}">Comme chaque 5 du mois, vos commissions validées partent automatiquement : <strong>${fmt(amount)}</strong> vers <strong>${destination}</strong>. Vous recevrez un e-mail dès que le versement sera confirmé.</p>
    <a href="${getAppUrl()}/affilie/retraits" style="${BOUTON}">Suivre mon versement</a>
  `);
  await sendEmail({ to, subject: `Versement mensuel en route — ${fmt(amount)}`, html }).catch(() => null);
}

/** Des commissions attendent, mais aucun moyen de versement utilisable n'est enregistré. */
export async function sendRappelMoyenVersementEmail(to: string, name: string | null | undefined, amount: number, motif: string) {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">${fmt(amount)} vous attendent</h2>
    <p style="${PARAGRAPHE}">Bonjour ${firstName(name)},</p>
    <p style="${PARAGRAPHE}">Vos commissions validées n'ont pas pu partir avec le versement automatique de ce mois : ${motif}</p>
    <p style="${PARAGRAPHE}">Choisissez votre moyen de versement sur la page Retraits : il servira aux prochains versements du 5. Vous pouvez aussi retirer vos gains tout de suite.</p>
    <a href="${getAppUrl()}/affilie/retraits" style="${BOUTON}">Choisir mon moyen de versement</a>
  `);
  await sendEmail({ to, subject: `${fmt(amount)} de commissions vous attendent`, html }).catch(() => null);
}

/**
 * Alerte de sécurité : le moyen de versement a changé. Quiconque prend la
 * main sur un compte affilié chercherait d'abord à détourner les versements ;
 * le titulaire doit le savoir immédiatement.
 */
export async function sendMoyenVersementModifieEmail(to: string, name: string | null | undefined, destination: string | null) {
  if (!to) return;
  const html = emailLayout(`
    <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 12px;">Moyen de versement modifié</h2>
    <p style="${PARAGRAPHE}">Bonjour ${firstName(name)},</p>
    <p style="${PARAGRAPHE}">${destination
      ? `Vos versements automatiques du 5 du mois iront désormais vers <strong>${destination}</strong>.`
      : "Le versement automatique du 5 du mois a été désactivé : vos commissions attendront que vous demandiez un retrait."}</p>
    <p style="${PARAGRAPHE}">Si vous n'êtes pas à l'origine de ce changement, modifiez votre mot de passe et contactez le support sans attendre.</p>
    <a href="${getAppUrl()}/affilie/retraits" style="${BOUTON}">Vérifier</a>
  `);
  await sendEmail({ to, subject: "🔐 Moyen de versement modifié", html }).catch(() => null);
}
