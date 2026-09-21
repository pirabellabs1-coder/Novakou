import { prisma } from "@/lib/prisma";
import { sendKycApprovedEmail, sendKycRefusedEmail } from "@/lib/email/kyc";

/**
 * Applique une décision KYC (approbation ou refus) — mêmes effets de bord,
 * qu'elle vienne d'un admin (`/api/formations/admin/kyc/[id]`) ou de l'agent
 * de vérification autonome. Un seul endroit qui met à jour le niveau KYC,
 * notifie et envoie l'e-mail : les deux chemins ne doivent JAMAIS diverger,
 * sous peine qu'une décision « corrige » l'autre sans le vouloir.
 *
 * `decidePar` : identifiant de l'auteur de la décision — l'id d'un admin, ou
 * une constante ("agent-ia") pour l'agent autonome. Le champ `reviewedBy` du
 * schéma est une simple chaîne, sans contrainte de clé étrangère.
 */
export type DecisionKyc =
  | { ok: true; statut: "APPROUVE"; nouveauNiveau: number }
  | { ok: true; statut: "REFUSE" }
  | { ok: false; erreur: string };

export async function appliquerDecisionKyc(p: {
  kycRequestId: string;
  action: "approve" | "refuse";
  refuseReason?: string;
  decidePar: string;
}): Promise<DecisionKyc> {
  const kyc = await prisma.kycRequest.findUnique({
    where: { id: p.kycRequestId },
    include: { user: { select: { id: true, email: true, name: true, kyc: true } } },
  });
  if (!kyc) return { ok: false, erreur: "Demande KYC introuvable" };
  if (kyc.status !== "EN_ATTENTE") return { ok: false, erreur: "Cette demande a déjà été traitée" };

  const now = new Date();

  if (p.action === "approve") {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: kyc.userId },
      select: { id: true },
    });

    const tx: Array<Promise<unknown>> = [
      prisma.kycRequest.update({
        where: { id: p.kycRequestId },
        data: { status: "APPROUVE", reviewedBy: p.decidePar, reviewedAt: now },
      }),
      prisma.user.update({
        where: { id: kyc.userId },
        data: { kyc: Math.max(kyc.user.kyc ?? 0, kyc.requestedLevel) },
      }),
    ];
    if (mentorProfile) {
      tx.push(
        prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isVerified: true } }),
      );
    }
    await Promise.all(tx);

    const isPro = kyc.requestedLevel >= 4;
    await prisma.notification.create({
      data: {
        userId: kyc.userId,
        type: "ORDER",
        title: isPro ? "Certification pro validée ✓" : "Identité vérifiée ✓",
        message: isPro
          ? "Votre certification professionnelle a été approuvée. Le badge Elite est maintenant affiché sur votre profil public."
          : "Votre identité a été vérifiée. Vous pouvez désormais demander un retrait de vos gains.",
        link: isPro ? "/mentor/profil" : "/mentor/finances",
      },
    }).catch(() => null);

    if (kyc.user.email) {
      await sendKycApprovedEmail({
        userEmail: kyc.user.email,
        userName: kyc.user.name ?? kyc.user.email.split("@")[0],
        level: kyc.requestedLevel,
      }).catch((e) => console.warn("[kyc approve email]", e));
    }

    return { ok: true, statut: "APPROUVE", nouveauNiveau: kyc.requestedLevel };
  }

  // refuse
  const raison = (p.refuseReason ?? "").trim();
  if (raison.length < 10) return { ok: false, erreur: "Motif de refus obligatoire (10 caractères minimum)" };

  await prisma.kycRequest.update({
    where: { id: p.kycRequestId },
    data: { status: "REFUSE", reviewedBy: p.decidePar, reviewedAt: now, refuseReason: raison },
  });

  await prisma.notification.create({
    data: {
      userId: kyc.userId,
      type: "ORDER",
      title: "KYC refusé",
      message: `Votre vérification d'identité a été refusée. Motif : ${raison}. Vous pouvez soumettre une nouvelle demande.`,
      link: "/kyc",
    },
  }).catch(() => null);

  if (kyc.user.email) {
    await sendKycRefusedEmail({
      userEmail: kyc.user.email,
      userName: kyc.user.name ?? kyc.user.email.split("@")[0],
      refuseReason: raison,
    }).catch((e) => console.warn("[kyc refuse email]", e));
  }

  return { ok: true, statut: "REFUSE" };
}
