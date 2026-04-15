// Resolves the CURRENT REAL user ID in the DB, even if the session has a
// stale userId (e.g. after a DB reset or data wipe).
//
// Strategy:
//   1. Try the session's user.id — if it exists in DB, return it.
//   2. Otherwise fall back to session.user.email — if it matches a user, return that ID.
//   3. Otherwise create the user from the session data (email + name + image).
//
// This eliminates "Profil introuvable" / FK violations caused by stale cookies.

import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export async function resolveActiveUserId(
  session: Session | null,
  opts?: { devFallback?: string }
): Promise<string | null> {
  const sessionUserId = session?.user?.id;
  const sessionEmail = session?.user?.email;
  const sessionName = session?.user?.name ?? null;
  const sessionImage = session?.user?.image ?? null;

  // 1. Try session's user.id first
  if (sessionUserId) {
    const byId = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  // 2. Fallback: lookup by email
  if (sessionEmail) {
    const byEmail = await prisma.user.findUnique({
      where: { email: sessionEmail.toLowerCase() },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;

    // 3. Auto-create the user if session has a verified email but no DB row
    try {
      const created = await prisma.user.create({
        data: {
          email: sessionEmail.toLowerCase(),
          name: sessionName,
          image: sessionImage,
          role: "FREELANCE",
          status: "ACTIF",
          formationsRole: "instructeur",
        },
      });
      return created.id;
    } catch (err) {
      console.error("[resolveActiveUserId] auto-create failed:", err);
    }
  }

  // 4. Dev fallback
  if (opts?.devFallback) {
    const dev = await prisma.user.findUnique({
      where: { id: opts.devFallback },
      select: { id: true },
    });
    if (dev) return dev.id;
  }

  return null;
}

/**
 * Resolves the active userId AND upserts the instructeurProfile in one call.
 * Returns { userId, instructeurId } — both guaranteed to exist in the DB.
 * Returns null if the session is too broken to recover.
 */
export async function resolveVendorContext(
  session: Session | null,
  opts?: { devFallback?: string }
): Promise<{ userId: string; instructeurId: string } | null> {
  const userId = await resolveActiveUserId(session, opts);
  if (!userId) return null;

  // Upsert the instructeur profile — atomic, no race condition
  const inst = await prisma.instructeurProfile
    .upsert({
      where: { userId },
      create: { userId, status: "APPROUVE" },
      update: {},
    })
    .catch(async (err) => {
      console.error("[resolveVendorContext] upsert failed:", err);
      // Retry findUnique — maybe a concurrent request created it
      return prisma.instructeurProfile.findUnique({ where: { userId } });
    });

  if (!inst) return null;

  // Align formationsRole in background (non-blocking)
  prisma.user
    .update({ where: { id: userId }, data: { formationsRole: "instructeur" } })
    .catch(() => null);

  return { userId, instructeurId: inst.id };
}
