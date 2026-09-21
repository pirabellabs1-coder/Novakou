import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

/**
 * Compte SYSTÈME représentant l'agent IA — auteur des décisions autonomes.
 *
 * `AuditLog.actorId` porte une clé étrangère réelle vers `User` : une chaîne
 * arbitraire comme "agent-ia" ferait échouer chaque journalisation. Un compte
 * dédié résout ça proprement, et en prime rend l'auteur des décisions IA
 * LISIBLE partout où `reviewedBy` / `actorId` est affiché — pas une chaîne
 * énigmatique, un nom : « Agent IA Novakou ».
 *
 * Rôle CLIENT (le plus bas privilège) et mot de passe aléatoire jamais
 * communiqué : ce compte ne doit jamais pouvoir se connecter. Son seul usage
 * est d'exister comme cible de clé étrangère.
 */
const EMAIL_AGENT = "agent-ia@novakou.internal";

let idEnCache: string | null = null;

export async function agentSystemUserId(): Promise<string> {
  if (idEnCache) return idEnCache;

  const existant = await prisma.user.findUnique({ where: { email: EMAIL_AGENT }, select: { id: true } });
  if (existant) {
    idEnCache = existant.id;
    return existant.id;
  }

  const motDePasseInutilisable = await bcrypt.hash(randomUUID() + randomUUID(), 10);
  const cree = await prisma.user.create({
    data: {
      email: EMAIL_AGENT,
      passwordHash: motDePasseInutilisable,
      name: "Agent IA Novakou",
      role: "CLIENT",
      status: "ACTIF",
      emailVerified: new Date(),
    },
    select: { id: true },
  });
  idEnCache = cree.id;
  return cree.id;
}
