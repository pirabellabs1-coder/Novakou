import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/service";
import { revalidatePublicCatalog } from "@/lib/formations/revalidate-public";

export type KindProduit = "formation" | "product";

/** Le vendeur apprend la décision par notification — pas en rechargeant sa liste. */
async function notifierVendeur(
  userId: string | null | undefined,
  titre: string,
  action: "approve" | "reject",
  reason: string | null,
): Promise<void> {
  if (!userId) return;
  await createNotification({
    userId,
    type: "system",
    title: action === "approve" ? "Produit approuvé ✔" : "Produit refusé",
    message:
      action === "approve"
        ? `« ${titre} » a été approuvé : il est en ligne sur la marketplace.`
        : `« ${titre} » a été refusé.${reason ? ` Motif : ${reason}.` : ""} Corrigez-le puis soumettez-le à nouveau.`,
    link: "/vendeur/produits",
  }).catch(() => null);
}

export type DecisionProduit = { ok: true; statut: "ACTIF" | "REFUSE" | "ARCHIVE" } | { ok: false; erreur: string };

/**
 * Applique une décision de modération (formation ou produit numérique) — mêmes
 * effets de bord qu'elle vienne d'un admin (`/api/formations/admin/produits/[id]`)
 * ou de l'agent de validation autonome. `actorId` : id d'un admin, ou une
 * constante ("agent-ia") pour l'agent — `createAuditLog` accepte une chaîne
 * libre, sans contrainte de clé étrangère.
 */
export async function appliquerDecisionProduit(p: {
  kind: KindProduit;
  id: string;
  action: "approve" | "reject";
  reason: string | null;
  actorId: string;
}): Promise<DecisionProduit> {
  if (p.kind === "formation") {
    // FormationStatus n'a pas REFUSE : un refus archive, avec le motif.
    const newStatus = p.action === "approve" ? ("ACTIF" as const) : ("ARCHIVE" as const);
    const f = await prisma.formation.update({
      where: { id: p.id },
      data: {
        status: newStatus,
        refuseReason: p.action === "reject" ? (p.reason || "Non conforme aux règles de la marketplace.") : null,
        ...(p.action === "approve" ? { publishedAt: new Date() } : {}),
      },
      select: { title: true, instructeur: { select: { user: { select: { id: true } } } } },
    });
    await notifierVendeur(f.instructeur?.user?.id, f.title, p.action, p.reason);
    await createAuditLog({
      actorId: p.actorId,
      action: p.action === "approve" ? "formation.approved" : "formation.rejected",
      targetType: "formation",
      targetId: p.id,
      details: { reason: p.reason },
    }).catch(() => null);
    revalidatePublicCatalog();
    return { ok: true, statut: newStatus };
  }

  const newStatus = p.action === "approve" ? ("ACTIF" as const) : ("REFUSE" as const);
  const prod = await prisma.digitalProduct.update({
    where: { id: p.id },
    data: {
      status: newStatus,
      refuseReason: p.action === "reject" ? (p.reason || "Non conforme aux règles de la marketplace.") : null,
    },
    select: { title: true, instructeur: { select: { user: { select: { id: true } } } } },
  });
  await notifierVendeur(prod.instructeur?.user?.id, prod.title, p.action, p.reason);
  await createAuditLog({
    actorId: p.actorId,
    action: p.action === "approve" ? "product.approved" : "product.rejected",
    targetType: "product",
    targetId: p.id,
    details: { reason: p.reason },
  }).catch(() => null);
  revalidatePublicCatalog();
  return { ok: true, statut: newStatus };
}
