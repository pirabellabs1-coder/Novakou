// Helper: get or auto-create the InstructeurProfile for the current user.
//
// Policy: any authenticated user that reaches a vendor API clearly wants to sell.
// We use an atomic upsert to guarantee the profile exists in a single DB call —
// no race conditions, no silent failures.

import { prisma } from "@/lib/prisma";

export async function getOrCreateInstructeur(userId: string) {
  if (!userId) return null;

  try {
    // Atomic upsert: creates if missing, returns existing otherwise
    const inst = await prisma.instructeurProfile.upsert({
      where: { userId },
      create: {
        userId,
        status: "APPROUVE",
      },
      update: {}, // No-op update, just to make it idempotent
    });

    // Align formationsRole only when unset — never overwrite an existing
    // role like "mentor" or "apprenant". A mentor visiting a vendor API
    // (e.g. domain settings) gets an instructeurProfile auto-created but
    // keeps their primary role for sidebar/RoleGuard purposes.
    prisma.user
      .updateMany({
        where: { id: userId, OR: [{ formationsRole: null }, { formationsRole: "" }] },
        data: { formationsRole: "instructeur" },
      })
      .catch(() => null);

    return inst;
  } catch (err) {
    // Most likely a FK violation: the userId doesn't exist in the User table.
    // That means the session is stale / the user was deleted.
    console.error("[getOrCreateInstructeur] Upsert failed for userId=" + userId, err);
    return null;
  }
}

/**
 * Resolve the current user's instructeurId (used in query WHERE clauses).
 * Returns null only if the userId is invalid or the user was deleted.
 */
export async function getInstructeurId(userId: string): Promise<string | null> {
  const inst = await getOrCreateInstructeur(userId);
  return inst?.id ?? null;
}
