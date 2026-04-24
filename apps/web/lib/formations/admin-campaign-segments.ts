// Helpers pour résoudre les segments utilisateurs dans les campagnes admin.

import { prisma } from "@/lib/prisma";

export type CampaignSegment = "all" | "vendors" | "mentors" | "learners";

export const SEGMENT_LABELS: Record<CampaignSegment, string> = {
  all: "Tous les utilisateurs",
  vendors: "Tous les vendeurs",
  mentors: "Tous les mentors",
  learners: "Tous les apprenants",
};

export function isValidSegment(s: unknown): s is CampaignSegment {
  return typeof s === "string" && ["all", "vendors", "mentors", "learners"].includes(s);
}

/** Retourne les users cibles + leur email + leur prénom (name splittée). */
export async function resolveSegmentRecipients(
  segment: CampaignSegment
): Promise<Array<{ id: string; email: string; firstName: string | null }>> {
  if (segment === "all") {
    const users = await prisma.user.findMany({
      where: { status: "ACTIF" },
      select: { id: true, email: true, name: true },
    });
    return users.map((u) => ({ id: u.id, email: u.email, firstName: firstNameOf(u.name) }));
  }

  if (segment === "vendors") {
    // Vendeurs = users avec instructeurProfile (peu importe status — on cible tous ceux qui se sont inscrits comme vendeur)
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIF",
        instructeurProfile: { isNot: null },
      },
      select: { id: true, email: true, name: true },
    });
    return users.map((u) => ({ id: u.id, email: u.email, firstName: firstNameOf(u.name) }));
  }

  if (segment === "mentors") {
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIF",
        mentorProfile: { isNot: null },
      },
      select: { id: true, email: true, name: true },
    });
    return users.map((u) => ({ id: u.id, email: u.email, firstName: firstNameOf(u.name) }));
  }

  if (segment === "learners") {
    // Apprenants = users qui ont au moins un achat (enrollment ou digitalProductPurchase)
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIF",
        OR: [
          { enrollments: { some: {} } },
          { productPurchases: { some: {} } },
        ],
      },
      select: { id: true, email: true, name: true },
    });
    return users.map((u) => ({ id: u.id, email: u.email, firstName: firstNameOf(u.name) }));
  }

  return [];
}

function firstNameOf(full: string | null): string | null {
  if (!full) return null;
  const parts = full.trim().split(/\s+/);
  return parts[0] || null;
}

/** Compte rapide (sans récupérer tous les users) pour preview. */
export async function countSegmentRecipients(segment: CampaignSegment): Promise<number> {
  if (segment === "all") {
    return prisma.user.count({ where: { status: "ACTIF" } });
  }
  if (segment === "vendors") {
    return prisma.user.count({
      where: { status: "ACTIF", instructeurProfile: { isNot: null } },
    });
  }
  if (segment === "mentors") {
    return prisma.user.count({
      where: { status: "ACTIF", mentorProfile: { isNot: null } },
    });
  }
  if (segment === "learners") {
    return prisma.user.count({
      where: {
        status: "ACTIF",
        OR: [
          { enrollments: { some: {} } },
          { productPurchases: { some: {} } },
        ],
      },
    });
  }
  return 0;
}
