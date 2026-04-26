import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/subscription-expire
 *
 * Cron Vercel — tourne 1× par jour.
 *
 * Gère le cycle de vie post-fin-de-période :
 *   - status `active` + currentPeriodEnd dépassé sans renouvellement → `past_due`
 *   - status `past_due` depuis +14 jours → `expired` (retrait des accès)
 *   - status `active` + cancelAtPeriodEnd + currentPeriodEnd dépassé → `cancelled`
 *
 * Quand une sub passe à `expired` ou `cancelled`, on supprime les Enrollments
 * et DigitalProductPurchase qui ont été créés via ce sub (identifiés par
 * `stripeSessionId = "sub_<subId>"`). Ça révoque l'accès aux contenus.
 */
export const dynamic = "force-dynamic";

const PAST_DUE_GRACE_DAYS = 14;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const pastDueCutoff = new Date(now.getTime() - PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);

  let movedToPastDue = 0;
  let movedToCancelled = 0;
  let movedToExpired = 0;
  let revokedEnrollments = 0;
  let revokedPurchases = 0;

  // 1) active → past_due (currentPeriodEnd dépassé, pas annulée)
  const toPastDue = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "trialing"] },
      currentPeriodEnd: { lt: now },
      cancelAtPeriodEnd: false,
    },
    select: { id: true },
  });
  for (const s of toPastDue) {
    await prisma.subscription.update({
      where: { id: s.id },
      data: { status: "past_due" },
    }).catch((e) => console.warn("[cron/subscription-expire past_due]", s.id, e?.message ?? e));
    movedToPastDue++;
  }

  // 2) cancelAtPeriodEnd + currentPeriodEnd dépassé → cancelled (et révoque)
  const toCancel = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "trialing"] },
      currentPeriodEnd: { lt: now },
      cancelAtPeriodEnd: true,
    },
    include: { plan: { select: { id: true } } },
  });
  for (const s of toCancel) {
    const tag = `sub_${s.id}`;
    const [delE, delP] = await Promise.all([
      prisma.enrollment.deleteMany({
        where: { userId: s.userId, stripeSessionId: tag },
      }).catch(() => ({ count: 0 })),
      prisma.digitalProductPurchase.deleteMany({
        where: { userId: s.userId, stripeSessionId: tag },
      }).catch(() => ({ count: 0 })),
    ]);
    revokedEnrollments += delE.count;
    revokedPurchases += delP.count;

    await prisma.subscription.update({
      where: { id: s.id },
      data: { status: "cancelled", cancelledAt: now },
    }).catch((e) => console.warn("[cron/subscription-expire cancel]", s.id, e?.message ?? e));

    if (s.plan?.id) {
      await prisma.subscriptionPlan.update({
        where: { id: s.plan.id },
        data: { activeCount: { decrement: 1 } },
      }).catch(() => null);
    }
    movedToCancelled++;
  }

  // 3) past_due depuis > 14 jours → expired (et révoque)
  const toExpire = await prisma.subscription.findMany({
    where: {
      status: "past_due",
      currentPeriodEnd: { lt: pastDueCutoff },
    },
    include: { plan: { select: { id: true } } },
  });
  for (const s of toExpire) {
    const tag = `sub_${s.id}`;
    const [delE, delP] = await Promise.all([
      prisma.enrollment.deleteMany({
        where: { userId: s.userId, stripeSessionId: tag },
      }).catch(() => ({ count: 0 })),
      prisma.digitalProductPurchase.deleteMany({
        where: { userId: s.userId, stripeSessionId: tag },
      }).catch(() => ({ count: 0 })),
    ]);
    revokedEnrollments += delE.count;
    revokedPurchases += delP.count;

    await prisma.subscription.update({
      where: { id: s.id },
      data: { status: "expired" },
    }).catch((e) => console.warn("[cron/subscription-expire expire]", s.id, e?.message ?? e));

    if (s.plan?.id) {
      await prisma.subscriptionPlan.update({
        where: { id: s.plan.id },
        data: { activeCount: { decrement: 1 } },
      }).catch(() => null);
    }
    movedToExpired++;
  }

  return NextResponse.json({
    ok: true,
    movedToPastDue,
    movedToCancelled,
    movedToExpired,
    revokedEnrollments,
    revokedPurchases,
    runAt: now.toISOString(),
  });
}
