import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * Trouve ou crée un utilisateur ACHETEUR « léger » à partir d'un e-mail.
 *
 * Un acheteur invité (ou le DESTINATAIRE d'un cadeau) n'a pas de compte : on lui
 * en crée un minimal, rôle CLIENT (apprenant), avec un mot de passe aléatoire —
 * il se connectera par OTP (magic link). Le même code servait, dupliqué, dans
 * payment/init et la route gift ; on le centralise ici pour ne pas diverger.
 *
 * ⚠️ La VALIDATION de l'e-mail (isAllowedBuyerEmail) reste à l'appelant : selon
 * le contexte on veut un message d'erreur différent.
 */
export async function findOrCreateBuyerByEmail(
  email: string,
  name?: string | null,
): Promise<{ id: string; email: string; name: string | null }> {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true, name: true },
  });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email: normalized,
      name: name?.trim() || normalized.split("@")[0],
      passwordHash: randomBytes(32).toString("hex"),
      // UserRole n'a pas APPRENANT — CLIENT est le mapping Novakou pour un acheteur.
      role: "CLIENT",
      status: "ACTIF",
    },
    select: { id: true, email: true, name: true },
  });
}
