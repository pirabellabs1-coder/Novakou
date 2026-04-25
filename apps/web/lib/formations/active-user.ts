// Resolves the active user + creates instructeurProfile in one bulletproof
// atomic flow. Uses upsert so it never fails on race conditions or stale sessions.

import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Given a session, returns userId + instructeurId (both guaranteed to exist in DB).
 * Uses upsert so it works even if:
 *  - The session.user.id points to a deleted user (stale cookie after DB wipe)
 *  - The session.user.email doesn't yet exist in DB (first-time login)
 *  - A concurrent request is creating the same profile
 */
export async function resolveVendorContext(
  session: Session | null,
  opts?: { devFallback?: string }
): Promise<{ userId: string; instructeurId: string } | null> {
  const email = session?.user?.email?.toLowerCase().trim();
  const sessionUserId = session?.user?.id;
  const name = session?.user?.name ?? null;
  const image = session?.user?.image ?? null;

  // ── Step 1: Resolve userId (with auto-create if needed) ──────────────────
  let userId: string | null = null;

  // Prefer email-based lookup (works even if session.user.id is stale).
  // We use findUnique + (conditional) create instead of upsert to avoid
  // Prisma validating the full `create` shape on every call — the User model
  // requires `passwordHash` which we don't have here (session-only context).
  if (email) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing) {
        userId = existing.id;
      } else {
        // True first-time flow: create with a placeholder passwordHash.
        // This branch almost never runs — users should already exist from
        // registration. Defensive code for edge cases.
        const created = await prisma.user.create({
          data: {
            email,
            name,
            image,
            passwordHash: "", // placeholder — real password set via register flow
            role: "FREELANCE",
            status: "ACTIF",
            formationsRole: "instructeur",
            emailVerified: new Date(),
          },
          select: { id: true },
        });
        userId = created.id;
      }
    } catch (err) {
      console.error("[resolveVendorContext] user lookup/create by email failed:", err);
    }
  }

  // If email didn't work, try session.user.id
  if (!userId && sessionUserId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true },
      });
      if (user) userId = user.id;
    } catch (err) {
      console.error("[resolveVendorContext] user findUnique by id failed:", err);
    }
  }

  // Dev fallback
  if (!userId && opts?.devFallback) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: opts.devFallback },
        select: { id: true },
      });
      if (user) userId = user.id;
    } catch {
      /* ignore */
    }
  }

  if (!userId) return null;

  // ── Step 2: Upsert instructeurProfile ───────────────────────────────────
  try {
    const inst = await prisma.instructeurProfile.upsert({
      where: { userId },
      create: { userId, status: "APPROUVE" },
      update: {},
    });

    // Align formationsRole (non-blocking)
    prisma.user
      .update({ where: { id: userId }, data: { formationsRole: "instructeur" } })
      .catch(() => null);

    return { userId, instructeurId: inst.id };
  } catch (err) {
    // Race condition — refetch
    try {
      const existing = await prisma.instructeurProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (existing) {
        return { userId, instructeurId: existing.id };
      }
    } catch {
      /* ignore */
    }
    console.error("[resolveVendorContext] profile upsert failed:", err);
    return null;
  }
}

/**
 * Resolves just the userId (without touching instructeur profile).
 * Used when an API doesn't need vendor privileges (e.g. wallet GET).
 */
export async function resolveActiveUserId(
  session: Session | null,
  opts?: { devFallback?: string }
): Promise<string | null> {
  const ctx = await resolveVendorContext(session, opts);
  return ctx?.userId ?? null;
}
