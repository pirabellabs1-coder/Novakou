/**
 * Novakou — Email Templates : Team / Collaborateurs (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import { emailLayoutDark, headingDark, textDark, buttonDark, mutedDark } from "@/lib/email/layout-dark";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Manager",
  EDITOR: "Éditeur",
};

const ROLE_DESC: Record<string, string> = {
  MANAGER: "Vous pourrez inviter d'autres membres, gérer tous les produits, voir les statistiques. Vous ne pourrez pas effectuer de retraits.",
  EDITOR: "Vous pourrez créer et modifier les produits, et voir les statistiques de la boutique. Vous ne pourrez pas inviter de membres ni faire de retraits.",
};

/**
 * Envoyé quand un vendeur invite quelqu'un à rejoindre sa boutique.
 * Le destinataire clique sur un lien qui l'amène à /invitation/[code].
 */
export async function sendShopInvitationEmail(
  email: string,
  data: {
    shopName: string;
    inviterName: string;
    role: "MANAGER" | "EDITOR";
    inviteCode: string;
    expiresAt: Date;
  }
) {
  const link = `${getAppUrl()}/invitation/${data.inviteCode}`;
  const roleLabel = ROLE_LABEL[data.role] ?? data.role;
  const roleDesc = ROLE_DESC[data.role] ?? "";
  const expiresStr = data.expiresAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const html = emailLayoutDark(`
    ${headingDark("Invitation à rejoindre une boutique")}
    ${textDark(`<strong style="color:#F1F5F9;">${data.inviterName}</strong> vous invite à rejoindre la boutique <strong style="color:#F1F5F9;">${data.shopName}</strong> sur Novakou en tant que <strong style="color:#22c55e;">${roleLabel}</strong>.`)}
    ${textDark(roleDesc)}
    ${buttonDark("Accepter l'invitation", link, "green")}
    ${mutedDark(`Cette invitation expire le ${expiresStr}. Si vous n'avez pas de compte Novakou, vous pourrez en créer un lors de l'acceptation.`)}
    ${mutedDark(`Si vous ne reconnaissez pas cet expéditeur, ignorez simplement cet email.`)}
  `);

  return sendEmail({
    to: email,
    subject: `Invitation à rejoindre ${data.shopName} sur Novakou`,
    html,
  });
}
