/**
 * Access control for formations and digital products.
 *
 * A user has access either through a one-shot purchase (Enrollment /
 * DigitalProductPurchase) OR through an active Subscription whose plan links
 * the formation/product. This helper unifies both paths so route handlers
 * don't have to duplicate the logic.
 *
 * Enrollments/purchases créés PAR un abonnement sont tagués
 * `stripeSessionId = "sub_<subId>"`. Pour ceux-là, la simple présence de la
 * ligne NE SUFFIT PAS : on revérifie que la souscription d'origine n'est pas
 * expirée/annulée. Sinon, un échec transitoire du deleteMany du cron
 * `subscription-expire` (best-effort, jamais re-scanné) laisserait un accès
 * gratuit permanent.
 */
import { prisma } from "@/lib/prisma";

const ACTIVE_SUB_STATES = ["active", "trialing"];
// Statuts où l'accès hérité d'un abonnement est révoqué. `past_due` garde
// l'accès (période de grâce de 14 jours, cf. cron subscription-expire).
const REVOKED_SUB_STATES = ["expired", "cancelled"];

const SUB_TAG_PREFIX = "sub_";

/**
 * Un enrollment/purchase tagué `sub_<subId>` ne vaut accès que si la
 * souscription d'origine existe encore et n'est pas expirée/annulée.
 */
async function subTagGrantsAccess(stripeSessionId: string | null): Promise<boolean | null> {
  if (!stripeSessionId?.startsWith(SUB_TAG_PREFIX)) return null; // pas un tag d'abonnement
  const subId = stripeSessionId.slice(SUB_TAG_PREFIX.length);
  if (!subId) return false;
  const sub = await prisma.subscription.findUnique({
    where: { id: subId },
    select: { status: true },
  });
  return !!sub && !REVOKED_SUB_STATES.includes(sub.status);
}

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

  // Path 1 — direct purchase (ou accès hérité d'un abonnement, revérifié)
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_formationId: { userId, formationId } },
    select: { id: true, refundedAt: true, stripeSessionId: true },
  });
  if (enrollment && !enrollment.refundedAt) {
    const viaSub = await subTagGrantsAccess(enrollment.stripeSessionId);
    if (viaSub !== false) return true; // null = vrai achat direct ; true = sub encore valide
    // viaSub === false : sub expirée/annulée → on tombe sur Path 2 (une autre
    // souscription active peut couvrir la même formation).
  }

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
    select: { id: true, stripeSessionId: true },
  });
  if (purchase) {
    const viaSub = await subTagGrantsAccess(purchase.stripeSessionId);
    if (viaSub !== false) return true;
  }

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
      select: { formationId: true, stripeSessionId: true },
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

  // Enrollments tagués sub_ : revérifier le statut des souscriptions d'origine
  // en un seul batch (pas de N+1).
  const subTagged = enrollments.filter((e) => e.stripeSessionId?.startsWith(SUB_TAG_PREFIX));
  const subIds = [...new Set(subTagged.map((e) => e.stripeSessionId!.slice(SUB_TAG_PREFIX.length)).filter(Boolean))];
  const validSubIds = new Set<string>();
  if (subIds.length > 0) {
    const originSubs = await prisma.subscription.findMany({
      where: { id: { in: subIds }, status: { notIn: REVOKED_SUB_STATES } },
      select: { id: true },
    });
    for (const s of originSubs) validSubIds.add(s.id);
  }

  for (const e of enrollments) {
    if (e.stripeSessionId?.startsWith(SUB_TAG_PREFIX)) {
      const subId = e.stripeSessionId.slice(SUB_TAG_PREFIX.length);
      if (validSubIds.has(subId)) result.add(e.formationId);
      // sinon : accès hérité d'une sub révoquée → exclu (Path 2 ci-dessous
      // le ré-ajoute si une AUTRE souscription active couvre la formation).
    } else {
      result.add(e.formationId);
    }
  }
  for (const s of subs) {
    if (s.plan?.isActive) {
      for (const fid of s.plan.linkedFormationIds) result.add(fid);
    }
  }
  return result;
}
