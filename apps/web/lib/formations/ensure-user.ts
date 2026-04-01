/**
 * Ensures the session user exists in the Prisma DB.
 * In DEV_MODE, the auth uses a local JSON store with IDs like "dev-admin-1"
 * that don't exist in the Prisma User table. This helper creates a minimal
 * user record so that FK constraints on CartItem, Enrollment, etc. don't fail.
 */
import prisma from "@freelancehigh/db";

const IS_DEV = process.env.DEV_MODE === "true";

export async function ensureUserInDb(session: {
  user: { id: string; email: string; name: string; role?: string };
}): Promise<void> {
  if (!IS_DEV) return; // In production, user always exists via proper auth flow

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (existing) return;

  // Also check by email to avoid duplicate email constraint
  const byEmail = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (byEmail) {
    // User exists with different ID — this shouldn't happen but handle gracefully
    return;
  }

  await prisma.user.create({
    data: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      passwordHash: "",
      role: (session.user.role || "CLIENT").toUpperCase() as "FREELANCE" | "CLIENT" | "AGENCE" | "ADMIN",
      status: "ACTIF",
      kyc: 1,
      plan: "GRATUIT",
    },
  });
}
