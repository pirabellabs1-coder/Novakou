/**
 * Access control for formations and digital products.
 *
 * A user has access either through a one-shot purchase (Enrollment /
 * DigitalProductPurchase) OR through an active Subscription whose plan links
 * the formation/product. This helper unifies both paths so route handlers
 * don't have to duplicate the logic.
 */
import { prisma } from "@/lib/prisma";

const ACTIVE_SUB_STATES = ["active", "trialing"];

/**
 * Returns true if the user can access the given formation, either because they
 * have an Enrollment, or because they hold an active Subscription whose plan
 * includes this formationId in `linkedFormationIds`.
 */
export async function userHasFormationAccess(
  userId: string,
  formationId: string,
): Promise<boolean> {
  if (!userId || !formationId) return false;

  // Path 1 — direct purchase
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_formationId: { userId, formationId } },
    select: { id: true, refundedAt: true },
  });
  if (enrollment && !enrollment.refundedAt) return true;

  // Path 2 — active subscription that includes this formation
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ACTIVE_SUB_STATES },
      currentPeriodEnd: { gt: new Date() },
      plan: {
        is: {
          isActive: true,
          linkedFormationIds: { has: formationId },
        },
      },
    },
    select: { id: true },
  });
  return !!sub;
}

/**
 * Same idea for digital products.
 */
export async function userHasProductAccess(
  userId: string,
  productId: string,
): Promise<boolean> {
  if (!userId || !productId) return false;

  const purchase = await prisma.digitalProductPurchase.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  if (purchase) return true;

  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ACTIVE_SUB_STATES },
      currentPeriodEnd: { gt: new Date() },
      plan: {
        is: {
          isActive: true,
          linkedProductIds: { has: productId },
        },
      },
    },
    select: { id: true },
  });
  return !!sub;
}

/**
 * Bulk version: given a userId, returns the set of formation IDs they can
 * access. Useful for "Mes formations" listings.
 */
export async function listAccessibleFormationIds(userId: string): Promise<Set<string>> {
  const result = new Set<string>();
  if (!userId) return result;

  const [enrollments, subs] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, refundedAt: null },
      select: { formationId: true },
    }),
    prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ACTIVE_SUB_STATES },
        currentPeriodEnd: { gt: new Date() },
      },
      select: { plan: { select: { linkedFormationIds: true, isActive: true } } },
    }),
  ]);

  for (const e of enrollments) result.add(e.formationId);
  for (const s of subs) {
    if (s.plan?.isActive) {
      for (const fid of s.plan.linkedFormationIds) result.add(fid);
    }
  }
  return result;
}
